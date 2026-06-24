'use client';

import { createContext, useContext, useMemo } from 'react';
import { getPlatformAnalyticsTheme } from './platformAnalyticsTheme';

const PlatformAnalyticsThemeContext = createContext(null);

export function PlatformAnalyticsThemeProvider({ platform, children }) {
    const theme = useMemo(() => getPlatformAnalyticsTheme(platform), [platform]);
    return (
        <PlatformAnalyticsThemeContext.Provider value={theme}>
            {children}
        </PlatformAnalyticsThemeContext.Provider>
    );
}

export function usePlatformAnalyticsTheme() {
    const ctx = useContext(PlatformAnalyticsThemeContext);
    return ctx || getPlatformAnalyticsTheme('tiktok');
}
