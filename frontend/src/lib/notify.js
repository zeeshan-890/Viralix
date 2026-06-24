import toast from 'react-hot-toast';
import { createElement } from 'react';
import { AlertTriangle, Info } from 'lucide-react';

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

const base = {
    position: 'top-right',
    duration: 4500,
};

export const notify = {
    success: (message, opts) =>
        toast.success(message, {
            ...base,
            duration: 4000,
            ...opts,
        }),

    error: (message, opts) =>
        toast.error(message, {
            ...base,
            duration: 5500,
            ...opts,
        }),

    warning: (message, opts) =>
        toast(message, {
            ...base,
            ...opts,
            icon: createElement(AlertTriangle, {
                className: 'h-5 w-5 shrink-0 text-amber-600',
                'aria-hidden': true,
            }),
            style: {
                ...toastStyle,
                borderLeft: '4px solid #d97706',
                ...opts?.style,
            },
        }),

    info: (message, opts) =>
        toast(message, {
            ...base,
            ...opts,
            icon: createElement(Info, {
                className: 'h-5 w-5 shrink-0 text-sky-600',
                'aria-hidden': true,
            }),
            style: {
                ...toastStyle,
                borderLeft: '4px solid #0284c7',
                ...opts?.style,
            },
        }),

    loading: (message, opts) => toast.loading(message, { ...base, ...opts }),

    promise: (promise, messages, opts) => toast.promise(promise, messages, { ...base, ...opts }),

    dismiss: (id) => toast.dismiss(id),
};

export default notify;
