import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import apiRouter from './routes';
import errorHandler from './middleware/error.middleware';
import { correlationIdMiddleware } from './middleware/correlationId.middleware';
import { verifySafeRequest, getAllowedOrigins } from './middleware/csrf.middleware';
import { swaggerUi, openapiSpec, swaggerOptions } from './config/swagger.config';
import { env } from './config/env';

const app = express();

// 1. Request tracing & Correlation IDs (very first middleware)
app.use(correlationIdMiddleware);

// 2. High-Performance Gzip / Deflate Response Compression
app.use(
  compression({
    threshold: 1024, // Only compress responses larger than 1KB
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    },
  })
);

// 3. Security Headers (Helmet Hardening)
app.use(
  helmet({
    contentSecurityPolicy: false, // Allows Swagger UI inline rendering on /api-docs
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    crossOriginResourcePolicy: { policy: 'same-origin' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    xContentTypeOptions: true,
    xFrameOptions: { action: 'deny' },
    xXssProtection: true,
    hsts:
      env.NODE_ENV === 'production'
        ? {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true,
          }
        : false,
  })
);

// 4. Strict CORS Configuration
const allowedOrigins = getAllowedOrigins();
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.some((allowed) => origin.startsWith(allowed))) {
        return callback(null, true);
      }
      if (env.NODE_ENV === 'development' || env.NODE_ENV === 'test') {
        return callback(null, true);
      }
      return callback(new Error('Blocked by CORS policy: Untrusted origin'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-Correlation-Id',
      'X-CSRF-Token',
    ],
    exposedHeaders: ['X-Correlation-Id'],
    maxAge: 86400, // 24 hours preflight cache
  })
);

// 5. CSRF / Origin Verification
app.use(verifySafeRequest);

// 6. Body Parsers & Cookie Parser
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(cookieParser());

// 7. Interactive OpenAPI / Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiSpec, swaggerOptions));
app.get('/api-docs.json', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(openapiSpec);
});

// 8. API Endpoints
app.use('/api/v1', apiRouter);

// 9. Centralized Error Handling
app.use(errorHandler);

export default app;
