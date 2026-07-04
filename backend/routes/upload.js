const express = require('express');
const multer  = require('multer');
const path    = require('path');
const { v2: cloudinary } = require('cloudinary');
const { authMiddleware } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/asyncHandler');

const router = express.Router();

// Cloudinary (production) si CLOUDINARY_URL est défini, sinon disque local (développement).
// Sur Render gratuit le disque est éphémère : sans Cloudinary, les images
// uploadées disparaissent au redémarrage.
const CLOUDINARY_ENABLED = !!process.env.CLOUDINARY_URL;
if (CLOUDINARY_ENABLED) cloudinary.config({ secure: true });

const diskStorage = multer.diskStorage({
  destination: path.join(__dirname, '../uploads'),
  filename: (req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, name);
  },
});

const ALLOWED_EXT = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const upload = multer({
  storage: CLOUDINARY_ENABLED ? multer.memoryStorage() : diskStorage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 }, // 5 MB, 1 fichier
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    // Double vérification : extension ET type MIME déclaré
    if (ALLOWED_EXT.includes(ext) && ALLOWED_MIME.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Format non supporté. Utilisez JPG, PNG ou WEBP.'));
  },
});

function uploadToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'marketbf', resource_type: 'image' },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(buffer);
  });
}

router.post('/', authMiddleware, upload.single('image'), asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Aucun fichier reçu' });

  if (CLOUDINARY_ENABLED) {
    const result = await uploadToCloudinary(req.file.buffer);
    return res.json({ url: result.secure_url });
  }

  res.json({ url: `/uploads/${req.file.filename}` });
}));

router.use((err, req, res, next) => {
  res.status(400).json({ error: err.message });
});

module.exports = router;
