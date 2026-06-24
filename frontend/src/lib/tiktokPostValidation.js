/**
 * TikTok Content Posting API — client-side validation (TikTok UX guidelines).
 */

export function validateTikTokSettings(settings = {}) {
    const errors = [];

    if (!settings.privacyLevel) {
        errors.push('Select who can view this video.');
    }

    if (settings.commercialDisclosure && !settings.brandOrganic && !settings.brandedContent) {
        errors.push('Select at least one commercial option (“Your brand” or “Branded content”).');
    }

    if (settings.brandedContent && settings.privacyLevel === 'SELF_ONLY') {
        errors.push('Branded content cannot be set to private.');
    }

    return errors;
}

export function isTikTokSettingsValid(settings) {
    return validateTikTokSettings(settings).length === 0;
}

export function validateTikTokPost({
    caption = '',
    videoUrl = '',
    uploading = false,
    selectedAccountId = '',
    creatorInfo = null,
    settings = {},
}) {
    const errors = [];

    if (!selectedAccountId) {
        errors.push('Select a TikTok account.');
    }

    if (!creatorInfo) {
        errors.push('Wait for TikTok account settings to load.');
    } else if (creatorInfo.canPost === false) {
        errors.push('You have reached your daily TikTok posting limit.');
    }

    if (uploading) {
        errors.push('Wait for the video upload to finish.');
    }

    if (!videoUrl) {
        errors.push('Upload a video before publishing.');
    }

    if (!String(caption).trim()) {
        errors.push('Caption is required.');
    }

    errors.push(...validateTikTokSettings(settings));

    return errors;
}

export function isTikTokPostValid(params) {
    return validateTikTokPost(params).length === 0;
}
