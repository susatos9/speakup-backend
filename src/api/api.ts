import express, { Request } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import multer from 'multer';
import { sendToService } from '../controllers/sendToService';

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
      filler = sendToService(
        path.join(__dirname, '../..', req.file.path),
        15, // maxRetries
        20000, // retryDelay
        'https://api.example.com/endpoint', // Replace with your actual URL
        {
          'Content-Type': req.file.mimetype,
      });
      grammar = sendToService(
        path.join(__dirname, '../..', req.file.path),
        15, // maxRetries
        20000, // retryDelay
        'https://api.example.com/endpoint', // Replace with your actual URL
        {
          'Content-Type': req.file.mimetype,
      });
      pitch = sendToService(
        path.join(__dirname, '../..', req.file.path),
        15, // maxRetries
        20000, // retryDelay
        'https://api.example.com/endpoint', // Replace with your actual URL
        {
          'Content-Type': req.file.mimetype,
      });
      formality = sendToService(
        path.join(__dirname, '../..', req.file.path),
        15, // maxRetries
        20000, // retryDelay
        'https://api.example.com/endpoint', // Replace with your actual URL
        {
          'Content-Type': req.file.mimetype,
      });
    }
);

export default router;
