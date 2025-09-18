export const getStoredToken = () => {
    if (typeof window === 'undefined')
        return null;
    return localStorage.getItem('token');
};
export const setStoredToken = (token) => {
    if (typeof window === 'undefined')
        return;
    localStorage.setItem('token', token);
};
export const removeStoredToken = () => {
    if (typeof window === 'undefined')
        return;
    localStorage.removeItem('token');
};
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
    return !!getStoredToken();
};
export const logout = () => {
    removeStoredToken();
    removeStoredUser();
    window.location.href = '/auth/login';
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
