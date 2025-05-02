"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const multer_1 = require("multer");
const api_1 = __importDefault(require("./api/api"));
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Register the audio router
app.use('/api', api_1.default);
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
// Error handling middleware
const errorHandler = (err, req, res, next) => {
    if (err instanceof multer_1.MulterError) {
        res.status(400).json({
            error: true,
            message: `File upload error: ${err.message}`
        });
        return;
    }
    if (err instanceof Error) {
        res.status(500).json({
            error: true,
            message: err.message
        });
        return;
    }
    next();
};
app.use(errorHandler);
//# sourceMappingURL=main.js.map