/** Platform-branded themes for deep analytics pages */

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
    youtube: {
        pageShell: 'platform-analytics-page platform-analytics-youtube',
        bannerShell: 'platform-analytics-banner-youtube',
        chartColors: ['#FF0000', '#FF4D4D', '#0F0F0F', '#FF8080', '#CC0000', '#7A7A7A'],
        chartPrimary: '#FF0000',
        chartSecondary: '#0F0F0F',
        chartTertiary: '#FF4D4D',
        gridStroke: 'rgba(15, 15, 15, 0.1)',
        axisTick: '#7a2626',
        legendColor: '#5b2d2d',
    },
    facebook: {
        pageShell: 'platform-analytics-page platform-analytics-facebook',
        bannerShell: 'platform-analytics-banner-facebook',
        chartColors: ['#1877F2', '#42A5F5', '#0A3D91', '#90CAF9', '#1A73E8', '#6B93D6'],
        chartPrimary: '#1877F2',
        chartSecondary: '#0A3D91',
        chartTertiary: '#42A5F5',
        gridStroke: 'rgba(24, 119, 242, 0.14)',
        axisTick: '#365d99',
        legendColor: '#2a4f86',
    },
};

export function getPlatformAnalyticsTheme(platform) {
    return PLATFORM_ANALYTICS_THEMES[platform] || PLATFORM_ANALYTICS_THEMES.tiktok;
}
