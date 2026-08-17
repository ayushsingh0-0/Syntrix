import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import apiRouter from './routes';
import errorHandler from './middleware/error.middleware';
import { correlationIdMiddleware } from './middleware/correlationId.middleware';
import { httpLoggerMiddleware } from './middleware/httpLogger.middleware';

const app = express();

// 1. Request tracing & Correlation IDs (very first middleware)
app.use(correlationIdMiddleware);

// 2. Structured HTTP access logging & latency monitoring
app.use(httpLoggerMiddleware);

// 3. Core parsers & security middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());
app.use(cookieParser());

// 4. API Endpoints
app.use('/api/v1', apiRouter);

// 5. Centralized Error Handling
app.use(errorHandler);

export default app;
