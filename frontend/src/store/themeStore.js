'use client';
import { create } from 'zustand';

// state: { theme: 'light'|'dark'|'system', systemTheme: 'light'|'dark' }
// actions: { setTheme(t), initTheme(), attachSystemListener() }

export const useThemeStore = create((set, get) => ({
    theme: 'system',
    systemTheme: 'light',

    setTheme: (newTheme) => {
        set({ theme: newTheme });
        if (typeof window !== 'undefined') {
            localStorage.setItem('theme', newTheme);
            // Apply immediately
            const root = window.document.documentElement;
            root.classList.remove('light', 'dark');
            const effective = newTheme === 'system' ? get().systemTheme : newTheme;
            root.classList.add(effective);
        }
    },

    initTheme: () => {
        if (typeof window === 'undefined') return;
        const stored = localStorage.getItem('theme');
        if (stored) set({ theme: stored });

        const m = window.matchMedia('(prefers-color-scheme: dark)');
        set({ systemTheme: m.matches ? 'dark' : 'light' });

        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        const eff = (stored || get().theme) === 'system' ? get().systemTheme : (stored || get().theme);
        root.classList.add(eff);
    },

    attachSystemListener: () => {
        if (typeof window === 'undefined') return () => { };
        const m = window.matchMedia('(prefers-color-scheme: dark)');
        const onChange = (e) => {
            set({ systemTheme: e.matches ? 'dark' : 'light' });
            const { theme } = get();
            if (theme === 'system') {
                const root = window.document.documentElement;
                root.classList.remove('light', 'dark');
                root.classList.add(e.matches ? 'dark' : 'light');
            }
        };
        m.addEventListener('change', onChange);
        return () => m.removeEventListener('change', onChange);
    },
}));
