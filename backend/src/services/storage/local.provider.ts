import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import { IStorageProvider, StorageUploadResult } from './storage.types';

export class LocalStorageProvider implements IStorageProvider {
  private baseDir: string;

  constructor(baseDir = path.resolve(process.cwd(), 'uploads')) {
    this.baseDir = baseDir;
  }

  public async uploadFile(file: Express.Multer.File, folder = 'general'): Promise<StorageUploadResult> {
    const targetDir = path.join(this.baseDir, folder);
    await fs.mkdir(targetDir, { recursive: true });

    const ext = path.extname(file.originalname) || '';
    const uniqueId = crypto.randomUUID();
    const fileName = `${uniqueId}${ext}`;
    const filePath = path.join(targetDir, fileName);

    await fs.writeFile(filePath, file.buffer);

    const relativeKey = `${folder}/${fileName}`;
    const url = `/uploads/${relativeKey}`;

    return {
      url,
      key: relativeKey,
    };
  }

  public async deleteFile(key: string): Promise<void> {
    const filePath = path.join(this.baseDir, key);
    try {
      await fs.unlink(filePath);
    } catch {
      // Ignore if file doesn't exist
    }
  }
}

