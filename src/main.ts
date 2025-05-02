import express from 'express';
import * as fs from 'fs';
import * as path from 'path';


const router = express.Router();

router.post('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
    }
);
