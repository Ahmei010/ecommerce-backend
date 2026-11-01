import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { fileURLToPath } from 'node:url';

const backendDirectory = fileURLToPath(new URL('../', import.meta.url));
const uploadDirectory = path.join(backendDirectory, 'uploads');
const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';

const storage = isProduction
  ? multer.memoryStorage()
  : (() => {
    mkdirSync(uploadDirectory, { recursive: true });
    return multer.diskStorage({
      destination: uploadDirectory,
      filename: (req, file, callback) => {
        const extension = path.extname(file.originalname).toLowerCase();
        callback(null, `${randomUUID()}${extension}`);
      },
    });
  })();

function imageFileFilter(req, file, callback) {
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.mimetype)) {
    return callback(new Error('Upload a JPG, PNG, WEBP, or GIF image.'));
  }

  return callback(null, true);
}

const upload = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
});

export default upload;
