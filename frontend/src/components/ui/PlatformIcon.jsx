'use client';

import Image from 'next/image';
import { getPlatform } from '@/config/platforms';
import { cn } from '@/lib/utils';

/**
 * Official platform logo (PNG).
 * @param {{ platform: string, size?: number, className?: string, inverted?: boolean, alt?: string }} props
 */
export default function PlatformIcon({ platform, size = 20, className, inverted = false, alt }) {
    const cfg = getPlatform(platform);
    if (!cfg) return null;

    return (
        <Image
            src={cfg.icon}
            alt={alt ?? cfg.label}
            width={size}
            height={size}
            className={cn('object-contain', inverted && 'brightness-0 invert', className)}
        />
    );
}
