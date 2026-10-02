import { faTelegram } from '@fortawesome/free-brands-svg-icons/faTelegram';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons/faWhatsapp';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons/faArrowRight';
import { faCheck } from '@fortawesome/free-solid-svg-icons/faCheck';
import { faCircleCheck } from '@fortawesome/free-solid-svg-icons/faCircleCheck';
import { faCode } from '@fortawesome/free-solid-svg-icons/faCode';
import { faDiagramProject } from '@fortawesome/free-solid-svg-icons/faDiagramProject';
import { faGaugeHigh } from '@fortawesome/free-solid-svg-icons/faGaugeHigh';
import { faUserTie } from '@fortawesome/free-solid-svg-icons/faUserTie';
import { Link } from '@inertiajs/react';
import { useRef } from 'react';
import ServicesController from '@/actions/App/Http/Controllers/ServicesController';
import type { CSSProperties } from 'react';
import { ToolIcon } from '@/components/home/tool-icon';
import { SplitHeading } from '@/components/motion/split-heading';
import { Icon } from '@/components/ui/icon';
import type { FontAwesomeIconData } from '@/components/ui/icon';
import {
    gsap,
    MOTION_OK,
    SCRUB_EXTRAS_OK,
    ScrollTrigger,
    useGSAP,
} from '@/lib/gsap';
import { brandColours, toolMasks, toolSvgs } from '@/lib/tool-icons';
import { cn } from '@/lib/utils';
import type { Service, ToolRow } from '@/types/content';

type ServicesSectionProps = {
    services: Service[];
    toolRows: ToolRow[];
};

/** Icon keys in content/services.php that aren't tool logo files. */
const fontAwesomeIcons: Record<
    string,
    { icon: FontAwesomeIconData; brand?: string }
> = {
    whatsapp: { icon: faWhatsapp, brand: '#25D366' },
    telegram: { icon: faTelegram, brand: '#26A5E4' },
    gauge: { icon: faGaugeHigh },
    diagram: { icon: faDiagramProject },
};

/** How many cards lead the grid at a larger size. */
const LEAD_CARDS = 2;

function isToolLogo(key: string): boolean {
    return Boolean(toolSvgs[key] || toolMasks[key]);
}

/**
 * "What I build": service cards in a bento grid. As each card scrolls in it
 * rises, its logo cluster clicks together, its content cascades in and its
 * metric counts up. On desktop a spotlight follows the mouse across the
 * grid. Server-rendered in the final state.
 */
