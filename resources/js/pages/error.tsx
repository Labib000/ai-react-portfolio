import { faArrowRight } from '@fortawesome/free-solid-svg-icons/faArrowRight';
import { faHouse } from '@fortawesome/free-solid-svg-icons/faHouse';
import { faRotateRight } from '@fortawesome/free-solid-svg-icons/faRotateRight';
import { Link } from '@inertiajs/react';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { useRef } from 'react';
import ResumeController from '@/actions/App/Http/Controllers/ResumeController';
import ServicesController from '@/actions/App/Http/Controllers/ServicesController';
import WorkController from '@/actions/App/Http/Controllers/WorkController';
import { Magnetic } from '@/components/motion/magnetic';
import { SeoHead } from '@/components/site/seo-head';
import { Icon } from '@/components/ui/icon';
import { gsap, MOTION_OK, useGSAP } from '@/lib/gsap';
import { cn } from '@/lib/utils';
import { home } from '@/routes';
import type { PageMeta } from '@/types/content';

if (typeof window !== 'undefined') {
    gsap.registerPlugin(ScrambleTextPlugin);
}

type ErrorProps = {
    meta: PageMeta;
    status: number;
    method: string;
    path: string;
    /** The closest real page to a mistyped URL (404 only). */
    suggestion: string | null;
};

type Copy = {
    reason: string;
    title: string;
    description: string;
    route: string;
    /** Reload instead of going home: the page itself is fine to retry. */
    retry?: boolean;
};

const COPY: Record<number, Copy> = {
    403: {
        reason: 'Forbidden',
        title: "You can't open this page",
        description:
            "This page isn't public. Everything I've built is on the pages below.",
        route: 'Access denied',
    },
    404: {
        reason: 'Not Found',
        title: "This page doesn't exist",
        description:
            'The link may be broken, or the page has moved. Here is where everything lives now.',
        route: 'No matching route',
    },
    419: {
        reason: 'Page Expired',
        title: 'This page expired',
        description:
            'It was open for a while, so the form went stale. Reload and try again.',
        route: 'Session token expired',
        retry: true,
    },
    429: {
        reason: 'Too Many Requests',
        title: 'Slow down a little',
        description:
            'That was a lot of requests in a short time. Wait a minute, then try again.',
        route: 'Rate limit reached',
        retry: true,
    },
    500: {
        reason: 'Server Error',
        title: 'Something broke on my end',
        description:
            "It's not you. The error has been logged and I'll fix it. Try again in a moment.",
        route: 'Unhandled exception',
        retry: true,
    },
    503: {
        reason: 'Service Unavailable',
        title: 'Back in a few minutes',
        description:
            "I'm shipping an update right now. The site will be back shortly.",
        route: 'Maintenance mode',
        retry: true,
    },
};

const ROUTES = [
    { path: home.url(), label: 'Home' },
    { path: WorkController.index.url(), label: 'Projects and case studies' },
    { path: ServicesController.url(), label: 'What I can build for you' },
    { path: ResumeController.url(), label: 'Experience and résumé' },
];

/**
 * The site's page for HTTP errors. The status code scrambles into place and
 * glitches, and a devtools-style trace shows the failed request, the closest
 * real page and the routes that do exist.
 */
