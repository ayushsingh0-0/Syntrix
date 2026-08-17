import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import fs from 'fs';
import { getCorrelationId } from '../middleware/correlationId.middleware';

const logDir = path.resolve(process.cwd(), 'logs');

// Ensure log directory exists
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Log Levels & Colors
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'cyan',
};

winston.addColors(colors);

// Format enrichment: inject correlation ID, timestamp, and environment
const enrichFormat = winston.format((info) => {
  info.correlationId = info.correlationId || getCorrelationId();
  info.environment = process.env.NODE_ENV || 'development';
  info.service = 'syntrix-backend';
  return info;
});

// Console format for human readability in development
const consoleFormat = winston.format.combine(
  enrichFormat(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, correlationId, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level}] [${correlationId}] ${message}${metaStr}`;
  })
);

// JSON format for structured file logs
const jsonFormat = winston.format.combine(
  enrichFormat(),
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Transport: Application Log Rotation (All info and above)
const appRotateTransport = new DailyRotateFile({
  filename: path.join(logDir, 'app-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
  level: 'info',
  format: jsonFormat,
});

// Transport: Error Log Rotation (Errors only)
const errorRotateTransport = new DailyRotateFile({
  filename: path.join(logDir, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '30d',
  level: 'error',
  format: jsonFormat,
});

// Transport: Security Audit Log Rotation
const securityRotateTransport = new DailyRotateFile({
  filename: path.join(logDir, 'security-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '90d',
  level: 'info',
  format: jsonFormat,
});

// Create Primary Application Logger
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  levels,
  transports: [
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'production' ? jsonFormat : consoleFormat,
    }),
    appRotateTransport,
    errorRotateTransport,
  ],
  exitOnError: false,
});

// Create Dedicated Security Audit Logger
export const securityLogger = winston.createLogger({
  levels,
  transports: [
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'production' ? jsonFormat : consoleFormat,
      level: 'info',
    }),
    securityRotateTransport,
  ],
  exitOnError: false,
});

/**
 * Helper to log structured security audit events
 */
export const logSecurityEvent = (
  eventType: string,
  details: {
    userId?: string;
    email?: string;
    orgId?: string;
    projectId?: string;
    ipAddress?: string;
    userAgent?: string;
    action: string;
    status: 'SUCCESS' | 'DENIED' | 'LOCKED' | 'FLAGGED';
    metadata?: Record<string, unknown>;
  }
) => {
  securityLogger.info(`[SECURITY_AUDIT] ${eventType}: ${details.action} (${details.status})`, {
    securityEvent: eventType,
    ...details,
  });
};
