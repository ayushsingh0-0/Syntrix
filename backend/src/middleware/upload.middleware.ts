import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { ApiError } from '../utils/ApiError';

const uploadDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueHash = crypto.randomBytes(16).toString('hex');
    cb(null, `${uniqueHash}-${Date.now()}${ext}`);
  },
});

const ALLOWED_MIME_TYPES = new Set([
  // Images
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  // Documents
  'application/pdf',
  'text/plain',
  'text/markdown',
  'text/csv',
  // Code & Data
  'application/json',
  'application/xml',
  'text/javascript',
  'text/typescript',
  // Archives
  'application/zip',
  'application/x-zip-compressed',
  'application/x-tar',
  'application/gzip',
]);

const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  if (ALLOWED_MIME_TYPES.has(file.mimetype.toLowerCase())) {
    cb(null, true);
  } else {
    cb(
      new ApiError(
        400,
        `Unsupported file type '${file.mimetype}'. Allowed types include images, PDFs, text files, JSON, CSV, and zip archives.`
      )
    );
  }
};

export const uploadAttachment = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter,
});
