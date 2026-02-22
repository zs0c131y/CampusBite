import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadPath = path.join(__dirname, '../../public/uploads');

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif', 'image/heic', 'image/heif'];
  const allowedExt = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.heic', '.heif'];
  const ext = path.extname(file.originalname || '').toLowerCase();

  if (allowedTypes.includes(file.mimetype) || allowedExt.includes(ext)) {
    cb(null, true);
  } else {
    const error = new Error('Only image files are allowed (jpg, png, webp, avif, heic).');
    error.code = 'INVALID_FILE_TYPE';
    cb(error, false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

export default upload;
