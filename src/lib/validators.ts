import { z } from 'zod'

export const loginSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const signupSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
})

export const forgotPasswordSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
})

export const resetPasswordSchema = z.object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
})

export const campaignSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    caption: z.string().min(1, 'Caption is required'),
    hashtags: z.array(z.string()).optional(),
    platforms: z.array(z.enum(['tiktok', 'youtube', 'instagram', 'linkedin'])).min(1, 'Select at least one platform'),
    publishAt: z.date().min(new Date(), 'Publish date must be in the future'),
})

export const profileSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
})

export const settingsSchema = z.object({
    emailNotifications: z.boolean(),
    pushNotifications: z.boolean(),
    weeklyReports: z.boolean(),
    theme: z.enum(['light', 'dark', 'system']),
    timezone: z.string(),
})

export type LoginFormData = z.infer<typeof loginSchema>
export type SignupFormData = z.infer<typeof signupSchema>
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>
export type CampaignFormData = z.infer<typeof campaignSchema>
export type ProfileFormData = z.infer<typeof profileSchema>
export type SettingsFormData = z.infer<typeof settingsSchema>
