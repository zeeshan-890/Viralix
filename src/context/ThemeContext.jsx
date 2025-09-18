'use client';
import { createContext, useContext, useEffect, useState } from 'react';
const ThemeContext = createContext(null);
export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState('system');
    const [systemTheme, setSystemTheme] = useState('light');
    useEffect(() => {
        // Get stored theme
        const storedTheme = localStorage.getItem('theme');
        if (storedTheme) {
            setTheme(storedTheme);
        }
        // Listen for system theme changes
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        setSystemTheme(mediaQuery.matches ? 'dark' : 'light');
        const handleChange = (e) => {
            setSystemTheme(e.matches ? 'dark' : 'light');
        };
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);
    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        const effectiveTheme = theme === 'system' ? systemTheme : theme;
        root.classList.add(effectiveTheme);
    }, [theme, systemTheme]);
    const handleSetTheme = (newTheme) => {
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    };
    const value = {
        theme,
        setTheme: handleSetTheme,
        systemTheme,
    };
    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
