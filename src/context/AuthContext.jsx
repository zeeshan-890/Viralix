'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { authAPI } from '../lib/api';
import { getStoredToken, getStoredUser, setStoredToken, setStoredUser, removeStoredToken, removeStoredUser } from '../lib/auth';
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const initAuth = async () => {
            const token = getStoredToken();
            const storedUser = getStoredUser();
            if (token && storedUser) {
                setUser(storedUser);
                try {
                    const response = await authAPI.me();
                    setUser(response.data);
                    setStoredUser(response.data);
                }
                catch (error) {
                    removeStoredToken();
                    removeStoredUser();
                    setUser(null);
                }
            }
            setLoading(false);
        };
        initAuth();
    }, []);
    const login = async (email, password) => {
        const response = await authAPI.login(email, password);
        const { token, user } = response.data;
        setStoredToken(token);
        setStoredUser(user);
        setUser(user);
    };
    const signup = async (name, email, password) => {
        const response = await authAPI.signup(name, email, password);
        const { token, user } = response.data;
        setStoredToken(token);
        setStoredUser(user);
        setUser(user);
    };
    const logout = () => {
        removeStoredToken();
        removeStoredUser();
        setUser(null);
        window.location.href = '/auth/login';
    };
    const updateUser = (userData) => {
        if (user) {
            const updatedUser = Object.assign(Object.assign({}, user), userData);
            setUser(updatedUser);
            setStoredUser(updatedUser);
        }
    };
    const value = {
        user,
        loading,
        login,
        signup,
        logout,
        updateUser,
    };
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
