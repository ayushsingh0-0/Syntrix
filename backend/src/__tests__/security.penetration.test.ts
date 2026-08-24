import { describe, it, expect, vi } from 'vitest';
import { sanitizeFilename, validateFileExtension, verifyFileMagicBytes } from '../utils/fileSecurity';
import { verifySafeRequest } from '../middleware/csrf.middleware';
import { ApiError } from '../utils/ApiError';
import type { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

describe('Security Hardening & Penetration Testing', () => {
  describe('File Upload Security & Extension Sanitization', () => {
    it('should sanitize path traversal attempts from filenames', () => {
      expect(sanitizeFilename('../../etc/passwd.png')).toBe('passwd.png');
      expect(sanitizeFilename('..\\..\\windows\\system32\\cmd.exe.jpg')).toBe('cmd.exe.jpg');
      expect(sanitizeFilename('normal_report_2026.pdf')).toBe('normal_report_2026.pdf');
    });

    it('should reject malicious executable and script extensions', () => {
      const dangerousExtensions = [
        'exploit.exe',
        'backdoor.sh',
        'script.bat',
        'payload.php',
        'webshell.phtml',
        'evil.vbs',
        'virus.scr',
        'malware.msi',
        'injection.html',
      ];

      for (const name of dangerousExtensions) {
        expect(() => validateFileExtension(name, 'application/octet-stream')).toThrow(ApiError);
      }
    });

    it('should throw ApiError if declared MIME type does not match extension', () => {
      // Trying to upload a PHP script with image/png MIME
      expect(() => validateFileExtension('script.png', 'application/x-httpd-php')).toThrow(ApiError);
      // Legitimate PNG
      expect(() => validateFileExtension('diagram.png', 'image/png')).not.toThrow();
      // Legitimate PDF
      expect(() => validateFileExtension('contract.pdf', 'application/pdf')).not.toThrow();
    });

    it('should verify true binary magic bytes for PNG and PDF files', async () => {
      const testDir = path.resolve(process.cwd(), 'scratch_test_files');
      if (!fs.existsSync(testDir)) fs.mkdirSync(testDir, { recursive: true });

      // Create valid PNG file
      const pngPath = path.join(testDir, 'test.png');
      fs.writeFileSync(pngPath, Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));

      // Create valid PDF file
      const pdfPath = path.join(testDir, 'test.pdf');
      fs.writeFileSync(pdfPath, Buffer.from('%PDF-1.5 test document header'));

      // Create fake/spoofed PNG (containing plain executable text)
      const fakePngPath = path.join(testDir, 'fake.png');
      fs.writeFileSync(fakePngPath, Buffer.from('MZ\x90\x00\x03\x00\x00\x00'));

      const isPngValid = await verifyFileMagicBytes(pngPath, '.png');
      const isPdfValid = await verifyFileMagicBytes(pdfPath, '.pdf');
      const isFakePngValid = await verifyFileMagicBytes(fakePngPath, '.png');

      expect(isPngValid).toBe(true);
      expect(isPdfValid).toBe(true);
      expect(isFakePngValid).toBe(false);

      // Clean up test files
      fs.rmSync(testDir, { recursive: true, force: true });
    });
  });

  describe('CSRF & Origin Verification Middleware', () => {
    it('should allow safe HTTP methods (GET, HEAD, OPTIONS) unconditionally', () => {
      const req = { method: 'GET', headers: {} } as Request;
      const res = {} as Response;
      const next = vi.fn();

      verifySafeRequest(req, res, next);
      expect(next).toHaveBeenCalledWith();
    });

    it('should permit state-changing requests from localhost/trusted frontend origins', () => {
      const req = {
        method: 'POST',
        headers: {
          origin: 'http://localhost:5173',
        },
      } as unknown as Request;
      const res = {} as Response;
      const next = vi.fn();

      verifySafeRequest(req, res, next);
      expect(next).toHaveBeenCalledWith();
    });
  });
});
