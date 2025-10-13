'use client';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export default function AuthCallbackPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { setAuth } = useAuthStore();

    useEffect(() => {
        const token = searchParams.get('token');
        const error = searchParams.get('error');

        if (error) {
            // Handle OAuth error
            console.error('OAuth error:', error);
            router.replace(`/auth/login?error=${error}`);
            return;
        }

        if (token) {
            // Store token and fetch user data
            localStorage.setItem('token', token);

            // Fetch user data
            fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
                .then(res => res.json())
                .then(user => {
                    setAuth(user, token);
                    router.replace('/dashboard');
                })
                .catch(err => {
                    console.error('Failed to fetch user:', err);
                    router.replace('/auth/login?error=auth_failed');
                });
        } else {
            // No token, redirect to login
            router.replace('/auth/login');
        }
    }, [searchParams, router, setAuth]);

    return (
        <div className="min-h-screen flex items-center justify-center" style={{ fontFamily: 'Inter, Poppins, sans-serif' }}>
            <div className="text-center">
                <div className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ borderColor: '#84A98C', borderTopColor: 'transparent' }}></div>
                <h2 className="text-2xl font-bold mb-2" style={{ color: '#354F52' }}>
                    Completing Sign In...
                </h2>
                <p className="text-gray-600">
                    Please wait while we set up your account
                </p>
            </div>
        </div>
    );
}
