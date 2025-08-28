import { Platform } from './campaign'

export interface AnalyticsData {
    platform: Platform
    period: 'day' | 'week' | 'month' | 'year'
    metrics: {
        views: number
        likes: number
        comments: number
        shares: number
        clicks: number
        engagement_rate: number
        reach: number
        impressions: number
    }
    date: Date
}

export interface PerformanceMetrics {
    totalViews: number
    totalLikes: number
    totalComments: number
    totalShares: number
    totalClicks: number
    averageEngagementRate: number
    topPerformingPost?: {
        id: string
        title: string
        metrics: AnalyticsData['metrics']
    }
}

export interface PlatformComparison {
    platform: Platform
    metrics: AnalyticsData['metrics']
    growth: {
        views: number
        likes: number
        followers: number
    }
}

export interface EngagementInsight {
    id: string
    type: 'tip' | 'warning' | 'success'
    title: string
    description: string
    actionable: boolean
    platform?: Platform
}
