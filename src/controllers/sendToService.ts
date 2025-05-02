import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { convertToWav } from './processAudio';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';


const TIMEOUT = 300000; // Timeout in milliseconds (5 minutes)

export async function sendToService(filePath: string, maxRetries = 15, retryDelay = 20000, url:string, headers:{}): Promise<string> {
    if (!filePath) {
        console.log('File path is required');
        return 'file path is required';
    }
    if (!url) {
        console.log('URL is required');
        return 'url is required';
    }
    let retries = 0;
    
    async function makeRequest() {
        let tempFilePath = '';
        let wavBuffer: Buffer | null = null;
        
        try {
            const inputBuffer = fs.readFileSync(filePath);
            
            if (inputBuffer.length === 0) {
                throw new Error('Input file is empty');
            }
            
            console.log(`Input file size: ${inputBuffer.length} bytes`);

            wavBuffer = await convertToWav(inputBuffer);
            
            if (wavBuffer.length < 44) {
                throw new Error('Converted WAV file is invalid or too small');
            }
            
            console.log(`Converted WAV size: ${wavBuffer.length} bytes`);
            
            const tempDir = os.tmpdir();
            tempFilePath = path.join(tempDir, `speech-to-text-${uuidv4()}.wav`);
            fs.writeFileSync(tempFilePath, wavBuffer);
            
            console.log(`Saved WAV to temporary file: ${tempFilePath}`);
            
            try {
                console.log('Attempting direct binary upload with Content-Type: audio/wav...');
                
                const fileContent = fs.readFileSync(tempFilePath);
                console.log(`Raw file size for direct upload: ${fileContent.length} bytes`);
                
                const directResponse = await axios.post(url, fileContent, {
                    headers: headers,
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
                } else {
                    throw new Error('Empty response from direct upload');
                }
                
            } catch (directError: any) {
                console.error('Direct upload failed:', directError.message);
                
                console.log('Trying with chunked binary upload...');
                
                try {
                    const fileStats = fs.statSync(tempFilePath);
                    const fileSize = fileStats.size;
                    const fileStream = fs.createReadStream(tempFilePath);
                    
                    console.log(`Starting chunked upload with file size: ${fileSize} bytes`);
                    
                    const chunkedResponse = await axios.post(url, fileStream, {
                        headers: headers,
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
                    
                } catch (chunkedError: any) {
                    console.error('Chunked upload failed:', chunkedError.message);
                    
                    console.log('Trying with properly configured FormData...');
                    
                    const formData = new FormData();
                    
                    const fileBuffer = fs.readFileSync(tempFilePath);
                    
                    formData.append('file', fileBuffer, {
                        filename: 'audio.wav',
                        contentType: 'audio/wav',
                    });
                    
                    try {
                        const formResponse = await axios.post(url, formData, {
                            headers: headers,
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
                        
                    } catch (formError: any) {
                        console.error('FormData attempt failed:', formError.message);
                        
                        console.log('Final attempt with "audio" field name...');
                        
                        const finalFormData = new FormData();
                        finalFormData.append('audio', fileBuffer, {
                            filename: 'audio.wav',
                            contentType: 'audio/wav',
                        });
                        
                        const finalResponse = await axios.post(url, finalFormData, {
                            headers: headers,
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
        } catch (error: any) {
            const shouldCleanup = !(
                (error.response?.data?.error === 'No audio data received' && retries < maxRetries) ||
                (error.response?.status === 503 && retries < maxRetries) || 
                (error.code === 'ECONNABORTED' && retries < maxRetries)
            );
            
            if (shouldCleanup && tempFilePath && fs.existsSync(tempFilePath)) {
                try {
                    fs.unlinkSync(tempFilePath);
                    console.log(`Cleaned up temporary file: ${tempFilePath}`);
                } catch (cleanupError) {
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
            
            if (retries < maxRetries && (
                error.response?.status === 503 ||
                error.response?.status === 400 ||
                error.code === 'ECONNABORTED' ||
                error.message.includes('timeout') ||
                error.response?.data?.error === 'No audio data received'
            )) {
                retries++;
                const actualDelay = retryDelay * Math.pow(1.5, retries - 1);
                console.log(`Retry attempt ${retries} of ${maxRetries} in ${actualDelay/1000} seconds...`);
                
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