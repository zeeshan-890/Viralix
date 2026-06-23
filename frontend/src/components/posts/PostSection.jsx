import { cn } from '@/lib/utils';

/** Panel section — dark header band, no nested card boxes */
export default function PostSection({ title, icon: Icon, children, className, bodyClassName, variant = 'default' }) {
    if (variant === 'flush') {
        return (
            <section className={cn('overflow-hidden rounded-2xl border border-[#B8C9C0] bg-white shadow-[0_4px_20px_rgba(47,62,70,0.06)]', className)}>
                <div className="flex items-center gap-2 bg-gradient-to-r from-[#354F52] to-[#2F3E46] px-4 py-3">
                    {Icon && <Icon className="h-4 w-4 shrink-0 text-[#84A98C]" aria-hidden />}
                    <h3 className="text-sm font-semibold text-white">{title}</h3>
                </div>
                <div className={cn(bodyClassName)}>{children}</div>
            </section>
        );
    }

    return (
        <section className={cn('overflow-hidden rounded-2xl border border-[#B8C9C0] bg-white shadow-[0_4px_20px_rgba(47,62,70,0.06)]', className)}>
            <div className="flex items-center gap-2 border-b border-[#E8EDEA] bg-[#F4F8F6] px-4 py-3">
                {Icon && <Icon className="h-4 w-4 shrink-0 text-[#52796F]" aria-hidden />}
                <h3 className="text-sm font-semibold text-[#354F52]">{title}</h3>
            </div>
            <div className={cn('p-4', bodyClassName)}>{children}</div>
        </section>
    );
}
