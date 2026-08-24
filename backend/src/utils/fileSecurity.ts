import fs from 'fs';
import path from 'path';
import { ApiError } from './ApiError';

/**
 * High-risk / executable extensions that must never be accepted under any circumstances.
 */
const BLOCKED_EXTENSIONS = new Set([
  '.exe',
  '.bat',
  '.cmd',
  '.sh',
  '.ps1',
  '.vbs',
  '.php',
  '.phtml',
  '.php5',
  '.dll',
  '.scr',
  '.msi',
  '.jsp',
  '.asp',
  '.aspx',
  '.html',
  '.htm',
  '.hta',
  '.jar',
  '.com',
  '.bin',
  '.cpl',
]);

/**
 * Allowed safe file extensions mapped to permitted MIME types.
 */
const ALLOWED_EXTENSIONS_MAP: Record<string, string[]> = {
  // Images
  '.png': ['image/png'],
  '.jpg': ['image/jpeg', 'image/jpg'],
  '.jpeg': ['image/jpeg', 'image/jpg'],
  '.webp': ['image/webp'],
  '.gif': ['image/gif'],
  '.svg': ['image/svg+xml'],
  // Documents
  '.pdf': ['application/pdf'],
  '.txt': ['text/plain'],
  '.md': ['text/markdown', 'text/plain'],
  '.csv': ['text/csv', 'text/plain', 'application/vnd.ms-excel'],
  // Data
  '.json': ['application/json', 'text/plain'],
  '.xml': ['application/xml', 'text/xml', 'text/plain'],
  // Archives
  '.zip': ['application/zip', 'application/x-zip-compressed'],
  '.tar': ['application/x-tar'],
  '.gz': ['application/gzip'],
};

/**
 * Sanitizes an uploaded filename to prevent directory traversal and header injection.
 */
export function sanitizeFilename(filename: string): string {
  // 1. Remove path traversal indicators and null bytes
  const basename = path.basename(filename).replace(/\0/g, '');

  // 2. Replace any non-alphanumeric/safe characters except dots, hyphens, and underscores
  const cleaned = basename.replace(/[^a-zA-Z0-9.\-_]/g, '_');

  // 3. Limit length to 200 chars while preserving extension
  const ext = path.extname(cleaned);
  const nameWithoutExt = path.basename(cleaned, ext);
  const truncatedName = nameWithoutExt.slice(0, 200 - ext.length);

  return `${truncatedName || 'file'}${ext}`;
}

/**
 * Validates the file extension against both the blacklist and allowed MIME types.
 */
export function validateFileExtension(originalName: string, mimeType: string): void {
  const ext = path.extname(originalName).toLowerCase();

  if (!ext) {
    throw new ApiError(400, 'Uploaded file must have a valid file extension');
  }

  if (BLOCKED_EXTENSIONS.has(ext)) {
    throw new ApiError(
      400,
      `Security violation: Executable or script extension '${ext}' is strictly forbidden.`
    );
  }

  const validMimes = ALLOWED_EXTENSIONS_MAP[ext];
  if (!validMimes) {
    throw new ApiError(
      400,
      `File extension '${ext}' is not supported. Allowed formats include PNG, JPG, WebP, GIF, SVG, PDF, TXT, MD, CSV, JSON, XML, ZIP.`
    );
  }

  const normalizedMime = mimeType.toLowerCase();
  if (!validMimes.includes(normalizedMime)) {
    throw new ApiError(
      400,
      `MIME type mismatch: Declared type '${mimeType}' does not match file extension '${ext}'.`
    );
  }
}

/**
 * Inspects the initial bytes (magic numbers) of a file to verify its true binary signature.
 */
export async function verifyFileMagicBytes(filePath: string, ext: string): Promise<boolean> {
  const normalizedExt = ext.toLowerCase();

  // Plaintext formats don't have binary magic bytes
  if (['.txt', '.md', '.csv', '.json', '.xml', '.svg'].includes(normalizedExt)) {
    return true;
  }

  try {
    const buffer = Buffer.alloc(8);
    const fd = await fs.promises.open(filePath, 'r');
    const { bytesRead } = await fd.read(buffer, 0, 8, 0);
    await fd.close();

    if (bytesRead < 4) return false;

    // PNG: 89 50 4E 47
    if (normalizedExt === '.png') {
      return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
    }

    // JPEG: FF D8 FF
    if (normalizedExt === '.jpg' || normalizedExt === '.jpeg') {
      return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    }

    // GIF: GIF87a or GIF89a (47 49 46 38)
    if (normalizedExt === '.gif') {
      return buffer.toString('ascii', 0, 4) === 'GIF8';
    }

    // PDF: %PDF (25 50 44 46)
    if (normalizedExt === '.pdf') {
      return buffer.toString('ascii', 0, 4) === '%PDF';
    }

    // ZIP: PK.. (50 4B 03 04 or 50 4B 05 06)
    if (normalizedExt === '.zip') {
      return buffer[0] === 0x50 && buffer[1] === 0x4b;
    }

    // WebP: RIFF....WEBP
    if (normalizedExt === '.webp') {
      return buffer.toString('ascii', 0, 4) === 'RIFF';
    }

    return true;
  } catch {
    return false;
  }
}
