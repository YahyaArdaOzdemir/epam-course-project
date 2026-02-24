import express from 'express';
import path from 'path';
import { apiRouter } from './routes';
import { errorHandler } from './middleware/error-handler';

export const app = express();

app.use(express.json());
app.use('/uploads', express.static(path.resolve(process.env.UPLOAD_DIR ?? 'backend/uploads')));
app.use('/api', apiRouter);
app.use(errorHandler);
