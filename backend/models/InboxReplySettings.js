const mongoose = require('mongoose');

const BusinessHoursSchema = new mongoose.Schema({
    start: { type: String, default: '09:00' },
    end: { type: String, default: '18:00' },
    timezone: { type: String, default: 'America/New_York' }
}, { _id: false });

const InboxReplySettingsSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    aiEnabled: { type: Boolean, default: true },
    aiMode: { type: String, enum: ['suggest', 'auto'], default: 'suggest' },
    defaultTone: { type: String, default: 'friendly' },
    businessHoursOnly: { type: Boolean, default: false },
    businessHours: { type: BusinessHoursSchema, default: () => ({}) },
    confidenceThreshold: { type: Number, default: 85 },
    includeContext: { type: Boolean, default: true },
    signOff: { type: String, default: '' },
    autoReplyEnabled: { type: Boolean, default: false }
}, {
    timestamps: true
});

const DEFAULTS = {
    aiEnabled: true,
    aiMode: 'suggest',
    defaultTone: 'friendly',
    businessHoursOnly: false,
    businessHours: { start: '09:00', end: '18:00', timezone: 'America/New_York' },
    confidenceThreshold: 85,
    includeContext: true,
    signOff: '',
    autoReplyEnabled: false
};

InboxReplySettingsSchema.statics.getOrCreate = async function (userId) {
    let doc = await this.findOne({ userId });
    if (!doc) {
        doc = await this.create({ userId, ...DEFAULTS });
    }
    return doc;
};

module.exports = mongoose.model('InboxReplySettings', InboxReplySettingsSchema);
