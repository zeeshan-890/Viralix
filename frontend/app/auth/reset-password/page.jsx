'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

function ResetPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!token) {
            setError('Invalid or missing reset token');
        }
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await api.post('/auth/reset-password', { token, password });
            setSuccess(true);
            setTimeout(() => router.push('/auth/login'), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reset password. The link may have expired.');
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
                <h3 className="text-xl font-bold mb-2" style={{ color: '#354F52' }}>Password Reset Successful!</h3>
                <p className="text-gray-600 mb-8">
                    Your password has been updated. Redirecting to login...
                </p>
                <Link href="/auth/login">
                    <button
                        className="w-full h-11 rounded-md text-sm font-medium text-white shadow-lg hover:shadow-xl transition-all"
                        style={{ backgroundColor: '#84A98C' }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#52796F'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#84A98C'}
                    >
                        Go to Login
                    </button>
                </Link>
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
                <label htmlFor="password" className="block text-sm font-medium mb-1" style={{ color: '#354F52' }}>
                    New Password
                </label>
                <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password"
                    required
                    minLength={6}
                    className="flex h-11 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
                    style={{ focusRingColor: '#84A98C' }}
                    onFocus={(e) => e.target.style.borderColor = '#84A98C'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                />
            </div>

            <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1" style={{ color: '#354F52' }}>
                    Confirm Password
                </label>
                <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    required
                    minLength={6}
                    className="flex h-11 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
                    style={{ focusRingColor: '#84A98C' }}
                    onFocus={(e) => e.target.style.borderColor = '#84A98C'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                />
            </div>

            <button
                type="submit"
                disabled={loading || !token}
                className="w-full inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 text-white h-11 px-4 py-2 shadow-lg hover:shadow-xl"
                style={{ backgroundColor: '#84A98C' }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#52796F'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#84A98C'}
            >
                {loading ? 'Resetting...' : 'Reset Password'}
            </button>

            <div className="text-center pt-2">
                <Link href="/auth/login" className="text-sm font-medium hover:underline" style={{ color: '#52796F' }}>
                    ← Back to login
                </Link>
            </div>
        </form>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen flex items-center justify-center p-4 sm:p-6" style={{ fontFamily: 'Inter, Poppins, sans-serif' }}>
            <div className='flex w-full max-w-6xl mx-auto rounded-2xl border overflow-hidden'
                style={{ borderColor: 'rgb(22 27 19)' }}>
                {/* Left Side - Brand/Info */}
                <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden" style={{ background: 'linear-gradient(to right bottom, rgb(22 27 19), rgb(60 86 65))' }}>
                    <div className="flex flex-col justify-center items-center w-full p-12 text-white relative z-10">
                        <div className="max-w-md">
                            <div className="flex items-center gap-3 mb-8">
                                <img src="/logo.png" className="w-16 h-16 rounded-full" alt="Viralix Logo" />
                                <h1 className="text-4xl font-bold">Viralix</h1>
                            </div>
                            <h2 className="text-3xl font-bold mb-4 leading-tight">
                                Secure Your Account
                            </h2>
                            <p className="text-xl text-white/90 leading-relaxed">
                                Choose a strong password to keep your social media automation workspace safe.
                            </p>
                            <div className="mt-8 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#84A98C' }}>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </div>
                                    <span className="text-lg">Strong Encryption</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#84A98C' }}>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <span className="text-lg">Instant Update</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Decorative gradient overlay */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
                </div>

                {/* Right Side - Reset Form */}
                <div className="flex-1 flex items-center justify-center bg-white py-8 px-4 sm:px-6 lg:px-10">
                    <div className="max-w-md w-full space-y-8">
                        <div>
                            <div className="flex items-center justify-center gap-3 lg:hidden mb-8">
                                <img src="/logo.png" className="w-12 h-12 rounded-full" alt="Viralix Logo" />
                                <h1 className="text-3xl font-bold" style={{ color: '#84A98C' }}>Viralix</h1>
                            </div>
                            <h2 className="text-center text-3xl sm:text-4xl font-bold mb-3" style={{ color: '#354F52' }}>
                                Set New Password
                            </h2>
                            <p className="text-center text-base text-gray-600">
                                Enter your new password below
                            </p>
                        </div>
                        <Suspense fallback={<div className="text-center">Loading...</div>}>
                            <ResetPasswordContent />
                        </Suspense>
                    </div>
                </div>
            </div>
        </div>
    );
}
