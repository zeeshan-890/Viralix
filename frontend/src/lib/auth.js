// Cookie-based sessions: no token persisted in localStorage anymore
export const getStoredToken = () => null;
export const setStoredToken = (_token) => { };
export const removeStoredToken = () => { };
export const getStoredUser = () => {
    if (typeof window === 'undefined')
        return null;
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
};
export const setStoredUser = (user) => {
    if (typeof window === 'undefined')
        return;
    localStorage.setItem('user', JSON.stringify(user));
};
export const removeStoredUser = () => {
    if (typeof window === 'undefined')
        return;
    localStorage.removeItem('user');
};
export const isAuthenticated = () => {
    // Heuristic: consider authenticated if we have a cached user; authoritative check is /auth/me
    return !!getStoredUser();
};
export const logout = async () => {
    // Hit server to clear cookie; ignore errors
    try {
        await fetch((process.env.NEXT_PUBLIC_API_URL || 'https://viralix-b3ff86cb412f.herokuapp.com/api') + '/auth/logout', {
            method: 'POST',
            credentials: 'include',
        });
    } catch { }
    removeStoredUser();
    if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
    }
};
export const redirectToLogin = () => {
    if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
    }
};
export const redirectToDashboard = () => {
    if (typeof window !== 'undefined') {
        window.location.href = '/dashboard';
    }
};
