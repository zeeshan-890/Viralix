import * as React from 'react';
import { cn } from '../../lib/utils';

const colorMap = {
    default: 'bg-gray-100 text-gray-700 border-transparent',
    primary: 'bg-blue-100 text-blue-800 border-transparent',
    success: 'bg-green-100 text-green-700 border-transparent',
    warning: 'bg-yellow-100 text-yellow-800 border-transparent',
    danger: 'bg-red-100 text-red-700 border-transparent',
    outline: 'bg-white text-gray-800 border-gray-300',
};

const Badge = ({ className, variant = 'default', pill = false, children, ...props }) => {
    return (
        <span
            className={cn(
                'inline-flex items-center border text-xs font-medium px-2 py-0.5',
                pill ? 'rounded-full' : 'rounded-md',
                colorMap[variant] || colorMap.default,
                className
            )}
            {...props}
        >
            {children}
        </span>
    );
};

export { Badge };