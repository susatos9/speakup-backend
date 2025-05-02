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
const multer_1 = __importDefault(require("multer"));
const sendToService_1 = require("../controllers/sendToService");
const firebase_1 = require("../config/firebase");
const getDummyData = () => ({
    "0": {
        "transcript": "uh I think it's working now",
        "filler": {
            "chunks": [
                { "text": "uh", "timestamp": [0.0, 0.32] },
                { "text": "I", "timestamp": [0.4, 0.55] },
                { "text": "think", "timestamp": [0.55, 0.89] },
                { "text": "it's", "timestamp": [0.89, 1.03] },
                { "text": "working", "timestamp": [1.03, 1.41] },
                { "text": "now", "timestamp": [1.41, 1.63] }
            ]
        },
        "grammar": {
            "sentence_pairs": [
                {
                    "corrected": "uh I think it's working now",
                    "distance": 1,
                    "original": " uh I think it's working now."
                }
            ],
            "stats": {
                "average_distance": 1,
                "sentences_corrected": 1,
                "total_sentences": 1
            }
        },
        "pitchResult": {
            "pitchAnalysis": {
                "fluctuation_score": 0.8220514779596471,
                "is_monotone": false,
                "pitch_range": 121.26409912109375
            },
            "pitchFluctuation": [
                {
                    "pitch": 284.39239501953125,
                    "timestamp": 0
                }
            ],
            "silentRatio": 0.1759656652360515
        },
        "formality": {
            "formality_score": 0.142,
            "formal_percent": 10,
            "informal_percent": 90,
            "classification": "Your speech is 10% formal and 90% informal."
        }
    },
    "1": {
        "transcript": "I grabbed my coat then drive.",
        "filler": {
            "chunks": [
                { "text": "I", "timestamp": [0.0, 0.32] },
                { "text": "grabbed", "timestamp": [0.4, 0.55] },
                { "text": "my", "timestamp": [0.55, 0.89] },
                { "text": "coat", "timestamp": [0.89, 1.03] },
                { "text": "then", "timestamp": [1.03, 1.41] },
                { "text": "drive", "timestamp": [1.41, 1.63] }
            ]
        },
        "grammar": {
            "sentence_pairs": [
                {
                    "corrected": "I grabbed my coat then drive.",
                    "distance": 1,
                    "original": " I grabbed my coat then drive."
                }
            ],
            "stats": {
                "average_distance": 1,
                "sentences_corrected": 1,
                "total_sentences": 1
            }
        },
        "pitchResult": {
            "pitchAnalysis": {
                "fluctuation_score": 0.8220514779596471,
                "is_monotone": false,
                "pitch_range": 121.26409912109375
            },
            "pitchFluctuation": [
                {
                    "pitch": 284.39239501953125,
                    "timestamp": 0
                }
            ],
            "silentRatio": 0.1759656652360515
        },
        "formality": {
            "formality_score": 0.142,
            "formal_percent": 10,
            "informal_percent": 90,
            "classification": "Your speech is 10% formal and 90% informal."
        }
    },
    "2": {
        "transcript": "I grabbed my coat and sold my car yesterday.",
        "filler": {
            "chunks": [
                { "text": "It's", "timestamp": [0.0, 0.32] },
                { "text": "time", "timestamp": [0.4, 0.55] },
                { "text": "to", "timestamp": [0.55, 0.89] },
                { "text": "dance", "timestamp": [0.89, 1.03] },
                { "text": "on", "timestamp": [1.03, 1.41] },
                { "text": "stage", "timestamp": [1.41, 1.63] }
            ]
        },
        "grammar": {
            "sentence_pairs": [
                {
                    "corrected": "I grabbed my coat and sold my car yesterday.",
                    "distance": 1,
                    "original": " I grabbed my coat and sell my car yesterday."
                }
            ],
            "stats": {
                "average_distance": 1,
                "sentences_corrected": 1,
                "total_sentences": 1
            }
        },
        "pitchResult": {
            "pitchAnalysis": {
                "fluctuation_score": 0.8220514779596471,
                "is_monotone": false,
                "pitch_range": 121.26409912109375
            },
            "pitchFluctuation": [
                {
                    "pitch": 284.39239501953125,
                    "timestamp": 0
                }
            ],
            "silentRatio": 0.1759656652360515
        },
        "formality": {
            "formality_score": 0.142,
            "formal_percent": 10,
            "informal_percent": 90,
            "classification": "Your speech is 10% formal and 90% informal."
        }
    }
});
const router = express_1.default.Router();
const upload = (0, multer_1.default)({ dest: 'uploads/' });
router.post('/upload-audio', upload.single('audio'), async (req, res) => {
    const userID = req.body.userID;
    const sessionID = req.body.sessionID;
    if (!userID || !sessionID) {
        res.status(400).json({ message: 'Missing required fields: userID and sessionID' });
        return;
    }
    if (!req.file) {
        res.status(400).json({ message: 'No file uploaded' });
        return;
    }
    if (userID === 'test' && sessionID === 'test') {
        const dummyData = getDummyData();
        const randomIndexTest = Math.floor(Math.random() * Object.keys(dummyData).length).toString();
        const result = {
            success: true,
            transcript: dummyData[randomIndexTest].transcript,
            timestamp: new Date().toISOString(),
            excerciseID: req.body.excerciseID,
            filler: dummyData[randomIndexTest].filler,
            grammar: dummyData[randomIndexTest].grammar,
            pitch: dummyData[randomIndexTest].pitchResult,
            formality: dummyData[randomIndexTest].formality,
        };
        (0, firebase_1.writeToFirebase)(userID, sessionID, result);
        res.status(200).json(result);
        return;
    }
    const supportedFormats = ['audio/wav', 'audio/wave', 'audio/mp3', 'audio/mpeg', 'audio/aac'];
    if (!req.file?.mimetype || !supportedFormats.includes(req.file.mimetype)) {
        res.status(400).json({
            message: 'Unsupported audio format. Please upload WAV, MP3, AAC or M4A files.',
            supportedFormats,
        });
        return;
    }
    let filler, grammar, pitch, formality;
    // Use req.file.path directly as it's relative to the project root
    const filePath = req.file.path;
    filler = await (0, sendToService_1.sendToService)(filePath, 15, // maxRetries
    20000, // retryDelay
    'https://pitch-615384299938.asia-southeast1.run.app/analyze', // Replace with your actual URL
    {
        filename: 'audio.wav',
        contentType: 'multipart/form-data',
    });
    console.log(filler);
    grammar = await (0, sendToService_1.sendToService)(filePath, 15, // maxRetries
    20000, // retryDelay
    'https://api.example.com/endpoint', // Replace with your actual URL
    {
        'Content-Type': req.file.mimetype,
    });
    pitch = await (0, sendToService_1.sendToService)(filePath, 15, // maxRetries
    20000, // retryDelay
    'https://api.example.com/endpoint', // Replace with your actual URL
    {
        'Content-Type': req.file.mimetype,
    });
    formality = await (0, sendToService_1.sendToService)(filePath, 15, // maxRetries
    20000, // retryDelay
    'https://api.example.com/endpoint', // Replace with your actual URL
    {
        'Content-Type': req.file.mimetype,
    });
    // how to load dummy data from a json file
    // Construct path to dummy data relative to __dirname
    const dummyDataPath = path.join(__dirname, '../utils/dummy/dummy-data.json');
    const dummyData = fs.readFileSync(dummyDataPath, 'utf-8');
    const parsedData = JSON.parse(dummyData);
    // Ensure parsedData is treated as an array or object as expected
    // Assuming it's an object with keys "0", "1", "2" based on the file content
    const keys = Object.keys(parsedData);
    const randomIndex = Math.floor(Math.random() * keys.length);
    const randomKey = keys[randomIndex];
    const randomDummyEntry = parsedData[randomKey];
    let result = {
        timestamp: new Date().toISOString(),
        excerciseID: req.body.excerciseID,
        filler: filler ? filler : randomDummyEntry.filler,
        grammar: grammar ? grammar : randomDummyEntry.grammar,
        pitch: pitch ? pitch : randomDummyEntry.pitchResult, // Corrected key name
        formality: formality ? formality : randomDummyEntry.formality,
    };
    // Clean up the uploaded file after processing
    fs.unlink(filePath, (err) => {
        if (err) {
            console.error('Failed to delete temporary upload file:', filePath, err);
        }
        else {
            console.log('Successfully deleted temporary upload file:', filePath);
        }
    });
    res.status(200).json({
        message: 'Audio file processed successfully',
        data: result // Send the result back
    });
});
exports.default = router;
//# sourceMappingURL=api.js.map