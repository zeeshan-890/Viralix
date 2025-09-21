const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    avatar: {
        type: String,
        default: ''
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date,
        default: Date.now
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    otpCode: String,
    otpExpires: Date,
    otpAttempts: {
        type: Number,
        default: 0
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    socialAccounts: [{
        platform: {
            type: String,
            enum: ['facebook', 'instagram', 'twitter', 'linkedin', 'tiktok', 'youtube'],
            required: true
        },
        accountId: {
            type: String,
            required: true
        },
        accountName: {
            type: String,
            required: true
        },
        accessToken: {
            type: String,
            required: true
        },
        refreshToken: String,
        tokenExpires: Date,
        isActive: {
            type: Boolean,
            default: true
        },
        connectedAt: {
            type: Date,
            default: Date.now
        }
    }],
    subscription: {
        plan: {
            type: String,
            enum: ['free', 'basic', 'pro', 'enterprise'],
            default: 'free'
        },
        status: {
            type: String,
            enum: ['active', 'cancelled', 'expired'],
            default: 'active'
        },
        startDate: {
            type: Date,
            default: Date.now
        },
        endDate: Date,
        postsLimit: {
            type: Number,
            default: 10
        },
        accountsLimit: {
            type: Number,
            default: 3
        }
    },
    settings: {
        timezone: {
            type: String,
            default: 'UTC'
        },
        language: {
            type: String,
            default: 'en'
        },
        // Persist Facebook pages list and default page selection
        facebookPages: [
            {
                id: String,
                name: String,
                category: String,
                accessToken: String,
                // Optional: linked Instagram user ID (from instagram_business_account or connected_instagram_account)
                instagramId: String,
            }
        ],
        facebookDefaultPageId: {
            type: String,
            default: null,
        },
        notifications: {
            email: {
                type: Boolean,
                default: true
            },
            push: {
                type: Boolean,
                default: true
            },
            postSuccess: {
                type: Boolean,
                default: true
            },
            postFailure: {
                type: Boolean,
                default: true
            },
            weeklyReport: {
                type: Boolean,
                default: true
            }
        },
        autoPosting: {
            type: Boolean,
            default: true
        }
    }
}, {
    timestamps: true
});

// Index for performance
UserSchema.index({ email: 1 });
UserSchema.index({ 'socialAccounts.platform': 1, 'socialAccounts.accountId': 1 });

module.exports = mongoose.model('User', UserSchema);
