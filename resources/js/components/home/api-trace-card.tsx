import { faBolt } from '@fortawesome/free-solid-svg-icons/faBolt';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';
import type { Impact } from '@/types/content';

type ApiTraceCardProps = {
    impact: Impact;
    className?: string;
};

/**
 * Before/after response-time card for the API speed-up in content/profile.php.
 * The server renders the final state; the hero timeline animates into it.
 */
export function ApiTraceCard({ impact, className }: ApiTraceCardProps) {
    const remaining = 100 - impact.value;

    return (
        <div
            data-hero="card"
            data-animate
            role="img"
            aria-label={`API response time ${impact.value}${impact.suffix} faster${impact.detail ? ` through ${impact.detail.toLowerCase()}` : ''}`}
            className={cn(
                'rounded-2xl border bg-card/85 p-4 shadow-2xl shadow-black/25 backdrop-blur-md sm:p-5',
                className,
            )}
        >
            <div aria-hidden className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand/15 text-brand">
                        <Icon icon={faBolt} className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold whitespace-nowrap">
                                API response time
                            </p>
                            <span className="shrink-0 rounded-full bg-brand/15 px-2.5 py-0.5 text-xs font-semibold text-brand tabular-nums">
                                <span data-hero="pill">{impact.value}</span>
                                {impact.suffix} faster
                            </span>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            After optimising the backend
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-[3rem_1fr_2.5rem] items-center gap-x-3 gap-y-2.5 text-xs">
                    <span className="text-muted-foreground">Before</span>
                    <span className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <span className="block h-full w-full rounded-full bg-muted-foreground/40" />
                    </span>
                    <span className="text-right text-muted-foreground tabular-nums">
                        100%
                    </span>

                    <span className="text-muted-foreground">After</span>
                    <span className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <span
                            data-hero="after-bar"
                            className="block h-full w-full origin-left bg-shine rounded-full"
                            style={{ transform: `scaleX(${remaining / 100})` }}
                        />
                    </span>
                    <span
                        data-hero="after-value"
                        className="text-right font-semibold text-brand tabular-nums"
                    >
                        {remaining}%
                    </span>
                </div>

                {impact.tags && impact.tags.length > 0 && (
                    <ul className="flex flex-wrap gap-1.5">
                        {impact.tags.map((tag) => (
                            <li
                                key={tag}
                                data-hero="tag"
                                className="rounded-full border px-2.5 py-1 text-[0.6875rem] text-muted-foreground"
                            >
                                {tag}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
