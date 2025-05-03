"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertSpeechToText = convertSpeechToText;
const axios_1 = __importDefault(require("axios"));
const fs = __importStar(require("fs"));
const stream_1 = require("stream");
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
const path_1 = __importDefault(require("path"));
const form_data_1 = __importDefault(require("form-data"));
const uuid_1 = require("uuid");
const os_1 = __importDefault(require("os"));
const TIMEOUT = 300000; // Timeout in milliseconds (5 minutes)
async function convertToWavGrammar(inputBuffer) {
    return new Promise((resolve, reject) => {
        let outputBuffer = Buffer.alloc(0);
        const inputStream = new stream_1.Readable();
        inputStream.push(inputBuffer);
        inputStream.push(null); // Signal EOF
        console.log(`Starting speech-to-text audio conversion. Input buffer size: ${inputBuffer.length} bytes`);
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
async function convertSpeechToText(filePath, maxRetries = 15, retryDelay = 20000) {
    const url = 'https://s2tarkav-525960652018.asia-southeast1.run.app/speech2text';
    let retries = 0;
    async function makeRequest() {
        let tempFilePath = '';
        let wavBuffer = null;
        try {
            const inputBuffer = fs.readFileSync(filePath);
            if (inputBuffer.length === 0) {
                throw new Error('Input file is empty');
            }
            console.log(`Input file size: ${inputBuffer.length} bytes`);
            wavBuffer = await convertToWavGrammar(inputBuffer);
            if (wavBuffer.length < 44) {
                throw new Error('Converted WAV file is invalid or too small');
            }
            console.log(`Converted WAV size: ${wavBuffer.length} bytes`);
            const tempDir = os_1.default.tmpdir();
            tempFilePath = path_1.default.join(tempDir, `speech-to-text-${(0, uuid_1.v4)()}.wav`);
            fs.writeFileSync(tempFilePath, wavBuffer);
            console.log(`Saved WAV to temporary file: ${tempFilePath}`);
            try {
                console.log('Attempting direct binary upload with Content-Type: audio/wav...');
                const fileContent = fs.readFileSync(tempFilePath);
                console.log(`Raw file size for direct upload: ${fileContent.length} bytes`);
                const directResponse = await axios_1.default.post(url, fileContent, {
                    headers: {
                        'Content-Type': 'audio/wav',
                        'Content-Length': fileContent.length.toString(),
                        'Accept': 'application/json',
                    },
                    timeout: TIMEOUT,
                    maxBodyLength: Infinity,
                    maxContentLength: Infinity,
                });
                console.log(`Direct upload response status: ${directResponse.status}`);
                if (directResponse.data) {
                    console.log('Direct upload method successful!');
                    console.log(`Direct upload response: ${JSON.stringify(directResponse.data).substring(0, 200)}...`);
                    if (fs.existsSync(tempFilePath)) {
                        fs.unlinkSync(tempFilePath);
                        console.log(`Cleaned up temporary file: ${tempFilePath}`);
                    }
                    return directResponse.data;
                }
                else {
                    throw new Error('Empty response from direct upload');
                }
            }
            catch (directError) {
                console.error('Direct upload failed:', directError.message);
                console.log('Trying with chunked binary upload...');
                try {
                    const fileStats = fs.statSync(tempFilePath);
                    const fileSize = fileStats.size;
                    const fileStream = fs.createReadStream(tempFilePath);
                    console.log(`Starting chunked upload with file size: ${fileSize} bytes`);
                    const chunkedResponse = await axios_1.default.post(url, fileStream, {
                        headers: {
                            'Content-Type': 'audio/wav',
                            'Content-Length': fileSize.toString(),
                            'Transfer-Encoding': 'chunked',
                            'Accept': 'application/json',
                        },
                        timeout: TIMEOUT,
                        maxBodyLength: Infinity,
                        maxContentLength: Infinity,
                    });
                    if (chunkedResponse.data) {
                        console.log('Chunked upload method successful!');
                        if (fs.existsSync(tempFilePath)) {
                            fs.unlinkSync(tempFilePath);
                        }
                        return chunkedResponse.data;
                    }
                    throw new Error('Empty response from chunked upload');
                }
                catch (chunkedError) {
                    console.error('Chunked upload failed:', chunkedError.message);
                    console.log('Trying with properly configured FormData...');
                    const formData = new form_data_1.default();
                    const fileBuffer = fs.readFileSync(tempFilePath);
                    formData.append('file', fileBuffer, {
                        filename: 'audio.wav',
                        contentType: 'audio/wav',
                    });
                    try {
                        const formResponse = await axios_1.default.post(url, formData, {
                            headers: {
                                ...formData.getHeaders(),
                                'Accept': 'application/json',
                            },
                            timeout: TIMEOUT,
                            maxBodyLength: Infinity,
                            maxContentLength: Infinity,
                        });
                        if (formResponse.data) {
                            console.log('FormData method successful!');
                            if (fs.existsSync(tempFilePath)) {
                                fs.unlinkSync(tempFilePath);
                            }
                            return formResponse.data;
                        }
                        throw new Error('Empty response from FormData method');
                    }
                    catch (formError) {
                        console.error('FormData attempt failed:', formError.message);
                        console.log('Final attempt with "audio" field name...');
                        const finalFormData = new form_data_1.default();
                        finalFormData.append('audio', fileBuffer, {
                            filename: 'audio.wav',
                            contentType: 'audio/wav',
                        });
                        const finalResponse = await axios_1.default.post(url, finalFormData, {
                            headers: {
                                ...finalFormData.getHeaders(),
                                'Accept': 'application/json',
                            },
                            timeout: TIMEOUT,
                            maxBodyLength: Infinity,
                            maxContentLength: Infinity,
                        });
                        if (finalResponse.data) {
                            console.log('Final attempt successful!');
                            if (fs.existsSync(tempFilePath)) {
                                fs.unlinkSync(tempFilePath);
                            }
                            return finalResponse.data;
                        }
                        throw new Error('All upload methods failed');
                    }
                }
            }
        }
        catch (error) {
            const shouldCleanup = !((error.response?.data?.error === 'No audio data received' && retries < maxRetries) ||
                (error.response?.status === 503 && retries < maxRetries) ||
                (error.code === 'ECONNABORTED' && retries < maxRetries));
            if (shouldCleanup && tempFilePath && fs.existsSync(tempFilePath)) {
                try {
                    fs.unlinkSync(tempFilePath);
                    console.log(`Cleaned up temporary file: ${tempFilePath}`);
                }
                catch (cleanupError) {
                    console.error(`Failed to clean up temporary file: ${cleanupError}`);
                }
            }
            if (error.response) {
                console.error('API Error Response:', {
                    status: error.response.status,
                    statusText: error.response.statusText,
                    data: error.response.data,
                    headers: error.response.headers
                });
                if (error.response.status === 400) {
                    console.error('Audio processing error:', error.response.data);
                }
            }
            if (retries < maxRetries && (error.response?.status === 503 ||
                error.response?.status === 400 ||
                error.code === 'ECONNABORTED' ||
                error.message.includes('timeout') ||
                error.response?.data?.error === 'No audio data received')) {
                retries++;
                const actualDelay = retryDelay * Math.pow(1.5, retries - 1);
                console.log(`Retry attempt ${retries} of ${maxRetries} in ${actualDelay / 1000} seconds...`);
                await new Promise(resolve => setTimeout(resolve, actualDelay));
                return makeRequest();
            }
            console.error('Error during speech-to-text conversion:', error.message);
            if (error.response) {
                console.error(`Status: ${error.response.status}, Data:`, error.response.data);
            }
            throw new Error(`Speech-to-text conversion failed: ${error.message}${error.response ? ` (Status: ${error.response.status})` : ''}`);
        }
    }
    return makeRequest();
}
function ffmpeg(inputStream) {
    return (0, fluent_ffmpeg_1.default)(inputStream);
}
function duration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}
//# sourceMappingURL=grammar.js.map