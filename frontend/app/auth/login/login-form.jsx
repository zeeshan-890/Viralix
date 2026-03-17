'use client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '@/store/authStore';
// Using plain HTML inputs and buttons with same styling as the design

export default function LoginForm() {

    const { login } = useAuthStore();
    const router = useRouter();
    const { register, handleSubmit, setError, watch, formState: { errors, isSubmitting } } = useForm({
        defaultValues: {
            email: '',
            password: '',
        },
    });

    const onSubmit = async (values) => {
        try {
            const res = await login(values.email, values.password);
            if (res?.requiresVerification) {
                router.replace(`/auth/verify-otp?email=${encodeURIComponent(values.email)}`);
                return;
            }
            router.replace('/dashboard');
        } catch (err) {
            setError('root', { message: 'Invalid email or password.' });
        }
    };

    const handleGoogleLogin = () => {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        window.location.href = `${apiUrl}/api/auth/google`;
    };

    const handleFacebookLogin = () => {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        window.location.href = `${apiUrl}/api/auth/facebook`;
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {errors.root?.message && (
                <div className="bg-red-50 text-red-800 p-3 rounded-md text-sm">{errors.root.message}</div>
            )}



            <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1" style={{ color: '#354F52' }}>
                    Email
                </label>
                <input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    aria-invalid={!!errors.email}
                    className="flex h-11 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
                    style={{ focusRingColor: '#84A98C' }}
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
                {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>}
            </div>

            <div>
                <div className="flex items-center justify-between mb-1">
                    <label htmlFor="password" className="block text-sm font-medium" style={{ color: '#354F52' }}>
                        Password
                    </label>
                    <Link href="/auth/forgot-password" className="text-sm font-medium hover:underline" style={{ color: '#84A98C' }}>
                        Forgot password?
                    </Link>
                </div>
                <input
                    id="password"
                    type="password"
                    placeholder="Create a password"
                    aria-invalid={!!errors.password}
                    className="flex h-11 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
                    style={{ focusRingColor: '#84A98C' }}
                    onFocus={(e) => e.target.style.borderColor = '#84A98C'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                    {...register('password', {
                        required: 'Password is required',
                        minLength: { value: 8, message: 'Password must be at least 8 characters' },
                    })}
                />
                {errors.password && <p className="text-sm text-red-600 mt-1">{errors.password.message}</p>}
            </div>





            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 text-white h-11 px-4 py-2 shadow-lg hover:shadow-xl"
                style={{ backgroundColor: '#84A98C' }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#52796F'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#84A98C'}
            >
                {isSubmitting ? 'Logging in...' : 'Log in'}
            </button>



            <div className="text-center">
                <span className="text-sm text-gray-600">
                    Don&apos;t have an account?{' '}
                    <Link href="/auth/signup" className="font-medium hover:underline" style={{ color: '#84A98C' }}>
                        Sign Up
                    </Link>
                </span>
            </div>
        </form>
    );
}
