import { AttachmentType } from '@prisma/client';

export interface StorageUploadResult {
  url: string;
  key: string;
}

export interface IStorageProvider {
  uploadFile(file: Express.Multer.File, folder?: string): Promise<StorageUploadResult>;
  deleteFile(key: string): Promise<void>;
}

export interface UploadedFileMetadata {
  url: string;
  key: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  attachmentType: AttachmentType;
}

