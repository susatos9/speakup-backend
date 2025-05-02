import express, { ErrorRequestHandler } from 'express';
import cors from 'cors';
import { MulterError } from 'multer';
import audioRouter from './api/api';

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Register the audio router
app.use('/api', audioRouter);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

// Error handling middleware
const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (err instanceof MulterError) {
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
