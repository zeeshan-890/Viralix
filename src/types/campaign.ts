export type Platform = 'tiktok' | 'youtube' | 'instagram' | 'linkedin'

export type PostStatus = 'draft' | 'scheduled' | 'published' | 'failed'

export interface Campaign {
    id: string
    title: string
    description?: string
    status: PostStatus
    platforms: Platform[]
    content: {
        caption: string
        hashtags: string[]
        media: MediaFile[]
        cta?: string
    }
    scheduling: {
        publishAt: Date
        timezone: string
    }
    analytics?: {
        views: number
        likes: number
        comments: number
        shares: number
        clicks: number
    }
    createdAt: Date
    updatedAt: Date
    userId: string
}

export interface MediaFile {
    id: string
    filename: string
    type: 'image' | 'video'
    url: string
    thumbnail?: string
    size: number
    duration?: number // for videos
    dimensions: {
        width: number
        height: number
    }
    platforms: Platform[] // which platforms this file is optimized for
}

export interface CampaignTemplate {
    id: string
    name: string
    caption: string
    hashtags: string[]
    platforms: Platform[]
    userId: string
    createdAt: Date
}
