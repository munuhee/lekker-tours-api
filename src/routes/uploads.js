import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { requireAdmin } from '../middleware/auth.js';
import { ApiError } from '../utils/ApiError.js';
import { sendData } from '../utils/respond.js';
import { env } from '../config/env.js';
import { slugify } from '../utils/slugify.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.resolve(__dirname, '../../uploads');

const ALLOWED = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
  ['image/avif', '.avif'],
]);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = ALLOWED.get(file.mimetype) ?? '.jpg';
    const base = slugify(path.parse(file.originalname).name).slice(0, 40) || 'image';
    // Random suffix keeps same-named uploads from overwriting one another.
    cb(null, `${base}-${crypto.randomBytes(6).toString('hex')}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 6 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED.has(file.mimetype)) {
      return cb(ApiError.badRequest('Only JPEG, PNG, WebP or AVIF images are accepted.'));
    }
    cb(null, true);
  },
});

const router = Router();

router.post('/admin/uploads', requireAdmin, (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(ApiError.badRequest('That image is larger than the 6MB limit.'));
      }
      return next(err);
    }
    if (!req.file) return next(ApiError.badRequest('No image was received.'));

    const apiBase = `http://localhost:${env.port}`;
    sendData(
      res,
      {
        url: `${apiBase}/uploads/${req.file.filename}`,
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype,
      },
      { status: 201 }
    );
  });
});

export default router;
