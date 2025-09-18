'use client';
import { useThemeStore } from '../store/themeStore';

export function useTheme() {
    const theme = useThemeStore(s => s.theme);
    const systemTheme = useThemeStore(s => s.systemTheme);
    const setTheme = useThemeStore(s => s.setTheme);
    const initTheme = useThemeStore(s => s.initTheme);
    const attachSystemListener = useThemeStore(s => s.attachSystemListener);
    return { theme, systemTheme, setTheme, initTheme, attachSystemListener };
}
