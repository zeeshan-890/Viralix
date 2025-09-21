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
        // Simple HttpOnly cookie valid for 7 days
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
            path: '/',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

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
    res.clearCookie('token', { path: '/' });
    return res.json({ message: 'Logged out' });
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
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
            path: '/',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
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

module.exports = router;
