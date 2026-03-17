'use client';
import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api';
import Link from 'next/link';
import { Mail, KeyRound, ArrowLeft, RefreshCw, CheckCircle2 } from 'lucide-react';

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
        <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
            style={{
                background: 'linear-gradient(to bottom right, #2a3e2e, #354a3c, #4e6653)',
                fontFamily: 'Inter, Poppins, sans-serif'
            }}>

            {/* Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-72 h-72 bg-[#84A98C]/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#52796F]/20 rounded-full blur-3xl"></div>
            </div>

            {/* Logo Header */}
            <div className="absolute top-6 left-6 flex items-center gap-2">
                <img src="/logo.png" className="w-10 h-10 rounded-full" alt="Viralix Logo" />
                <h1 className="text-xl font-bold text-white">Viralix</h1>
            </div>

            {/* Main Card */}
            <div className="w-full max-w-md relative z-10">
                <div className="bg-white/95 backdrop-blur-lg p-8 rounded-2xl shadow-2xl border border-white/20">

                    {/* Icon Header */}
                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg"
                            style={{ background: 'linear-gradient(135deg, #84A98C, #52796F)' }}>
                            <KeyRound className="w-8 h-8 text-white" />
                        </div>
                    </div>

                    {/* Title */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold mb-2"
                            style={{ color: '#2a3e2e' }}>
                            Verify Your Email
                        </h1>
                        <p className="text-gray-600">
                            We sent a 6-digit code to<br />
                            <span className="font-semibold" style={{ color: '#52796F' }}>
                                {email || 'your email'}
                            </span>
                        </p>
                    </div>

                    {/* Messages */}
                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-6 flex items-start gap-3">
                            <div className="flex-shrink-0 mt-0.5">⚠️</div>
                            <div className="text-sm">{error}</div>
                        </div>
                    )}
                    {message && (
                        <div className="border-l-4 p-4 rounded-lg mb-6 flex items-start gap-3"
                            style={{
                                backgroundColor: '#f0f7f4',
                                borderColor: '#84A98C'
                            }}>
                            <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#52796F' }} />
                            <div className="text-sm" style={{ color: '#2a3e2e' }}>{message}</div>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={onSubmit} className="space-y-5">
                        {/* OTP Input */}
                        <div>
                            <label htmlFor="code" className="block text-sm font-semibold mb-2"
                                style={{ color: '#2a3e2e' }}>
                                Verification Code
                            </label>
                            <div className="relative">
                                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    id="code"
                                    type="text"
                                    inputMode="numeric"
                                    pattern="\d{6}"
                                    maxLength={6}
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    required
                                    className="w-full h-12 pl-11 pr-4 border-2 border-gray-200 rounded-xl tracking-[0.5em] text-center text-xl font-semibold focus:outline-none focus:border-[#84A98C] transition-colors"
                                    placeholder="000000"
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-2 text-center">
                                Enter the 6-digit code sent to your email
                            </p>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            style={{
                                background: loading
                                    ? 'linear-gradient(135deg, #84A98C 0%, #52796F 100%)'
                                    : 'linear-gradient(135deg, #84A98C 0%, #52796F 100%)'
                            }}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <RefreshCw className="w-5 h-5 animate-spin" />
                                    Verifying...
                                </span>
                            ) : (
                                'Verify & Continue'
                            )}
                        </button>
                    </form>

                    {/* Footer Actions */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <div className="flex items-center justify-between text-sm">
                            <button
                                onClick={onResend}
                                disabled={loading}
                                className="font-medium hover:underline disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                style={{ color: '#52796F' }}
                            >
                                <RefreshCw className="w-4 h-4" />
                                Resend Code
                            </button>
                            <Link
                                href="/auth/login"
                                className="text-gray-600 hover:text-gray-900 font-medium flex items-center gap-1"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back to Login
                            </Link>
                        </div>
                    </div>

                    {/* Help Text */}
                    <div className="mt-6 text-center">
                        <p className="text-xs text-gray-500">
                            Didn't receive the code? Check your spam folder or{' '}
                            <button
                                onClick={onResend}
                                disabled={loading}
                                className="font-semibold hover:underline disabled:opacity-50"
                                style={{ color: '#52796F' }}
                            >
                                resend it
                            </button>
                        </p>
                    </div>
                </div>

                {/* Bottom Links */}
                <div className="mt-6 text-center text-sm text-white/80">
                    Need help?{' '}
                    <a href="mailto:support@viralix.com" className="font-semibold hover:text-white transition-colors">
                        Contact Support
                    </a>
                </div>
            </div>
        </div>
    );
}

export default function VerifyOtpPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center"
                style={{ background: 'linear-gradient(to bottom right, #2a3e2e, #354a3c, #4e6653)' }}>
                <div className="text-white text-xl">Loading...</div>
            </div>
        }>
            <VerifyOtpInner />
        </Suspense>
    );
}
