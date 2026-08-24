import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { sanitizeFilename, validateFileExtension } from '../utils/fileSecurity';

const uploadDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const sanitized = sanitizeFilename(file.originalname);
    const ext = path.extname(sanitized).toLowerCase();
    const uniqueHash = crypto.randomBytes(16).toString('hex');
    cb(null, `${uniqueHash}-${Date.now()}${ext}`);
  },
});

const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  try {
    const sanitizedName = sanitizeFilename(file.originalname);
    validateFileExtension(sanitizedName, file.mimetype);
    cb(null, true);
  } catch (error) {
    cb(error as Error);
  }
};

export const uploadAttachment = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1,
  },
  fileFilter,
});
