import multer from 'multer';
import path from 'path';
import os from 'os';
import { ApiError } from '../utils/ApiError.js';

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = process.env.VERCEL ? os.tmpdir() : './public/temp';
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB Limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new ApiError(400, 'Only image files (jpg, jpeg, png, webp) are allowed!'));
    }
  },
});