export function ServicesSection({ services, toolRows }: ServicesSectionProps) {
    const section = useRef<HTMLElement>(null);
    const toolsByName = new Map(
        toolRows.flatMap((row) =>
            row.tools.map((tool) => [tool.name.toLowerCase(), tool]),
        ),
    );
    const brandsByIcon = new Map(
        toolRows.flatMap((row) =>
            row.tools.map((tool) => [tool.icon, tool.brand]),
        ),
    );

    useGSAP(
        () => {
            const root = section.current;

            if (!root) {
                return;
            }

            const mm = gsap.matchMedia();

            mm.add(MOTION_OK, () => {
                const cards = gsap.utils.toArray<HTMLElement>(
                    '[data-service]',
                    root,
                );
                const entrances = new Map(
                    cards.map((card) => [card, cardEntrance(card)]),
                );

                const triggers = ScrollTrigger.batch(cards, {
                    start: 'top 88%',
                    once: true,
                    onEnter: (batch) =>
                        (batch as HTMLElement[]).forEach((card, index) =>
                            entrances
                                .get(card)
                                ?.delay(index * 0.1)
                                .play(),
                        ),
                });

                // Lead cards: the big watermark logo drifts with the scroll
                // (wide screens only; on phones it costs frames).
                gsap.utils
                    .toArray<HTMLElement>('[data-watermark]', root)
                    .filter(() => window.matchMedia(SCRUB_EXTRAS_OK).matches)
                    .forEach((watermark) =>
                        gsap.fromTo(
                            watermark,
                            { yPercent: 20, rotation: -8 },
                            {
                                yPercent: -20,
                                rotation: 8,
                                ease: 'none',
                                scrollTrigger: {
                                    trigger:
                                        watermark.closest('[data-service]'),
                                    start: 'top bottom',
                                    end: 'bottom top',
                                    scrub: true,
                                },
                            },
                        ),
                    );

                return () => triggers.forEach((trigger) => trigger.kill());
            });

            // One listener moves the spotlight across every card at once.
            mm.add('(pointer: fine)', () => {
                const grid = root.querySelector<HTMLElement>('[data-grid]');
                const cards = gsap.utils.toArray<HTMLElement>(
                    '[data-service]',
                    root,
                );

                if (!grid) {
                    return;
                }

                const onMove = (event: PointerEvent) => {
                    cards.forEach((card) => {
                        const box = card.getBoundingClientRect();
                        card.style.setProperty(
                            '--spot-x',
                            `${event.clientX - box.left}px`,
                        );
                        card.style.setProperty(
                            '--spot-y',
                            `${event.clientY - box.top}px`,
                        );
                    });
                };

                grid.addEventListener('pointermove', onMove);

                return () => grid.removeEventListener('pointermove', onMove);
            });

            return () => mm.revert();
        },
        { scope: section },
    );

    return (
        <section
            ref={section}
            id="services"
            aria-labelledby="services-heading"
            className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28"
        >
            <div className="mx-auto max-w-2xl text-center md:mx-0 md:text-left">
                <SplitHeading
                    as="h2"
                    id="services-heading"
                    className="text-3xl font-semibold tracking-tight sm:text-4xl"
                >
                    Web development services
                </SplitHeading>
                <p className="mt-4 text-pretty text-muted-foreground sm:text-lg">
                    Hire me to build a full product or one part of it. Every
                    service here comes from work that's live in production or
                    built end to end.
                </p>
            </div>

            <div
                data-grid
                className="group/grid mt-12 grid gap-4 sm:mt-14 md:grid-cols-2 lg:grid-cols-6 lg:gap-5"
            >
                {services.map((service, index) => (
                    <ServiceCard
                        key={service.title}
                        service={service}
                        isLead={index < LEAD_CARDS}
                        toolsByName={toolsByName}
                        brandsByIcon={brandsByIcon}
                    />
                ))}
            </div>

            <div className="mt-12 flex justify-center">
                <Link
                    href={ServicesController.url()}
                    prefetch
                    className="group inline-flex h-12 items-center gap-3 rounded-full border px-6 text-sm font-medium transition-colors hover:border-brand hover:text-brand active:scale-[0.98]"
                >
                    See all services
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
 * A paused timeline that takes one card from hidden to its final state.
 * The starting state is applied right away, so cards wait off-screen hidden.
 */
function cardEntrance(card: HTMLElement): gsap.core.Timeline {
    const find = (selector: string) =>
        Array.from(card.querySelectorAll<HTMLElement>(selector));
    const tiles = find('[data-icon-tile]');
    const number = card.querySelector<HTMLElement>('[data-metric-number]');

    const entrance = gsap.timeline({
        paused: true,
        defaults: { ease: 'power3.out' },
    });

    entrance
        .fromTo(
            card,
            {
                autoAlpha: 0,
                y: 48,
                rotationX: 10,
                transformPerspective: 1000,
                transformOrigin: '50% 100%',
            },
            {
                autoAlpha: 1,
                y: 0,
                rotationX: 0,
                duration: 0.9,
                ease: 'expo.out',
            },
            0,
        )
        // Logos fly in from a spread and click into the overlapped cluster.
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
            find('[data-best-for]'),
            { autoAlpha: 0, x: -16 },
            { autoAlpha: 1, x: 0, duration: 0.5 },
            0.7,
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
            { autoAlpha: 1, y: 0, duration: 0.5 },
            0.95,
        );

    // "20+" counts 0 → 20; ranges count their first number.
    const [, digits, rest] = number?.dataset.value?.match(/^(\d+)(.*)$/) ?? [];

    if (number && digits) {
        const count = { value: 0 };
        number.textContent = `0${rest}`;
        entrance.to(
            count,
            {
                value: Number(digits),
                duration: 1.2,
                ease: 'power2.out',
                onUpdate: () => {
                    number.textContent = `${Math.round(count.value)}${rest}`;
                },
            },
            0.95,
        );
    }

    entrance.progress(0);

    return entrance;
}

function brandStyle(hex: string | undefined): CSSProperties | undefined {
    if (!hex) {
        return undefined;
    }

    const colours = brandColours(hex);

    return {
        '--tool-light': colours.onLight,
        '--tool-dark': colours.onDark,
    } as CSSProperties;
}

export function IconCluster({
    icons,
    title,
    brandsByIcon,
}: {
    icons: string[];
    title: string;
    brandsByIcon: Map<string, string>;
}) {
    return (
        <div aria-hidden className="flex">
            {icons.map((key, index) => {
                const fontAwesome = fontAwesomeIcons[key];
                const brand = fontAwesome?.brand ?? brandsByIcon.get(key);

                return (
                    <span
                        key={key}
                        data-icon-tile
                        style={
                            {
                                ...brandStyle(brand),
                                '--i': index,
                                zIndex: icons.length - index,
                            } as CSSProperties
                        }
                        className={cn(
                            'relative grid size-11 shrink-0 place-items-center rounded-full border bg-background ring-4 ring-card transition-[translate] duration-500 ease-out group-hover:translate-x-[calc(var(--i)*7px)]',
                            index > 0 && '-ml-3',
                            brand
                                ? 'text-(--tool-light) dark:text-(--tool-dark)'
                                : 'text-brand',
                        )}
                    >
                        {fontAwesome ? (
                            <Icon icon={fontAwesome.icon} className="size-5" />
                        ) : isToolLogo(key) ? (
                            <ToolIcon
                                icon={key}
                                name={title}
                                className="size-5"
                            />
                        ) : (
                            <Icon icon={faCode} className="size-5" />
                        )}
                    </span>
                );
            })}
        </div>
    );
}

function ServiceCard({
    service,
    isLead,
    toolsByName,
    brandsByIcon,
}: {
    service: Service;
    isLead: boolean;
    toolsByName: Map<string, ToolRow['tools'][number]>;
    brandsByIcon: Map<string, string>;
}) {
    const watermark = isLead
        ? service.icons.findLast((key) => isToolLogo(key))
        : undefined;
    const canCount = /^\d+/.test(service.metric?.value ?? '');

    return (
        <article
            data-service
            className={cn(
                'group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-card/60 p-6 text-center sm:p-7 md:text-left',
                isLead ? 'lg:col-span-3' : 'lg:col-span-2',
            )}
        >
            {/* Spotlight: a glow inside the card and a brighter border,
                both following the mouse across the grid. */}
            <span
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 pointer-fine:group-hover/grid:opacity-100"
                style={{
                    background:
                        'radial-gradient(22rem circle at var(--spot-x, 50%) var(--spot-y, 50%), color-mix(in oklab, var(--color-brand) 10%, transparent), transparent 70%)',
                }}
            />
            <span
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-2xl p-px opacity-0 transition-opacity duration-500 [mask:linear-gradient(#000_0_0)_content-box_exclude,linear-gradient(#000_0_0)] pointer-fine:group-hover/grid:opacity-100"
                style={{
                    background:
                        'radial-gradient(16rem circle at var(--spot-x, 50%) var(--spot-y, 50%), color-mix(in oklab, var(--color-brand) 70%, transparent), transparent 70%)',
                }}
            />

            {watermark && (
                <span
                    aria-hidden
                    className="pointer-events-none absolute -right-8 -bottom-10 text-foreground opacity-[0.06] transition-opacity duration-500 group-hover:opacity-10"
                >
                    <span data-watermark className="block">
                        <ToolIcon
                            icon={watermark}
                            name={service.title}
                            className="block size-36 sm:size-44"
                        />
                    </span>
                </span>
            )}

            <div className="relative flex flex-col items-center gap-3 md:flex-row md:items-start md:justify-between md:gap-4">
                <IconCluster
                    icons={service.icons}
                    title={service.title}
                    brandsByIcon={brandsByIcon}
                />
                {service.badge && (
                    <span
                        data-cascade
                        className="rounded-full border border-brand/30 bg-brand/10 px-2.5 py-0.5 text-xs font-medium whitespace-nowrap text-brand"
                    >
                        {service.badge}
                    </span>
                )}
            </div>

            <h3
                data-cascade
                className={cn(
                    'relative mt-6 font-semibold tracking-tight text-balance',
                    isLead ? 'text-2xl' : 'text-xl',
                )}
            >
                {service.title}
            </h3>
            <p
                data-cascade
                className="relative mt-2.5 text-sm leading-relaxed text-pretty text-muted-foreground sm:text-[0.9375rem]"
            >
                {service.summary}
            </p>

            {service.points.length > 0 && (
                <ul
                    data-cascade
                    className={cn(
                        'relative mx-auto mt-5 grid w-fit gap-2.5 text-left md:mx-0 md:w-auto',
                        isLead && 'xl:grid-cols-2 xl:gap-x-5',
                    )}
                >
                    {service.points.map((point) => (
                        <li
                            key={point}
                            className="flex gap-2.5 text-sm leading-snug"
                        >
                            <span
                                data-check
                                className="mt-px grid size-4.5 shrink-0 place-items-center rounded-full bg-brand/15 text-brand"
                            >
                                <Icon icon={faCheck} className="size-2.5" />
                            </span>
                            {point}
                        </li>
                    ))}
                </ul>
            )}

            {service.stack.length > 0 && (
                <ul
                    data-cascade
                    aria-label="Tools"
                    className="relative mt-5 flex flex-wrap justify-center gap-1.5 md:justify-start"
                >
                    {service.stack.map((name) => {
                        const tool = toolsByName.get(name.toLowerCase());

                        return (
                            <li
                                key={name}
                                className="inline-flex items-center gap-1.5 rounded-full border bg-background/40 px-2.5 py-1 text-xs text-foreground/80"
                            >
                                {tool && (
                                    <ToolIcon
                                        icon={tool.icon}
                                        name={name}
                                        className="size-3.5 text-muted-foreground"
                                    />
                                )}
                                {name}
                            </li>
                        );
                    })}
                </ul>
            )}

            <div className="relative mt-auto pt-6">
                {service.for && (
                    <p
                        data-best-for
                        className="flex items-start justify-center gap-2 text-sm text-muted-foreground md:justify-start"
                    >
                        <Icon
                            icon={faUserTie}
                            className="mt-0.5 size-3.5 text-brand"
                        />
                        <span>
                            <span className="font-medium text-foreground">
                                Best for:
                            </span>{' '}
                            {service.for}
                        </span>
                    </p>
                )}

                {(service.metric || service.proof) && (
                    <>
                        <span
                            aria-hidden
                            data-divider
                            className="mt-4 block h-px origin-left bg-border"
                        />
                        <div data-proof className="mt-4">
                            {service.metric ? (
                                <p className="flex flex-wrap items-baseline justify-center gap-x-3 gap-y-1 md:justify-start">
                                    <span
                                        data-metric-number
                                        data-value={
                                            canCount ? service.metric.value : ''
                                        }
                                        className="text-shine text-3xl font-semibold tracking-tight tabular-nums"
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
                                <p className="flex items-start justify-center gap-2 text-sm md:justify-start">
                                    <Icon
                                        icon={faCircleCheck}
                                        className="mt-0.5 size-3.5 text-brand"
                                    />
                                    <span>
                                        <span className="sr-only">Proof: </span>
                                        {service.proof}
                                    </span>
                                </p>
                            )}
                        </div>
                    </>
                )}
            </div>
        </article>
    );
}