export default function ErrorPage({
    meta,
    status,
    method,
    path,
    suggestion,
}: ErrorProps) {
    const root = useRef<HTMLElement>(null);
    const copy = COPY[status] ?? COPY[500];
    const digits = String(status).split('');

    useGSAP(
        () => {
            const scope = root.current;

            if (!scope) {
                return;
            }

            const q = gsap.utils.selector(scope);
            const mm = gsap.matchMedia();

            mm.add(MOTION_OK, () => {
                const intro = gsap.timeline({
                    defaults: { ease: 'power3.out' },
                    delay: 0.15,
                });

                // Digits rise out of a mask while their text decodes.
                q('[data-digit]').forEach((digit, index) => {
                    const final = digit.dataset.digit ?? '';
                    intro
                        .fromTo(
                            digit,
                            { yPercent: 100 },
                            { yPercent: 0, duration: 0.9, ease: 'expo.out' },
                            index * 0.12,
                        )
                        .to(
                            digit.querySelectorAll('[data-face]'),
                            {
                                duration: 1.1,
                                scrambleText: {
                                    text: final,
                                    chars: '0123456789#%&/?!',
                                    revealDelay: 0.4,
                                    speed: 0.6,
                                },
                            },
                            index * 0.12,
                        );
                });

                intro.add(glitch(q), 1.3);

                intro.fromTo(
                    q('[data-copy]'),
                    { autoAlpha: 0, y: 20 },
                    { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.08 },
                    0.4,
                );

                // The trace card: the card rises, the request bar runs and
                // fails, then each line prints like a terminal.
                intro
                    .fromTo(
                        q('[data-trace]'),
                        { autoAlpha: 0, y: 40, rotationX: 12 },
                        {
                            autoAlpha: 1,
                            y: 0,
                            rotationX: 0,
                            transformPerspective: 1000,
                            duration: 1,
                            ease: 'expo.out',
                        },
                        0.5,
                    )
                    .fromTo(
                        q('[data-request-bar]'),
                        { scaleX: 0 },
                        { scaleX: 1, duration: 0.9, ease: 'power2.inOut' },
                        0.9,
                    )
                    .fromTo(
                        q('[data-request-fail]'),
                        { autoAlpha: 0 },
                        { autoAlpha: 1, duration: 0.2 },
                        1.8,
                    )
                    .fromTo(
                        q('[data-status-chip]'),
                        { scale: 0.6, autoAlpha: 0 },
                        {
                            scale: 1,
                            autoAlpha: 1,
                            duration: 0.45,
                            ease: 'back.out(3)',
                        },
                        1.8,
                    )
                    .fromTo(
                        q('[data-trace-line]'),
                        { autoAlpha: 0, x: -10 },
                        { autoAlpha: 1, x: 0, duration: 0.35, stagger: 0.08 },
                        1.95,
                    )
                    .fromTo(
                        q('[data-suggestion]'),
                        { scale: 0.96 },
                        {
                            scale: 1,
                            duration: 0.6,
                            ease: 'elastic.out(1, 0.5)',
                        },
                        '>-0.1',
                    );
            });

            // With a mouse: the digits lean away from the cursor, and
            // hovering them sets off another glitch.
            mm.add(
                '(pointer: fine) and (prefers-reduced-motion: no-preference)',
                () => {
                    const code = q('[data-code]')[0];

                    if (!code) {
                        return;
                    }

                    const layers = q('[data-depth]').map((layer) => ({
                        depth: Number(layer.dataset.depth),
                        x: gsap.quickTo(layer, 'x', {
                            duration: 0.9,
                            ease: 'power3.out',
                        }),
                        y: gsap.quickTo(layer, 'y', {
                            duration: 0.9,
                            ease: 'power3.out',
                        }),
                    }));

                    const onMove = (event: PointerEvent) => {
                        const x = event.clientX / window.innerWidth - 0.5;
                        const y = event.clientY / window.innerHeight - 0.5;
                        layers.forEach((layer) => {
                            layer.x(x * layer.depth);
                            layer.y(y * layer.depth);
                        });
                    };

                    let running: gsap.core.Timeline | null = null;
                    const onEnter = () => {
                        if (!running?.isActive()) {
                            running = glitch(q);
                        }
                    };

                    window.addEventListener('pointermove', onMove);
                    code.addEventListener('pointerenter', onEnter);

                    return () => {
                        window.removeEventListener('pointermove', onMove);
                        code.removeEventListener('pointerenter', onEnter);
                    };
                },
            );

            return () => mm.revert();
        },
        { scope: root },
    );

    return (
        <>
            <SeoHead meta={{ ...meta, description: copy.description }} />

            <section
                ref={root}
                aria-labelledby="error-heading"
                className="relative mx-auto grid min-h-[calc(100svh-4rem)] max-w-6xl grid-cols-1 items-center gap-12 overflow-x-clip px-4 py-14 sm:px-6 lg:grid-cols-12 lg:gap-10 lg:py-20"
            >
                <div className="min-w-0 text-center lg:col-span-7 lg:text-left">
                    {/* The big status code: three stacked faces per digit,
                        two coloured ones offset by the glitch. */}
                    <p
                        data-code
                        aria-hidden
                        className="relative inline-flex cursor-default text-[clamp(6.5rem,24vw,13rem)] leading-[0.85] font-semibold tracking-tighter select-none"
                    >
                        <span
                            data-depth="-14"
                            className="pointer-events-none absolute inset-[15%] -z-10 rounded-full bg-brand/20 blur-3xl"
                        />
                        {digits.map((digit, index) => (
                            <span
                                key={index}
                                data-depth={10 + index * 8}
                                className="block overflow-hidden pb-[0.06em]"
                            >
                                <span
                                    data-digit={digit}
                                    className="relative block"
                                >
                                    <span
                                        data-face
                                        data-glitch="brand"
                                        className="absolute inset-0 text-brand opacity-0 mix-blend-multiply dark:mix-blend-screen"
                                    >
                                        {digit}
                                    </span>
                                    <span
                                        data-face
                                        data-glitch="amber"
                                        className="absolute inset-0 text-[#e0a84a] opacity-0 mix-blend-multiply dark:mix-blend-screen"
                                    >
                                        {digit}
                                    </span>
                                    <span
                                        data-face
                                        className={cn(
                                            'relative block tabular-nums',
                                            index === 1
                                                ? 'text-shine'
                                                : 'text-foreground',
                                        )}
                                    >
                                        {digit}
                                    </span>
                                </span>
                            </span>
                        ))}
                    </p>

                    <h1
                        id="error-heading"
                        data-copy
                        className="mt-6 text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-5xl"
                    >
                        <span className="sr-only">Error {status}: </span>
                        {copy.title}
                    </h1>
                    <p
                        data-copy
                        className="mx-auto mt-4 max-w-lg text-pretty text-muted-foreground sm:text-lg lg:mx-0"
                    >
                        {copy.description}
                    </p>

                    <div
                        data-copy
                        className="mt-9 flex flex-wrap justify-center gap-3 lg:justify-start"
                    >
                        <Magnetic>
                            {copy.retry ? (
                                <button
                                    type="button"
                                    onClick={() => window.location.reload()}
                                    className="inline-flex h-12 items-center gap-2.5 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-colors hover:bg-primary/85 active:scale-[0.98]"
                                >
                                    <Icon
                                        icon={faRotateRight}
                                        className="size-4"
                                    />
                                    Try again
                                </button>
                            ) : (
                                <Link
                                    href={suggestion ?? home.url()}
                                    className="inline-flex h-12 items-center gap-2.5 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-colors hover:bg-primary/85 active:scale-[0.98]"
                                >
                                    <Icon
                                        icon={
                                            suggestion ? faArrowRight : faHouse
                                        }
                                        className="size-4"
                                    />
                                    {suggestion
                                        ? `Go to ${suggestion}`
                                        : 'Back to home'}
                                </Link>
                            )}
                        </Magnetic>
                        {(copy.retry || suggestion) && (
                            <Magnetic>
                                <Link
                                    href={home.url()}
                                    className="inline-flex h-12 items-center gap-2.5 rounded-full border px-6 text-sm font-medium transition-colors hover:border-brand hover:text-brand active:scale-[0.98]"
                                >
                                    <Icon icon={faHouse} className="size-4" />
                                    Home
                                </Link>
                            </Magnetic>
                        )}
                    </div>
                </div>

                <TraceCard
                    status={status}
                    reason={copy.reason}
                    route={copy.route}
                    method={method}
                    path={path}
                    suggestion={suggestion}
                />
            </section>
        </>
    );
}

