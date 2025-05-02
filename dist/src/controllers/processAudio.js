"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertToWav = convertToWav;
const stream_1 = require("stream");
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
async function convertToWav(inputBuffer) {
    return new Promise((resolve, reject) => {
        let outputBuffer = Buffer.alloc(0);
        const inputStream = new stream_1.Readable();
        inputStream.push(inputBuffer);
        inputStream.push(null); // Signal EOF
        console.log(`Starting audio conversion. Input buffer size: ${inputBuffer.length} bytes`);
        const command = ffmpeg(inputStream)
            // Auto-detect input format (including AAC and M4A)
            .outputOptions([
            '-ac 1', // mono output (reduces file size)
            '-ar 16000', // 16kHz sample rate (sufficient for speech)
            '-acodec pcm_u8' // 8-bit PCM audio (smallest size)
        ])
            .toFormat('wav')
            .audioCodec('pcm_u8') // 8-bit unsigned PCM
            .audioChannels(1) // Ensure mono output
            .duration(300); // Set a fixed maximum duration of 5 minutes (300 seconds)
        let ffmpegStderr = ''; // Collect stderr for better error reporting
        command
            .on('start', (commandLine) => {
            console.log('FFmpeg conversion started:', commandLine);
        })
            .on('stderr', (stderrLine) => {
            ffmpegStderr += stderrLine + '\n';
        })
            .on('error', (err, stdout, stderr) => {
            const fullStderr = ffmpegStderr + (stderr || '');
            console.error('FFmpeg conversion error:', err.message);
            console.error('FFmpeg stderr output:\n', fullStderr);
            const error = new Error(`FFmpeg conversion failed: ${err.message}. FFmpeg stderr: ${fullStderr}`);
            reject(error);
        })
            .on('end', () => {
            console.log('FFmpeg conversion finished successfully.');
            if (outputBuffer.length === 0) {
                console.error('FFmpeg stderr output on empty buffer:\n', ffmpegStderr);
                reject(new Error('FFmpeg conversion finished but produced an empty buffer. Check FFmpeg stderr log.'));
            }
            else {
                resolve(outputBuffer);
            }
        })
            .pipe()
            .on('data', (chunk) => {
            outputBuffer = Buffer.concat([outputBuffer, chunk]);
        })
            .on('error', (err) => {
            console.error('FFmpeg output stream error:', err.message);
            const error = new Error(`FFmpeg output stream error: ${err.message}. FFmpeg stderr: ${ffmpegStderr}`);
            reject(error);
        });
    });
}
function ffmpeg(inputStream) {
    return (0, fluent_ffmpeg_1.default)(inputStream);
}
//# sourceMappingURL=processAudio.js.map