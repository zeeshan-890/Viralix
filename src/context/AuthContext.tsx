'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '../types/user'
import { authAPI } from '../lib/api'
import { getStoredToken, getStoredUser, setStoredToken, setStoredUser, removeStoredToken, removeStoredUser } from '../lib/auth'

interface AuthContextType {
    user: User | null
    loading: boolean
    login: (email: string, password: string) => Promise<void>
    signup: (name: string, email: string, password: string) => Promise<void>
    logout: () => void
    updateUser: (userData: Partial<User>) => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const initAuth = async () => {
            const token = getStoredToken()
            const storedUser = getStoredUser()

            if (token && storedUser) {
                setUser(storedUser)
                try {
                    const response = await authAPI.me()
                    setUser(response.data)
                    setStoredUser(response.data)
                } catch (error) {
                    removeStoredToken()
                    removeStoredUser()
                    setUser(null)
                }
            }
            setLoading(false)
        }

        initAuth()
    }, [])

    const login = async (email: string, password: string) => {
        const response = await authAPI.login(email, password)
        const { token, user } = response.data

        setStoredToken(token)
        setStoredUser(user)
        setUser(user)
    }

    const signup = async (name: string, email: string, password: string) => {
        const response = await authAPI.signup(name, email, password)
        const { token, user } = response.data

        setStoredToken(token)
        setStoredUser(user)
        setUser(user)
    }

    const logout = () => {
        removeStoredToken()
        removeStoredUser()
        setUser(null)
        window.location.href = '/auth/login'
    }

    const updateUser = (userData: Partial<User>) => {
        if (user) {
            const updatedUser = { ...user, ...userData }
            setUser(updatedUser)
            setStoredUser(updatedUser)
        }
    }

    const value = {
        user,
        loading,
        login,
        signup,
        logout,
        updateUser,
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
