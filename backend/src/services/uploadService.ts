import multer from 'multer';
import fs from 'fs';
import { Request } from 'express';
import { env } from '../config/env';
import { sanitizeFilename } from '../utils/helpers';

const uploadDir = env.UPLOAD_DIR;
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const sanitized = sanitizeFilename(file.originalname);
    cb(null, `${uniqueSuffix}-${sanitized}`);
  },
});

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'audio/mpeg',
    'audio/wav',
    'audio/mp3',
    'audio/ogg',
    'application/pdf',
    'text/plain',
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(env.MAX_FILE_SIZE),
  },
});

export const deleteFile = (filepath: string): void => {
  try {
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
  } catch (error) {
    console.error('Error deleting file:', error);
  }
};
