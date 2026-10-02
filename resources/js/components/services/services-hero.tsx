import { faArrowDown } from '@fortawesome/free-solid-svg-icons/faArrowDown';
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons/faPaperPlane';
import { Link } from '@inertiajs/react';
import { useRef } from 'react';
import { Magnetic } from '@/components/motion/magnetic';
import { HIRE_ME_HREF } from '@/components/site/nav-items';
import { Icon } from '@/components/ui/icon';
import { addFrameLoad, countUp } from '@/components/work/animations';
import { BrowserFrame } from '@/components/work/project-media';
import { gsap, MOTION_OK, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { cn } from '@/lib/utils';
import type { Impact, ProjectSummary } from '@/types/content';

const WORDS = [
    'websites',
    'web apps',
    'online stores',
    'booking systems',
    'AI chatbots',
];

/** Collage frames, back to front, with their resting tilt and depth. */
const COLLAGE = [
    {
        slug: 'msit-cms',
        className: 'left-0 top-4 w-[62%] -rotate-6',
        depth: 10,
    },
    {
        slug: 'cardiwan',
        className: 'right-0 top-0 w-[64%] rotate-3',
        depth: 18,
    },
    {
        slug: 'w3-techiez',
        className: 'left-[14%] bottom-0 w-[72%] -rotate-1',
        depth: 28,
    },
];

type ServicesHeroProps = {
    projects: ProjectSummary[];
    impact: Impact[];
};

export function ServicesHero({ projects, impact }: ServicesHeroProps) {
    const root = useRef<HTMLElement>(null);
    const frames = COLLAGE.map((frame) => ({
        ...frame,
        project: projects.find((project) => project.slug === frame.slug),
    })).filter((frame) => frame.project);
    const [speed, , users] = impact;
    const stats = [
        { value: projects.length, suffix: '', label: 'live products shipped' },
        ...(users
            ? [
                  {
                      value: users.value,
                      suffix: users.suffix,
                      label: 'monthly users served',
                  },
              ]
            : []),
        ...(speed
            ? [
                  {
                      value: speed.value,
                      suffix: speed.suffix,
                      label: 'faster APIs delivered',
                  },
              ]
            : []),
        { value: 24, suffix: 'h', label: 'reply time, every message' },
    ];

    useGSAP(
        () => {
            const scope = root.current;

            if (!scope) {
                return;
            }

            const mm = gsap.matchMedia();

            mm.add(MOTION_OK, () => {
                const q = gsap.utils.selector(scope);

                // Entrance: headline lines, supporting copy, then the collage
                // frames "load" one after another.
                const intro = gsap.timeline({
                    defaults: { ease: 'power3.out' },
                    delay: 0.1,
                });
                intro.fromTo(
                    q('[data-hero-line]'),
                    { yPercent: 110 },
                    {
                        yPercent: 0,
                        duration: 1,
                        stagger: 0.1,
                        ease: 'expo.out',
                    },
                );
                intro.fromTo(
                    q('[data-hero-item]'),
                    { autoAlpha: 0, y: 20 },
                    { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.08 },
                    0.35,
                );
                q('[data-collage-frame]').forEach((frame, index) =>
                    addFrameLoad(intro, frame, 0.4 + index * 0.25),
                );
                q('[data-stat]').forEach((stat) =>
                    countUp(
                        intro,
                        stat,
                        0,
                        Number(stat.dataset.stat),
                        (value) =>
                            `${value.toLocaleString('en-US')}${stat.dataset.suffix ?? ''}`,
                        0.8,
                    ),
                );

                // The collage floats gently, each frame on its own rhythm.
                q('[data-float]').forEach((frame, index) =>
                    gsap.to(frame, {
                        y: index % 2 === 0 ? -10 : 10,
                        duration: 3 + index * 0.6,
                        ease: 'sine.inOut',
                        yoyo: true,
                        repeat: -1,
                    }),
                );

                // Word rotator: every word is already rendered (stacked in
                // one grid cell); letters of the current word flip out and
                // the next word's letters flip in.
                const words = q('[data-rotator-word]');
                let index = 0;

                gsap.set(words.slice(1), { autoAlpha: 0 });

                const swap = (): gsap.core.Timeline => {
                    const outgoing = words[index];
                    index = (index + 1) % words.length;
                    const incoming = words[index];

                    return gsap
                        .timeline()
                        .to(outgoing.querySelectorAll('[data-letter]'), {
                            rotationX: 90,
                            autoAlpha: 0,
                            y: -10,
                            transformPerspective: 400,
                            duration: 0.3,
                            stagger: 0.02,
                            ease: 'power2.in',
                        })
                        .set(outgoing, { autoAlpha: 0 })
                        .set(incoming, { autoAlpha: 1 })
                        .fromTo(
                            incoming.querySelectorAll('[data-letter]'),
                            {
                                rotationX: -90,
                                autoAlpha: 0,
                                y: 10,
                                transformPerspective: 400,
                            },
                            {
                                rotationX: 0,
                                autoAlpha: 1,
                                y: 0,
                                duration: 0.45,
                                stagger: 0.025,
                                ease: 'back.out(2)',
                            },
                        )
                        .add(() =>
                            words.forEach((word, position) =>
                                word.setAttribute(
                                    'aria-hidden',
                                    position === index ? 'false' : 'true',
                                ),
                            ),
                        );
                };

                // Wait, swap, wait, swap… as a chain of delayed calls, so it
                // can be paused at any point.
                let waiter: gsap.core.Tween | null = null;
                let current: gsap.core.Timeline | null = null;
                const next = () => {
                    const cycle = swap();
                    current = cycle;
                    cycle.eventCallback('onComplete', () => {
                        waiter = gsap.delayedCall(2.2, next);
                    });
                };
                waiter = gsap.delayedCall(2.4, next);

                // Pause everything that loops while the hero is off screen or
                // the tab is hidden.
                const loops = (): gsap.core.Animation[] => [
                    ...(waiter ? [waiter] : []),
                    ...(current ? [current] : []),
                    ...gsap.getTweensOf(q('[data-float]')),
                ];
                const setPlaying = (isPlaying: boolean) =>
                    loops().forEach((loop) =>
                        isPlaying ? loop.resume() : loop.pause(),
                    );

                const trigger = ScrollTrigger.create({
                    trigger: scope,
                    start: 'top bottom',
                    end: 'bottom top',
                    onToggle: (self) => setPlaying(self.isActive),
                });
                const onVisibility = () => setPlaying(!document.hidden);
                document.addEventListener('visibilitychange', onVisibility);

                return () => {
                    waiter?.kill();
                    current?.kill();
                    trigger.kill();
                    document.removeEventListener(
                        'visibilitychange',
                        onVisibility,
                    );
                };
            });

            // With a mouse, the collage layers shift at different depths.
            mm.add(
                '(pointer: fine) and (prefers-reduced-motion: no-preference) and (min-width: 64rem)',
                () => {
                    const layers = gsap.utils
                        .toArray<HTMLElement>('[data-depth]', scope)
                        .map((layer) => ({
                            depth: Number(layer.dataset.depth),
                            x: gsap.quickTo(layer, 'x', {
                                duration: 0.8,
                                ease: 'power3.out',
                            }),
                            y: gsap.quickTo(layer, 'y', {
                                duration: 0.8,
                                ease: 'power3.out',
                            }),
                        }));

                    const onMove = (event: PointerEvent) => {
                        const box = scope.getBoundingClientRect();
                        const x = (event.clientX - box.left) / box.width - 0.5;
                        const y = (event.clientY - box.top) / box.height - 0.5;
                        layers.forEach((layer) => {
                            layer.x(x * layer.depth);
                            layer.y(y * layer.depth);
                        });
                    };

                    scope.addEventListener('pointermove', onMove);

                    return () =>
                        scope.removeEventListener('pointermove', onMove);
                },
            );

            return () => mm.revert();
        },
        { scope: root },
    );

    return (
        <section
            ref={root}
            aria-labelledby="services-hero-heading"
            className="relative mx-auto grid max-w-6xl items-center gap-14 overflow-x-clip px-4 pt-12 pb-16 sm:px-6 sm:pt-20 lg:grid-cols-12 lg:gap-10 lg:pb-24"
        >
            <div className="text-center lg:col-span-6 lg:text-left">
                <p
                    data-hero-item
                    className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-medium text-brand sm:text-sm"
                >
                    <span className="relative flex size-1.5">
                        <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand opacity-60 motion-reduce:hidden" />
                        <span className="relative inline-flex size-1.5 rounded-full bg-brand" />
                    </span>
                    Taking on new projects
                </p>

                <h1
                    id="services-hero-heading"
                    className="mt-6 text-[clamp(2.2rem,4.2vw+0.8rem,4rem)] leading-[1.06] font-semibold tracking-tight"
                >
                    <span
                        data-hero-item
                        className="mb-4 block text-base font-medium tracking-normal text-brand sm:text-lg"
                    >
                        Web development services
                    </span>
                    <span className="sr-only">: </span>
                    <span className="block overflow-hidden pb-1">
                        <span data-hero-line className="block">
                            I build
                        </span>
                    </span>{' '}
                    <span className="block overflow-hidden pb-1">
                        <span data-hero-line className="block">
                            <span className="relative inline-grid whitespace-nowrap text-brand">
                                {WORDS.map((word, position) => (
                                    <span
                                        key={word}
                                        data-rotator-word
                                        aria-hidden={position !== 0}
                                        className={cn(
                                            'col-start-1 row-start-1',
                                            position !== 0 && 'invisible',
                                        )}
                                    >
                                        {Array.from(word).map((letter, i) => (
                                            <span
                                                key={i}
                                                data-letter
                                                className="inline-block"
                                            >
                                                {letter === ' '
                                                    ? '\u00a0'
                                                    : letter}
                                            </span>
                                        ))}
                                        {/* Keeps the words apart in the page text. */}
                                        <span className="sr-only">
                                            {position < WORDS.length - 2
                                                ? ', '
                                                : position === WORDS.length - 2
                                                  ? ' and '
                                                  : ''}
                                        </span>
                                    </span>
                                ))}
                            </span>
                        </span>
                    </span>{' '}
                    <span className="block overflow-hidden pb-1">
                        <span data-hero-line className="block">
                            built to last.
                        </span>
                    </span>
                </h1>

                <p
                    data-hero-item
                    className="mx-auto mt-6 max-w-xl text-lg text-pretty text-muted-foreground lg:mx-0"
                >
                    Laravel, React and AI, from the first idea to launch and
                    beyond. Clean code, clear updates, and a product you fully
                    own.
                </p>

                <div
                    data-hero-item
                    className="mt-9 flex flex-wrap justify-center gap-3 lg:justify-start"
                >
                    <Magnetic>
                        <Link
                            href={HIRE_ME_HREF}
                            className="inline-flex h-12 items-center gap-2.5 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-colors hover:bg-primary/85 active:scale-[0.98]"
                        >
                            <Icon icon={faPaperPlane} className="size-4" />
                            Hire me
                        </Link>
                    </Magnetic>
                    <Magnetic>
                        <a
                            href="#services"
                            className="group inline-flex h-12 items-center gap-2.5 rounded-full border px-6 text-sm font-medium transition-colors hover:border-brand hover:text-brand active:scale-[0.98]"
                        >
                            See services
                            <Icon
                                icon={faArrowDown}
                                className="size-3 transition-transform group-hover:translate-y-0.5"
                            />
                        </a>
                    </Magnetic>
                </div>

                <dl
                    data-hero-item
                    className="mx-auto mt-10 grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-4 lg:mx-0"
                >
                    {stats.map((stat) => (
                        <div
                            key={stat.label}
                            className="rounded-2xl border bg-card/60 px-3 py-3 text-left"
                        >
                            <dd
                                data-stat={stat.value}
                                data-suffix={stat.suffix}
                                className="text-shine text-xl font-semibold tracking-tight tabular-nums sm:text-2xl"
                            >
                                {stat.value.toLocaleString('en-US')}
                                {stat.suffix}
                            </dd>
                            <dt className="mt-0.5 text-[0.6875rem] leading-snug text-muted-foreground">
                                {stat.label}
                            </dt>
                        </div>
                    ))}
                </dl>
            </div>

            {/* Collage of real projects */}
            <div
                aria-hidden
                className="relative mx-auto aspect-[5/4] w-full max-w-md lg:col-span-6 lg:max-w-none"
            >
                <div
                    aria-hidden
                    className="absolute inset-[12%] rounded-full bg-brand/20 blur-3xl"
                />
                {frames.map((frame, index) => (
                    <div
                        key={frame.slug}
                        data-depth={frame.depth}
                        className={cn(
                            'absolute',
                            frame.className,
                            index < frames.length - 1 && 'max-lg:hidden',
                            index === frames.length - 1 &&
                                'max-lg:inset-x-0 max-lg:top-[10%] max-lg:bottom-auto max-lg:mx-auto max-lg:w-full max-lg:rotate-0',
                        )}
                    >
                        <div data-float>
                            <div data-collage-frame>
                                <BrowserFrame
                                    project={frame.project!}
                                    sizes="(min-width: 1024px) 380px, 90vw"
                                    eager
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
