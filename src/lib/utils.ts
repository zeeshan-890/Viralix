import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string) {
    return new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    })
}

export function formatDateTime(date: Date | string) {
    return new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
    })
}

export function formatNumber(num: number) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + "M"
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + "K"
    }
    return num.toString()
}

export function getInitials(name: string) {
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
}

export function validateEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function validatePassword(password: string) {
    return password.length >= 8
}

export function generateId() {
    return Math.random().toString(36).substr(2, 9)
}
