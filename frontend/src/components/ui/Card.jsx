import * as React from 'react';
import { cn } from '../../lib/utils';

const Card = React.forwardRef(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            'rounded-lg border border-gray-200 bg-white text-gray-900 shadow-sm',
            className
        )}
        {...props}
    />
));
Card.displayName = 'Card';

const CardHeader = ({ className, ...props }) => (
    <div
        className={cn('flex flex-col space-y-1.5 p-4 border-b border-gray-100', className)}
        {...props}
    />
);
CardHeader.displayName = 'CardHeader';

const CardTitle = ({ className, ...props }) => (
    <h3
        className={cn('text-base font-semibold leading-none tracking-tight', className)}
        {...props}
    />
);
CardTitle.displayName = 'CardTitle';

const CardDescription = ({ className, ...props }) => (
    <p
        className={cn('text-sm text-gray-500', className)}
        {...props}
    />
);
CardDescription.displayName = 'CardDescription';

const CardContent = ({ className, ...props }) => (
    <div className={cn('p-4 pt-2', className)} {...props} />
);
CardContent.displayName = 'CardContent';

const CardFooter = ({ className, ...props }) => (
    <div
        className={cn('flex items-center p-4 border-t border-gray-100', className)}
        {...props}
    />
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };