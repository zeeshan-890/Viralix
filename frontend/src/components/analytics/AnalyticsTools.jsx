'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import SentimentAnalysis from '../../../app/dashboard/analytics/components/SentimentAnalysis';
import HashtagResearch from '../../../app/dashboard/analytics/components/HashtagResearch';
import CompetitorAnalysis from '../../../app/dashboard/analytics/components/CompetitorAnalysis';
import KeywordAlerts from '../../../app/dashboard/analytics/components/KeywordAlerts';
import LinkShortener from '../../../app/dashboard/analytics/components/LinkShortener';
import { MessageCircle, Hash, Users, Bell, Link2 } from 'lucide-react';

const TABS = [
    { id: 'sentiment', label: 'Sentiment', icon: MessageCircle, Component: SentimentAnalysis },
    { id: 'hashtags', label: 'Hashtags', icon: Hash, Component: HashtagResearch },
    { id: 'competitors', label: 'Competitors', icon: Users, Component: CompetitorAnalysis },
    { id: 'alerts', label: 'Alerts', icon: Bell, Component: KeywordAlerts },
    { id: 'links', label: 'Links', icon: Link2, Component: LinkShortener },
];

export default function AnalyticsTools() {
    const [tab, setTab] = useState('sentiment');
    const active = TABS.find((t) => t.id === tab) || TABS[0];
    const ActiveComponent = active.Component;

    return (
        <div className="overflow-hidden rounded-xl border border-[#B8C9C0] bg-white shadow-sm">
            <div className="border-b border-[#E8EDEA] bg-gradient-to-r from-[#354F52]/5 to-transparent px-4 py-3 sm:px-5">
                <p className="text-sm font-semibold text-[#354F52]">Growth tools</p>
                <p className="text-xs text-[#52796F]">Research, monitoring, and link tracking</p>
            </div>
            <div className="border-b border-[#E8EDEA] bg-[#FAFCFB] px-3 py-2 sm:px-4">
                <div className="flex gap-1 overflow-x-auto">
                    {TABS.map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            type="button"
                            onClick={() => setTab(id)}
                            className={cn(
                                'inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all',
                                tab === id ? 'bg-white text-[#354F52] shadow-sm ring-1 ring-[#D5DFD9]' : 'text-[#52796F] hover:text-[#354F52]'
                            )}
                        >
                            <Icon className="h-3.5 w-3.5" />
                            {label}
                        </button>
                    ))}
                </div>
            </div>
            <div className="p-4 sm:p-5 [&_.bg-white.rounded-lg]:border-0 [&_.bg-white.rounded-lg]:p-0 [&_.bg-white.rounded-lg]:shadow-none">
                <ActiveComponent />
            </div>
        </div>
    );
}
