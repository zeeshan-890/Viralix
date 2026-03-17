const express = require('express');
const multer = require('multer');
const auth = require('../middleware/auth');
const Post = require('../models/Post');

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
            cb(null, true);
        } else {
            cb(new Error('Only CSV files allowed'), false);
        }
    }
});

/**
 * Parse CSV text manually (no external dependency needed).
 * Handles quoted fields and newlines inside quotes.
 */
function parseCSV(text) {
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) return { headers: [], rows: [] };

    const splitRow = (line) => {
        const result = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (ch === '"') {
                inQuotes = !inQuotes;
            } else if (ch === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += ch;
            }
        }
        result.push(current.trim());
        return result;
    };

    const headers = splitRow(lines[0]).map(h => h.toLowerCase().replace(/\s+/g, '_'));
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
        const values = splitRow(lines[i]);
        if (values.length === 0 || (values.length === 1 && !values[0])) continue;

        const row = {};
        headers.forEach((h, idx) => {
            row[h] = values[idx] || '';
        });
        rows.push(row);
    }

    return { headers, rows };
}

/**
 * Validate a row and return errors (if any).
 */
function validateRow(row, index, validPlatforms) {
    const errors = [];

    if (!row.title && !row.content) {
        errors.push({ row: index + 1, field: 'title/content', message: 'Title or content is required' });
    }

    if (row.platform) {
        const platforms = row.platform.split(';').map(p => p.trim().toLowerCase());
        for (const p of platforms) {
            if (!validPlatforms.includes(p)) {
                errors.push({ row: index + 1, field: 'platform', message: `Invalid platform: ${p}` });
            }
        }
    }

    if (row.scheduled_date) {
        const d = new Date(row.scheduled_date);
        if (isNaN(d.getTime())) {
            errors.push({ row: index + 1, field: 'scheduled_date', message: 'Invalid date format' });
        }
    }

    return errors;
}

// POST /api/bulk-upload/preview — dry run: parse CSV & validate
router.post('/preview', auth, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No CSV file uploaded' });

        const text = req.file.buffer.toString('utf-8');
        const { headers, rows } = parseCSV(text);

        if (rows.length === 0) {
            return res.status(400).json({ message: 'CSV file is empty or has no data rows' });
        }

        if (rows.length > 200) {
            return res.status(400).json({ message: `Max 200 rows allowed. Found ${rows.length}` });
        }

        const validPlatforms = ['facebook', 'instagram', 'twitter', 'linkedin', 'tiktok', 'youtube'];
        const allErrors = [];
        const validRows = [];

        rows.forEach((row, i) => {
            const errs = validateRow(row, i, validPlatforms);
            if (errs.length > 0) {
                allErrors.push(...errs);
            } else {
                validRows.push({
                    index: i + 1,
                    title: row.title || row.content?.substring(0, 40) || 'Untitled',
                    content: row.content || '',
                    platforms: row.platform ? row.platform.split(';').map(p => p.trim().toLowerCase()) : ['instagram'],
                    hashtags: row.hashtags ? row.hashtags.split(';').map(h => h.trim()) : [],
                    scheduledDate: row.scheduled_date || null,
                    mediaUrl: row.media_url || ''
                });
            }
        });

        res.json({
            totalRows: rows.length,
            validCount: validRows.length,
            errorCount: allErrors.length,
            headers,
            preview: validRows.slice(0, 20), // Show first 20 for preview
            errors: allErrors.slice(0, 30)     // Show first 30 errors
        });
    } catch (e) {
        console.error('[BulkUpload] Preview error:', e.message);
        res.status(500).json({ message: 'Parse failed: ' + e.message });
    }
});

// POST /api/bulk-upload/create — actually create posts from CSV
router.post('/create', auth, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No CSV file uploaded' });

        const text = req.file.buffer.toString('utf-8');
        const { rows } = parseCSV(text);

        if (rows.length === 0) return res.status(400).json({ message: 'CSV is empty' });
        if (rows.length > 200) return res.status(400).json({ message: `Max 200 rows. Found ${rows.length}` });

        const validPlatforms = ['facebook', 'instagram', 'twitter', 'linkedin', 'tiktok', 'youtube'];
        const created = [];
        const failed = [];

        // Get user's default account ID as fallback
        const User = require('../models/User');
        const user = await User.findById(req.user.id).select('socialAccounts');
        const defaultAccountId = user?.socialAccounts?.[0]?.accountId || 'pending';

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const errs = validateRow(row, i, validPlatforms);
            if (errs.length > 0) {
                failed.push({ row: i + 1, errors: errs });
                continue;
            }

            try {
                const platforms = row.platform
                    ? row.platform.split(';').map(p => p.trim().toLowerCase())
                    : ['instagram'];

                const scheduledDate = row.scheduled_date ? new Date(row.scheduled_date) : null;

                const postData = {
                    user: req.user.id,
                    title: row.title || row.content?.substring(0, 40) || `Bulk Post ${i + 1}`,
                    content: row.content || '',
                    platforms: platforms.map(name => ({
                        name,
                        accountId: (user?.socialAccounts?.find(a => a.platform === name)?.accountId) || defaultAccountId,
                        status: scheduledDate ? 'scheduled' : 'draft'
                    })),
                    hashtags: row.hashtags ? row.hashtags.split(';').map(h => h.trim().replace(/^#/, '')) : [],
                    isDraft: !scheduledDate,
                    isScheduled: !!scheduledDate,
                    scheduledDate: scheduledDate || undefined,
                    media: row.media_url ? [{
                        type: 'image',
                        url: row.media_url,
                        filename: 'csv-imported'
                    }] : []
                };

                const post = new Post(postData);
                await post.save();
                created.push({ row: i + 1, postId: post._id, title: post.title });
            } catch (err) {
                failed.push({ row: i + 1, errors: [{ message: err.message }] });
            }
        }

        res.json({
            message: `Bulk upload complete: ${created.length} created, ${failed.length} failed`,
            created: created.length,
            failed: failed.length,
            createdPosts: created,
            failedRows: failed
        });
    } catch (e) {
        console.error('[BulkUpload] Create error:', e.message);
        res.status(500).json({ message: 'Bulk create failed: ' + e.message });
    }
});

module.exports = router;
