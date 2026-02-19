const mongoose = require('mongoose');

const BioPageSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        minlength: 3,
        maxlength: 30,
        match: /^[a-z0-9-]+$/
    },
    profile: {
        title: { type: String, default: '' },
        bio: { type: String, maxlength: 200, default: '' },
        image: { type: String, default: '' } // URL
    },
    theme: {
        id: { type: String, default: 'simple-light' }, // simple-light, simple-dark, gradient-blue, etc.
        background: { type: String, default: '#ffffff' }, // hex or gradient css
        buttonStyle: { type: String, enum: ['rounded', 'square', 'pill', 'shadow'], default: 'rounded' },
        font: { type: String, default: 'Inter' },
        textColor: { type: String, default: '#000000' },
        buttonColor: { type: String, default: '#f3f4f6' },
        buttonTextColor: { type: String, default: '#000000' }
    },
    buttons: [{
        _id: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
        label: { type: String, required: true },
        url: { type: String, required: true },
        icon: { type: String, default: '' }, // lucide icon name
        animation: { type: String, enum: ['none', 'pulse', 'shake', 'wobble'], default: 'none' },
        isVisible: { type: Boolean, default: true },
        clicks: { type: Number, default: 0 },
        order: { type: Number, default: 0 }
    }],
    socials: [{
        platform: { type: String, enum: ['instagram', 'facebook', 'twitter', 'tiktok', 'youtube', 'linkedin', 'website', 'email'], required: true },
        url: { type: String, required: true },
        isVisible: { type: Boolean, default: true },
        clicks: { type: Number, default: 0 }
    }],
    stats: {
        views: { type: Number, default: 0 },
        uniqueVisitors: { type: Number, default: 0 } // simplified tracking
    },
    isPublished: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// slug already has unique:true which creates an index automatically

module.exports = mongoose.model('BioPage', BioPageSchema);
