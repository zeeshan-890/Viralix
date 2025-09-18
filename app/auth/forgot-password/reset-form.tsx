'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '../../../src/components/ui/Button'
import { Input } from '../../../src/components/ui/Input'

export default function ResetForm() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            // TODO: Implement actual password reset logic
            console.log('Password reset request:', { email })

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000))

            setSuccess(true)
        } catch {
            setError('Failed to send reset email. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                    <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Email sent!</h3>
                <p className="text-sm text-gray-600 mb-6">
                    We&apos;ve sent a password reset link to {email}
                </p>
                <Link href="/login">
                    <Button variant="outline">Back to login</Button>
                </Link>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="bg-red-50 text-red-800 p-3 rounded-md text-sm">
                    {error}
                </div>
            )}

            <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email address
                </label>
                <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    required
                />
                <p className="mt-2 text-sm text-gray-600">
                    We&apos;ll send you a link to reset your password.
                </p>
            </div>

            <Button
                type="submit"
                className="w-full"
                disabled={loading}
            >
                {loading ? 'Sending...' : 'Send reset email'}
            </Button>

            <div className="text-center">
                <Link href="/login" className="text-sm text-blue-600 hover:text-blue-500">
                    Back to login
                </Link>
            </div>
        </form>
    )
}
