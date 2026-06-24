/**
 * Official platform branding — icons, colors, and UI tokens.
 * Use PlatformIcon / PlatformBadge components instead of Lucide social icons.
 */

export const PLATFORMS = {
    facebook: {
        id: 'facebook',
        label: 'Facebook',
        description: 'Posts, Photos, and Videos',
        icon: '/facebook.png',
        color: '#1877F2',
        bg: '#EBF3FE',
        lightBg: 'bg-blue-50',
        textColor: 'text-blue-600',
        ringColor: 'ring-blue-400',
        hoverRing: 'hover:ring-blue-400',
        buttonClass: 'bg-[#1877F2] hover:bg-[#166FE0] text-white',
        selectedBorder: 'border-[#1877F2]',
        selectedBg: 'bg-[#1877F2]/10',
        selectedRing: 'ring-[#1877F2]',
    },
    instagram: {
        id: 'instagram',
        label: 'Instagram',
        description: 'Photos, Stories, and Reels',
        icon: '/instagram.png',
        color: '#E4405F',
        bg: '#FDEEF1',
        lightBg: 'bg-pink-50',
        textColor: 'text-pink-600',
        gradientClass: 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400',
        ringColor: 'ring-pink-400',
        hoverRing: 'hover:ring-pink-400',
        buttonClass: 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 hover:opacity-95 text-white',
        selectedBorder: 'border-pink-500',
        selectedBg: 'bg-pink-50',
        selectedRing: 'ring-pink-500',
    },
    tiktok: {
        id: 'tiktok',
        label: 'TikTok',
        description: 'Short-form videos',
        icon: '/tiktok.png',
        color: '#010101',
        bg: '#F3F3F3',
        lightBg: 'bg-gray-100',
        textColor: 'text-gray-900',
        ringColor: 'ring-gray-900',
        hoverRing: 'hover:ring-black',
        buttonClass: 'bg-black hover:bg-gray-900 text-white',
        selectedBorder: 'border-black',
        selectedBg: 'bg-gray-100',
        selectedRing: 'ring-black',
    },
    youtube: {
        id: 'youtube',
        label: 'YouTube',
        description: 'Videos and Shorts',
        icon: '/youtube.png',
        color: '#FF0000',
        bg: '#FEECEC',
        lightBg: 'bg-red-50',
        textColor: 'text-red-600',
        ringColor: 'ring-red-600',
        hoverRing: 'hover:ring-red-600',
        buttonClass: 'bg-red-600 hover:bg-red-700 text-white',
        selectedBorder: 'border-red-600',
        selectedBg: 'bg-red-50',
        selectedRing: 'ring-red-600',
    },
};

export const PLATFORM_LIST = Object.values(PLATFORMS);

/** @param {string} id */
export function getPlatform(id) {
    return PLATFORMS[id] || null;
}

/** Backward-compatible shape for legacy PLATFORM_CONFIG consumers */
export const PLATFORM_CONFIG = Object.fromEntries(
    Object.entries(PLATFORMS).map(([key, p]) => [
        key,
        {
            label: p.label,
            color: p.color,
            bg: p.bg,
            iconPath: p.icon,
            description: p.description,
        },
    ])
);

/** Tailwind classes for a platform CTA button */
export function platformButtonClass(platformId) {
    return getPlatform(platformId)?.buttonClass || 'bg-[#1877F2] text-white';
}

/** Inline style for solid-color buttons (when gradient isn't used) */
export function platformButtonStyle(platformId) {
    const p = getPlatform(platformId);
    if (!p || p.gradientClass) return undefined;
    return { backgroundColor: p.color };
}
