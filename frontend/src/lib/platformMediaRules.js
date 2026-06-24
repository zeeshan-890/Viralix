/**
 * Media rules per platform for the multi-platform upload composer.
 * Uploadable media must be valid for ALL currently selected platforms (intersection).
 */

export const PLATFORM_MEDIA_RULES = {
    facebook: {
        label: 'Facebook',
        image: true,
        video: true,
        requiresMedia: false,
        maxFiles: 10,
        notes: 'Text-only posts are supported without media.',
    },
    instagram: {
        label: 'Instagram',
        image: true,
        video: true,
        requiresMedia: true,
        maxFiles: 1,
        notes: 'Queue publishes feed images or Reels. Use Instagram Upload for Stories & carousels.',
        advancedUploadPath: '/dashboard/platforms/instagram/upload',
    },
    tiktok: {
        label: 'TikTok',
        image: false,
        video: true,
        requiresMedia: true,
        maxFiles: 1,
        notes: 'TikTok requires a video on this composer. Configure privacy & disclosure in Publish.',
    },
    youtube: {
        label: 'YouTube',
        image: false,
        video: true,
        requiresMedia: true,
        maxFiles: 1,
        notes: 'YouTube only accepts video uploads.',
    },
};

const DEFAULT_RULE = {
    image: true,
    video: true,
    requiresMedia: false,
    maxFiles: 10,
};

function ruleFor(platform) {
    return PLATFORM_MEDIA_RULES[platform] || DEFAULT_RULE;
}

/**
 * Compute allowed media for the intersection of selected platforms.
 * @param {Array<{ name: string }>} selectedPlatforms
 */
export function getMediaConstraints(selectedPlatforms) {
    if (!selectedPlatforms?.length) {
        return {
            allowImage: false,
            allowVideo: false,
            requiresMedia: false,
            maxFiles: 0,
            accept: '',
            inputAccept: '',
            summary: 'Select at least one platform to upload media.',
            hints: [],
            platformNotes: [],
            hasInstagram: false,
            hasTikTok: false,
            hasYouTube: false,
            hasFacebook: false,
            videoOnly: false,
            imageOnly: false,
        };
    }

    const names = [...new Set(selectedPlatforms.map((p) => p.name))];
    const rules = names.map((n) => ({ platform: n, ...ruleFor(n) }));

    const allowImage = rules.every((r) => r.image === true);
    const allowVideo = rules.every((r) => r.video === true);
    const requiresMedia = rules.some((r) => r.requiresMedia);
    const maxFiles = Math.min(...rules.map((r) => r.maxFiles ?? 10));
    const videoOnly = allowVideo && !allowImage;
    const imageOnly = allowImage && !allowVideo;

    let accept = '';
    let inputAccept = '';
    if (videoOnly) {
        accept = 'video/*';
        inputAccept = 'video/*';
    } else if (imageOnly) {
        accept = 'image/jpeg,image/png,image/webp,image/*';
        inputAccept = 'image/*';
    } else if (allowImage && allowVideo) {
        accept = 'image/*,video/*';
        inputAccept = 'image/*,video/*';
    }

    const hints = [];
    if (videoOnly) {
        const videoPlatforms = rules.filter((r) => r.video && !r.image).map((r) => r.label);
        hints.push(`Only video allowed — ${videoPlatforms.join(' & ')} require video.`);
    }
    if (imageOnly) {
        hints.push('Only images allowed for the selected platforms.');
    }
    if (requiresMedia) {
        const need = rules.filter((r) => r.requiresMedia).map((r) => r.label);
        hints.push(`Media required for: ${need.join(', ')}.`);
    }
    if (maxFiles === 1 && names.length > 0) {
        hints.push('Single file only for the current platform selection.');
    }

    const platformNotes = rules.filter((r) => r.notes).map((r) => ({
        platform: r.platform,
        label: r.label,
        note: r.notes,
        advancedUploadPath: r.advancedUploadPath,
    }));

    let summary = '';
    if (videoOnly) summary = 'Video only';
    else if (imageOnly) summary = 'Images only';
    else if (allowImage && allowVideo) summary = 'Images or video';
    else summary = 'No compatible media';

    return {
        allowImage,
        allowVideo,
        requiresMedia,
        maxFiles,
        accept,
        inputAccept,
        summary,
        hints,
        platformNotes,
        hasInstagram: names.includes('instagram'),
        hasTikTok: names.includes('tiktok'),
        hasYouTube: names.includes('youtube'),
        hasFacebook: names.includes('facebook'),
        videoOnly,
        imageOnly,
        selectedPlatformNames: names,
    };
}

/** @returns {'image'|'video'|null} */
export function mediaTypeOfFile(file) {
    if (!file) return null;
    if (file.type === 'video' || file.mimetype?.startsWith('video/')) return 'video';
    if (file.type === 'image' || file.mimetype?.startsWith('image/')) return 'image';
    return null;
}

export function isFileAllowedForConstraints(file, constraints) {
    const type = mediaTypeOfFile(file);
    if (!type) return false;
    if (type === 'image') return constraints.allowImage;
    if (type === 'video') return constraints.allowVideo;
    return false;
}

export function filterFilesForConstraints(files, constraints) {
    return (files || []).filter((f) => isFileAllowedForConstraints(f, constraints));
}

export function describeIncompatibleFile(file, constraints) {
    const type = mediaTypeOfFile(file);
    if (type === 'image' && !constraints.allowImage) {
        return 'Images are not supported for the selected platforms (video-only selection).';
    }
    if (type === 'video' && !constraints.allowVideo) {
        return 'Video is not supported for the selected platforms.';
    }
    return 'This file type is not allowed for the selected platforms.';
}
