'use client';

import Link from 'next/link';
import { ArrowLeft, ExternalLink, BarChart3, RefreshCw } from 'lucide-react';
import PlatformIcon from '@/components/ui/PlatformIcon';
import { getPlatform } from '@/config/platforms';
import { cn } from '@/lib/utils';

export default function PostAnalyticsHeader({
    platform,
    title = 'Post analytics',
    subtitle,
    permalink,
    onRefresh,
    refreshing = false,
    live = true,
}) {
    const config = getPlatform(platform);

    return (
        <div className="analytics-hero px-5 py-5 sm:px-6 sm:py-6 mb-5">
            <div className="flex flex-wrap items-center gap-2 text-sm text-white/60 mb-4">
                <Link href={`/dashboard/analytics?platform=${platform}`} className="hover:text-white transition-colors">
                    Analytics
                </Link>
                <span className="text-white/30">/</span>
                <Link href={`/dashboard/platforms/${platform}`} className="hover:text-white transition-colors">
                    {config.label}
                </Link>
                <span className="text-white/30">/</span>
                <span className="text-white/90">Post</span>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                    <Link
                        href={`/dashboard/platforms/${platform}`}
                        className="mt-0.5 p-2.5 rounded-lg bg-white/10 border border-white/15 hover:bg-white/15 text-white transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                    <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl bg-white/95 border border-white/20 shadow-md', config.lightBg)}>
                        <PlatformIcon platform={platform} size={28} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-[#84A98C]" />
                            <h1 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">{title}</h1>
                        </div>
                        {subtitle && <p className="text-sm text-white/65 mt-1">{subtitle}</p>}
                        {live && (
                            <p className="text-xs text-emerald-300 flex items-center gap-1.5 mt-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                                Live metrics from {config.label}
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {onRefresh && (
                        <button
                            type="button"
                            onClick={onRefresh}
                            disabled={refreshing}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 border border-white/15 text-sm font-medium text-white hover:bg-white/15 disabled:opacity-50 transition-colors"
                        >
                            <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
                            Refresh
                        </button>
                    )}
                    {permalink && (
                        <a
                            href={permalink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-[var(--viralix-accent)] text-sm font-medium shadow-md hover:bg-white/95 transition-colors"
                        >
                            <ExternalLink className="h-4 w-4" />
                            View on {config.label}
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
}
