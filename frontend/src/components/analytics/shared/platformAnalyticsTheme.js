/** Platform-branded themes for TikTok / Instagram deep analytics pages */

export const PLATFORM_ANALYTICS_THEMES = {
    instagram: {
        pageShell: 'platform-analytics-page platform-analytics-instagram',
        bannerShell: 'platform-analytics-banner-instagram',
        chartColors: ['#E4405F', '#833AB4', '#F77737', '#FCAF45', '#C13584', '#405DE6'],
        chartPrimary: '#833AB4',
        chartSecondary: '#E4405F',
        chartTertiary: '#F77737',
        gridStroke: 'rgba(131, 58, 180, 0.14)',
        axisTick: '#9d4b6a',
        legendColor: '#6b3a5c',
    },
    tiktok: {
        pageShell: 'platform-analytics-page platform-analytics-tiktok',
        bannerShell: 'platform-analytics-banner-tiktok',
        chartColors: ['#00F2EA', '#FF0050', '#FFFFFF', '#69C9D0', '#EE1D52', '#2a2a2a'],
        chartPrimary: '#00F2EA',
        chartSecondary: '#FF0050',
        chartTertiary: '#FFFFFF',
        gridStroke: 'rgba(255, 255, 255, 0.08)',
        axisTick: 'rgba(255, 255, 255, 0.45)',
        legendColor: 'rgba(255, 255, 255, 0.65)',
    },
};

export function getPlatformAnalyticsTheme(platform) {
    return PLATFORM_ANALYTICS_THEMES[platform] || PLATFORM_ANALYTICS_THEMES.tiktok;
}
