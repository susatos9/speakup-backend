"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const router = express_1.default.Router();
const upload = (0, multer_1.default)({ dest: 'uploads/' });
router.post('/upload-audio', upload.single('audio'), async (req, res) => {
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
    let filler, grammar, ptich, formality;
});
exports.default = router;
//# sourceMappingURL=api.js.map