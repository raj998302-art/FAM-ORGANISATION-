import { Router } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { requireAuth } from '../middlewares/auth.js';
import { uploadLimiter } from '../middlewares/rateLimiter.js';
import { logger } from '../config/logger.js';
import mongoose from 'mongoose';

const router = Router();

// Configure Cloudinary from env vars
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Memory storage — streams directly to Cloudinary (no disk writes ever)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB strict limit
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG and WEBP images are allowed'));
    }
  },
});

/**
 * POST /api/upload/avatar
 * Upload avatar -> Cloudinary -> saves secure_url to MongoDB profile
 * Returns: { success, url, file_url, secure_url }
 */
router.post('/avatar', uploadLimiter, requireAuth, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
      logger.error('[UPLOAD] Cloudinary not configured');
      return res.status(500).json({ error: 'Image upload service not configured. Set CLOUDINARY_* env vars.' });
    }

    // Stream buffer to Cloudinary — face-crop + auto optimize
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'fam/avatars',
          public_id: `avatar_${req.user._id}_${Date.now()}`,
          transformation: [
            { width: 400, height: 400, crop: 'fill', gravity: 'face' },
            { quality: 'auto', fetch_format: 'auto' },
          ],
          allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
          resource_type: 'image',
        },
        (err, res) => (err ? reject(err) : resolve(res))
      );
      stream.end(req.file.buffer);
    });

    const imageUrl = result.secure_url;

    // Persist Cloudinary URL to UserProfile in MongoDB
    const EntityModel = mongoose.model('Entity');
    const profile = await EntityModel.findOne({ type: 'UserProfile', 'data.user_email': req.user.email });
    if (profile) {
      profile.data.avatar_url = imageUrl;
      profile.markModified('data');
      await profile.save();
    }

    logger.info(`[UPLOAD] Avatar stored for ${req.user.email}: ${imageUrl}`);
    res.json({ success: true, url: imageUrl, file_url: imageUrl, secure_url: imageUrl });
  } catch (error) {
    logger.error(`[UPLOAD] Avatar upload failed for ${req.user?.email}: ${error.message}`);
    next(error);
  }
});

/**
 * POST /api/upload  (legacy general upload — kept for backwards compat)
 */
router.post('/', uploadLimiter, requireAuth, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    if (!process.env.CLOUDINARY_CLOUD_NAME) return res.status(500).json({ error: 'Image upload service not configured' });

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'fam/uploads', transformation: [{ quality: 'auto', fetch_format: 'auto' }], resource_type: 'image' },
        (err, res) => (err ? reject(err) : resolve(res))
      );
      stream.end(req.file.buffer);
    });

    res.json({ url: result.secure_url, file_url: result.secure_url, secure_url: result.secure_url });
  } catch (error) {
    next(error);
  }
});

export default router;
