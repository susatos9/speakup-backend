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
const express_1 = __importDefault(require("express"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const firebase_upload_1 = require("../functions/firebase_upload");
const split_upload_1 = require("../functions/split_upload");
const pitch_1 = __importDefault(require("../functions/model_hafid/pitch"));
const grammar_1 = require("../functions/model_hafid/grammar");
const formality_1 = require("../functions/model_olivia/formality");
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const router = express_1.default.Router();
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
// Configure multer with file size limit
const upload = (0, split_upload_1.configureMulter)();
// Firebase auth middleware
const validateFirebaseToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(403).json({ message: 'Unauthorized - missing or invalid token format' });
    }
    const token = authHeader.split('Bearer ')[1];
    try {
        const decodedToken = await firebase_admin_1.default.auth().verifyIdToken(token);
        req.user = decodedToken;
        next();
    }
    catch (error) {
        return res.status(403).json({ message: 'Unauthorized - invalid token' });
    }
};
const writeToFirebase = async (userID, sessionID, result) => {
    try {
        const docRef = firebase_admin_1.default.firestore()
            .collection('users')
            .doc(userID)
            .collection('sessions')
            .doc(sessionID);
        await docRef.update({
            timestamp: firebase_admin_1.default.firestore.FieldValue.serverTimestamp(),
            ...result
        });
        console.log('Successfully wrote to Firebase:', { userID, sessionID, result });
    }
    catch (error) {
        console.error('Error writing to Firebase:', error);
        throw error;
    }
};
router.post('/upload-audio', upload.single('audio'), async (req, res) => {
    let tempFilePath = null;
    try {
        const userID = req.body.userID;
        const sessionID = req.body.sessionID;
        if (!userID || !sessionID) {
            return res.status(400).json({ message: 'Missing required fields: userID and sessionID' });
        }
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        // Add format validation with expanded supported formats
        const supportedFormats = [
            'audio/wav', 'audio/wave', 'audio/mp3', 'audio/mpeg',
            'audio/aac', 'audio/x-aac', 'audio/mp4', 'audio/x-m4a'
        ];
        console.log('Uploaded file:', req.file.mimetype, req.file.size);
        if (!supportedFormats.includes(req.file.mimetype)) {
            return res.status(400).json({
                message: 'Unsupported audio format. Please upload WAV, MP3, AAC or M4A files.',
                supportedFormats
            });
        }
        if (!Buffer.isBuffer(req.file.buffer)) {
            return res.status(400).json({ message: 'Invalid file format' });
        }
        const intersectionTime = req.body.intersectionTime ? parseFloat(req.body.intersectionTime) : 1;
        const destination = `users/${userID}/sessions/${sessionID}`;
        // Create temporary file for speech-to-text processing
        tempFilePath = path.join('/tmp', `${Date.now()}-${req.file.originalname}`);
        fs.writeFileSync(tempFilePath, req.file.buffer);
        // Get grammar from speech-to-text API
        console.log('Processing speech-to-text conversion with buffer size:', req.file.buffer.length);
        let grammarResult;
        try {
            grammarResult = await (0, grammar_1.convertSpeechToText)(tempFilePath);
            // console.log(grammarResult);
        }
        catch (grammarError) {
            console.warn('Speech-to-text conversion failed:', grammarError.message);
            grammarResult = "grammar failed";
        }
        console.log('Processing pitchResult analysis with buffer size:', req.file.buffer.length);
        let pitchresult;
        try {
            pitchresult = await (0, pitch_1.default)(Buffer.from(req.file.buffer));
        }
        catch (pitchResultError) {
            console.warn('pitchResult analysis failed:', pitchResultError.message);
            pitchresult = { data: { error: 'pitchResult analysis unavailable' } };
        }
        const uploadResult = await (0, split_upload_1.splitAudioAndUpload)(req.file, intersectionTime, destination);
        // Formality analysis
        let formality;
        // Extract transcript by executing the function immediately instead of storing the function itself
        const extractTranscript = (gr) => {
            if (gr && gr.sentence_pairs && Array.isArray(gr.sentence_pairs)) {
                // Log the sentence pairs for debugging
                console.log('Sentence pairs:', JSON.stringify(gr.sentence_pairs));
                return gr.sentence_pairs.map((pair) => pair.original).join(' ');
            }
            return typeof gr === 'string' ? gr : '';
        };
        // Get the actual transcript text by executing the function
        const transcriptText = extractTranscript(grammarResult);
        console.log('Extracted transcript:', transcriptText);
        try {
            formality = await (0, formality_1.analyzeFormality)(transcriptText);
            console.log('Formality analysis result:', formality);
        }
        catch (formalityError) {
            console.warn('Formality analysis failed:', formalityError.message);
            formality = null; // Set to null if the analysis fails
        }
        // Upload the original file to Firebase
        const audioUrl = await (0, firebase_upload_1.uploadToFirebase)(req.file, destination);
        console.log('Original file uploaded to Firebase:', audioUrl);
        // Transform the results into the required format
        const result = {
            timestamp: new Date().toISOString(),
            audioURL: audioUrl,
            transcript: transcriptText, // Use the extracted transcript text
            grammar: grammarResult,
            pitchResult: pitchresult.data || [],
            formality: formality ? formality : { "classification": "Your speech is 18% formal and 82% informal.", "text": "Yo bro, how is life?" },
        };
        console.log('Saving result with audioURL:', result.audioURL); // Debug log
        await writeToFirebase(userID, sessionID, result);
        return res.status(200).json({
            message: 'Upload successful'
        });
    }
    catch (error) {
        console.error('Error in upload-audio route:', {
            message: error.message,
            stack: error.stack,
            fileInfo: req.file ? {
                size: req.file.size,
                mimetype: req.file.mimetype,
                bufferExists: !!req.file.buffer,
                bufferSize: req.file.buffer?.length
            } : 'No file',
            ffmpegError: error.code === 'FFMPEG_ERROR' ? error.ffmpegError : undefined
        });
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'File too large. Maximum size is 5MB' });
        }
        if (error.code === 'FFMPEG_ERROR') {
            return res.status(422).json({
                message: 'Audio processing failed. Please try with a different file.',
                detail: error.ffmpegError
            });
        }
        return res.status(500).json({
            message: 'Internal server error',
            detail: error.message
        });
    }
    finally {
        // Clean up temporary file
        if (tempFilePath && fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
        }
    }
});
exports.default = router;
//# sourceMappingURL=audio.js.map