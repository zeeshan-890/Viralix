import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}
export function formatDate(date) {
    return new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}
export function formatDateTime(date) {
    return new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}
export function formatNumber(num) {
    const n = Number(num);
    if (!Number.isFinite(n)) return '0';
    if (n >= 1000000) {
        return (n / 1000000).toFixed(1) + 'M';
    }
    if (n >= 1000) {
        return (n / 1000).toFixed(1) + 'K';
    }
    return String(Math.round(n));
}
export function getInitials(name) {
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}
export function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
export function validatePassword(password) {
    return password.length >= 8;
}
export function generateId() {
    return Math.random().toString(36).substr(2, 9);
}
