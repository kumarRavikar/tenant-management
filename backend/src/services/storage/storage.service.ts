import { AttachmentType } from '@prisma/client';
import { IStorageProvider, UploadedFileMetadata } from './storage.types';
import { LocalStorageProvider } from './local.provider';
import { AppError } from '../../middleware/error.middleware';

const ALLOWED_PHOTO_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_AUDIO_MIMES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/wave',
  'audio/x-wav',
  'audio/ogg',
  'audio/webm',
  'audio/m4a',
  'audio/x-m4a',
  'audio/mp4',
];
const ALLOWED_DOC_MIMES = ['application/pdf', 'text/plain'];

const MAX_PHOTO_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_AUDIO_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_DOC_SIZE = 10 * 1024 * 1024; // 10MB

export class StorageService {
  private provider: IStorageProvider;

  constructor(provider?: IStorageProvider) {
    this.provider = provider || new LocalStorageProvider();
  }

  public determineAttachmentType(mimeType: string): AttachmentType {
    if (ALLOWED_PHOTO_MIMES.includes(mimeType)) {
      return AttachmentType.PHOTO;
    }
    if (ALLOWED_AUDIO_MIMES.includes(mimeType)) {
      return AttachmentType.VOICE_NOTE;
    }
    if (ALLOWED_DOC_MIMES.includes(mimeType)) {
      return AttachmentType.DOCUMENT;
    }
    throw new AppError(
      `Unsupported file type: ${mimeType}. Allowed: JPEG, PNG, WebP, MP3, WAV, OGG, M4A, WebM audio, PDF.`,
      400
    );
  }

  public validateFile(file: Express.Multer.File): AttachmentType {
    if (!file || !file.buffer) {
      throw new AppError('No file provided for upload', 400);
    }

    const attachmentType = this.determineAttachmentType(file.mimetype);

    if (attachmentType === AttachmentType.PHOTO && file.size > MAX_PHOTO_SIZE) {
      throw new AppError(`Photo attachment exceeds maximum size of 5MB`, 400);
    }

    if (attachmentType === AttachmentType.VOICE_NOTE && file.size > MAX_AUDIO_SIZE) {
      throw new AppError(`Voice note exceeds maximum size of 10MB`, 400);
    }

    if (attachmentType === AttachmentType.DOCUMENT && file.size > MAX_DOC_SIZE) {
      throw new AppError(`Document exceeds maximum size of 10MB`, 400);
    }

    return attachmentType;
  }

  public async upload(file: Express.Multer.File, folder = 'attachments'): Promise<UploadedFileMetadata> {
    const attachmentType = this.validateFile(file);
    const { url, key } = await this.provider.uploadFile(file, folder);

    return {
      url,
      key,
      fileName: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size,
      attachmentType,
    };
  }

  public async delete(key: string): Promise<void> {
    await this.provider.deleteFile(key);
  }
}

export const storageService = new StorageService();

