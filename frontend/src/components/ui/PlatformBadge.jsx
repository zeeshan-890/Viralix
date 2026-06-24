'use client';

import { getPlatform } from '@/config/platforms';
import { cn } from '@/lib/utils';
import PlatformIcon from './PlatformIcon';

const BOX = {
    xs: { box: 'h-5 w-5', icon: 12 },
    sm: { box: 'h-6 w-6', icon: 14 },
    md: { box: 'h-8 w-8', icon: 18 },
    lg: { box: 'h-10 w-10', icon: 22 },
    xl: { box: 'h-14 w-14', icon: 32 },
    '2xl': { box: 'h-16 w-16', icon: 40 },
};

/**
 * Platform logo inside a tinted rounded container.
 */
export default function PlatformBadge({
    platform,
    size = 'md',
    className,
    iconClassName,
    showLabel = false,
    rounded = 'lg',
}) {
    const cfg = getPlatform(platform);
    if (!cfg) return null;

    const dim = BOX[size] || BOX.md;
    const roundClass = rounded === 'full' ? 'rounded-full' : rounded === 'xl' ? 'rounded-xl' : 'rounded-lg';

    return (
        <div className={cn('inline-flex items-center gap-2', className)}>
            <span
                className={cn(
                    'inline-flex shrink-0 items-center justify-center border border-gray-100',
                    roundClass,
                    dim.box,
                    cfg.lightBg
                )}
            >
                <PlatformIcon platform={platform} size={dim.icon} className={iconClassName} />
            </span>
            {showLabel && (
                <span className="text-sm font-medium text-[var(--viralix-accent)]">{cfg.label}</span>
            )}
        </div>
    );
}
