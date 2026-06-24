'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { platformButtonClass } from '@/config/platforms';
import PlatformIcon from './PlatformIcon';

/**
 * CTA button/link styled with official platform brand colors.
 */
export function PlatformButton({ platform, children, className, inverted = true, as = 'button', href, ...props }) {
    const classes = cn(
        'inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium shadow-md transition-all hover:shadow-lg disabled:opacity-50',
        platformButtonClass(platform),
        className
    );

    const content = (
        <>
            <PlatformIcon platform={platform} size={16} inverted={inverted} />
            {children}
        </>
    );

    if (as === 'link' && href) {
        return (
            <Link href={href} className={classes} {...props}>
                {content}
            </Link>
        );
    }

    return (
        <button type="button" className={classes} {...props}>
            {content}
        </button>
    );
}

export default PlatformButton;
