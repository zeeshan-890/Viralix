'use client';
import { useAuthStore } from '../store/authStore';

export function useAuth() {
    const user = useAuthStore(s => s.user);
    const loading = useAuthStore(s => s.loading);
    const init = useAuthStore(s => s.init);
    const login = useAuthStore(s => s.login);
    const signup = useAuthStore(s => s.signup);
    const logout = useAuthStore(s => s.logout);
    const updateUser = useAuthStore(s => s.updateUser);
    return { user, loading, init, login, signup, logout, updateUser };
}
