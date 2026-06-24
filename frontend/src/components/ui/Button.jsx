import * as React from 'react';
import { cn } from '../../lib/utils';

const variantClasses = {
    default: 'btn btn-primary',
    primary: 'btn btn-primary',
    confirm: 'btn btn-confirm',
    success: 'btn btn-success',
    destructive: 'btn btn-danger',
    danger: 'btn btn-danger',
    cancel: 'btn btn-cancel',
    warning: 'btn btn-warning',
    outline: 'btn btn-secondary',
    secondary: 'btn btn-secondary',
    ghost: 'btn btn-ghost',
    link: 'text-[var(--viralix-primary-dark)] underline-offset-4 hover:underline font-medium',
};

const sizeClasses = {
    default: '',
    sm: 'btn-sm',
    lg: 'btn-lg',
    icon: 'btn-icon',
};

const Button = React.forwardRef(function Button(
    { className, variant = 'default', size = 'default', type = 'button', ...props },
    ref,
) {
    const isLink = variant === 'link';

    return (
        <button
            ref={ref}
            type={type}
            className={cn(
                !isLink && 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--viralix-primary)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
                !isLink && variantClasses[variant],
                !isLink && sizeClasses[size],
                className,
            )}
            {...props}
        />
    );
});

Button.displayName = 'Button';

export { Button };
