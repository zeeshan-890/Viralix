import { User } from '@/types/user'

export const getStoredToken = (): string | null => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('token')
}

export const setStoredToken = (token: string): void => {
    if (typeof window === 'undefined') return
    localStorage.setItem('token', token)
}

export const removeStoredToken = (): void => {
    if (typeof window === 'undefined') return
    localStorage.removeItem('token')
}

export const getStoredUser = (): User | null => {
    if (typeof window === 'undefined') return null
    const user = localStorage.getItem('user')
    return user ? JSON.parse(user) : null
}

export const setStoredUser = (user: User): void => {
    if (typeof window === 'undefined') return
    localStorage.setItem('user', JSON.stringify(user))
}

export const removeStoredUser = (): void => {
    if (typeof window === 'undefined') return
    localStorage.removeItem('user')
}

export const isAuthenticated = (): boolean => {
    return !!getStoredToken()
}

export const logout = (): void => {
    removeStoredToken()
    removeStoredUser()
    window.location.href = '/auth/login'
}

export const redirectToLogin = (): void => {
    if (typeof window !== 'undefined') {
        window.location.href = '/auth/login'
    }
}

export const redirectToDashboard = (): void => {
    if (typeof window !== 'undefined') {
        window.location.href = '/dashboard'
    }
}
