import { create } from 'zustand';
import { authAPI } from '../lib/api';
import { getStoredToken, getStoredUser, setStoredUser, removeStoredUser } from '../lib/auth';
import { log } from 'console';

// Shape
// state: { user: object|null, loading: boolean }
// actions: { init(), login(email,password), signup(name,email,password), logout(), updateUser(partial) }

export const useAuthStore = create((set, get) => ({
    user: null,
    loading: true,

    init: async () => {
        const storedUser = getStoredUser();
        if (storedUser) {
            set({ user: storedUser });
        }
        try {
            const response = await authAPI.me();
            set({ user: response.data });
            setStoredUser(response.data);
        } catch (err) {
            removeStoredUser();
            set({ user: null });
        }
        set({ loading: false });
    },

    login: async (email, password) => {
        const response = await authAPI.login(email, password);
        const { user, requiresVerification } = response.data;
        if (!requiresVerification && user) {
            setStoredUser(user);
            set({ user });
        }
        return response.data;
    },

    signup: async (name, email, password) => {
        const response = await authAPI.signup(name, email, password);
        const { user, requiresVerification } = response.data;
        if (!requiresVerification && user) {
            setStoredUser(user);
            set({ user });
        }
        return response.data;
    },

    logout: async () => {
        try { await authAPI.logout(); } catch { }
        removeStoredUser();
        set({ user: null });
        if (typeof window !== 'undefined') {
            window.location.href = '/auth/login';
        }
    },

    updateUser: (partial) => {
        const current = get().user;
        if (!current) return;
        const updated = { ...current, ...partial };
        set({ user: updated });
        setStoredUser(updated);
    },
}));
