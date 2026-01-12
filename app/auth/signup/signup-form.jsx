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
