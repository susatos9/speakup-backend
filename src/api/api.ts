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

const getDummyData = (): DummyData => ({
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
    },
    "1": {
        "transcript":"I grabbed my coat then drive.",
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
        "transcript":"I grabbed my coat and sold my car yesterday.",
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

const router = express.Router();
const upload = multer({ dest: 'uploads/' });
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

    if(userID ==='test' && sessionID === 'test') {
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
    

    const supportedFormats = ['audio/wav', 'audio/wave', 'audio/mp3', 'audio/mpeg', 'audio/aac', 'audio/x-m4a', 'audio/x-aac'];
    console.log(req.file.mimetype);
    if (!req.file?.mimetype || !supportedFormats.includes(req.file.mimetype)) {
        res.status(400).json({ 
          message: 'Unsupported audio format. Please upload WAV, MP3, AAC or M4A files.',
          supportedFormats,
        });
        return;
      }
      let filler,grammar,pitch,formality;
      
      const filePath = req.file.path; 

      // Process grammar first since formality depends on it
      grammar = await convertSpeechToText(
        filePath,
        15, // maxRetries
        2000, // retryDelay
      );
      console.log(grammar);

      // Extract transcript for formality analysis
      const extractTranscript = (gr: any): string => {
        if (gr && gr.sentence_pairs && Array.isArray(gr.sentence_pairs)) {
          console.log('Sentence pairs:', JSON.stringify(gr.sentence_pairs));
          return gr.sentence_pairs.map((pair: any) => pair.original).join(' ');
        }
        return typeof gr === 'string' ? gr : '';
      };
      
      const transcriptText = extractTranscript(grammar);
      console.log('Extracted transcript:', transcriptText);

      // Process filler, formality, and pitch in parallel
      [filler, formality, pitch] = await Promise.all([
        fillerFunction(
          filePath,
          15, // maxRetries
          20000, // retryDelay
        ),
        analyzeFormality(transcriptText).catch((error) => {
          console.warn('Formality analysis failed:', error.message);
          return null;
        }),
        sendToService(
          filePath,
          15, // maxRetries
          20000, // retryDelay
          'https://pitch-615384299938.asia-southeast1.run.app/analyze',
          {
            filename: 'audio.wav',
            contentType: 'multipart/form-data',
          }
        ).catch((error) => {
          console.warn('Pitch analysis failed:', error.message);
          return null;
        })
      ]);

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
      }

        // Clean up the uploaded file after processing
        fs.unlink(filePath, (err) => {
            if (err) {
                console.error('Failed to delete temporary upload file:', filePath, err);
            } else {
                console.log('Successfully deleted temporary upload file:', filePath);
            }
        });

        const finalresult: AudioAnalysisResult = {
            success: true,
            transcript: transcriptText,
            timestamp: new Date().toISOString(),
            excerciseID: req.body.excerciseID,
            filler: filler,
            grammar: grammar,
            pitch: pitch,
            formality: formality,
        }
        writeToFirebase(userID, sessionID, finalresult);
        res.status(200).json(finalresult);
        return;
    }
);




export default router;