/**
 * A short RGB-split glitch on the status code: the coloured faces jump
 * sideways through clipped slices, then settle back behind the digit.
 */
function glitch(q: (selector: string) => HTMLElement[]): gsap.core.Timeline {
    const slices = [
        'inset(10% 0 60% 0)',
        'inset(55% 0 20% 0)',
        'inset(30% 0 45% 0)',
        'inset(75% 0 5% 0)',
        'inset(0% 0 80% 0)',
    ];
    const timeline = gsap.timeline();

    (['brand', 'amber'] as const).forEach((colour, layer) => {
        const faces = q(`[data-glitch="${colour}"]`);
        const direction = layer === 0 ? -1 : 1;

        timeline.set(faces, { opacity: 0.85 }, 0);
        slices.forEach((slice, step) =>
            timeline.set(
                faces,
                {
                    clipPath: slice,
                    x: direction * gsap.utils.random(4, 14),
                    y: gsap.utils.random(-3, 3),
                },
                step * 0.055,
            ),
        );
        timeline.set(
            faces,
            { opacity: 0, x: 0, y: 0, clipPath: 'inset(0% 0 0% 0)' },
            slices.length * 0.055,
        );
    });

    timeline.fromTo(
        q('[data-digit]'),
        { skewX: 0 },
        {
            skewX: () => gsap.utils.random(-8, 8),
            duration: 0.05,
            repeat: 3,
            yoyo: true,
            ease: 'none',
        },
        0,
    );

    return timeline;
}

