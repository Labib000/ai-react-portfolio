import { faArrowRight } from '@fortawesome/free-solid-svg-icons/faArrowRight';
import { faCheck } from '@fortawesome/free-solid-svg-icons/faCheck';
import { faCircleCheck } from '@fortawesome/free-solid-svg-icons/faCircleCheck';
import { faUserTie } from '@fortawesome/free-solid-svg-icons/faUserTie';
import { Link } from '@inertiajs/react';
import { useLayoutEffect, useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import WorkController from '@/actions/App/Http/Controllers/WorkController';
import { IconCluster } from '@/components/home/services-section';
import { SplitHeading } from '@/components/motion/split-heading';
import { Icon } from '@/components/ui/icon';
import { countUpMetric } from '@/components/work/animations';
import {
    padded,
    Screenshot,
    StackList,
    toolIconMap,
} from '@/components/work/project-media';
import { gsap, MOTION_OK, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { cn } from '@/lib/utils';
import type { ProjectSummary, Service, ToolRow } from '@/types/content';

type ServiceCatalogueProps = {
    services: Service[];
    projects: ProjectSummary[];
    toolRows: ToolRow[];
};

function prefersReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function serviceId(service: Service): string {
    return `service-${service.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')}`;
}

/**
 * "What I can build for you": every service as a full panel. On desktop a
 * sticky numbered index follows along, with a gliding marker and a progress
 * line; on phones a sticky chip bar does the same job. Each panel builds
 * itself once as it scrolls in. Server-rendered in the final state.
 */
export function ServiceCatalogue({
    services,
    projects,
    toolRows,
}: ServiceCatalogueProps) {
    const section = useRef<HTMLElement>(null);
    const indexLinks = useRef<(HTMLAnchorElement | null)[]>([]);
    const chips = useRef<(HTMLAnchorElement | null)[]>([]);
    const [active, setActive] = useState(0);
    const icons = toolIconMap(toolRows);
    const brandsByIcon = new Map(
        toolRows.flatMap((row) =>
            row.tools.map((tool) => [tool.icon, tool.brand]),
        ),
    );

    // The marker glides to the active index entry; the active chip scrolls
    // into view sideways on phones.
    useLayoutEffect(() => {
        const marker =
            section.current?.querySelector<HTMLElement>('[data-marker]');
        const entry = indexLinks.current[active];
        const duration = prefersReducedMotion() ? 0 : 0.45;

        if (marker && entry) {
            gsap.to(marker, {
                y: entry.offsetTop,
                height: entry.offsetHeight,
                duration,
                ease: 'power3.out',
            });
        }

        const chip = chips.current[active];
        const scroller = chip?.parentElement?.parentElement;

        if (chip && scroller && scroller.scrollWidth > scroller.clientWidth) {
            scroller.scrollTo({
                left: chip.offsetLeft - 16,
                behavior: duration ? 'smooth' : 'auto',
            });
        }
    }, [active]);

    useGSAP(
        () => {
            const root = section.current;

            if (!root) {
                return;
            }

            const panels = gsap.utils.toArray<HTMLElement>(
                '[data-service-panel]',
                root,
            );

            // Which service is on screen. Not motion, so it always runs.
            const spies = panels.map((panel, index) =>
                ScrollTrigger.create({
                    trigger: panel,
                    start: 'top 55%',
                    end: 'bottom 55%',
                    onToggle: (self) => self.isActive && setActive(index),
                }),
            );

            const progress = root.querySelector('[data-progress]');
            const list = root.querySelector('[data-panels]');
            const progressTween =
                progress && list
                    ? gsap.fromTo(
                          progress,
                          { scaleY: 0 },
                          {
                              scaleY: 1,
                              ease: 'none',
                              scrollTrigger: {
                                  trigger: list,
                                  start: 'top 55%',
                                  end: 'bottom 55%',
                                  scrub: true,
                              },
                          },
                      )
                    : null;

            const mm = gsap.matchMedia();

            mm.add(MOTION_OK, () => {
                const triggers = panels.map((panel) => {
                    const entrance = panelEntrance(panel);

                    return ScrollTrigger.create({
                        trigger: panel,
                        start: 'top 85%',
                        once: true,
                        onEnter: () => entrance.play(),
                    });
                });

                return () => triggers.forEach((trigger) => trigger.kill());
            });

            // A spotlight follows the mouse inside each panel.
            mm.add('(pointer: fine)', () => {
                const onMove = (event: PointerEvent) => {
                    const panel = event.currentTarget as HTMLElement;
                    const box = panel.getBoundingClientRect();
                    panel.style.setProperty(
                        '--spot-x',
                        `${event.clientX - box.left}px`,
                    );
                    panel.style.setProperty(
                        '--spot-y',
                        `${event.clientY - box.top}px`,
                    );
                };

                panels.forEach((panel) =>
                    panel.addEventListener('pointermove', onMove),
                );

                return () =>
                    panels.forEach((panel) =>
                        panel.removeEventListener('pointermove', onMove),
                    );
            });

            return () => {
                spies.forEach((spy) => spy.kill());
                progressTween?.scrollTrigger?.kill();
                progressTween?.kill();
                mm.revert();
            };
        },
        { scope: section },
    );

    const jumpTo = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
        const target = document.getElementById(id);

        if (!target) {
            return;
        }

        event.preventDefault();
        target.scrollIntoView({
            behavior: prefersReducedMotion() ? 'auto' : 'smooth',
            block: 'start',
        });
        history.replaceState(null, '', `#${id}`);
    };

    return (
        <section
            ref={section}
            id="services"
            aria-labelledby="catalogue-heading"
            className="mx-auto max-w-6xl scroll-mt-4 px-4 py-20 sm:px-6 sm:py-28"
        >
            <div className="max-w-2xl">
                <SplitHeading
                    as="h2"
                    id="catalogue-heading"
                    className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-5xl"
                >
                    What I can build for you
                </SplitHeading>
                <p className="mt-4 text-pretty text-muted-foreground sm:text-lg">
                    Hire me for a full product or one piece of it. Each service
                    shows what's included, who it suits and the work behind it.
                </p>
            </div>

            {/* Phones and tablets: a sticky chip bar */}
            <nav
                aria-label="Services"
                className="sticky top-0 z-30 -mx-4 mt-10 border-b bg-background/95 sm:-mx-6 lg:hidden"
            >
                <div className="[scrollbar-width:none] overflow-x-auto [&::-webkit-scrollbar]:hidden">
                    <ul className="flex w-max gap-2 px-4 py-3 sm:px-6">
                        {services.map((service, index) => (
                            <li key={service.title}>
                                <a
                                    ref={(element) => {
                                        chips.current[index] = element;
                                    }}
                                    href={`#${serviceId(service)}`}
                                    onClick={(event) =>
                                        jumpTo(event, serviceId(service))
                                    }
                                    aria-current={
                                        index === active ? 'true' : undefined
                                    }
                                    className={cn(
                                        'inline-flex h-9 items-center rounded-full border px-4 text-sm font-medium whitespace-nowrap transition-colors',
                                        index === active
                                            ? 'border-brand bg-brand/10 text-foreground'
                                            : 'text-muted-foreground hover:text-foreground',
                                    )}
                                >
                                    {service.title}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            </nav>

            <div className="mt-8 grid grid-cols-1 gap-10 lg:mt-14 lg:grid-cols-12 lg:gap-12">
                {/* Desktop: sticky numbered index */}
                <nav
                    aria-label="Services"
                    className="hidden lg:col-span-4 lg:block"
                >
                    <div className="sticky top-28">
                        <div className="relative pl-5">
                            <span
                                aria-hidden
                                className="absolute top-0 bottom-0 left-0 w-px bg-border"
                            />
                            <span
                                aria-hidden
                                data-progress
                                className="absolute top-0 bottom-0 left-0 w-px origin-top bg-brand"
                            />
                            <div className="relative">
                                <span
                                    aria-hidden
                                    data-marker
                                    className="pointer-events-none absolute top-0 left-0 w-full rounded-2xl border border-brand/40 bg-brand/10"
                                />
                                <ul>
                                    {services.map((service, index) => {
                                        const isActive = index === active;

                                        return (
                                            <li key={service.title}>
                                                <a
                                                    ref={(element) => {
                                                        indexLinks.current[
                                                            index
                                                        ] = element;
                                                    }}
                                                    href={`#${serviceId(service)}`}
                                                    onClick={(event) =>
                                                        jumpTo(
                                                            event,
                                                            serviceId(service),
                                                        )
                                                    }
                                                    aria-current={
                                                        isActive
                                                            ? 'true'
                                                            : undefined
                                                    }
                                                    className={cn(
                                                        'relative flex items-center gap-3 rounded-2xl px-4 py-2.5 text-[0.9375rem] font-medium transition-colors',
                                                        isActive
                                                            ? 'text-foreground'
                                                            : 'text-muted-foreground hover:text-foreground',
                                                    )}
                                                >
                                                    <span
                                                        className={cn(
                                                            'w-6 text-xs tabular-nums transition-colors',
                                                            isActive
                                                                ? 'text-brand'
                                                                : 'text-muted-foreground/70',
                                                        )}
                                                    >
                                                        {padded(index + 1)}
                                                    </span>
                                                    <span className="flex-1">
                                                        {service.title}
                                                    </span>
                                                    <Icon
                                                        icon={faArrowRight}
                                                        className={cn(
                                                            'size-3 transition-all duration-300',
                                                            isActive
                                                                ? 'translate-x-0 text-brand opacity-100'
                                                                : '-translate-x-2 opacity-0',
                                                        )}
                                                    />
                                                </a>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        </div>
                    </div>
                </nav>

                <div
                    data-panels
                    className="flex min-w-0 flex-col gap-6 lg:col-span-8 lg:gap-8"
                >
                    {services.map((service, index) => (
                        <ServicePanel
                            key={service.title}
                            id={serviceId(service)}
                            number={index + 1}
                            service={service}
                            example={
                                service.example
                                    ? projects.find(
                                          (project) =>
                                              project.slug === service.example,
                                      )
                                    : undefined
                            }
                            icons={icons}
                            brandsByIcon={brandsByIcon}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}

/**
 * A paused timeline that builds one panel from hidden to its final state.
 * The starting state is applied right away, so panels wait hidden.
 */
function panelEntrance(panel: HTMLElement): gsap.core.Timeline {
    const find = (selector: string) =>
        Array.from(panel.querySelectorAll<HTMLElement>(selector));
    const tiles = find('[data-icon-tile]');
    const shot = panel.querySelector<HTMLElement>('[data-example-shot]');

    const entrance = gsap.timeline({
        paused: true,
        defaults: { ease: 'power3.out' },
    });

    entrance
        .fromTo(
            panel,
            {
                autoAlpha: 0,
                y: 56,
                rotationX: 8,
                transformPerspective: 1200,
                transformOrigin: '50% 100%',
            },
            {
                autoAlpha: 1,
                y: 0,
                rotationX: 0,
                duration: 1,
                ease: 'expo.out',
            },
            0,
        )
        .fromTo(
            tiles,
            {
                scale: 0,
                x: (index) => (index - (tiles.length - 1) / 2) * 24,
                rotation: (index) => (index % 2 === 0 ? -20 : 20),
            },
            {
                scale: 1,
                x: 0,
                rotation: 0,
                duration: 0.6,
                stagger: 0.09,
                ease: 'back.out(2)',
            },
            0.2,
        )
        .fromTo(
            find('[data-cascade]'),
            { autoAlpha: 0, y: 16 },
            { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.07 },
            0.3,
        )
        .fromTo(
            find('[data-check]'),
            { scale: 0 },
            { scale: 1, duration: 0.35, stagger: 0.05, ease: 'back.out(3)' },
            0.55,
        )
        .fromTo(
            find('[data-pill]'),
            { autoAlpha: 0, scale: 0.8 },
            {
                autoAlpha: 1,
                scale: 1,
                duration: 0.4,
                stagger: 0.04,
                ease: 'back.out(2)',
            },
            0.6,
        )
        .fromTo(
            find('[data-divider]'),
            { scaleX: 0 },
            { scaleX: 1, duration: 0.8, ease: 'expo.inOut' },
            0.7,
        )
        .fromTo(
            find('[data-proof]'),
            { autoAlpha: 0, y: 10 },
            { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.1 },
            0.9,
        );

    // The case-study screenshot wipes in from the bottom and settles.
    if (shot) {
        entrance
            .fromTo(
                shot,
                { clipPath: 'inset(100% 0% 0% 0%)' },
                {
                    clipPath: 'inset(0% 0% 0% 0%)',
                    duration: 0.9,
                    ease: 'expo.inOut',
                },
                0.95,
            )
            .fromTo(
                shot.querySelector('img'),
                { scale: 1.12 },
                { scale: 1, duration: 1.2, ease: 'power3.out' },
                0.95,
            );
    }

    countUpMetric(
        entrance,
        panel.querySelector<HTMLElement>('[data-metric-number]'),
        0.95,
    );

    entrance.progress(0);

    return entrance;
}

function ServicePanel({
    id,
    number,
    service,
    example,
    icons,
    brandsByIcon,
}: {
    id: string;
    number: number;
    service: Service;
    example: ProjectSummary | undefined;
    icons: Map<string, string>;
    brandsByIcon: Map<string, string>;
}) {
    const canCount = /^\d+\D*$/.test(service.metric?.value ?? '');

    return (
        <article
            id={id}
            data-service-panel
            aria-labelledby={`${id}-title`}
            className="group relative scroll-mt-20 overflow-hidden rounded-3xl border bg-card/60 p-6 sm:p-8 lg:scroll-mt-28"
        >
            {/* Spotlight glow and a brighter border under the mouse */}
            <span
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 pointer-fine:group-hover:opacity-100"
                style={{
                    background:
                        'radial-gradient(24rem circle at var(--spot-x, 50%) var(--spot-y, 50%), color-mix(in oklab, var(--color-brand) 9%, transparent), transparent 70%)',
                }}
            />
            <span
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-3xl p-px opacity-0 transition-opacity duration-500 [mask:linear-gradient(#000_0_0)_content-box_exclude,linear-gradient(#000_0_0)] pointer-fine:group-hover:opacity-100"
                style={{
                    background:
                        'radial-gradient(18rem circle at var(--spot-x, 50%) var(--spot-y, 50%), color-mix(in oklab, var(--color-brand) 65%, transparent), transparent 70%)',
                }}
            />
            <span
                aria-hidden
                className="pointer-events-none absolute -top-28 -right-28 size-64 rounded-full bg-brand/10 blur-3xl"
            />

            <div className="relative">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <IconCluster
                        icons={service.icons}
                        title={service.title}
                        brandsByIcon={brandsByIcon}
                    />
                    <div data-cascade className="flex items-center gap-3">
                        {service.badge && (
                            <span className="rounded-full border border-brand/30 bg-brand/10 px-2.5 py-0.5 text-xs font-medium whitespace-nowrap text-brand">
                                {service.badge}
                            </span>
                        )}
                        <span
                            aria-hidden
                            className="text-sm font-medium text-muted-foreground/60 tabular-nums"
                        >
                            {padded(number)}
                        </span>
                    </div>
                </div>

                <h3
                    id={`${id}-title`}
                    data-cascade
                    className="mt-6 text-2xl font-semibold tracking-tight text-balance sm:text-3xl"
                >
                    {service.title}
                </h3>
                <p
                    data-cascade
                    className="mt-3 max-w-2xl text-pretty text-muted-foreground sm:text-lg"
                >
                    {service.summary}
                </p>

                <div className="mt-7 grid gap-7 md:grid-cols-2 md:gap-8">
                    {service.points.length > 0 && (
                        <div>
                            <p data-cascade className="text-sm font-medium">
                                What you get
                            </p>
                            <ul className="mt-3 grid gap-2.5">
                                {service.points.map((point) => (
                                    <li
                                        key={point}
                                        data-cascade
                                        className="flex gap-2.5 text-sm leading-snug"
                                    >
                                        <span
                                            data-check
                                            className="mt-px grid size-4.5 shrink-0 place-items-center rounded-full bg-brand/15 text-brand"
                                        >
                                            <Icon
                                                icon={faCheck}
                                                className="size-2.5"
                                            />
                                        </span>
                                        {point}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="flex flex-col gap-6">
                        {service.stack.length > 0 && (
                            <div>
                                <p data-cascade className="text-sm font-medium">
                                    Built with
                                </p>
                                <StackList
                                    stack={service.stack}
                                    icons={icons}
                                    className="mt-3 gap-1.5"
                                />
                            </div>
                        )}
                        {service.for && (
                            <p
                                data-cascade
                                className="flex items-start gap-2 text-sm text-muted-foreground"
                            >
                                <Icon
                                    icon={faUserTie}
                                    className="mt-0.5 size-3.5 shrink-0 text-brand"
                                />
                                <span>
                                    <span className="font-medium text-foreground">
                                        Best for:
                                    </span>{' '}
                                    {service.for}
                                </span>
                            </p>
                        )}
                    </div>
                </div>

                {(service.metric || service.proof || example) && (
                    <>
                        <span
                            aria-hidden
                            data-divider
                            className="mt-7 block h-px origin-left bg-border"
                        />
                        <div className="mt-6 grid items-center gap-5 md:grid-cols-2 md:gap-8">
                            {(service.metric || service.proof) && (
                                <div data-proof>
                                    {service.metric ? (
                                        <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                                            <span
                                                data-metric-number
                                                data-value={
                                                    canCount
                                                        ? service.metric.value
                                                        : undefined
                                                }
                                                className="text-shine text-4xl font-semibold tracking-tight tabular-nums"
                                            >
                                                {service.metric.value}
                                            </span>
                                            <span className="text-sm font-medium">
                                                {service.metric.label}
                                            </span>
                                            {service.proof && (
                                                <span className="basis-full text-xs text-muted-foreground">
                                                    {service.proof}
                                                </span>
                                            )}
                                        </p>
                                    ) : (
                                        <p className="flex items-start gap-2 text-sm">
                                            <Icon
                                                icon={faCircleCheck}
                                                className="mt-0.5 size-3.5 shrink-0 text-brand"
                                            />
                                            <span>
                                                <span className="sr-only">
                                                    Proof:{' '}
                                                </span>
                                                {service.proof}
                                            </span>
                                        </p>
                                    )}
                                </div>
                            )}

                            {example && (
                                <Link
                                    data-proof
                                    href={WorkController.show.url(example.slug)}
                                    prefetch
                                    className="group/example flex items-center gap-4 rounded-2xl border bg-background/50 p-3 transition-colors hover:border-brand/50 md:col-start-2"
                                >
                                    <span
                                        data-example-shot
                                        className="w-28 shrink-0 overflow-hidden rounded-xl border sm:w-32"
                                    >
                                        <Screenshot
                                            project={example}
                                            sizes="128px"
                                            className="aspect-[1400/846] w-full object-cover object-top transition-transform duration-500 group-hover/example:scale-105"
                                        />
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block text-xs text-muted-foreground">
                                            Real example
                                        </span>
                                        <span className="block font-semibold tracking-tight transition-colors group-hover/example:text-brand">
                                            {example.title}
                                        </span>
                                        <span className="mt-0.5 block truncate text-xs text-brand">
                                            {example.category}
                                        </span>
                                    </span>
                                    <span className="grid size-9 shrink-0 place-items-center rounded-full border transition-all duration-500 group-hover/example:-rotate-45 group-hover/example:border-brand group-hover/example:bg-brand group-hover/example:text-primary-foreground">
                                        <Icon
                                            icon={faArrowRight}
                                            className="size-3"
                                        />
                                    </span>
                                </Link>
                            )}
                        </div>
                    </>
                )}
            </div>
        </article>
    );
}
