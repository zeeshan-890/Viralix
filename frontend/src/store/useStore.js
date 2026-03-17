import { create } from 'zustand';

const useStore = create((set) => ({
    // UI State
    sidebarOpen: true,
    toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    setSidebarOpen: (isOpen) => set({ sidebarOpen: isOpen }),

    // User/Auth State (Optimistic updates for faster UI)
    user: null,
    setUser: (user) => set({ user }),
    clearUser: () => set({ user: null }),

    // Connection Status (can be used to show global offline warnings)
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    setIsOnline: (status) => set({ isOnline: status }),
}));

export default useStore;
