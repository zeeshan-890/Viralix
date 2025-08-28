import { Platform } from './campaign'

export interface User {
    id: string
    email: string
    name: string
    avatar?: string
    role: 'user' | 'admin'
    createdAt: Date
    updatedAt: Date
    subscription?: {
        plan: 'free' | 'starter' | 'pro'
        status: 'active' | 'cancelled' | 'expired'
        expiresAt?: Date
    }
}

export interface ConnectedAccount {
    id: string
    platform: Platform
    username: string
    isConnected: boolean
    lastSync?: Date
    error?: string
}
