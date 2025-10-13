'use client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '@/store/authStore';
// Using plain HTML inputs and buttons with same styling as the design

export default function SignupForm() {

    const { signup } = useAuthStore();
    const router = useRouter();
    const { register, handleSubmit, setError, watch, formState: { errors, isSubmitting } } = useForm({
        defaultValues: {
            name: '',
            email: '',
            password: '',
            confirmPassword: '',
            terms: false,
        },
    });

    const onSubmit = async (values) => {
        try {
            const res = await signup(values.name, values.email, values.password);
            if (res?.requiresVerification) {
                // Direct user to OTP verification page
                router.replace(`/auth/verify-otp?email=${encodeURIComponent(values.email)}`);
                return;
            }
            // If verification not required (e.g., provider bypass), go to dashboard
            router.replace('/dashboard');
        } catch (err) {
            const msg = err?.response?.data?.message || 'Failed to create account. Please try again.';
            setError('root', { message: msg });
        }
    };

    const handleGoogleSignup = () => {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        window.location.href = `${apiUrl}/api/auth/google`;
    };

    const handleFacebookSignup = () => {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        window.location.href = `${apiUrl}/api/auth/facebook`;
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            {errors.root?.message && (
                <div className="bg-red-50 text-red-800 p-2 rounded-md text-xs">{errors.root.message}</div>
            )}

            <div>
                <label htmlFor="name" className="block text-xs font-medium mb-1" style={{ color: '#354F52' }}>
                    Full Name
                </label>
                <input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    aria-invalid={!!errors.name}
                    className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
                    onFocus={(e) => e.target.style.borderColor = '#84A98C'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                    {...register('name', {
                        required: 'Full name is required',
                        minLength: { value: 2, message: 'Full name is required' },
                    })}
                />
                {errors.name && <p className="text-xs text-red-600 mt-0.5">{errors.name.message}</p>}
            </div>

            <div>
                <label htmlFor="email" className="block text-xs font-medium mb-1" style={{ color: '#354F52' }}>
                    Email
                </label>
                <input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    aria-invalid={!!errors.email}
                    className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
                    onFocus={(e) => e.target.style.borderColor = '#84A98C'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                    {...register('email', {
                        required: 'Email is required',
                        pattern: {
                            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                            message: 'Enter a valid email',
                        },
                    })}
                />
                {errors.email && <p className="text-xs text-red-600 mt-0.5">{errors.email.message}</p>}
            </div>

            <div>
                <label htmlFor="password" className="block text-xs font-medium mb-1" style={{ color: '#354F52' }}>
                    Password
                </label>
                <input
                    id="password"
                    type="password"
                    placeholder="Create a password"
                    aria-invalid={!!errors.password}
                    className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
                    onFocus={(e) => e.target.style.borderColor = '#84A98C'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                    {...register('password', {
                        required: 'Password is required',
                        minLength: { value: 8, message: 'Password must be at least 8 characters' },
                    })}
                />
                {errors.password && <p className="text-xs text-red-600 mt-0.5">{errors.password.message}</p>}
            </div>

            <div>
                <label htmlFor="confirmPassword" className="block text-xs font-medium mb-1" style={{ color: '#354F52' }}>
                    Confirm Password
                </label>
                <input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    aria-invalid={!!errors.confirmPassword}
                    className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
                    onFocus={(e) => e.target.style.borderColor = '#84A98C'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                    {...register('confirmPassword', {
                        required: 'Confirm your password',
                        validate: (v) => v === watch('password') || 'Passwords do not match',
                    })}
                />
                {errors.confirmPassword && <p className="text-xs text-red-600 mt-0.5">{errors.confirmPassword.message}</p>}
            </div>

            <div className="flex items-start">
                <input
                    id="terms"
                    type="checkbox"
                    className="h-3.5 w-3.5 mt-0.5 border-gray-300 rounded focus:ring-2"
                    style={{ accentColor: '#84A98C' }}
                    aria-invalid={!!errors.terms}
                    {...register('terms', {
                        validate: (v) => (v === true || v === 'on') || 'You must accept the Terms and Privacy Policy',
                    })}
                />
                <label htmlFor="terms" className="ml-2 block text-xs text-gray-900">
                    I agree to the{' '}
                    <Link href="/terms" className="font-medium hover:underline" style={{ color: '#84A98C' }}>Terms</Link>{' '}
                    and{' '}
                    <Link href="/privacy" className="font-medium hover:underline" style={{ color: '#84A98C' }}>Privacy</Link>
                </label>
            </div>
            {errors.terms && <p className="text-xs text-red-600 -mt-1">{errors.terms.message}</p>}

            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 text-white h-10 px-4 py-2 shadow-lg hover:shadow-xl"
                style={{ backgroundColor: '#84A98C' }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#52796F'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#84A98C'}
            >
                {isSubmitting ? 'Creating account...' : 'Create account'}
            </button>

            <div className="mt-3">
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                        <span className="px-2 bg-white text-gray-500">Or sign up with</span>
                    </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={handleGoogleSignup}
                        className="w-full inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-gray-300 bg-white hover:bg-gray-50 text-gray-900 h-9 px-3 py-2"
                    >
                        <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Google
                    </button>

                    <button
                        type="button"
                        onClick={handleFacebookSignup}
                        className="w-full inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-gray-300 bg-white hover:bg-gray-50 text-gray-900 h-9 px-3 py-2"
                    >
                        <svg className="w-4 h-4 mr-1.5" fill="#1877F2" viewBox="0 0 24 24">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                        Facebook
                    </button>
                </div>
            </div>

            <div className="text-center">
                <span className="text-xs text-gray-600">
                    Already have an account?{' '}
                    <Link href="/auth/login" className="font-medium hover:underline" style={{ color: '#84A98C' }}>
                        Sign in
                    </Link>
                </span>
            </div>
        </form>
    );
}
