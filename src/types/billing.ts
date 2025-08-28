export interface SubscriptionPlan {
    id: string
    name: string
    price: number
    interval: 'month' | 'year'
    features: string[]
    limits: {
        postsPerMonth: number
        platforms: number
        teamMembers: number
        analyticsHistory: number // in months
    }
}

export interface PaymentMethod {
    id: string
    type: 'card' | 'paypal'
    last4?: string
    brand?: string
    expiryMonth?: number
    expiryYear?: number
    isDefault: boolean
}

export interface Invoice {
    id: string
    amount: number
    currency: string
    status: 'paid' | 'pending' | 'failed'
    createdAt: Date
    paidAt?: Date
    downloadUrl?: string
}

export interface UsageStats {
    postsThisMonth: number
    postsLimit: number
    connectedPlatforms: number
    platformsLimit: number
    teamMembers: number
    teamMembersLimit: number
}
