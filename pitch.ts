import axios from 'axios';
import { Readable } from 'stream';
import FormData from 'form-data';
import ffmpeg from 'fluent-ffmpeg';

// Ensure ffmpeg path is correctly set if not in system PATH
// import ffmpegPath from '@ffmpeg-installer/ffmpeg';
// ffmpeg.setFfmpegPath(ffmpegPath.path);

const PITCHRESULT_SERVICE_URL = process.env.PITCHRESULT_SERVICE_URL || 'https://pitch-analyzer-525960652018.asia-southeast1.run.app/analyze';
const MAX_RETRIES = Number(process.env.PITCHRESULT_SERVICE_RETRIES) || 3;
const TIMEOUT = Number(process.env.PITCHRESULT_SERVICE_TIMEOUT) || 30000; // 30 seconds timeout for the API call

// Optional: Check service availability quickly (adds an extra network call)
// async function checkServiceAvailability(): Promise<boolean> {
//     try {
//         await axios.get(pitchResult_SERVICE_URL, { timeout: 5000 });
//         console.log('pitchResult service is available.');
//         return true;
//     } catch (error) {
//         console.warn('pitchResult service check failed:', error.message);
//         return false;
//     }
// }

/**
 * Converts an input audio buffer (assumed MP3, AAC, M4A or FFmpeg-detectable) to WAV format (PCM S16LE, 44.1kHz, Stereo).
 * Explicitly supports AAC and M4A formats along with other formats detectable by FFmpeg.
 * @param inputBuffer The input audio buffer.
 * @returns A Promise resolving with the WAV audio buffer.
 */
async function convertToWav(inputBuffer: Buffer): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        let outputBuffer = Buffer.alloc(0);
        const inputStream = new Readable();
        inputStream.push(inputBuffer);
        inputStream.push(null); // Signal EOF

        console.log(`Starting audio conversion to WAV. Input buffer size: ${inputBuffer.length} bytes`);
        
        const command = ffmpeg(inputStream)
            // FFmpeg will auto-detect the format, including AAC and M4A
            // but we can set some optimized parameters for these formats
            .outputOptions([
                '-ac 2',                  // stereo output
                '-ar 44100',              // 44.1kHz sample rate
                '-acodec pcm_s16le'       // 16-bit PCM audio
            ])
            .toFormat('wav')
            .audioFrequency(44100)
            .audioChannels(2)
            // Add a timeout for the ffmpeg process itself to prevent hangs
            .duration(TIMEOUT / 1000);

        let ffmpegStderr = ''; // Collect stderr for better error reporting

        command
            .on('start', (commandLine) => {
                console.log('FFmpeg conversion started:', commandLine);
            })
            .on('stderr', (stderrLine) => {
                // Don't log every line here if it's too verbose,
                // just collect it for the error case.
                // console.log('FFmpeg stderr:', stderrLine);
                ffmpegStderr += stderrLine + '\n';
            })
            .on('error', (err, stdout, stderr) => {
                // Combine collected stderr with potentially more info from the error event
                const fullStderr = ffmpegStderr + (stderr || '');
                console.error('FFmpeg conversion error:', err.message);
                console.error('FFmpeg stderr output:\n', fullStderr);
                // Create a more informative error
                const error = new Error(`FFmpeg conversion failed: ${err.message}. FFmpeg stderr: ${fullStderr}`);
                reject(error);
            })
            .on('end', () => {
                console.log('FFmpeg conversion finished successfully.');
                if (outputBuffer.length === 0) {
                     console.error('FFmpeg stderr output on empty buffer:\n', ffmpegStderr);
                     reject(new Error('FFmpeg conversion finished but produced an empty buffer. Check FFmpeg stderr log.'));
                } else {
                    resolve(outputBuffer);
                }
            })
            .pipe()
            .on('data', (chunk: Buffer) => {
                outputBuffer = Buffer.concat([outputBuffer, chunk]);
            })
            .on('error', (err) => {
                // Catch errors on the output stream as well
                console.error('FFmpeg output stream error:', err.message);
                const error = new Error(`FFmpeg output stream error: ${err.message}. FFmpeg stderr: ${ffmpegStderr}`);
                reject(error);
            });
    });
}

/**
 * Sends an audio buffer to the pitchResult analysis service after converting it to WAV.
 * Includes retries on failure.
 * @param audioFile The input audio buffer (expected to be FFmpeg-compatible, e.g., MP3).
 * @param destination The URL of the pitchResult analysis service.
 * @returns A Promise resolving with the analysis result from the service.
 */
export default async function pitchResult(audioFile: Buffer, destination: string = PITCHRESULT_SERVICE_URL) {
    console.log('pitchResult function received buffer:', {
        isBuffer: Buffer.isBuffer(audioFile),
        size: audioFile?.length,
        // instanceof check is redundant if isBuffer is true, but doesn't hurt
        validBuffer: audioFile instanceof Buffer
    });

    // --- Input Validation ---
    if (!Buffer.isBuffer(audioFile) || audioFile.length === 0) {
         const reason = !Buffer.isBuffer(audioFile) ? 'Input is not a valid Buffer' : 'Audio file buffer is empty';
         console.error('Invalid audio input:', {
            isBuffer: Buffer.isBuffer(audioFile),
            length: audioFile?.length,
            reason: reason
         });
        throw new Error(`Invalid audio input: ${reason}`);
    }

    // --- Optional: Service Availability Check ---
    // const isAvailable = await checkServiceAvailability();
    // if (!isAvailable) {
    //     throw new Error(`pitchResult service at ${destination} is not available`);
    // }

    let lastError: Error | null = null;

    // --- Retry Loop ---
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        console.log(`pitchResult analysis attempt ${attempt}/${MAX_RETRIES}...`);
        try {
            // 1. Convert to WAV
            console.log('Attempting to convert audio buffer to WAV...');
            const wavBuffer = await convertToWav(audioFile);
            console.log(`Conversion successful. WAV buffer size: ${wavBuffer.length}`);

            // 2. Create FormData and append WAV buffer directly
            const formData = new FormData();
            formData.append('file', wavBuffer, {
                filename: 'audio.wav',
                contentType: 'audio/wav',
            });

            // 3. Send to Service
            console.log(`Sending WAV request to: ${destination}`);
            const response = await axios.post(destination, formData, {
                headers: {
                    ...formData.getHeaders(),
                    'Content-Type': 'multipart/form-data'
                },
                maxContentLength: Infinity, // Allow large uploads
                maxBodyLength: Infinity,    // Allow large uploads
                timeout: TIMEOUT           // Timeout for the API request itself
            });
            console.log('pitchResult service responded successfully.');
            return { data: response.data };

        } catch (error: any) {
            lastError = error; // Store the error from this attempt
            console.error(`Attempt ${attempt} failed: ${error.message}`);

            // Check if it's the last attempt
            if (attempt === MAX_RETRIES) {
                console.error(`pitchResult analysis failed after ${MAX_RETRIES} attempts.`);
                throw new Error(`pitchResult service failed after ${MAX_RETRIES} attempts: ${lastError.message}`); // Throw the last encountered error
            }

            // Wait before retrying (simple linear backoff)
            const delay = 1000 * attempt;
            console.log(`Waiting ${delay}ms before retrying...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    // Should theoretically not be reached if MAX_RETRIES > 0, but acts as a fallback.
    throw lastError || new Error('pitchResult analysis failed due to an unknown error after retries.');
}
