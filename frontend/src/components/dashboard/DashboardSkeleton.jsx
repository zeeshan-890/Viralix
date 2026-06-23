export default function DashboardSkeleton() {
    return (
        <div className="animate-pulse space-y-5">
            <div className="h-28 rounded-2xl bg-white/80 border border-[var(--viralix-border)]" />
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-24 rounded-xl bg-white border border-[var(--viralix-border)]" />
                ))}
            </div>
            <div className="grid gap-4 lg:grid-cols-12">
                <div className="h-72 rounded-xl bg-white border border-[var(--viralix-border)] lg:col-span-8" />
                <div className="h-72 rounded-xl bg-white border border-[var(--viralix-border)] lg:col-span-4" />
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
                <div className="h-48 rounded-xl bg-white border border-[var(--viralix-border)]" />
                <div className="h-48 rounded-xl bg-white border border-[var(--viralix-border)]" />
            </div>
        </div>
    );
}
