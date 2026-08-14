export interface StoredFile {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  path: string;
}

export interface IStorageProvider {
  saveFile(file: Express.Multer.File): Promise<StoredFile>;
  deleteFile(filePath: string): Promise<boolean>;
  getFilePath(filePath: string): string;
}
