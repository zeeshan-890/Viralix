'use client';
import { useEffect } from 'react';
import { useThemeStore } from './themeStore';

export default function ThemeInit() {
    const initTheme = useThemeStore(s => s.initTheme);
    const attachSystemListener = useThemeStore(s => s.attachSystemListener);
    useEffect(() => {
        initTheme();
        const cleanup = attachSystemListener();
        return () => cleanup && cleanup();
    }, [initTheme, attachSystemListener]);
    return null;
}
