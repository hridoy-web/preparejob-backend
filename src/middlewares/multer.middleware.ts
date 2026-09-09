import multer from 'multer';
import path from 'path';

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB Limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extName = path.extname(file.originalname).toLowerCase().replace('.', '');
    const isValidExt = allowedTypes.test(extName);
    const isValidMime = allowedTypes.test(file.mimetype);

    if (isValidExt && isValidMime) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (jpg, jpeg, png, webp) are allowed!'));
    }
  },
});