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
        <div className="mb-6">
            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 mb-4">
                <Link href={`/dashboard/analytics?platform=${platform}`} className="hover:text-[#354F52]">
                    Analytics
                </Link>
                <span>/</span>
                <Link href={`/dashboard/platforms/${platform}`} className="hover:text-[#354F52]">
                    {config.label}
                </Link>
                <span>/</span>
                <span className="text-gray-800">Post</span>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                    <Link
                        href={`/dashboard/platforms/${platform}`}
                        className="mt-1 p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                    <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl border border-gray-100', config.lightBg)}>
                        <PlatformIcon platform={platform} size={28} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-[#84A98C]" />
                            <h1 className="text-2xl font-bold text-[#354F52]">{title}</h1>
                        </div>
                        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
                        {live && (
                            <p className="text-xs text-emerald-600 flex items-center gap-1.5 mt-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
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
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
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
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium hover:bg-gray-50"
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
