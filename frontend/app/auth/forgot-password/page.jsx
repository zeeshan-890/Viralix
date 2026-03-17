import Link from 'next/link';
import ResetForm from './reset-form';

export default function ForgotPasswordPage() {
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
                                Forgot Your Password?
                            </h2>
                            <p className="text-xl text-white/90 leading-relaxed">
                                No worries! It happens. Enter your email and we'll send you reset instructions.
                            </p>
                            <div className="mt-8 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#84A98C' }}>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <span className="text-lg">Check your inbox</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#84A98C' }}>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11.542 6.356 15 7z" />
                                        </svg>
                                    </div>
                                    <span className="text-lg">Use the secure link</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#84A98C' }}>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </div>
                                    <span className="text-lg">Set a new password</span>
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
                                Reset Password
                            </h2>
                            <p className="text-center text-base text-gray-600">
                                Enter your email to receive reset instructions
                            </p>
                        </div>
                        <ResetForm />
                    </div>
                </div>
            </div>
        </div>
    );
}
