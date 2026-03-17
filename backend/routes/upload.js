const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { v4: uuidv4 } = require('uuid');
const auth = require('../middleware/auth');

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    },
    fileFilter: (req, file, cb) => {
        // Allow images and videos
        if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image and video files are allowed'), false);
        }
    }
});

// @route   POST /api/upload/media
// @desc    Upload media files (images/videos)
// @access  Private
router.post('/media', auth, upload.array('files', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No files uploaded' });
        }

        const uploadPromises = req.files.map(async (file) => {
            return new Promise((resolve, reject) => {
                const publicId = `autoreach/${req.user.id}/${uuidv4()}`;

                const uploadOptions = {
                    public_id: publicId,
                    resource_type: 'auto', // Automatically detect file type
                    folder: 'autoreach-ai',
                    transformation: [
                        { quality: 'auto' },
                        { fetch_format: 'auto' }
                    ]
                };

                // Upload to Cloudinary
                cloudinary.uploader.upload_stream(
                    uploadOptions,
                    (error, result) => {
                        if (error) {
                            reject(error);
                        } else {
                            resolve({
                                type: file.mimetype.startsWith('image/') ? 'image' : 'video',
                                url: result.secure_url,
                                publicId: result.public_id,
                                filename: file.originalname,
                                size: file.size,
                                mimetype: file.mimetype,
                                width: result.width,
                                height: result.height,
                                duration: result.duration || null
                            });
                        }
                    }
                ).end(file.buffer);
            });
        });

        const uploadedFiles = await Promise.all(uploadPromises);

        res.json({
            message: 'Files uploaded successfully',
            files: uploadedFiles
        });
    } catch (error) {
        console.error('Upload error:', error.message);
        res.status(500).json({ message: 'Upload failed', error: error.message });
    }
});

// @route   DELETE /api/upload/media/:publicId
// @desc    Delete uploaded media
// @access  Private
router.delete('/media/:publicId', auth, async (req, res) => {
    try {
        const publicId = req.params.publicId.replace(/:/g, '/'); // Convert back to original format

        // Delete from Cloudinary
        const result = await cloudinary.uploader.destroy(publicId);

        if (result.result === 'ok') {
            res.json({ message: 'File deleted successfully' });
        } else {
            res.status(404).json({ message: 'File not found' });
        }
    } catch (error) {
        console.error('Delete error:', error.message);
        res.status(500).json({ message: 'Delete failed', error: error.message });
    }
});

// @route   GET /api/upload/media
// @desc    Get user's uploaded media
// @access  Private
router.get('/media', auth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;

        // Search for files in Cloudinary by folder and user ID
        const searchExpression = `folder:autoreach-ai AND public_id:autoreach/${req.user.id}/*`;

        const result = await cloudinary.search
            .expression(searchExpression)
            .sort_by([['created_at', 'desc']])
            .max_results(limit)
            .with_field('context')
            .with_field('tags')
            .execute();

        const files = result.resources.map(resource => ({
            type: resource.resource_type === 'image' ? 'image' : 'video',
            url: resource.secure_url,
            publicId: resource.public_id,
            filename: resource.filename || 'unknown',
            size: resource.bytes,
            mimetype: `${resource.resource_type}/${resource.format}`,
            width: resource.width,
            height: resource.height,
            duration: resource.duration || null,
            createdAt: resource.created_at
        }));

        res.json({
            files,
            pagination: {
                current: page,
                total: result.total_count,
                hasMore: result.resources.length === limit
            }
        });
    } catch (error) {
        console.error('Media fetch error:', error.message);
        res.status(500).json({ message: 'Failed to fetch media', error: error.message });
    }
});

// @route   POST /api/upload/avatar
// @desc    Upload user avatar
// @access  Private
router.post('/avatar', auth, upload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        if (!req.file.mimetype.startsWith('image/')) {
            return res.status(400).json({ message: 'Only image files are allowed for avatars' });
        }

        const publicId = `autoreach/avatars/${req.user.id}`;

        const uploadOptions = {
            public_id: publicId,
            resource_type: 'image',
            folder: 'autoreach-ai/avatars',
            transformation: [
                { width: 200, height: 200, crop: 'fill', gravity: 'face' },
                { quality: 'auto' },
                { fetch_format: 'auto' }
            ],
            overwrite: true // Replace existing avatar
        };

        const result = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                uploadOptions,
                (error, result) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(result);
                    }
                }
            ).end(req.file.buffer);
        });

        // Update user's avatar URL in database
        const User = require('../models/User');
        await User.findByIdAndUpdate(req.user.id, {
            avatar: result.secure_url
        });

        res.json({
            message: 'Avatar uploaded successfully',
            avatar: result.secure_url
        });
    } catch (error) {
        console.error('Avatar upload error:', error.message);
        res.status(500).json({ message: 'Avatar upload failed', error: error.message });
    }
});

module.exports = router;
