'use client';

import { Toaster } from 'react-hot-toast';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

const toastStyle = {
    background: 'var(--viralix-surface, #FEFEFE)',
    color: 'var(--viralix-accent, #354F52)',
    border: '1px solid var(--viralix-border, #CDD9D2)',
    borderRadius: '12px',
    padding: '12px 16px',
    fontSize: '14px',
    lineHeight: '1.4',
    boxShadow: '0 4px 20px rgba(47, 62, 70, 0.12)',
    maxWidth: '400px',
};

export default function AppToaster() {
    return (
        <Toaster
            position="top-right"
            gutter={12}
            containerClassName="app-toaster"
            containerStyle={{ top: 16, right: 16 }}
            toastOptions={{
                duration: 4500,
                style: toastStyle,
                success: {
                    duration: 4000,
                    icon: <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden />,
                    style: {
                        ...toastStyle,
                        borderLeft: '4px solid #16a34a',
                    },
                },
                error: {
                    duration: 5500,
                    icon: <XCircle className="h-5 w-5 shrink-0 text-red-600" aria-hidden />,
                    style: {
                        ...toastStyle,
                        borderLeft: '4px solid #dc2626',
                    },
                },
                loading: {
                    icon: <Loader2 className="h-5 w-5 shrink-0 animate-spin text-[var(--viralix-primary,#84A98C)]" aria-hidden />,
                    style: {
                        ...toastStyle,
                        borderLeft: '4px solid var(--viralix-primary, #84A98C)',
                    },
                },
            }}
        />
    );
}
