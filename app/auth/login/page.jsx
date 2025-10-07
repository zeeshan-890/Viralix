import Link from 'next/link';
import LoginForm from './login-form';

export default function LoginPage() {
    return (
        <div className="min-h-screen flex min-w-screen px-auto  py-auto" style={{ fontFamily: 'Inter, Poppins, sans-serif' }}>
            <div className='flex w-[80%] h-[80%] mx-auto my-auto border rounded-lg drop-shadow-emerald-900' 
            style={{ 
                border: '1px solid rgb(22 27 19)',
                borderRadius: '15px',
                boxShadow: '0px 0px 35px rgb(22 27 19)'
            }}>
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden" style={{ background: 'linear-gradient(to right bottom, rgb(22 27 19), rgb(60 86 65))' , borderRadius: '10px', borderTopRightRadius: '20px', borderBottomRightRadius: '20px'}}>
                <div className="flex flex-col justify-center items-center w-full p-12 text-white relative z-10">
                    <div className="max-w-md">
                        <div className="flex items-center gap-3 mb-8">
                            <img src="/logo.png" className="w-16 h-16 rounded-full" alt="Viralix Logo" />
                            <h1 className="text-4xl font-bold">Viralix</h1>
                        </div>
                        <h2 className="text-3xl font-bold mb-4 leading-tight">
                            Welcome Back to Your Social Media Command Center
                        </h2>
                        <p className="text-xl text-white/90 leading-relaxed">
                            Manage, schedule, and analyze your social media content with AI-powered automation.
                        </p>
                        <div className="mt-8 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#84A98C' }}>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <span className="text-lg">AI-Powered Content Generation</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#84A98C' }}>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <span className="text-lg">Smart Scheduling & Analytics</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#84A98C' }}>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <span className="text-lg">Cross-Platform Management</span>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Decorative gradient overlay */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
            </div>

            {/* Right Side - Login Form */}
            <div className="flex-1 flex items-center justify-center bg-white py-12 px-4 sm:px-6 lg:px-8"style={{ borderRadius: '20px' }}>
                <div className="max-w-md w-full space-y-8">
                    <div>
                        <div className="flex items-center justify-center gap-3 lg:hidden mb-8">
                            <img src="/logo.png" className="w-12 h-12 rounded-full" alt="Viralix Logo" />
                            <h1 className="text-3xl font-bold" style={{ color: '#84A98C' }}>Viralix</h1>
                        </div>
                        <h2 className="text-center text-4xl font-bold mb-3" style={{ color: '#354F52' }}>
                            Welcome Back
                        </h2>
                        <p className="text-center text-base text-gray-600">
                            Sign in to continue to your dashboard
                        </p>
                    </div>
                    <LoginForm />
                    <div className="text-center pt-4">
                        <Link href="/" className="text-sm font-medium hover:underline" style={{ color: '#52796F' }}>
                            ← Back to home
                        </Link>
                    </div>
                </div>
            </div>
        </div>
        </div>
    );
}
