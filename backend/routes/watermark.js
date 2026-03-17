const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const auth = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// Configure Cloudinary (may already be configured in upload.js)
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Only image files allowed'), false);
    }
});

// GET /api/watermark — get current watermark settings
router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('settings');
        res.json({
            logoPublicId: user.settings?.watermark?.logoPublicId || null,
            logoUrl: user.settings?.watermark?.logoUrl || null,
            position: user.settings?.watermark?.position || 'southeast',
            opacity: user.settings?.watermark?.opacity || 60,
            scale: user.settings?.watermark?.scale || 15,
            enabled: user.settings?.watermark?.enabled || false
        });
    } catch (e) {
        res.status(500).json({ message: 'Failed to load watermark settings' });
    }
});

// POST /api/watermark/upload — upload watermark logo
router.post('/upload', auth, upload.single('logo'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

        const publicId = `autoreach/watermarks/${req.user.id}`;

        const result = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                {
                    public_id: publicId,
                    resource_type: 'image',
                    folder: 'autoreach-ai/watermarks',
                    overwrite: true,
                    transformation: [{ quality: 'auto', fetch_format: 'png' }]
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            ).end(req.file.buffer);
        });

        // Save to user settings
        await User.findByIdAndUpdate(req.user.id, {
            'settings.watermark.logoPublicId': result.public_id,
            'settings.watermark.logoUrl': result.secure_url,
            'settings.watermark.enabled': true
        });

        res.json({
            message: 'Watermark logo uploaded',
            logoPublicId: result.public_id,
            logoUrl: result.secure_url
        });
    } catch (e) {
        console.error('[Watermark] Upload error:', e.message);
        res.status(500).json({ message: 'Upload failed' });
    }
});

// PATCH /api/watermark — update watermark settings
router.patch('/', auth, async (req, res) => {
    try {
        const { position, opacity, scale, enabled } = req.body;
        const update = {};

        if (position !== undefined) {
            const validPositions = ['north', 'south', 'east', 'west', 'northeast', 'northwest', 'southeast', 'southwest', 'center'];
            if (!validPositions.includes(position)) {
                return res.status(400).json({ message: 'Invalid position' });
            }
            update['settings.watermark.position'] = position;
        }
        if (opacity !== undefined) update['settings.watermark.opacity'] = Math.min(100, Math.max(10, Number(opacity)));
        if (scale !== undefined) update['settings.watermark.scale'] = Math.min(50, Math.max(5, Number(scale)));
        if (enabled !== undefined) update['settings.watermark.enabled'] = Boolean(enabled);

        await User.findByIdAndUpdate(req.user.id, update);
        res.json({ message: 'Settings updated' });
    } catch (e) {
        res.status(500).json({ message: 'Update failed' });
    }
});

// DELETE /api/watermark — remove watermark logo
router.delete('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('settings');
        const publicId = user.settings?.watermark?.logoPublicId;

        if (publicId) {
            try { await cloudinary.uploader.destroy(publicId); } catch (_) { }
        }

        await User.findByIdAndUpdate(req.user.id, {
            $unset: { 'settings.watermark': '' }
        });

        res.json({ message: 'Watermark removed' });
    } catch (e) {
        res.status(500).json({ message: 'Remove failed' });
    }
});

/**
 * Utility: Build a Cloudinary URL with watermark overlay.
 * No server-side image processing — pure URL transformation.
 */
function getWatermarkedUrl(imageUrl, watermarkSettings) {
    if (!watermarkSettings?.enabled || !watermarkSettings?.logoPublicId) {
        return imageUrl; // No watermark, return original
    }

    const { logoPublicId, position = 'southeast', opacity = 60, scale = 15 } = watermarkSettings;

    // Extract cloud name and public ID from the image URL
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    if (!cloudName || !imageUrl.includes('cloudinary')) {
        return imageUrl; // Not a Cloudinary URL
    }

    // Gravity mapping
    const gravityMap = {
        north: 'north', south: 'south', east: 'east', west: 'west',
        northeast: 'north_east', northwest: 'north_west',
        southeast: 'south_east', southwest: 'south_west',
        center: 'center'
    };

    // Build overlay transformation
    const overlayId = logoPublicId.replace(/\//g, ':');
    const transformation = `l_${overlayId},o_${opacity},g_${gravityMap[position] || 'south_east'},w_${scale}p/fl_layer_apply`;

    // Insert transformation into URL
    const parts = imageUrl.split('/upload/');
    if (parts.length === 2) {
        return `${parts[0]}/upload/${transformation}/${parts[1]}`;
    }

    return imageUrl;
}

// GET /api/watermark/preview — preview watermark on a sample image
router.get('/preview', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('settings');
        const { imageUrl } = req.query;

        if (!imageUrl) return res.status(400).json({ message: 'imageUrl query param required' });

        const watermarked = getWatermarkedUrl(imageUrl, user.settings?.watermark);
        res.json({ original: imageUrl, watermarked });
    } catch (e) {
        res.status(500).json({ message: 'Preview failed' });
    }
});

router.getWatermarkedUrl = getWatermarkedUrl;
module.exports = router;
