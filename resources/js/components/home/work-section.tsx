import { faArrowRight } from '@fortawesome/free-solid-svg-icons/faArrowRight';
import { faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons/faArrowUpRightFromSquare';
import { faCheck } from '@fortawesome/free-solid-svg-icons/faCheck';
import { Link } from '@inertiajs/react';
import { useRef } from 'react';
import WorkController from '@/actions/App/Http/Controllers/WorkController';
import { Magnetic } from '@/components/motion/magnetic';
import { SplitHeading } from '@/components/motion/split-heading';
import { Icon } from '@/components/ui/icon';
import {
    addFrameLoad,
    countUp,
    countUpMetric,
    tiltFrames,
} from '@/components/work/animations';
import {
    BrowserFrame,
    padded,
    Screenshot,
    StackList,
    toolIconMap,
} from '@/components/work/project-media';
import { gsap, MOTION_OK, SCRUB_EXTRAS_OK, useGSAP } from '@/lib/gsap';
import { cn } from '@/lib/utils';
import type { ProjectSummary, ToolRow } from '@/types/content';

type WorkSectionProps = {
    projects: ProjectSummary[];
    toolRows: ToolRow[];
};

/** Same query as the `hover-preview` CSS variant in app.css. */
const PREVIEW_QUERY =
    '(pointer: fine) and (min-width: 48rem) and (prefers-reduced-motion: no-preference)';

const TILT_QUERY =
    '(pointer: fine) and (prefers-reduced-motion: no-preference)';

/**
 * Selected work: featured projects as large alternating showcase rows, the
 * rest as a compact list whose screenshot follows the cursor. Everything is
 * server-rendered in its final state; the scripts animate into it.
 */
export function WorkSection({ projects, toolRows }: WorkSectionProps) {
    const section = useRef<HTMLElement>(null);
    const featured = projects.filter((project) => project.featured);
    const more = projects.filter((project) => !project.featured);
    const icons = toolIconMap(toolRows);

    useGSAP(
        () => {
            const root = section.current;

            if (!root) {
                return;
            }

            const mm = gsap.matchMedia();

            mm.add(MOTION_OK, () => {
                gsap.utils
                    .toArray<HTMLElement>('[data-work-row]', root)
                    .forEach((row, rowIndex) => animateRow(row, rowIndex));

                animateMoreList(root);
            });

            // The browser frame leans toward the mouse and catches a glare.
            mm.add(TILT_QUERY, () => tiltFrames(root));

            mm.add(PREVIEW_QUERY, () => followCursorPreview(root));

            return () => mm.revert();
        },
        { scope: section },
    );

    return (
        <section
            ref={section}
            id="work"
            aria-labelledby="work-heading"
            className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28"
        >
            <div className="flex flex-col items-center gap-6 text-center md:flex-row md:items-end md:justify-between md:text-left">
                <div className="max-w-2xl">
                    <SplitHeading
                        as="h2"
                        id="work-heading"
                        className="text-3xl font-semibold tracking-tight sm:text-4xl"
                    >
                        Projects I've built
                    </SplitHeading>
                    <p className="mt-4 text-pretty text-muted-foreground sm:text-lg">
                        Live websites and web apps for car rental, education and
                        automotive businesses in Dubai and India.
                    </p>
                </div>
                <p className="hidden text-sm text-muted-foreground tabular-nums md:block">
                    {padded(projects.length)} projects
                </p>
            </div>

            <div className="mt-14 flex flex-col gap-24 sm:mt-20 lg:gap-32">
                {featured.map((project, index) => (
                    <FeaturedProject
                        key={project.slug}
                        project={project}
                        index={index}
                        icons={icons}
                    />
                ))}
            </div>

            {more.length > 0 && (
                <div className="mt-24 lg:mt-32">
                    <h3 className="text-center text-xl font-semibold tracking-tight md:text-left">
                        More projects
                    </h3>

                    <div data-more className="relative mt-6">
                        <ul className="relative">
                            <span
                                aria-hidden
                                data-line
                                className="absolute inset-x-0 top-0 h-px origin-left bg-border"
                            />
                            {more.map((project) => (
                                <MoreProject
                                    key={project.slug}
                                    project={project}
                                    icons={icons}
                                />
                            ))}
                        </ul>

                        {/* Cursor-following preview, mouse users only. */}
                        <div
                            data-preview
                            aria-hidden
                            className="pointer-events-none absolute top-0 left-0 z-30 hidden w-[22rem] overflow-hidden rounded-xl border bg-card shadow-2xl shadow-black/40 hover-preview:block"
                        >
                            <div className="relative aspect-[1400/846]">
                                {more.map((project) => (
                                    <div
                                        key={project.slug}
                                        data-preview-image
                                        className="absolute inset-0"
                                        style={{
                                            clipPath: 'inset(100% 0% 0% 0%)',
                                        }}
                                    >
                                        <Screenshot
                                            project={project}
                                            sizes="352px"
                                            className="size-full object-cover object-top"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="mt-14 flex justify-center">
                <Link
                    href={WorkController.index.url()}
                    prefetch
                    className="group inline-flex h-12 items-center gap-3 rounded-full border px-6 text-sm font-medium transition-colors hover:border-brand hover:text-brand active:scale-[0.98]"
                >
                    View all projects
                    <Icon
                        icon={faArrowRight}
                        className="size-3 transition-transform group-hover:translate-x-1"
                    />
                </Link>
            </div>
        </section>
    );
}

/**
 * One featured row, played once as it scrolls in: the browser frame rises,
 * its dots pop, the URL types itself, a loading bar runs and the screenshot
 * wipes in, while the text column counts and staggers alongside.
 */
function animateRow(row: HTMLElement, rowIndex: number): void {
    const drift = row.querySelector<HTMLElement>('[data-drift]');
    const index = row.querySelector<HTMLElement>('[data-index]');

    const load = gsap.timeline({
        defaults: { ease: 'power3.out' },
        scrollTrigger: { trigger: row, start: 'top 75%', once: true },
    });

    addFrameLoad(load, row);

    load.fromTo(
        row.querySelectorAll('[data-reveal]'),
        { autoAlpha: 0, y: 24 },
        { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.07 },
        0.3,
    )
        .fromTo(
            row.querySelectorAll('[data-check]'),
            { scale: 0, rotation: -45 },
            {
                scale: 1,
                rotation: 0,
                duration: 0.45,
                stagger: 0.09,
                ease: 'back.out(3)',
            },
            0.9,
        )
        .fromTo(
            row.querySelectorAll('[data-pill]'),
            { autoAlpha: 0, y: 10, scale: 0.9 },
            {
                autoAlpha: 1,
                y: 0,
                scale: 1,
                duration: 0.4,
                stagger: 0.05,
                ease: 'back.out(2)',
            },
            1.05,
        );

    countUp(load, index, 0, rowIndex + 1, padded, 0.3);
    countUpMetric(load, row.querySelector('[data-metric-number]'), 1);

    // Parallax: the whole frame drifts against the text column, and the
    // index number drifts slower still. The screenshot is never trimmed.
    // Wide screens only: on phones it costs frames for little effect.
    if (!window.matchMedia(SCRUB_EXTRAS_OK).matches) {
        return;
    }

    const scrub = {
        trigger: row,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
    };

    gsap.fromTo(
        drift,
        { y: 40 },
        { y: -40, ease: 'none', scrollTrigger: scrub },
    );
    gsap.fromTo(
        index,
        { yPercent: 25 },
        { yPercent: -25, ease: 'none', scrollTrigger: scrub },
    );
}

/** "More projects": divider lines draw in and the rows rise, once. */
function animateMoreList(root: HTMLElement): void {
    const list = root.querySelector<HTMLElement>('[data-more]');

    if (!list) {
        return;
    }

    gsap.timeline({
        scrollTrigger: { trigger: list, start: 'top 85%', once: true },
    })
        .fromTo(
            list.querySelectorAll('[data-line]'),
            { scaleX: 0 },
            { scaleX: 1, duration: 1, stagger: 0.12, ease: 'expo.inOut' },
            0,
        )
        .fromTo(
            list.querySelectorAll('[data-more-content]'),
            { autoAlpha: 0, y: 20 },
            {
                autoAlpha: 1,
                y: 0,
                duration: 0.7,
                stagger: 0.12,
                ease: 'power3.out',
            },
            0.25,
        );
}

/**
 * A preview card follows the cursor over the list and wipes to the hovered
 * project's screenshot.
 */
function followCursorPreview(root: HTMLElement): (() => void) | undefined {
    const list = root.querySelector<HTMLElement>('[data-more]');
    const preview = root.querySelector<HTMLElement>('[data-preview]');

    if (!list || !preview) {
        return;
    }

    const images = gsap.utils.toArray<HTMLElement>(
        '[data-preview-image]',
        preview,
    );
    const rows = gsap.utils.toArray<HTMLElement>('[data-more-row]', list);
    let active = -1;
    let layer = 1;

    gsap.set(preview, {
        xPercent: -50,
        yPercent: -50,
        autoAlpha: 0,
        scale: 0.85,
    });

    const moveX = gsap.quickTo(preview, 'x', {
        duration: 0.5,
        ease: 'power3.out',
    });
    const moveY = gsap.quickTo(preview, 'y', {
        duration: 0.5,
        ease: 'power3.out',
    });

    const onMove = (event: PointerEvent) => {
        const box = list.getBoundingClientRect();
        moveX(event.clientX - box.left);
        moveY(event.clientY - box.top);
    };

    const onEnter = (event: PointerEvent) => {
        const box = list.getBoundingClientRect();
        gsap.set(preview, {
            x: event.clientX - box.left,
            y: event.clientY - box.top,
        });
        gsap.to(preview, {
            autoAlpha: 1,
            scale: 1,
            duration: 0.4,
            ease: 'power3.out',
            overwrite: 'auto',
        });
    };

    const onLeave = () => {
        active = -1;
        gsap.to(preview, {
            autoAlpha: 0,
            scale: 0.85,
            duration: 0.3,
            ease: 'power2.in',
            overwrite: 'auto',
        });
    };

    const rowCleanups = rows.map((row, index) => {
        const show = () => {
            if (index === active || !images[index]) {
                return;
            }

            active = index;
            layer += 1;
            gsap.fromTo(
                images[index],
                {
                    zIndex: layer,
                    clipPath: 'inset(100% 0% 0% 0%)',
                    scale: 1.15,
                },
                {
                    clipPath: 'inset(0% 0% 0% 0%)',
                    scale: 1,
                    duration: 0.55,
                    ease: 'expo.out',
                    overwrite: true,
                },
            );
        };

        row.addEventListener('pointerenter', show);

        return () => row.removeEventListener('pointerenter', show);
    });

    list.addEventListener('pointermove', onMove);
    list.addEventListener('pointerenter', onEnter);
    list.addEventListener('pointerleave', onLeave);

    return () => {
        list.removeEventListener('pointermove', onMove);
        list.removeEventListener('pointerenter', onEnter);
        list.removeEventListener('pointerleave', onLeave);
        rowCleanups.forEach((cleanup) => cleanup());
    };
}

function FeaturedProject({
    project,
    index,
    icons,
}: {
    project: ProjectSummary;
    index: number;
    icons: Map<string, string>;
}) {
    const isFlipped = index % 2 === 1;
    const canCount = /^\d+\D*$/.test(project.metric?.value ?? '');

    return (
        <article
            data-work-row
            aria-labelledby={`project-${project.slug}`}
            className="grid items-center gap-8 lg:grid-cols-12 lg:gap-14"
        >
            <div
                data-drift
                className={cn('lg:col-span-7', isFlipped && 'lg:order-2')}
            >
                <div data-tilt className="will-change-transform">
                    <BrowserFrame
                        project={project}
                        sizes="(min-width: 1024px) 640px, 92vw"
                    />
                </div>
            </div>

            <div
                className={cn(
                    'text-center lg:col-span-5 lg:text-left',
                    isFlipped && 'lg:order-1',
                )}
            >
                <div className="flex items-end justify-center gap-4 lg:justify-start">
                    <span
                        data-index
                        data-reveal
                        aria-hidden
                        className="text-6xl leading-none font-semibold text-transparent tabular-nums opacity-70 [-webkit-text-stroke:1px_var(--color-brand)] sm:text-7xl"
                    >
                        {padded(index + 1)}
                    </span>
                    <p
                        data-reveal
                        className="pb-1.5 text-sm font-medium text-brand"
                    >
                        {project.category}, {project.year}
                    </p>
                </div>

                <h3
                    id={`project-${project.slug}`}
                    data-reveal
                    className="mt-5 text-2xl font-semibold tracking-tight text-balance sm:text-3xl"
                >
                    {project.title}
                </h3>
                <p
                    data-reveal
                    className="mt-3 text-pretty text-muted-foreground"
                >
                    {project.summary}
                </p>
                {project.company && (
                    <p data-reveal className="mt-3 text-sm">
                        {project.company}
                        <span className="text-muted-foreground">
                            , {project.role.charAt(0).toLowerCase()}
                            {project.role.slice(1)}
                        </span>
                    </p>
                )}

                {project.highlights.length > 0 && (
                    <ul
                        data-reveal
                        className="mx-auto mt-6 flex w-fit max-w-full flex-col gap-2.5 text-left lg:mx-0"
                    >
                        {project.highlights.map((highlight) => (
                            <li
                                key={highlight}
                                className="flex gap-3 text-sm leading-relaxed text-muted-foreground"
                            >
                                <span
                                    data-check
                                    className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-brand/15 text-brand"
                                >
                                    <Icon icon={faCheck} className="size-2.5" />
                                </span>
                                {highlight}
                            </li>
                        ))}
                    </ul>
                )}

                {project.metric && (
                    <p
                        data-reveal
                        className="mt-6 flex items-baseline justify-center gap-3 lg:justify-start"
                    >
                        <span
                            data-metric-number
                            data-value={canCount ? project.metric.value : ''}
                            className="text-shine text-3xl font-semibold tracking-tight tabular-nums"
                        >
                            {project.metric.value}
                        </span>
                        <span className="text-sm text-muted-foreground">
                            {project.metric.label}
                        </span>
                    </p>
                )}

                <StackList
                    stack={project.stack}
                    icons={icons}
                    className="mt-6 justify-center gap-2 lg:justify-start"
                />

                <div
                    data-reveal
                    className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start"
                >
                    <Magnetic>
                        <Link
                            href={WorkController.show.url(project.slug)}
                            prefetch
                            className="inline-flex h-11 items-center gap-2.5 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-colors hover:bg-primary/85 active:scale-[0.98]"
                        >
                            Read case study
                            <span className="sr-only">: {project.title}</span>
                            <Icon icon={faArrowRight} className="size-3" />
                        </Link>
                    </Magnetic>
                    {project.links.live && (
                        <Magnetic>
                            <a
                                href={project.links.live}
                                target="_blank"
                                rel="noopener"
                                className="inline-flex h-11 items-center gap-2.5 rounded-full border px-5 text-sm font-medium transition-colors hover:border-brand hover:text-brand active:scale-[0.98]"
                            >
                                Visit site
                                <span className="sr-only">
                                    {' '}
                                    {project.title} (opens in a new tab)
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
                                className="inline-flex h-11 items-center gap-2.5 rounded-full border px-5 text-sm font-medium transition-colors hover:border-brand hover:text-brand active:scale-[0.98]"
                            >
                                Admin panel
                                <span className="sr-only">
                                    {' '}
                                    for {project.title} (opens in a new tab)
                                </span>
                                <Icon
                                    icon={faArrowUpRightFromSquare}
                                    className="size-3"
                                />
                            </a>
                        </Magnetic>
                    )}
                </div>
            </div>
        </article>
    );
}

function MoreProject({
    project,
    icons,
}: {
    project: ProjectSummary;
    icons: Map<string, string>;
}) {
    const content = (
        <div
            data-more-content
            className="flex w-full items-center gap-4 sm:gap-6"
        >
            {/* Touch screens and reduced motion get an inline thumbnail. */}
            <span className="w-24 shrink-0 overflow-hidden rounded-lg border sm:w-32 hover-preview:hidden">
                <Screenshot
                    project={project}
                    sizes="128px"
                    className="aspect-[1400/846] w-full object-cover object-top"
                />
            </span>

            <div className="min-w-0 flex-1">
                <h4 className="text-lg font-semibold tracking-tight transition-transform duration-500 ease-out group-hover:translate-x-3 sm:text-xl">
                    {project.title}
                </h4>
                <span className="mt-0.5 block text-sm text-muted-foreground sm:hidden">
                    {project.category}, {project.year}
                </span>
                {project.metric && (
                    <span className="mt-1 hidden text-sm text-muted-foreground transition-transform duration-500 ease-out group-hover:translate-x-3 md:block">
                        <span className="text-brand">
                            {project.metric.value}
                        </span>{' '}
                        {project.metric.label}
                    </span>
                )}
            </div>

            <span className="hidden w-48 shrink-0 text-sm text-muted-foreground sm:block lg:w-56">
                {project.category}
            </span>

            <StackList
                stack={project.stack.slice(0, 3)}
                icons={icons}
                className="hidden w-64 shrink-0 gap-1.5 xl:flex"
            />

            <span className="hidden w-12 shrink-0 text-right text-sm text-muted-foreground tabular-nums sm:block">
                {project.year}
            </span>

            <span
                aria-hidden
                className="grid size-9 shrink-0 place-items-center rounded-full border text-muted-foreground transition-all duration-500 ease-out group-hover:-rotate-45 group-hover:border-brand group-hover:bg-brand group-hover:text-primary-foreground"
            >
                <Icon icon={faArrowRight} className="size-3" />
            </span>
        </div>
    );

    const rowClassName =
        'group flex py-5 outline-none focus-visible:bg-card/60 sm:py-6';

    return (
        <li data-more-row className="relative">
            <Link
                href={WorkController.show.url(project.slug)}
                prefetch
                className={rowClassName}
            >
                {content}
            </Link>
            <span
                aria-hidden
                data-line
                className="absolute inset-x-0 bottom-0 h-px origin-left bg-border"
            />
        </li>
    );
}
