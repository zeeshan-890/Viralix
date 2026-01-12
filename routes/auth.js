const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sign } = require('../services/jwt');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const User = require('../models/User');
const { sendEmail, otpTemplate } = require('../services/mailer');

// Initialize router
const router = express.Router();

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, async (req, res) => {
    try {
        const { name, profilePicture, timezone } = req.body;

        const updateFields = {};
        if (name) updateFields.name = name;
        if (profilePicture !== undefined) updateFields.profilePicture = profilePicture;
        if (timezone) updateFields['settings.timezone'] = timezone;

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: updateFields },
            { new: true }
        ).select('-password');

        res.json(user);
    } catch (error) {
        console.error('Profile update error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/auth/change-password
// @desc    Change user password
// @access  Private
router.post('/change-password', auth, [
    body('currentPassword', 'Current password is required').exists(),
    body('newPassword', 'New password must be at least 6 characters').isLength({ min: 8 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if user is OAuth-only (no local password)
        if (user.authProvider !== 'local' && !user.password) {
            return res.status(400).json({ message: 'Cannot change password for OAuth accounts' });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Password change error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/auth/signup
// @desc    Register user
// @access  Public
router.post('/signup', [
    body('name', 'Name is required').not().isEmpty(),
    body('email', 'Please include a valid email').isEmail(),
    body('password', 'Password must be at least 6 characters').isLength({ min: 6 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, email, password } = req.body;
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(password, salt);

        // Create user as unverified and generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        user = new User({ name, email, password: hashed, isVerified: false, otpCode: otp, otpExpires, otpAttempts: 0 });
        await user.save();

        // Send OTP email
        try {
            const { subject, html, text } = otpTemplate(otp);
            await sendEmail({ to: email, subject, html, text });
        } catch (e) {
            console.warn('Failed to send OTP email:', e?.message || e);
        }

        const safeUser = user.toObject();
        delete safeUser.password;

        return res.status(201).json({ user: safeUser, requiresVerification: true });
    } catch (error) {
        console.error(error.message);
        return res.status(500).send('Server error');
    }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & set cookie
// @access  Public
router.post('/login', [
    body('email', 'Please include a valid email').isEmail(),
    body('password', 'Password is required').exists()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // If user isn't verified, (re)send OTP and ask for verification
        if (!user.isVerified) {
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            user.otpCode = otp;
            user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
            user.otpAttempts = 0;
            await user.save();
            try {
                const { subject, html, text } = otpTemplate(otp);
                await sendEmail({ to: user.email, subject, html, text });
            } catch (e) {
                console.warn('Failed to send OTP email on login:', e?.message || e);
            }
            const safeUser = user.toObject();
            delete safeUser.password;
            return res.status(200).json({ user: safeUser, requiresVerification: true });
        }

        // Update last login when verified
        user.lastLogin = new Date();
        await user.save();

        const token = sign({ id: user.id });
        // Cookie-based auth removed (switching to client localStorage strategy)
        // Client should store this token and send it via Authorization Bearer header.
        console.log('[AUTH] Login issued token (no cookie mode)', { userId: user.id, origin: req.headers.origin });

        const safeUser = user.toObject();
        delete safeUser.password;
        console.log("login user", safeUser);
        return res.json({ user: safeUser, token });
    } catch (error) {
        console.error(error.message);
        return res.status(500).send('Server error');
    }
});

// @route   POST /api/auth/logout
// @desc    Clear auth cookie
// @access  Public
router.post('/logout', (req, res) => {
    // In localStorage mode, client simply discards token. No server state.
    return res.json({ message: 'Logged out (stateless)' });
});

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP and activate account
// @access  Public
router.post('/verify-otp', [
    body('email', 'Please include a valid email').isEmail(),
    body('code', 'Code is required').isLength({ min: 4 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { email, code } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (user.isVerified) return res.status(200).json({ message: 'Already verified' });
        if (!user.otpCode || !user.otpExpires || user.otpExpires < Date.now()) {
            return res.status(400).json({ message: 'OTP expired. Please request a new code.' });
        }
        if (user.otpAttempts >= 5) {
            return res.status(429).json({ message: 'Too many attempts. Please request a new code.' });
        }
        if (user.otpCode !== code) {
            user.otpAttempts += 1;
            await user.save();
            return res.status(400).json({ message: 'Invalid code' });
        }
        user.isVerified = true;
        user.otpCode = undefined;
        user.otpExpires = undefined;
        user.otpAttempts = 0;
        await user.save();

        const token = sign({ id: user.id });
        console.log('[AUTH] Verify OTP issued token (no cookie mode)', { userId: user.id });
        const safeUser = user.toObject();
        delete safeUser.password;
        return res.json({ user: safeUser, token });
    } catch (error) {
        console.error(error.message);
        return res.status(500).send('Server error');
    }
});

// @route   POST /api/auth/resend-otp
// @desc    Resend OTP for verification
// @access  Public
router.post('/resend-otp', [
    body('email', 'Please include a valid email').isEmail()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (user.isVerified) return res.status(200).json({ message: 'Already verified' });
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.otpCode = otp;
        user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
        user.otpAttempts = 0;
        await user.save();
        try {
            const { subject, html, text } = otpTemplate(otp);
            await sendEmail({ to: user.email, subject, html, text });
        } catch (e) {
            console.warn('Failed to send OTP email on resend:', e?.message || e);
        }
        return res.json({ message: 'Verification code sent' });
    } catch (error) {
        console.error(error.message);
        return res.status(500).send('Server error');
    }
});

// @route   POST /api/auth/forgot-password
// @desc    Send password reset email
// @access  Public
router.post('/forgot-password', [
    body('email', 'Please include a valid email').isEmail()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Generate reset token (implement email sending logic here)
        const resetToken = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // Store reset token in database with expiration
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        await user.save();

        res.json({
            message: 'Password reset email sent',
            resetToken // In production, this should be sent via email
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password with token
// @access  Public
router.post('/reset-password', [
    body('token', 'Token is required').not().isEmpty(),
    body('password', 'Password must be at least 6 characters').isLength({ min: 6 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { token, password } = req.body;

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);

        if (!user || user.resetPasswordToken !== token || user.resetPasswordExpires < Date.now()) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.json({ message: 'Password reset successful' });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
});

// @route   GET /api/auth/google
// @desc    Initiate Google OAuth
// @access  Public
router.get('/google', (req, res) => {
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${process.env.YOUTUBE_CLIENT_ID}&` +
        `redirect_uri=${encodeURIComponent(process.env.GOOGLE_AUTH_REDIRECT_URI || 'http://localhost:5000/api/auth/google/callback')}&` +
        `response_type=code&` +
        `scope=${encodeURIComponent('openid profile email')}&` +
        `access_type=offline&` +
        `prompt=consent`;

    res.redirect(googleAuthUrl);
});

// @route   GET /api/auth/google/callback
// @desc    Handle Google OAuth callback
// @access  Public
router.get('/google/callback', async (req, res) => {
    const { code } = req.query;

    if (!code) {
        return res.redirect(`${process.env.CLIENT_URL}/auth/login?error=oauth_failed`);
    }

    try {
        // Exchange code for tokens
        const axios = require('axios');
        const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
            code,
            client_id: process.env.YOUTUBE_CLIENT_ID,
            client_secret: process.env.YOUTUBE_CLIENT_SECRET,
            redirect_uri: process.env.GOOGLE_AUTH_REDIRECT_URI || 'http://localhost:5000/api/auth/google/callback',
            grant_type: 'authorization_code'
        });

        const { access_token } = tokenResponse.data;

        // Get user info
        const userInfoResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${access_token}` }
        });

        const { email, name, picture } = userInfoResponse.data;

        // Find or create user (case-insensitive email match)
        let user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            // Create new user with OAuth
            user = new User({
                name,
                email: email.toLowerCase(),
                profilePicture: picture,
                isVerified: true, // OAuth users are pre-verified
                authProvider: 'google',
                password: await bcrypt.hash(Math.random().toString(36), 10) // Random password for OAuth users
            });
            await user.save();
        } else {
            // User exists - link Google account and ensure verified
            if (user.authProvider === 'local' || !user.authProvider) {
                user.authProvider = 'google';
            }
            user.isVerified = true;
            if (picture && !user.profilePicture) {
                user.profilePicture = picture;
            }
            await user.save();
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Generate JWT token
        const token = sign({ id: user.id });

        // Redirect to client with token
        res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}`);
    } catch (error) {
        console.error('Google OAuth error:', error.response?.data || error.message);
        res.redirect(`${process.env.CLIENT_URL}/auth/login?error=oauth_failed`);
    }
});

// @route   GET /api/auth/facebook
// @desc    Initiate Facebook OAuth
// @access  Public
router.get('/facebook', (req, res) => {
    const facebookAuthUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
        `client_id=${process.env.FACEBOOK_APP_ID}&` +
        `redirect_uri=${encodeURIComponent(process.env.FACEBOOK_AUTH_REDIRECT_URI || 'https://viralix-b3ff86cb412f.herokuapp.com/api/auth/facebook/callback')}&` +
        `scope=${encodeURIComponent('email,public_profile')}&` +
        `response_type=code`;

    res.redirect(facebookAuthUrl);
});

// @route   GET /api/auth/facebook/callback
// @desc    Handle Facebook OAuth callback
// @access  Public
router.get('/facebook/callback', async (req, res) => {
    const { code } = req.query;

    if (!code) {
        return res.redirect(`${process.env.CLIENT_URL}/auth/login?error=oauth_failed`);
    }

    try {
        const axios = require('axios');

        // Exchange code for access token
        const tokenResponse = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
            params: {
                client_id: process.env.FACEBOOK_APP_ID,
                client_secret: process.env.FACEBOOK_APP_SECRET,
                redirect_uri: process.env.FACEBOOK_AUTH_REDIRECT_URI || 'https://viralix-b3ff86cb412f.herokuapp.com/api/auth/facebook/callback',
                code
            }
        });

        const { access_token } = tokenResponse.data;

        // Get user info
        const userInfoResponse = await axios.get('https://graph.facebook.com/me', {
            params: {
                fields: 'id,name,email,picture',
                access_token
            }
        });

        const { email, name, picture } = userInfoResponse.data;

        if (!email) {
            return res.redirect(`${process.env.CLIENT_URL}/auth/login?error=no_email`);
        }

        // Find or create user (case-insensitive email match)
        let user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            // Create new user with OAuth
            user = new User({
                name,
                email: email.toLowerCase(),
                profilePicture: picture?.data?.url,
                isVerified: true, // OAuth users are pre-verified
                authProvider: 'facebook',
                password: await bcrypt.hash(Math.random().toString(36), 10) // Random password for OAuth users
            });
            await user.save();
        } else {
            // User exists - link Facebook account and ensure verified
            if (user.authProvider === 'local' || !user.authProvider) {
                user.authProvider = 'facebook';
            }
            user.isVerified = true;
            if (picture?.data?.url && !user.profilePicture) {
                user.profilePicture = picture.data.url;
            }
            await user.save();
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Generate JWT token
        const token = sign({ id: user.id });

        // Redirect to client with token
        res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}`);
    } catch (error) {
        console.error('Facebook OAuth error:', error.response?.data || error.message);
        res.redirect(`${process.env.CLIENT_URL}/auth/login?error=oauth_failed`);
    }
});

module.exports = router;