function TraceCard({
    status,
    reason,
    route,
    method,
    path,
    suggestion,
}: {
    status: number;
    reason: string;
    route: string;
    method: string;
    path: string;
    suggestion: string | null;
}) {
    return (
        <div className="min-w-0 lg:col-span-5">
            <div
                data-trace
                className="relative mx-auto w-full max-w-md overflow-hidden rounded-2xl border bg-card font-mono text-xs shadow-2xl shadow-black/30 sm:text-[0.8125rem]"
            >
                {/* Window bar */}
                <div
                    aria-hidden
                    className="flex items-center gap-3 border-b px-4 py-2.5"
                >
                    <span className="flex gap-1.5">
                        <span className="size-2.5 rounded-full bg-[#ff5f57]/80" />
                        <span className="size-2.5 rounded-full bg-[#febc2e]/80" />
                        <span className="size-2.5 rounded-full bg-[#28c840]/80" />
                    </span>
                    <span className="font-sans text-xs text-muted-foreground">
                        Network
                    </span>
                </div>

                {/* The failed request */}
                <div className="border-b px-4 py-4">
                    <div className="flex items-center gap-3">
                        <span className="shrink-0 font-semibold text-brand">
                            {method}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-foreground">
                            {path}
                        </span>
                        <span
                            data-status-chip
                            className="shrink-0 rounded-md bg-red-500/15 px-2 py-0.5 font-semibold text-red-600 tabular-nums dark:text-red-400"
                        >
                            {status}
                        </span>
                    </div>
                    <span
                        aria-hidden
                        className="relative mt-3 block h-1.5 overflow-hidden rounded-full bg-muted"
                    >
                        <span
                            data-request-bar
                            className="absolute inset-0 origin-left rounded-full bg-brand/60"
                        />
                        <span
                            data-request-fail
                            className="absolute inset-0 rounded-full bg-red-500/70"
                        />
                    </span>
                </div>

                <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-2 px-4 py-4">
                    <dt data-trace-line className="text-muted-foreground">
                        Status
                    </dt>
                    <dd data-trace-line className="text-foreground">
                        {status} {reason}
                    </dd>
                    <dt data-trace-line className="text-muted-foreground">
                        Route
                    </dt>
                    <dd data-trace-line className="text-foreground">
                        {route}
                    </dd>
                    {suggestion && (
                        <>
                            <dt
                                data-trace-line
                                className="text-muted-foreground"
                            >
                                Did you mean
                            </dt>
                            <dd data-trace-line>
                                <Link
                                    data-suggestion
                                    href={suggestion}
                                    className="inline-flex items-center gap-2 rounded-md bg-brand/15 px-2 py-0.5 font-semibold text-brand transition-colors hover:bg-brand hover:text-primary-foreground"
                                >
                                    {suggestion}
                                    <Icon
                                        icon={faArrowRight}
                                        className="size-2.5"
                                    />
                                </Link>
                            </dd>
                        </>
                    )}
                </dl>

                {/* Routes that do exist */}
                <nav
                    aria-label="Pages on this site"
                    className="border-t bg-background/40 px-4 py-4"
                >
                    <p data-trace-line className="text-muted-foreground">
                        <span className="text-brand">$</span> php artisan
                        route:list
                    </p>
                    <ul className="mt-3 grid gap-1">
                        {ROUTES.map((item) => (
                            <li key={item.path} data-trace-line>
                                <Link
                                    href={item.path}
                                    prefetch
                                    className="group -mx-2 flex items-center gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-brand/10"
                                >
                                    <span className="w-8 shrink-0 text-brand">
                                        GET
                                    </span>
                                    <span className="w-20 shrink-0 text-foreground">
                                        {item.path}
                                    </span>
                                    <span className="min-w-0 flex-1 truncate font-sans text-muted-foreground transition-colors group-hover:text-foreground">
                                        {item.label}
                                    </span>
                                    <Icon
                                        icon={faArrowRight}
                                        className="size-2.5 -translate-x-1 text-brand opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100"
                                    />
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>
            </div>
        </div>
    );
}
