'use client';

import { AlertCircle, CheckCircle2, Loader2, Shield } from 'lucide-react';
import { useTikTokCreatorInfo } from '@/hooks/useTikTokCreatorInfo';
import TikTokAccountTypeBadge from './TikTokAccountTypeBadge';
import { cn } from '@/lib/utils';

const PRIVACY_LABELS = {
    PUBLIC_TO_EVERYONE: 'Public',
    MUTUAL_FOLLOW_FRIENDS: 'Friends',
    FOLLOWER_OF_CREATOR: 'Followers',
    SELF_ONLY: 'Only Me',
};

function StatusBadge({ tone = 'neutral', children }) {
    const tones = {
        success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        warning: 'bg-amber-50 text-amber-800 border-amber-200',
        danger: 'bg-red-50 text-red-800 border-red-200',
        neutral: 'bg-gray-50 text-gray-700 border-gray-200',
    };
    return (
        <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border', tones[tone])}>
            {children}
        </span>
    );
}

function formatPrivacyOptions(options = []) {
    return options.map((o) => (typeof o === 'string' ? PRIVACY_LABELS[o] || o : o.label || PRIVACY_LABELS[o.value] || o.value)).join(', ');
}

export default function TikTokPublishingStatus({
    accountId,
    accountName,
    tokenExpired = false,
    variant = 'full',
    className,
}) {
    const { info, loading, error } = useTikTokCreatorInfo(accountId);

    if (!accountId) return null;

    if (loading) {
        return (
            <div className={cn('flex items-center gap-2 text-sm text-gray-500', className)}>
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading account status…
            </div>
        );
    }

    if (error) {
        return (
            <div className={cn('rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 flex items-start gap-2', className)}>
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
            </div>
        );
    }

    if (!info) return null;

    const isPublic = !info.isPrivateAccount;
    const appLive = !info.isUnaudited;

    if (variant === 'inline') {
        return (
            <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
                <TikTokAccountTypeBadge accountId={accountId} size="sm" />
                <StatusBadge tone={tokenExpired ? 'danger' : 'success'}>
                    {tokenExpired ? 'Token expired' : 'Connected'}
                </StatusBadge>
            </div>
        );
    }

    if (variant === 'compact') {
        return (
            <div className={cn('space-y-2', className)}>
                <div className="flex flex-wrap items-center gap-2">
                    <TikTokAccountTypeBadge accountId={accountId} size="md" />
                    <StatusBadge tone={tokenExpired ? 'danger' : 'success'}>
                        {tokenExpired ? 'Token expired' : 'Connected'}
                    </StatusBadge>
                    <StatusBadge tone={appLive ? 'success' : 'warning'}>
                        {appLive ? 'App live' : 'App sandbox'}
                    </StatusBadge>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                    {isPublic
                        ? 'Public account — you can post with Public, Friends, or Only Me when the app is audited.'
                        : 'Private account — posts can only use Only Me visibility.'}
                    {info.requiresSelfOnly && !isPublic && ''}
                    {info.requiresSelfOnly && isPublic && ' Sandbox mode still limits posts to Only Me for now.'}
                </p>
            </div>
        );
    }

    return (
        <div className={cn('rounded-xl border border-[var(--viralix-border)] overflow-hidden shadow-sm', className)}>
            {/* Account type — primary headline */}
            <div
                className={cn(
                    'px-5 py-4 border-b',
                    isPublic ? 'bg-blue-50 border-blue-100' : 'bg-slate-50 border-slate-200'
                )}
            >
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-2">TikTok account type</p>
                <div className="flex flex-wrap items-center gap-3">
                    <TikTokAccountTypeBadge accountId={accountId} size="lg" />
                    {(accountName || info.creatorNickname) && (
                        <span className="text-sm text-gray-600">@{info.accountName || accountName}</span>
                    )}
                </div>
                <p className="text-sm text-gray-700 mt-2">
                    {isPublic
                        ? 'This is a public TikTok account. Your profile can be discovered by anyone on TikTok.'
                        : 'This is a private TikTok account. Only approved followers can see your profile and posts.'}
                </p>
            </div>

            <div className="p-5 bg-[var(--viralix-surface)] space-y-4">
                <div className="flex flex-wrap gap-2">
                    <StatusBadge tone={tokenExpired ? 'danger' : 'success'}>
                        {tokenExpired ? 'Token expired' : 'Connected'}
                    </StatusBadge>
                    <StatusBadge tone={appLive ? 'success' : 'warning'}>
                        {appLive ? 'Viralix app: Live' : 'Viralix app: Sandbox'}
                    </StatusBadge>
                </div>

                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="rounded-lg bg-gray-50 border border-gray-100 p-3">
                        <dt className="text-xs font-medium text-gray-500 mb-1">What you can post as</dt>
                        <dd className="font-medium text-gray-900 flex items-center gap-1.5">
                            <Shield className="w-3.5 h-3.5 text-gray-400" />
                            {formatPrivacyOptions(info.privacyLevelOptions) || 'Only Me'}
                        </dd>
                    </div>
                    <div className="rounded-lg bg-gray-50 border border-gray-100 p-3">
                        <dt className="text-xs font-medium text-gray-500 mb-1">Viralix app status</dt>
                        <dd className="flex items-center gap-2">
                            {appLive ? (
                                <>
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                    <span className="font-medium text-gray-900">Audited — full publishing</span>
                                </>
                            ) : (
                                <>
                                    <AlertCircle className="w-4 h-4 text-amber-600" />
                                    <span className="font-medium text-gray-900">Sandbox — Only Me posts</span>
                                </>
                            )}
                        </dd>
                    </div>
                </dl>

                {info.requiresSelfOnly && (
                    <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                        {isPublic && info.isUnaudited
                            ? 'Your account is public, but Viralix is still in TikTok sandbox — posts go live as Only Me until app audit passes.'
                            : isPublic
                                ? 'Posts are limited to Only Me for this account right now.'
                                : 'Private account — Viralix can only publish with Only Me visibility.'}
                    </p>
                )}

                {(info.postsRemainingToday != null || info.maxVideoPostDurationSec) && (
                    <div className="text-xs text-gray-600 pt-1 border-t border-gray-100">
                        {info.maxVideoPostDurationSec != null && (
                            <span className="mr-4">Max video: <strong>{Math.round(info.maxVideoPostDurationSec / 60)} min</strong></span>
                        )}
                        {info.postsRemainingToday != null && (
                            <span>Posts left today: <strong>{info.postsRemainingToday}</strong></span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
