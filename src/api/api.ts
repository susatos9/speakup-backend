import express, { Request } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import multer from 'multer';
import { sendToService } from '../controllers/sendToService';
import { writeToFirebase } from '../config/firebase';
import { convertSpeechToText } from '../controllers/grammar';
import { analyzeFormality } from '../controllers/formality';
import { filler as fillerFunction } from '../controllers/filler';
import { DummyData, DummyDataEntry, AudioAnalysisResult } from '../models/audio';
import { bypassAuth } from '../middlewares/middlewares';

const getDummyData = (): DummyData => {
    try {
        const dummyDataPath = path.join(__dirname, '../utils/dummy/dummy-data.json');
        const dummyData = fs.readFileSync(dummyDataPath, 'utf-8');
        return JSON.parse(dummyData);
    } catch (error) {
        console.error('Error reading dummy data:', error);
        // Return hardcoded dummy data as fallback
        return {
            "0": {
                "transcript":"uh I think it's working now",
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
            }
        };
    }
};

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Apply bypassAuth middleware to all routes
router.use(bypassAuth);

router.post('/upload-audio', upload.single('audio'), async (req, res): Promise<void> => {
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

    if(true) {
        const dummyData = getDummyData();
        const randomIndexTest = Math.floor(Math.random() * Object.keys(dummyData).length).toString();
        const result = 
        {
            success: true,
            transcript: dummyData[randomIndexTest].transcript,
            timestamp: new Date().toISOString(),
            excerciseID: req.body.excerciseID,
            filler: dummyData[randomIndexTest].filler,
            grammar: dummyData[randomIndexTest].grammar,
            pitch: dummyData[randomIndexTest].pitchResult,
            formality: dummyData[randomIndexTest].formality,
        }
        writeToFirebase(userID, sessionID, result);
        res.status(200).json(result);
        return;
    }
    

    // const supportedFormats = ['audio/wav', 'audio/wave', 'audio/mp3', 'audio/mpeg', 'audio/aac', 'audio/x-m4a', 'audio/x-aac', 'audio/mp4', 'video/mp4'];
    // console.log(req.file.mimetype);
    // if (!req.file?.mimetype || !supportedFormats.includes(req.file.mimetype)) {
    //     res.status(400).json({ 
    //       message: 'Unsupported audio format. Please upload WAV, MP3, AAC, M4A or MP4 files.',
    //       supportedFormats,
    //     });
    //     return;
    //   }
    //   let filler,grammar,pitch,formality;
      
    //   const filePath = req.file.path; 

    //   // Process grammar first since formality depends on it
    //   grammar = await convertSpeechToText(
    //     filePath,
    //     15, // maxRetries
    //     2000, // retryDelay
    //   );
    //   console.log(grammar);

    //   // Extract transcript for formality analysis
    //   const extractTranscript = (gr: any): string => {
    //     if (gr && gr.sentence_pairs && Array.isArray(gr.sentence_pairs)) {
    //       console.log('Sentence pairs:', JSON.stringify(gr.sentence_pairs));
    //       return gr.sentence_pairs.map((pair: any) => pair.original).join(' ');
    //     }
    //     return typeof gr === 'string' ? gr : '';
    //   };
      
    //   const transcriptText = extractTranscript(grammar);
    //   console.log('Extracted transcript:', transcriptText);

    //   // Process filler, formality, and pitch in parallel
    //   [filler, formality, pitch] = await Promise.all([
    //     fillerFunction(
    //       filePath,
    //       15, // maxRetries
    //       20000, // retryDelay
    //     ),
    //     analyzeFormality(transcriptText).catch((error) => {
    //       console.warn('Formality analysis failed:', error.message);
    //       return null;
    //     }),
    //     sendToService(
    //       filePath,
    //       15, // maxRetries
    //       20000, // retryDelay
    //       'https://pitch-615384299938.asia-southeast1.run.app/analyze',
    //       {
    //         filename: 'audio.wav',
    //         contentType: 'multipart/form-data',
    //       }
    //     ).catch((error) => {
    //       console.warn('Pitch analysis failed:', error.message);
    //       return null;
    //     })
    //   ]);

    //   // Get random dummy data entry
    //   const dummyDataObj = getDummyData();
    //   const keys = Object.keys(dummyDataObj);
    //   const randomIndex = Math.floor(Math.random() * keys.length);
    //   const randomKey = keys[randomIndex];
    //   const randomDummyEntry = dummyDataObj[randomKey as keyof DummyData];

    //   let result = {
    //     timestamp: new Date().toISOString(),
    //     excerciseID: req.body.excerciseID,
    //     filler: filler ? filler : randomDummyEntry.filler,
    //     grammar: grammar ? grammar : randomDummyEntry.grammar,
    //     pitch: pitch ? pitch : randomDummyEntry.pitchResult, // Corrected key name
    //     formality: formality ? formality : randomDummyEntry.formality,
    //   }

    //     // Clean up the uploaded file after processing
    //     fs.unlink(filePath, (err) => {
    //         if (err) {
    //             console.error('Failed to delete temporary upload file:', filePath, err);
    //         } else {
    //             console.log('Successfully deleted temporary upload file:', filePath);
    //         }
    //     });

    //     const finalresult: AudioAnalysisResult = {
    //         success: true,
    //         transcript: transcriptText,
    //         timestamp: new Date().toISOString(),
    //         excerciseID: req.body.excerciseID,
    //         filler: filler,
    //         grammar: grammar,
    //         pitch: pitch,
    //         formality: formality,
    //     }
    //     writeToFirebase(userID, sessionID, finalresult);
    //     res.status(200).json(finalresult);
    //     return;
    }
);




export default router;
