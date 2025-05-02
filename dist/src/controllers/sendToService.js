"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendToService = sendToService;
const axios_1 = __importDefault(require("axios"));
const form_data_1 = __importDefault(require("form-data"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const processAudio_1 = require("./processAudio");
const os_1 = __importDefault(require("os"));
const uuid_1 = require("uuid");
const console_1 = require("console");
const TIMEOUT = 300000; // Timeout in milliseconds (5 minutes)
async function sendToService(filePath, maxRetries = 15, retryDelay = 20000, url, headers) {
    if (!filePath) {
        throw (0, console_1.error)('file path is required');
    }
    if (!url) {
        throw (0, console_1.error)('URL is required');
    }
    let retries = 0;
    async function makeRequest() {
        let tempFilePath = '';
        let wavBuffer = null;
        try {
            const inputBuffer = fs_1.default.readFileSync(filePath);
            if (inputBuffer.length === 0) {
                throw new Error('Input file is empty');
            }
            console.log(`Input file size: ${inputBuffer.length} bytes`);
            wavBuffer = await (0, processAudio_1.convertToWav)(inputBuffer);
            if (wavBuffer.length < 44) {
                throw new Error('Converted WAV file is invalid or too small');
            }
            console.log(`Converted WAV size: ${wavBuffer.length} bytes`);
            const tempDir = os_1.default.tmpdir();
            tempFilePath = path_1.default.join(tempDir, `send-to-service-${(0, uuid_1.v4)()}.wav`);
            fs_1.default.writeFileSync(tempFilePath, wavBuffer);
            console.log(`Saved WAV to temporary file: ${tempFilePath}`);
            try {
                console.log('Attempting direct binary upload with Content-Type: audio/wav...');
                const fileContent = fs_1.default.readFileSync(tempFilePath);
                console.log(`Raw file size for direct upload: ${fileContent.length} bytes`);
                const directResponse = await axios_1.default.post(url, fileContent, {
                    headers: headers,
                    timeout: TIMEOUT,
                    maxBodyLength: Infinity,
                    maxContentLength: Infinity,
                });
                console.log(`Direct upload response status: ${directResponse.status}`);
                if (directResponse.data) {
                    console.log('Direct upload method successful!');
                    console.log(`Direct upload response: ${JSON.stringify(directResponse.data).substring(0, 200)}...`);
                    if (fs_1.default.existsSync(tempFilePath)) {
                        fs_1.default.unlinkSync(tempFilePath);
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
                    const fileStats = fs_1.default.statSync(tempFilePath);
                    const fileSize = fileStats.size;
                    const fileStream = fs_1.default.createReadStream(tempFilePath);
                    console.log(`Starting chunked upload with file size: ${fileSize} bytes`);
                    const chunkedResponse = await axios_1.default.post(url, fileStream, {
                        headers: headers,
                        timeout: TIMEOUT,
                        maxBodyLength: Infinity,
                        maxContentLength: Infinity,
                    });
                    if (chunkedResponse.data) {
                        console.log('Chunked upload method successful!');
                        if (fs_1.default.existsSync(tempFilePath)) {
                            fs_1.default.unlinkSync(tempFilePath);
                        }
                        return chunkedResponse.data;
                    }
                    throw new Error('Empty response from chunked upload');
                }
                catch (chunkedError) {
                    console.error('Chunked upload failed:', chunkedError.message);
                    console.log('Trying with properly configured FormData...');
                    const formData = new form_data_1.default();
                    const fileBuffer = fs_1.default.readFileSync(tempFilePath);
                    formData.append('file', fileBuffer, {
                        filename: 'audio.wav',
                        contentType: 'audio/wav',
                    });
                    try {
                        const formResponse = await axios_1.default.post(url, formData, {
                            headers: headers,
                            timeout: TIMEOUT,
                            maxBodyLength: Infinity,
                            maxContentLength: Infinity,
                        });
                        if (formResponse.data) {
                            console.log('FormData method successful!');
                            if (fs_1.default.existsSync(tempFilePath)) {
                                fs_1.default.unlinkSync(tempFilePath);
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
                            headers: headers,
                            timeout: TIMEOUT,
                            maxBodyLength: Infinity,
                            maxContentLength: Infinity,
                        });
                        if (finalResponse.data) {
                            console.log('Final attempt successful!');
                            if (fs_1.default.existsSync(tempFilePath)) {
                                fs_1.default.unlinkSync(tempFilePath);
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
            if (shouldCleanup && tempFilePath && fs_1.default.existsSync(tempFilePath)) {
                try {
                    fs_1.default.unlinkSync(tempFilePath);
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
            console.error('Error during send-to-service conversion:', error.message);
            if (error.response) {
                console.error(`Status: ${error.response.status}, Data:`, error.response.data);
            }
            throw new Error(`send-to-service conversion failed: ${error.message}${error.response ? ` (Status: ${error.response.status})` : ''}`);
        }
    }
    return makeRequest();
}
//# sourceMappingURL=sendToService.js.map