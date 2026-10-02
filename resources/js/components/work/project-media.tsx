import type { ReactNode } from 'react';
import { ToolIcon } from '@/components/home/tool-icon';
import { cn } from '@/lib/utils';
import type { ProjectSummary, ToolRow } from '@/types/content';

/**
 * Screenshot heights at 1400px wide, so the browser reserves the right space
 * before an image loads. Anything not listed is 1400×846.
 */
export const SHOT_HEIGHTS: Record<string, number> = {
    'msit-cms': 697,
    'digital-advengers': 843,
    'focus-auto': 843,
    zeromax: 839,
};

export function domain(url: string | undefined): string | null {
    if (!url) {
        return null;
    }

    try {
        return new URL(url).hostname.replace(/^www\./, '');
    } catch {
        return null;
    }
}

export function padded(value: number): string {
    return String(value).padStart(2, '0');
}

/** Tool name (lowercased) → logo file name, for stack pills. */
export function toolIconMap(toolRows: ToolRow[]): Map<string, string> {
    return new Map(
        toolRows.flatMap((row) =>
            row.tools.map((tool) => [tool.name.toLowerCase(), tool.icon]),
        ),
    );
}

export function Screenshot({
    project,
    sizes,
    className,
    eager = false,
}: {
    project: Pick<ProjectSummary, 'slug' | 'title' | 'cover'>;
    sizes: string;
    className?: string;
    /** Above-the-fold images load immediately. */
    eager?: boolean;
}) {
    if (!project.cover) {
        return (
            <div
                className={cn(
                    'grid aspect-[1400/846] place-items-center bg-arch text-4xl font-semibold text-brand',
                    className,
                )}
            >
                {project.title[0]}
            </div>
        );
    }

    return (
        <img
            src={`${project.cover}-800.webp`}
            srcSet={`${project.cover}-800.webp 800w, ${project.cover}-1400.webp 1400w`}
            sizes={sizes}
            width={1400}
            height={SHOT_HEIGHTS[project.slug] ?? 846}
            alt={`${project.title} website`}
            loading={eager ? 'eager' : 'lazy'}
            fetchPriority={eager ? 'high' : undefined}
            decoding="async"
            className={className}
        />
    );
}

export function StackList({
    stack,
    icons,
    className,
}: {
    stack: string[];
    icons: Map<string, string>;
    className?: string;
}) {
    return (
        <ul aria-label="Built with" className={cn('flex flex-wrap', className)}>
            {stack.map((name) => {
                const icon = icons.get(name.toLowerCase());

                return (
                    <li
                        key={name}
                        data-pill
                        className="inline-flex items-center gap-1.5 rounded-full border bg-background/40 px-3 py-1 text-xs text-foreground/80"
                    >
                        {icon && (
                            <ToolIcon
                                icon={icon}
                                name={name}
                                className="size-3.5 text-muted-foreground"
                            />
                        )}
                        {name}
                    </li>
                );
            })}
        </ul>
    );
}

/**
 * A browser window around a project screenshot: traffic-light dots, the
 * site's domain in an address bar, a loading bar and a mouse-following
 * glare. The data-* hooks are what `addFrameLoad` animates.
 */
export function BrowserFrame({
    project,
    sizes,
    eager = false,
    className,
    children,
}: {
    project: Pick<ProjectSummary, 'slug' | 'title' | 'cover' | 'links'>;
    sizes: string;
    eager?: boolean;
    className?: string;
    /** Extra overlays inside the frame. */
    children?: ReactNode;
}) {
    const liveDomain = domain(project.links.live);

    return (
        <div
            data-frame
            className={cn(
                'group/frame relative overflow-hidden rounded-2xl border bg-card shadow-2xl shadow-black/30',
                className,
            )}
        >
            <div className="flex items-center gap-3 border-b px-4 py-2.5">
                <span aria-hidden className="flex gap-1.5">
                    <span
                        data-dot
                        className="size-2.5 rounded-full bg-[#ff5f57]/80"
                    />
                    <span
                        data-dot
                        className="size-2.5 rounded-full bg-[#febc2e]/80"
                    />
                    <span
                        data-dot
                        className="size-2.5 rounded-full bg-[#28c840]/80"
                    />
                </span>
                {liveDomain && (
                    <span className="mx-auto w-[min(65%,18rem)] truncate rounded-md bg-muted px-3 py-0.5 text-center text-xs text-muted-foreground">
                        <span data-url data-text={liveDomain}>
                            {liveDomain}
                        </span>
                    </span>
                )}
                <span aria-hidden className="w-10" />
            </div>

            <div className="relative overflow-hidden">
                <span
                    aria-hidden
                    data-loadbar
                    className="absolute inset-x-0 top-0 z-10 h-0.5 origin-left bg-brand opacity-0"
                />
                <div data-shot>
                    <Screenshot
                        project={project}
                        sizes={sizes}
                        eager={eager}
                        className="block h-auto w-full transition-[scale] duration-700 ease-out group-hover/frame:scale-[1.03]"
                    />
                </div>
            </div>

            {/* Soft light that follows the mouse across the frame. */}
            <span
                aria-hidden
                className="pointer-events-none absolute inset-0 z-20 opacity-0 transition-opacity duration-300 pointer-fine:group-hover/frame:opacity-100"
                style={{
                    background:
                        'radial-gradient(28rem circle at var(--glare-x, 50%) var(--glare-y, 50%), rgb(255 255 255 / 0.1), transparent 60%)',
                }}
            />
            {children}
        </div>
    );
}
