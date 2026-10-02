import { faArrowLeft } from '@fortawesome/free-solid-svg-icons/faArrowLeft';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons/faArrowRight';
import { faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons/faArrowUpRightFromSquare';
import { faCheck } from '@fortawesome/free-solid-svg-icons/faCheck';
import { faChevronRight } from '@fortawesome/free-solid-svg-icons/faChevronRight';
import { Link, usePage } from '@inertiajs/react';
import { useRef } from 'react';
import WorkController from '@/actions/App/Http/Controllers/WorkController';
import { Magnetic } from '@/components/motion/magnetic';
import { SplitHeading } from '@/components/motion/split-heading';
import { SeoHead } from '@/components/site/seo-head';
import type { PageMeta } from '@/types/content';
import { Icon } from '@/components/ui/icon';
import {
    addFrameLoad,
    countUpMetric,
    tiltFrames,
} from '@/components/work/animations';
import {
    BrowserFrame,
    Screenshot,
    StackList,
    toolIconMap,
} from '@/components/work/project-media';
import { useScrollSpy } from '@/hooks/use-scroll-spy';
import { gsap, MOTION_OK, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { cn } from '@/lib/utils';
import type { ProjectDetail, ProjectSummary, ToolRow } from '@/types/content';

type WorkShowProps = {
    meta: PageMeta;
    project: ProjectDetail;
    next: ProjectSummary;
    previous: ProjectSummary;
    toolRows: ToolRow[];
};

/** Case studies share one page component; keying by slug replays everything. */
export default function WorkShow(props: WorkShowProps) {
    return <CaseStudy key={props.project.slug} {...props} />;
}

function CaseStudy({ meta, project, next, previous, toolRows }: WorkShowProps) {
    const { site } = usePage().props;
    const root = useRef<HTMLDivElement>(null);
    const icons = toolIconMap(toolRows);
    const canCount = /^\d+\D*$/.test(project.metric?.value ?? '');
    const contents = [
        ...project.sections,
        ...(project.highlights.length > 0
            ? [{ id: 'highlights', title: 'Highlights' }]
            : []),
        { id: 'tech-stack', title: 'Tech stack' },
    ];
    const activeId = useScrollSpy(contents.map((item) => item.id));

    useGSAP(
        () => {
            const scope = root.current;

            if (!scope) {
                return;
            }

            const mm = gsap.matchMedia();

            mm.add(MOTION_OK, () => {
                const find = (selector: string) =>
                    scope.querySelector<HTMLElement>(selector);
                const findAll = (selector: string) =>
                    gsap.utils.toArray<HTMLElement>(selector, scope);

                // Hero details, then the browser frame "loads" the site.
                const intro = gsap.timeline({
                    defaults: { ease: 'power3.out' },
                    delay: 0.15,
                });
                intro.fromTo(
                    findAll('[data-hero-item]'),
                    { autoAlpha: 0, y: 20 },
                    { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.07 },
                );
                intro.fromTo(
                    findAll('[data-meta]'),
                    { autoAlpha: 0, x: -16 },
                    { autoAlpha: 1, x: 0, duration: 0.6, stagger: 0.07 },
                    0.35,
                );

                const showcase = find('[data-showcase]');

                if (showcase) {
                    addFrameLoad(intro, showcase, 0.5);
                }

                // The metric card lands on the frame's edge and counts up.
                const metric = find('[data-metric-card]');

                if (metric) {
                    const land = gsap.timeline({
                        scrollTrigger: {
                            trigger: metric,
                            start: 'top 90%',
                            once: true,
                        },
                    });
                    land.fromTo(
                        metric,
                        { autoAlpha: 0, y: 40, scale: 0.92 },
                        {
                            autoAlpha: 1,
                            y: 0,
                            scale: 1,
                            duration: 0.8,
                            ease: 'back.out(1.6)',
                        },
                    );
                    countUpMetric(land, find('[data-metric-number]'), 0.2);
                }

                // Zoom into the site as it scrolls up the screen.
                gsap.fromTo(
                    find('[data-zoom]'),
                    { scale: 0.92 },
                    {
                        scale: 1,
                        ease: 'none',
                        scrollTrigger: {
                            trigger: find('[data-zoom]'),
                            start: 'top 85%',
                            end: 'top 15%',
                            scrub: 0.5,
                        },
                    },
                );

                // Reading progress along the table of contents.
                gsap.fromTo(
                    find('[data-progress]'),
                    { scaleY: 0 },
                    {
                        scaleY: 1,
                        ease: 'none',
                        scrollTrigger: {
                            trigger: find('[data-body]'),
                            start: 'top 40%',
                            end: 'bottom 60%',
                            scrub: 0.3,
                        },
                    },
                );

                // Body paragraphs and headings rise as they enter.
                const blocks = findAll(
                    '[data-body] .case-study > *, [data-rise]',
                );
                gsap.set(blocks, { autoAlpha: 0, y: 28 });
                const batches = ScrollTrigger.batch(blocks, {
                    start: 'top 88%',
                    once: true,
                    onEnter: (batch) =>
                        gsap.to(batch, {
                            autoAlpha: 1,
                            y: 0,
                            duration: 0.8,
                            stagger: 0.08,
                            ease: 'power3.out',
                        }),
                });

                // Checks and tech pills pop in once they're on screen.
                (
                    [
                        ['[data-highlights]', '[data-check]'],
                        ['[data-stack]', '[data-pill]'],
                    ] as const
                ).forEach(([container, items]) => {
                    const element = find(container);

                    if (!element) {
                        return;
                    }

                    gsap.fromTo(
                        element.querySelectorAll(items),
                        { scale: 0, rotation: -30 },
                        {
                            scale: 1,
                            rotation: 0,
                            duration: 0.5,
                            stagger: 0.07,
                            ease: 'back.out(2.5)',
                            scrollTrigger: {
                                trigger: element,
                                start: 'top 85%',
                                once: true,
                            },
                        },
                    );
                });

                return () => batches.forEach((trigger) => trigger.kill());
            });

            mm.add(
                '(pointer: fine) and (prefers-reduced-motion: no-preference)',
                () => tiltFrames(scope, 4),
            );

            return () => mm.revert();
        },
        { scope: root },
    );

    return (
        <div ref={root}>
            <SeoHead
                meta={meta}
                schema={{
                    '@context': 'https://schema.org',
                    '@graph': [
                        {
                            '@type': 'CreativeWork',
                            name: project.title,
                            description: project.summary,
                            dateCreated: String(project.year),
                            keywords: project.stack.join(', '),
                            genre: project.category,
                            author: {
                                '@type': 'Person',
                                name: site.name,
                                url: site.url,
                            },
                            ...(project.links.live
                                ? { url: project.links.live }
                                : {}),
                        },
                        {
                            '@type': 'BreadcrumbList',
                            itemListElement: [
                                {
                                    '@type': 'ListItem',
                                    position: 1,
                                    name: 'Work',
                                    item: `${site.url}/work`,
                                },
                                {
                                    '@type': 'ListItem',
                                    position: 2,
                                    name: project.title,
                                    item: `${site.url}/work/${project.slug}`,
                                },
                            ],
                        },
                    ],
                }}
            />

            {/* Hero */}
            <header className="mx-auto max-w-6xl px-4 pt-10 text-center sm:px-6 sm:pt-16 md:text-left">
                <nav aria-label="Breadcrumb" data-hero-item>
                    <ol className="flex items-center justify-center gap-2 text-sm text-muted-foreground md:justify-start">
                        <li>
                            <Link
                                href={WorkController.index.url()}
                                className="transition-colors hover:text-brand"
                            >
                                Work
                            </Link>
                        </li>
                        <li aria-hidden>
                            <Icon icon={faChevronRight} className="size-2.5" />
                        </li>
                        <li
                            aria-current="page"
                            className="truncate text-foreground"
                        >
                            {project.title}
                        </li>
                    </ol>
                </nav>

                <p
                    data-hero-item
                    className="mt-8 inline-flex rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-medium text-brand sm:text-sm"
                >
                    {project.category}, {project.year}
                </p>

                <SplitHeading
                    as="h1"
                    className="mx-auto mt-5 max-w-4xl text-[clamp(2.5rem,5vw+1rem,4.75rem)] leading-[1.04] font-semibold tracking-tight text-balance md:mx-0"
                >
                    {project.title}
                </SplitHeading>

                <div className="mt-6 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
                    <p
                        data-hero-item
                        className="mx-auto max-w-2xl text-lg text-pretty text-muted-foreground sm:text-xl md:mx-0"
                    >
                        {project.summary}
                    </p>

                    {(project.links.live || project.links.admin) && (
                        <div
                            data-hero-item
                            className="flex flex-wrap justify-center gap-3 md:justify-start lg:shrink-0"
                        >
                            {project.links.live && (
                                <Magnetic>
                                    <a
                                        href={project.links.live}
                                        target="_blank"
                                        rel="noopener"
                                        className="inline-flex h-12 items-center gap-2.5 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-colors hover:bg-primary/85 active:scale-[0.98]"
                                    >
                                        Visit live site
                                        <span className="sr-only">
                                            {' '}
                                            (opens in a new tab)
                                        </span>
                                        <Icon
                                            icon={faArrowUpRightFromSquare}
                                            className="size-3"
                                        />
                                    </a>
                                </Magnetic>
                            )}
                            {project.links.admin && (
                                <Magnetic>
                                    <a
                                        href={project.links.admin}
                                        target="_blank"
                                        rel="noopener"
                                        className="inline-flex h-12 items-center gap-2.5 rounded-full border px-6 text-sm font-medium transition-colors hover:border-brand hover:text-brand active:scale-[0.98]"
                                    >
                                        Admin panel
                                        <span className="sr-only">
                                            {' '}
                                            (opens in a new tab)
                                        </span>
                                        <Icon
                                            icon={faArrowUpRightFromSquare}
                                            className="size-3"
                                        />
                                    </a>
                                </Magnetic>
                            )}
                        </div>
                    )}
                </div>

                <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-5 border-y py-6 lg:grid-cols-4">
                    {project.company && (
                        <MetaItem label="Company" value={project.company} />
                    )}
                    <MetaItem label="Role" value={project.role} />
                    <MetaItem label="Year" value={String(project.year)} />
                    <MetaItem
                        label="Stack"
                        value={project.stack.slice(0, 3).join(', ')}
                    />
                </dl>
            </header>

            {/* Showcase */}
            <div className="mx-auto max-w-6xl px-4 pt-12 sm:px-6 sm:pt-16">
                <div data-zoom className="relative origin-top">
                    <div
                        data-showcase
                        data-tilt
                        className="will-change-transform"
                    >
                        <BrowserFrame
                            project={project}
                            sizes="(min-width: 1152px) 1104px, 94vw"
                            eager
                            className="rounded-3xl"
                        />
                    </div>

                    {project.metric && (
                        <div
                            data-metric-card
                            className="relative z-10 mx-auto -mt-6 w-fit max-w-[90%] rounded-2xl border bg-card/95 px-6 py-4 shadow-2xl shadow-black/30 backdrop-blur-md sm:absolute sm:right-8 sm:-bottom-10 sm:mt-0"
                        >
                            <p className="flex items-baseline gap-3">
                                <span
                                    data-metric-number
                                    data-value={
                                        canCount ? project.metric.value : ''
                                    }
                                    className="text-shine text-4xl font-semibold tracking-tight tabular-nums"
                                >
                                    {project.metric.value}
                                </span>
                                <span className="text-sm font-medium">
                                    {project.metric.label}
                                </span>
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Case study */}
            <div
                data-body
                className="mx-auto mt-20 grid max-w-6xl gap-10 px-4 sm:mt-28 sm:px-6 lg:grid-cols-12"
            >
                <aside className="hidden lg:col-span-3 lg:block">
                    <nav
                        aria-label="On this page"
                        className="sticky top-28 flex gap-5"
                    >
                        <span
                            aria-hidden
                            className="relative w-px shrink-0 bg-border"
                        >
                            <span
                                data-progress
                                className="absolute inset-0 origin-top bg-brand"
                            />
                        </span>
                        <ol className="flex flex-col gap-3 py-1 text-sm">
                            {contents.map((item, index) => (
                                <li key={item.id}>
                                    <a
                                        href={`#${item.id}`}
                                        aria-current={
                                            activeId === item.id
                                                ? 'location'
                                                : undefined
                                        }
                                        className={cn(
                                            'flex gap-3 transition-colors',
                                            activeId === item.id
                                                ? 'font-medium text-brand'
                                                : 'text-muted-foreground hover:text-foreground',
                                        )}
                                    >
                                        <span className="tabular-nums opacity-60">
                                            {String(index + 1).padStart(2, '0')}
                                        </span>
                                        {item.title}
                                    </a>
                                </li>
                            ))}
                        </ol>
                    </nav>
                </aside>

                <div className="min-w-0 lg:col-span-8 lg:col-start-5">
                    <div
                        className="case-study"
                        dangerouslySetInnerHTML={{ __html: project.bodyHtml }}
                    />

                    {project.highlights.length > 0 && (
                        <section
                            id="highlights"
                            aria-labelledby="highlights-heading"
                            className="mt-16 scroll-mt-28"
                        >
                            <h2
                                id="highlights-heading"
                                data-rise
                                className="text-2xl font-semibold tracking-tight sm:text-3xl"
                            >
                                Highlights
                            </h2>
                            <ul
                                data-highlights
                                data-rise
                                className="mt-6 grid gap-3 sm:grid-cols-2"
                            >
                                {project.highlights.map((highlight) => (
                                    <li
                                        key={highlight}
                                        className="flex gap-3 rounded-2xl border bg-card/60 p-4 text-sm leading-relaxed"
                                    >
                                        <span
                                            data-check
                                            className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-brand/15 text-brand"
                                        >
                                            <Icon
                                                icon={faCheck}
                                                className="size-3"
                                            />
                                        </span>
                                        {highlight}
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    <section
                        id="tech-stack"
                        aria-labelledby="tech-stack-heading"
                        className="mt-16 scroll-mt-28"
                    >
                        <h2
                            id="tech-stack-heading"
                            data-rise
                            className="text-2xl font-semibold tracking-tight sm:text-3xl"
                        >
                            Tech stack
                        </h2>
                        <div data-stack data-rise>
                            <StackList
                                stack={project.stack}
                                icons={icons}
                                className="mt-6 gap-2"
                            />
                        </div>
                    </section>
                </div>
            </div>

            {/* Next project */}
            <section
                aria-labelledby="next-heading"
                className="mx-auto max-w-6xl px-4 pt-24 pb-28 sm:px-6 sm:pt-32"
            >
                <div className="flex items-end justify-between gap-4">
                    <h2
                        id="next-heading"
                        data-rise
                        className="text-2xl font-semibold tracking-tight sm:text-3xl"
                    >
                        Next project
                    </h2>
                    <Link
                        href={WorkController.show.url(previous.slug)}
                        prefetch
                        className="group inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-brand"
                    >
                        <Icon
                            icon={faArrowLeft}
                            className="size-3 transition-transform group-hover:-translate-x-0.5"
                        />
                        <span>
                            Previous
                            <span className="hidden sm:inline">
                                : {previous.title}
                            </span>
                        </span>
                    </Link>
                </div>

                <Link
                    href={WorkController.show.url(next.slug)}
                    prefetch
                    data-rise
                    className="group mt-8 grid overflow-hidden rounded-3xl border bg-card outline-none focus-visible:ring-2 focus-visible:ring-brand md:grid-cols-2"
                >
                    <div className="relative overflow-hidden md:order-2">
                        <Screenshot
                            project={next}
                            sizes="(min-width: 768px) 50vw, 94vw"
                            className="block h-full w-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105"
                        />
                        <span
                            aria-hidden
                            className="absolute inset-0 origin-bottom scale-y-0 bg-brand/20 transition-transform duration-500 ease-out group-hover:scale-y-100"
                        />
                    </div>
                    <div className="flex flex-col justify-between gap-8 p-6 sm:p-10">
                        <div>
                            <p className="text-sm font-medium text-brand">
                                {next.category}, {next.year}
                            </p>
                            <p className="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                                {next.title}
                            </p>
                            <p className="mt-3 line-clamp-3 text-pretty text-muted-foreground">
                                {next.summary}
                            </p>
                        </div>
                        <span className="inline-flex items-center gap-3 text-sm font-medium">
                            Read the case study
                            <span className="grid size-10 place-items-center rounded-full border transition-all duration-500 group-hover:translate-x-1 group-hover:border-brand group-hover:bg-brand group-hover:text-primary-foreground">
                                <Icon
                                    icon={faArrowRight}
                                    className="size-3.5"
                                />
                            </span>
                        </span>
                    </div>
                </Link>
            </section>
        </div>
    );
}

function MetaItem({ label, value }: { label: string; value: string }) {
    return (
        <div data-meta className="min-w-0">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="mt-1 text-sm font-medium text-pretty">{value}</dd>
        </div>
    );
}
