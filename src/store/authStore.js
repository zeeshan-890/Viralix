import { create } from 'zustand';
import { authAPI } from '../lib/api';
import { getStoredToken, getStoredUser, setStoredToken, setStoredUser, removeStoredToken, removeStoredUser } from '../lib/auth';

// Shape
// state: { user: object|null, loading: boolean }
// actions: { init(), login(email,password), signup(name,email,password), logout(), updateUser(partial) }

export const useAuthStore = create((set, get) => ({
    user: null,
    loading: true,

    init: async () => {
        const token = getStoredToken();
        const storedUser = getStoredUser();
        if (token && storedUser) {
            set({ user: storedUser });
            try {
                const response = await authAPI.me();
                set({ user: response.data });
                setStoredUser(response.data);
            } catch (err) {
                removeStoredToken();
                removeStoredUser();
                set({ user: null });
            }
        }
        set({ loading: false });
    },

    login: async (email, password) => {
        const response = await authAPI.login(email, password);
        const { token, user } = response.data;
        setStoredToken(token);
        setStoredUser(user);
        set({ user });
    },

    signup: async (name, email, password) => {
        const response = await authAPI.signup(name, email, password);
        const { token, user } = response.data;
        setStoredToken(token);
        setStoredUser(user);
        set({ user });
    },

    logout: () => {
        removeStoredToken();
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
