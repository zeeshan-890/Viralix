'use client';
import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api';
import Link from 'next/link';

function VerifyOtpInner() {
    const params = useSearchParams();
    const router = useRouter();
    const [email, setEmail] = useState(params.get('email') || '');
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const onSubmit = async (e) => {
        e.preventDefault();
        setError(''); setMessage(''); setLoading(true);
        try {
            const res = await authAPI.verifyOtp(email, code);
            setMessage('Verified successfully. Redirecting...');
            // After verification, cookie is set by server; go to dashboard
            router.replace('/dashboard');
        } catch (err) {
            setError(err?.response?.data?.message || 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    const onResend = async () => {
        setError(''); setMessage(''); setLoading(true);
        try {
            await authAPI.resendOtp(email);
            setMessage('A new code has been sent to your email.');
        } catch (err) {
            setError(err?.response?.data?.message || 'Failed to resend code');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-md bg-white p-6 rounded-lg shadow">
                <h1 className="text-xl font-semibold mb-1">Verify your email</h1>
                <p className="text-sm text-gray-600 mb-6">We sent a 6-digit code to your email. Enter it below to continue.</p>

                {error && <div className="bg-red-50 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}
                {message && <div className="bg-green-50 text-green-700 p-3 rounded mb-4 text-sm">{message}</div>}

                <form onSubmit={onSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full h-10 px-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                        <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">Verification code</label>
                        <input id="code" type="text" inputMode="numeric" pattern="\n?\d{6}" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} required className="w-full h-10 px-3 border rounded tracking-widest text-center text-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <button type="submit" disabled={loading} className="w-full h-10 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
                        {loading ? 'Verifying...' : 'Verify'}
                    </button>
                </form>

                <div className="mt-4 flex items-center justify-between text-sm">
                    <button onClick={onResend} disabled={loading || !email} className="text-blue-600 hover:text-blue-700 disabled:opacity-50">Resend code</button>
                    <Link href="/auth/login" className="text-gray-600 hover:text-gray-800">Back to login</Link>
                </div>
            </div>
        </div>
    );
}

export default function VerifyOtpPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading…</div>}>
            <VerifyOtpInner />
        </Suspense>
    );
}
