import { faArrowRight } from '@fortawesome/free-solid-svg-icons/faArrowRight';
import { faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons/faWandMagicSparkles';
import { Link } from '@inertiajs/react';
import { Flip } from 'gsap/Flip';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import WorkController from '@/actions/App/Http/Controllers/WorkController';
import { Magnetic } from '@/components/motion/magnetic';
import { SplitHeading } from '@/components/motion/split-heading';
import { HIRE_ME_HREF } from '@/components/site/nav-items';
import { SeoHead } from '@/components/site/seo-head';
import type { PageMeta } from '@/types/content';
import { Icon } from '@/components/ui/icon';
import {
    addFrameLoad,
    countUp,
    tiltFrames,
} from '@/components/work/animations';
import {
    BrowserFrame,
    StackList,
    toolIconMap,
} from '@/components/work/project-media';
import { gsap, MOTION_OK, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { cn } from '@/lib/utils';
import type { ProjectSummary, ToolRow } from '@/types/content';

if (typeof window !== 'undefined') {
    gsap.registerPlugin(Flip);
}

type WorkIndexProps = {
    meta: PageMeta;
    projects: ProjectSummary[];
    toolRows: ToolRow[];
};

const ALL = 'all';

const BUBBLE_QUERY =
    '(pointer: fine) and (min-width: 48rem) and (prefers-reduced-motion: no-preference)';

function shortCompany(company: string): string {
    return company.replace(/\s+(FZCO|Pvt\.? Ltd\.?|LLC)$/i, '');
}

function initialFilter(search: string, companies: string[]): string {
    const query = new URLSearchParams(search);
    const requested = query.get('company');

    return (
        companies.find((company) => shortCompany(company) === requested) ?? ALL
    );
}

export default function WorkIndex({
    meta,
    projects,
    toolRows,
}: WorkIndexProps) {
    const root = useRef<HTMLDivElement>(null);
    const flipState = useRef<Flip.FlipState | null>(null);
    const icons = toolIconMap(toolRows);
    const companies = [
        ...new Set(
            projects
                .map((project) => project.company)
                .filter((company): company is string => Boolean(company)),
        ),
    ];
    const [filter, setFilter] = useState(ALL);
    const visible = projects.filter(
        (project) => filter === ALL || project.company === filter,
    );
    const stats = [
        { value: projects.length, label: 'live products' },
        { value: companies.length, label: 'companies' },
        {
            value: new Set(projects.flatMap((project) => project.stack)).size,
            label: 'technologies used',
        },
    ];

    const choose = (next: string) => {
        if (next === filter) {
            return;
        }

        flipState.current = Flip.getState(
            root.current?.querySelectorAll('[data-card]') ?? [],
        );
        setFilter(next);

        // Keep the filter in the address bar, without a server round trip.
        const url = new URL(window.location.href);

        if (next === ALL) {
            url.searchParams.delete('company');
        } else {
            url.searchParams.set('company', shortCompany(next));
        }

        window.history.replaceState(window.history.state, '', url);
    };

    // A shared link like /work?company=Horizon%20Allienz opens pre-filtered.
    // Read after hydration so the server and client render the same markup.
    useEffect(() => {
        const requested = initialFilter(window.location.search, companies);

        if (requested !== ALL) {
            setFilter(requested);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Filtering: cards that stay glide to their new spots, others fade out.
    useLayoutEffect(() => {
        const state = flipState.current;
        flipState.current = null;

        if (
            !state ||
            window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ) {
            return;
        }

        Flip.from(state, {
            duration: 0.7,
            ease: 'power3.inOut',
            absolute: true,
            nested: true,
            onEnter: (elements) =>
                gsap.fromTo(
                    elements,
                    { autoAlpha: 0, scale: 0.9, y: 30 },
                    {
                        autoAlpha: 1,
                        scale: 1,
                        y: 0,
                        duration: 0.6,
                        delay: 0.2,
                        stagger: 0.06,
                    },
                ),
            onLeave: (elements) =>
                gsap.to(elements, {
                    autoAlpha: 0,
                    scale: 0.9,
                    duration: 0.4,
                }),
            onComplete: () => ScrollTrigger.refresh(),
        });
    }, [filter]);

    useGSAP(
        () => {
            const scope = root.current;

            if (!scope) {
                return;
            }

            const mm = gsap.matchMedia();

            mm.add(MOTION_OK, () => {
                // Hero: stat tiles rise and count up.
                const hero = gsap.timeline({ delay: 0.3 });
                hero.fromTo(
                    scope.querySelectorAll('[data-hero-item]'),
                    { autoAlpha: 0, y: 24 },
                    {
                        autoAlpha: 1,
                        y: 0,
                        duration: 0.8,
                        stagger: 0.08,
                        ease: 'power3.out',
                    },
                );
                scope
                    .querySelectorAll<HTMLElement>('[data-stat]')
                    .forEach((stat) =>
                        countUp(
                            hero,
                            stat,
                            0,
                            Number(stat.dataset.stat),
                            String,
                            0.3,
                        ),
                    );

                // Cards: the browser frame "loads", then the text rises.
                const cards = gsap.utils.toArray<HTMLElement>(
                    '[data-card]',
                    scope,
                );
                const entrances = new Map(
                    cards.map((card) => {
                        const timeline = gsap.timeline({ paused: true });
                        addFrameLoad(timeline, card);
                        timeline.fromTo(
                            card.querySelectorAll('[data-card-text]'),
                            { autoAlpha: 0, y: 20 },
                            {
                                autoAlpha: 1,
                                y: 0,
                                duration: 0.7,
                                stagger: 0.06,
                                ease: 'power3.out',
                            },
                            0.4,
                        );

                        return [card, timeline];
                    }),
                );

                const triggers = ScrollTrigger.batch(cards, {
                    start: 'top 85%',
                    once: true,
                    onEnter: (batch) =>
                        (batch as HTMLElement[]).forEach((card, index) =>
                            entrances
                                .get(card)
                                ?.delay(index * 0.12)
                                .play(),
                        ),
                });

                return () => triggers.forEach((trigger) => trigger.kill());
            });

            mm.add(
                '(pointer: fine) and (prefers-reduced-motion: no-preference)',
                () => tiltFrames(scope, 6),
            );

            // "View case study" bubble that follows the mouse over the cards.
            mm.add(BUBBLE_QUERY, () => {
                const grid = scope.querySelector<HTMLElement>('[data-grid]');
                const bubble =
                    scope.querySelector<HTMLElement>('[data-bubble]');

                if (!grid || !bubble) {
                    return;
                }

                gsap.set(bubble, {
                    xPercent: -50,
                    yPercent: -50,
                    scale: 0,
                    autoAlpha: 0,
                });

                const moveX = gsap.quickTo(bubble, 'x', {
                    duration: 0.45,
                    ease: 'power3.out',
                });
                const moveY = gsap.quickTo(bubble, 'y', {
                    duration: 0.45,
                    ease: 'power3.out',
                });

                const onMove = (event: PointerEvent) => {
                    const box = grid.getBoundingClientRect();
                    moveX(event.clientX - box.left);
                    moveY(event.clientY - box.top);

                    const overCard = (event.target as Element).closest(
                        '[data-card]',
                    );
                    gsap.to(bubble, {
                        scale: overCard ? 1 : 0,
                        autoAlpha: overCard ? 1 : 0,
                        duration: 0.3,
                        ease: overCard ? 'back.out(2)' : 'power2.in',
                        overwrite: 'auto',
                    });
                };

                const onLeave = () =>
                    gsap.to(bubble, {
                        scale: 0,
                        autoAlpha: 0,
                        duration: 0.25,
                        overwrite: 'auto',
                    });

                grid.addEventListener('pointermove', onMove);
                grid.addEventListener('pointerleave', onLeave);

                return () => {
                    grid.removeEventListener('pointermove', onMove);
                    grid.removeEventListener('pointerleave', onLeave);
                };
            });

            return () => mm.revert();
        },
        { scope: root },
    );

    return (
        <div ref={root}>
            <SeoHead meta={meta} />

            {/* Hero */}
            <section
                aria-labelledby="work-heading"
                className="mx-auto max-w-6xl px-4 pt-12 pb-10 text-center sm:px-6 sm:pt-20 sm:pb-14 md:text-left"
            >
                <SplitHeading
                    as="h1"
                    id="work-heading"
                    className="mx-auto max-w-3xl text-[clamp(2.5rem,5vw+1rem,4.5rem)] leading-[1.05] font-semibold tracking-tight md:mx-0"
                >
                    Full stack projects I've built
                </SplitHeading>
                <p
                    data-hero-item
                    className="mx-auto mt-6 max-w-2xl text-lg text-pretty text-muted-foreground md:mx-0"
                >
                    Live websites and web apps for car rental, education,
                    automotive and marketing businesses in Dubai and India. Each
                    case study covers the problem, what I built and what
                    changed.
                </p>

                <dl className="mx-auto mt-10 grid max-w-2xl grid-cols-3 gap-3 sm:gap-4 md:mx-0">
                    {stats.map((stat) => (
                        <div
                            key={stat.label}
                            data-hero-item
                            className="rounded-2xl border bg-card/60 p-4 sm:p-5"
                        >
                            <dt className="text-xs text-muted-foreground sm:text-sm">
                                {stat.label}
                            </dt>
                            <dd
                                data-stat={stat.value}
                                className="mt-1 text-shine text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl"
                            >
                                {stat.value}
                            </dd>
                        </div>
                    ))}
                </dl>
            </section>

            {/* Filter + grid */}
            <section
                aria-label="Projects"
                className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 sm:pb-28"
            >
                <div
                    data-hero-item
                    role="group"
                    aria-label="Filter projects by company"
                    className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:px-0"
                >
                    {[ALL, ...companies].map((company) => {
                        const isActive = filter === company;
                        const count =
                            company === ALL
                                ? projects.length
                                : projects.filter(
                                      (project) => project.company === company,
                                  ).length;

                        return (
                            <button
                                key={company}
                                type="button"
                                onClick={() => choose(company)}
                                aria-pressed={isActive}
                                className={cn(
                                    'inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors active:scale-[0.98]',
                                    isActive
                                        ? 'border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                                        : 'text-muted-foreground hover:border-brand hover:text-brand',
                                )}
                            >
                                {company === ALL
                                    ? 'All projects'
                                    : shortCompany(company)}
                                <span
                                    className={cn(
                                        'rounded-full px-1.5 text-xs tabular-nums',
                                        isActive
                                            ? 'bg-primary-foreground/20'
                                            : 'bg-muted',
                                    )}
                                >
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                <p className="sr-only" aria-live="polite">
                    Showing {visible.length} projects
                </p>

                <div
                    data-grid
                    className="relative mt-8 grid gap-6 md:grid-cols-2 lg:gap-8"
                >
                    {projects.map((project) => {
                        const visibleIndex = visible.indexOf(project);

                        return (
                            <ProjectCard
                                key={project.slug}
                                project={project}
                                icons={icons}
                                isHidden={visibleIndex === -1}
                                isWide={visibleIndex === 0}
                            />
                        );
                    })}

                    <span
                        data-bubble
                        aria-hidden
                        className="pointer-events-none absolute top-0 left-0 z-30 hidden size-24 place-items-center rounded-full bg-primary text-center text-xs leading-tight font-semibold text-primary-foreground opacity-0 shadow-2xl shadow-primary/40 hover-preview:grid"
                    >
                        View
                        <br />
                        case study
                    </span>
                </div>
            </section>

            {/* Closing CTA */}
            <section
                aria-labelledby="work-cta-heading"
                className="mx-auto max-w-6xl px-4 pb-24 sm:px-6"
            >
                <div className="relative overflow-hidden rounded-3xl border bg-card p-8 sm:p-12">
                    <div
                        aria-hidden
                        className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-brand/15 blur-3xl"
                    />
                    <h2
                        id="work-cta-heading"
                        className="relative max-w-xl text-2xl font-semibold tracking-tight text-balance sm:text-3xl"
                    >
                        Have a project in mind?
                    </h2>
                    <p className="relative mt-3 max-w-xl text-pretty text-muted-foreground">
                        Tell me what you're building, or ask the AI assistant
                        anything about my experience first.
                    </p>
                    <div className="relative mt-8 flex flex-wrap gap-3">
                        <Magnetic>
                            <Link
                                href={HIRE_ME_HREF}
                                className="inline-flex h-12 items-center gap-2.5 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-colors hover:bg-primary/85 active:scale-[0.98]"
                            >
                                Hire me
                                <Icon icon={faArrowRight} className="size-3" />
                            </Link>
                        </Magnetic>
                        <Magnetic>
                            <a
                                href="/#ask"
                                className="inline-flex h-12 items-center gap-2.5 rounded-full border px-6 text-sm font-medium transition-colors hover:border-brand hover:text-brand active:scale-[0.98]"
                            >
                                <Icon
                                    icon={faWandMagicSparkles}
                                    className="size-3.5 text-brand"
                                />
                                Ask the AI about my work
                            </a>
                        </Magnetic>
                    </div>
                </div>
            </section>
        </div>
    );
}

function ProjectCard({
    project,
    icons,
    isHidden,
    isWide,
}: {
    project: ProjectSummary;
    icons: Map<string, string>;
    isHidden: boolean;
    isWide: boolean;
}) {
    return (
        <article
            data-card
            data-flip-id={project.slug}
            aria-labelledby={`card-${project.slug}`}
            className={cn(isHidden && 'hidden', isWide && 'lg:col-span-2')}
        >
            <Link
                href={WorkController.show.url(project.slug)}
                prefetch
                className={cn(
                    'group block rounded-3xl p-2 outline-none focus-visible:ring-2 focus-visible:ring-brand',
                    isWide &&
                        'lg:grid lg:grid-cols-12 lg:items-center lg:gap-10',
                )}
            >
                <div
                    data-tilt
                    className={cn(
                        'will-change-transform',
                        isWide && 'lg:col-span-7',
                    )}
                >
                    <BrowserFrame
                        project={project}
                        sizes={
                            isWide
                                ? '(min-width: 1024px) 640px, (min-width: 768px) 45vw, 92vw'
                                : '(min-width: 768px) 45vw, 92vw'
                        }
                    />
                </div>

                <div
                    className={cn(
                        'mt-6 px-1',
                        isWide && 'lg:col-span-5 lg:mt-0',
                    )}
                >
                    <p
                        data-card-text
                        className="text-sm font-medium text-brand"
                    >
                        {project.category}, {project.year}
                    </p>
                    <h2
                        id={`card-${project.slug}`}
                        data-card-text
                        className={cn(
                            'mt-2 font-semibold tracking-tight text-balance transition-colors group-hover:text-brand',
                            isWide ? 'text-2xl sm:text-3xl' : 'text-2xl',
                        )}
                    >
                        {project.title}
                    </h2>
                    <p
                        data-card-text
                        className={cn(
                            'mt-2.5 text-pretty text-muted-foreground',
                            !isWide && 'line-clamp-2',
                        )}
                    >
                        {project.summary}
                    </p>

                    {project.metric && (
                        <p
                            data-card-text
                            className="mt-4 flex items-baseline gap-2.5"
                        >
                            <span className="text-shine text-2xl font-semibold tracking-tight tabular-nums">
                                {project.metric.value}
                            </span>
                            <span className="text-sm text-muted-foreground">
                                {project.metric.label}
                            </span>
                        </p>
                    )}

                    <div data-card-text>
                        <StackList
                            stack={project.stack.slice(0, isWide ? 5 : 4)}
                            icons={icons}
                            className="mt-5 gap-1.5"
                        />
                    </div>

                    <span
                        data-card-text
                        className="mt-6 inline-flex items-center gap-2 text-sm font-medium"
                    >
                        Read case study
                        <span className="grid size-7 place-items-center rounded-full border transition-all duration-500 group-hover:-rotate-45 group-hover:border-brand group-hover:bg-brand group-hover:text-primary-foreground">
                            <Icon icon={faArrowRight} className="size-2.5" />
                        </span>
                    </span>
                </div>
            </Link>
        </article>
    );
}
