import express, { Request } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import multer from 'multer';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });
router.post('/upload-audio', upload.single('audio'), async (req, res): Promise<void> => {
    const userID = req.body.userID;
    const sessionID = req.body.sessionID;

    if (!userID || !sessionID) {
      res.status(400).json({ message: 'Missing required fields: userID and sessionID' });
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
      let filler,grammar,ptich,formality;
    }
);

export default router;