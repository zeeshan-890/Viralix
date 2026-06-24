'use client';

import { cn } from '@/lib/utils';
import { getPlatform } from '@/config/platforms';
import PlatformIcon from './PlatformIcon';

/** Small platform pill for tabs, filters, and tags. */
export default function PlatformChip({ platform, label, active = false, onClick, className, size = 16 }) {
    const cfg = getPlatform(platform);
    if (!cfg) return null;

    const Tag = onClick ? 'button' : 'span';

    return (
        <Tag
            type={onClick ? 'button' : undefined}
            onClick={onClick}
            className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition',
                active
                    ? cn('ring-2 ring-offset-1 shadow-sm', cfg.selectedRing, cfg.selectedBg, cfg.textColor)
                    : cn(cfg.lightBg, cfg.textColor, 'opacity-80 hover:opacity-100'),
                className
            )}
        >
            <PlatformIcon platform={platform} size={size} />
            {label ?? cfg.label}
        </Tag>
    );
}
