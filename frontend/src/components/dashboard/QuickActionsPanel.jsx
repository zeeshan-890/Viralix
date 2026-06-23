import Link from 'next/link';
import {
    Upload, Calendar, FileText, BarChart3, MessageSquare, Bot, LayoutTemplate, Link2,
} from 'lucide-react';

const ACTIONS = [
    { href: '/dashboard/upload', label: 'Upload', desc: 'Media & compose', icon: Upload },
    { href: '/dashboard/schedule', label: 'Calendar', desc: 'Plan & schedule', icon: Calendar },
    { href: '/dashboard/preview', label: 'Posts', desc: 'All content', icon: FileText },
    { href: '/dashboard/analytics', label: 'Analytics', desc: 'Performance', icon: BarChart3 },
    { href: '/dashboard/inbox', label: 'Inbox', desc: 'Conversations', icon: MessageSquare },
    { href: '/dashboard/inbox/auto-reply', label: 'Auto-Reply', desc: 'AI & rules', icon: Bot },
    { href: '/dashboard/bio', label: 'Bio link', desc: 'Link in bio', icon: LayoutTemplate },
    { href: '/dashboard/connect-accounts', label: 'Connect', desc: 'Platforms', icon: Link2 },
];

export default function QuickActionsPanel() {
    return (
        <section className="rounded-xl border border-[var(--viralix-border)] bg-white p-4">
            <h2 className="text-sm font-semibold text-[var(--viralix-accent)]">Quick actions</h2>
            <div className="mt-3 grid grid-cols-2 gap-2">
                {ACTIONS.map(({ href, label, desc, icon: Icon }) => (
                    <Link
                        key={href + label}
                        href={href}
                        className="group flex flex-col rounded-lg border border-[var(--viralix-border)] p-3 transition-all hover:border-[var(--viralix-primary)] hover:shadow-sm"
                    >
                        <div
                            className="flex h-8 w-8 items-center justify-center rounded-lg transition-transform group-hover:scale-105"
                            style={{ backgroundColor: '#E8F0ED' }}
                        >
                            <Icon className="h-4 w-4 text-[var(--viralix-primary-dark)]" aria-hidden />
                        </div>
                        <span className="mt-2 text-xs font-medium text-[var(--viralix-accent)]">{label}</span>
                        <span className="text-[0.625rem] text-gray-400">{desc}</span>
                    </Link>
                ))}
            </div>
        </section>
    );
}
