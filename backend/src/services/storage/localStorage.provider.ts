import fs from 'fs';
import path from 'path';
import { IStorageProvider, StoredFile } from './storage.interface';

export class LocalDiskStorageProvider implements IStorageProvider {
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.resolve(process.cwd(), 'uploads');
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async saveFile(file: Express.Multer.File): Promise<StoredFile> {
    const filename = file.filename || file.originalname;
    const filePath = file.path;
    const url = `/api/v1/attachments/files/${filename}`;

    return {
      filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      url,
      path: filePath,
    };
  }

  async deleteFile(filePath: string): Promise<boolean> {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to delete physical file:', err);
      return false;
    }
  }

  getFilePath(filePath: string): string {
    return filePath;
  }
}

export const defaultStorageProvider = new LocalDiskStorageProvider();
