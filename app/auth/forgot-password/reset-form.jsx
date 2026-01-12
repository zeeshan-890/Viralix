'use client';
import { useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

export default function ResetForm() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await api.post('/auth/forgot-password', { email });
            setSuccess(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send reset email. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6" style={{ backgroundColor: '#E8F5E9' }}>
                    <svg className="h-8 w-8" style={{ color: '#2E7D32' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ color: '#354F52' }}>Check your email!</h3>
                <p className="text-gray-600 mb-8">
                    If an account matches <strong>{email}</strong>, we've sent password reset instructions.
                </p>
                <div className="space-y-4">
                    <Link href="/auth/login" className="block w-full">
                        <button
                            className="w-full h-11 rounded-md text-sm font-medium text-white shadow-lg hover:shadow-xl transition-all"
                            style={{ backgroundColor: '#84A98C' }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#52796F'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = '#84A98C'}
                        >
                            Back to login
                        </button>
                    </Link>
                    <button
                        onClick={() => setSuccess(false)}
                        className="text-sm font-medium hover:underline"
                        style={{ color: '#52796F' }}
                    >
                        Try a different email
                    </button>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="bg-red-50 text-red-800 p-3 rounded-md text-sm border border-red-100">
                    {error}
                </div>
            )}

            <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1" style={{ color: '#354F52' }}>
                    Email address
                </label>
                <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    required
                    className="flex h-11 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
                    style={{ focusRingColor: '#84A98C' }}
                    onFocus={(e) => e.target.style.borderColor = '#84A98C'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                />
                <p className="mt-2 text-xs text-gray-500">
                    We'll send you a secure link to reset your password.
                </p>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 text-white h-11 px-4 py-2 shadow-lg hover:shadow-xl"
                style={{ backgroundColor: '#84A98C' }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#52796F'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#84A98C'}
            >
                {loading ? 'Sending Instructions...' : 'Send Reset Instructions'}
            </button>

            <div className="text-center pt-2">
                <Link href="/auth/login" className="text-sm font-medium hover:underline" style={{ color: '#52796F' }}>
                    ← Back to login
                </Link>
            </div>
        </form>
    );
}
