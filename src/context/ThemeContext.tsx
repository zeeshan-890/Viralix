'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
    theme: Theme
    setTheme: (theme: Theme) => void
    systemTheme: 'light' | 'dark'
}

const ThemeContext = createContext<ThemeContextType | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>('system')
    const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('light')

    useEffect(() => {
        // Get stored theme
        const storedTheme = localStorage.getItem('theme') as Theme
        if (storedTheme) {
            setTheme(storedTheme)
        }

        // Listen for system theme changes
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
        setSystemTheme(mediaQuery.matches ? 'dark' : 'light')

        const handleChange = (e: MediaQueryListEvent) => {
            setSystemTheme(e.matches ? 'dark' : 'light')
        }

        mediaQuery.addEventListener('change', handleChange)
        return () => mediaQuery.removeEventListener('change', handleChange)
    }, [])

    useEffect(() => {
        const root = window.document.documentElement
        root.classList.remove('light', 'dark')

        const effectiveTheme = theme === 'system' ? systemTheme : theme
        root.classList.add(effectiveTheme)
    }, [theme, systemTheme])

    const handleSetTheme = (newTheme: Theme) => {
        setTheme(newTheme)
        localStorage.setItem('theme', newTheme)
    }

    const value = {
        theme,
        setTheme: handleSetTheme,
        systemTheme,
    }

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
    const context = useContext(ThemeContext)
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider')
    }
    return context
}
