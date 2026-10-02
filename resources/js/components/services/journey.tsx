import { faClipboardList } from '@fortawesome/free-solid-svg-icons/faClipboardList';
import { faCode } from '@fortawesome/free-solid-svg-icons/faCode';
import { faLaptopCode } from '@fortawesome/free-solid-svg-icons/faLaptopCode';
import { faPenRuler } from '@fortawesome/free-solid-svg-icons/faPenRuler';
import { faRocket } from '@fortawesome/free-solid-svg-icons/faRocket';
import { faRotate } from '@fortawesome/free-solid-svg-icons/faRotate';
import { faScrewdriverWrench } from '@fortawesome/free-solid-svg-icons/faScrewdriverWrench';
import { faVial } from '@fortawesome/free-solid-svg-icons/faVial';
import { useRef, useState } from 'react';
import { SplitHeading } from '@/components/motion/split-heading';
import { Icon } from '@/components/ui/icon';
import type { FontAwesomeIconData } from '@/components/ui/icon';
import { gsap, MOTION_OK, ScrollTrigger, useGSAP } from '@/lib/gsap';
import type { ProcessStep } from '@/types/content';

const STEP_ICONS: Record<string, FontAwesomeIconData> = {
    planning: faClipboardList,
    design: faPenRuler,
    development: faLaptopCode,
    testing: faVial,
    deployment: faRocket,
    maintenance: faScrewdriverWrench,
};

/** Wide screens with motion: the pinned, sideways-scrolling journey. */
const PINNED = '(min-width: 64rem) and (prefers-reduced-motion: no-preference)';
/** Everything else with motion: the vertical journey. */
const STACKED =
    '(max-width: 63.99rem) and (prefers-reduced-motion: no-preference)';

function padded(value: number): string {
    return String(value).padStart(2, '0');
}

/**
 * "How we'll work together" on /services: the process as a journey. On wide
 * screens the section pins and the stages slide past sideways, with a
 * progress route, a travelling marker and the stage in focus lighting up.
 * Elsewhere it's a vertical journey whose route draws as you scroll.
 */
export function Journey({ steps }: { steps: ProcessStep[] }) {
    const section = useRef<HTMLElement>(null);
    const [active, setActive] = useState(0);

    useGSAP(
        () => {
            const root = section.current;

            if (!root) {
                return;
            }

            const find = (selector: string) =>
                root.querySelector<HTMLElement>(selector);
            const cards = gsap.utils.toArray<HTMLElement>('[data-stage]', root);
            const mm = gsap.matchMedia();

            const light = (index: number) => {
                cards.forEach((card, position) => {
                    card.dataset.active = String(position === index);
                    card.dataset.passed = String(position < index);
                });
                setActive(index);
            };

            mm.add(PINNED, () => {
                const track = find('[data-track]');
                const pin = find('[data-pin]');
                const fill = find('[data-route-fill]');
                const marker = find('[data-marker]');

                if (!track || !pin) {
                    return;
                }

                const distance = () =>
                    Math.max(0, track.scrollWidth - window.innerWidth);

                const slide = gsap.to(track, {
                    x: () => -distance(),
                    ease: 'none',
                    scrollTrigger: {
                        trigger: pin,
                        start: 'top top',
                        end: () => `+=${distance()}`,
                        pin: true,
                        scrub: 0.6,
                        invalidateOnRefresh: true,
                        onUpdate: (self) => {
                            gsap.set(fill, { scaleX: self.progress });
                            gsap.set(marker, {
                                xPercent: -50,
                                left: `${self.progress * 100}%`,
                            });
                        },
                    },
                });

                // The stage crossing the middle of the screen lights up.
                const triggers = cards.map((card, index) =>
                    ScrollTrigger.create({
                        trigger: card,
                        containerAnimation: slide,
                        start: 'left 60%',
                        end: 'right 40%',
                        onToggle: (self) => self.isActive && light(index),
                    }),
                );

                light(0);

                return () => {
                    triggers.forEach((trigger) => trigger.kill());
                    cards.forEach((card) => {
                        delete card.dataset.active;
                        delete card.dataset.passed;
                    });
                };
            });

            mm.add(STACKED, () => {
                const fill = find('[data-rail-fill]');

                gsap.fromTo(
                    fill,
                    { scaleY: 0 },
                    {
                        scaleY: 1,
                        ease: 'none',
                        scrollTrigger: {
                            trigger: find('[data-track]'),
                            start: 'top 70%',
                            end: 'bottom 60%',
                            scrub: 0.4,
                        },
                    },
                );

                const triggers = cards.map((card, index) => {
                    gsap.fromTo(
                        card,
                        { autoAlpha: 0, y: 40 },
                        {
                            autoAlpha: 1,
                            y: 0,
                            duration: 0.8,
                            ease: 'power3.out',
                            scrollTrigger: {
                                trigger: card,
                                start: 'top 85%',
                                once: true,
                            },
                        },
                    );

                    return ScrollTrigger.create({
                        trigger: card,
                        start: 'top 60%',
                        end: 'bottom 40%',
                        onToggle: (self) => self.isActive && light(index),
                    });
                });

                return () => {
                    triggers.forEach((trigger) => trigger.kill());
                    cards.forEach((card) => {
                        delete card.dataset.active;
                        delete card.dataset.passed;
                    });
                };
            });

            // Heading lines are handled by SplitHeading; the intro rises.
            mm.add(MOTION_OK, () => {
                gsap.fromTo(
                    root.querySelectorAll('[data-journey-intro]'),
                    { autoAlpha: 0, y: 16 },
                    {
                        autoAlpha: 1,
                        y: 0,
                        duration: 0.7,
                        stagger: 0.08,
                        ease: 'power3.out',
                        scrollTrigger: {
                            trigger: root,
                            start: 'top 80%',
                            once: true,
                        },
                    },
                );
            });

            return () => mm.revert();
        },
        { scope: section },
    );

    return (
        <section
            ref={section}
            id="process"
            aria-labelledby="journey-heading"
            className="relative py-20 sm:py-28 lg:motion-safe:py-0"
        >
            <div
                data-pin
                className="relative lg:motion-safe:flex lg:motion-safe:min-h-svh lg:motion-safe:flex-col lg:motion-safe:justify-center lg:motion-safe:overflow-hidden lg:motion-safe:py-16"
            >
                <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-4 text-center sm:px-6 md:flex-row md:items-end md:justify-between md:text-left">
                    <div className="max-w-2xl">
                        <SplitHeading
                            as="h2"
                            id="journey-heading"
                            className="text-3xl font-semibold tracking-tight sm:text-4xl"
                        >
                            How we'll work together
                        </SplitHeading>
                        <p
                            data-journey-intro
                            className="mt-4 text-pretty text-muted-foreground sm:text-lg"
                        >
                            Six stages from idea to launch, and beyond. Planning
                            and support come with unlimited iterations.
                        </p>
                    </div>
                    <p
                        data-journey-intro
                        aria-hidden
                        className="hidden items-baseline gap-2 text-sm text-muted-foreground tabular-nums lg:motion-safe:flex"
                    >
                        Stage
                        <span
                            key={active}
                            className="inline-block animate-in text-3xl font-semibold text-foreground duration-300 fade-in slide-in-from-bottom-3 motion-reduce:animate-none"
                        >
                            {padded(active + 1)}
                        </span>
                        / {padded(steps.length)}
                    </p>
                </div>

                {/* The route: dotted, filling with teal as you travel. */}
                <div
                    aria-hidden
                    className="relative mx-auto mt-14 hidden h-3 w-[calc(100%-3rem)] max-w-6xl items-center lg:motion-safe:flex"
                >
                    <span className="absolute inset-x-0 top-1/2 border-t-2 border-dashed border-border" />
                    <span
                        data-route-fill
                        className="absolute inset-x-0 top-1/2 h-0.5 origin-left -translate-y-px scale-x-0 bg-brand"
                    />
                    <span
                        data-marker
                        className="absolute top-1/2 left-0 grid size-5 -translate-y-1/2 place-items-center"
                    >
                        <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand/50 motion-reduce:hidden" />
                        <span className="relative size-3 rounded-full bg-brand shadow-[0_0_16px_4px] shadow-brand/60" />
                    </span>
                </div>

                <div className="relative mt-12 lg:motion-safe:mt-10">
                    {/* Vertical route for stacked layouts. */}
                    <span
                        aria-hidden
                        className="absolute top-2 bottom-2 left-[1.6rem] w-px border-l-2 border-dashed border-border sm:left-[2.1rem] lg:motion-safe:hidden"
                    >
                        <span
                            data-rail-fill
                            className="absolute top-0 -left-0.5 h-full w-0.5 origin-top bg-brand"
                        />
                    </span>

                    <ol
                        data-track
                        className="relative flex flex-col gap-6 px-4 pl-12 sm:px-6 sm:pl-16 lg:motion-safe:w-max lg:motion-safe:flex-row lg:motion-safe:gap-8 lg:motion-safe:px-[max(1.5rem,calc((100vw-72rem)/2+1.5rem))]"
                    >
                        {steps.map((step, index) => (
                            <li
                                key={step.title}
                                data-stage
                                className="group/stage relative lg:motion-safe:w-[22rem]"
                            >
                                <span
                                    aria-hidden
                                    className="absolute top-7 -left-[1.9rem] size-3 rounded-full border-2 border-brand bg-background sm:-left-[2.3rem] lg:motion-safe:hidden"
                                />
                                <article className="relative h-full overflow-hidden rounded-3xl border bg-card/70 p-6 transition-all duration-500 group-data-[active=true]/stage:-translate-y-2 group-data-[active=true]/stage:border-brand/60 group-data-[active=true]/stage:bg-card group-data-[active=true]/stage:shadow-2xl group-data-[active=true]/stage:shadow-brand/15 group-data-[passed=true]/stage:opacity-70 sm:p-7">
                                    <span
                                        aria-hidden
                                        className="pointer-events-none absolute -top-24 -right-24 size-56 rounded-full bg-brand/0 blur-3xl transition-colors duration-700 group-data-[active=true]/stage:bg-brand/20"
                                    />
                                    <div className="relative flex items-start justify-between gap-4">
                                        <span className="grid size-12 place-items-center rounded-2xl bg-brand/10 text-brand transition-transform duration-500 group-data-[active=true]/stage:scale-110 group-data-[active=true]/stage:-rotate-6">
                                            <Icon
                                                icon={
                                                    STEP_ICONS[step.icon] ??
                                                    faCode
                                                }
                                                className="size-5"
                                            />
                                        </span>
                                        <span
                                            aria-hidden
                                            className="text-5xl leading-none font-semibold text-transparent tabular-nums transition-colors duration-500 [-webkit-text-stroke:1px_var(--color-brand)] group-data-[active=true]/stage:text-brand"
                                        >
                                            {padded(index + 1)}
                                        </span>
                                    </div>

                                    <h3 className="relative mt-6 text-xl font-semibold tracking-tight">
                                        <span className="sr-only">
                                            Stage {index + 1}:{' '}
                                        </span>
                                        {step.title}
                                    </h3>
                                    <p className="relative mt-2.5 text-sm leading-relaxed text-pretty text-muted-foreground">
                                        {step.summary}
                                    </p>

                                    <p className="relative mt-5 inline-flex rounded-full border bg-background/60 px-3 py-1 text-xs">
                                        <span className="font-medium text-brand">
                                            You get:
                                        </span>
                                        &nbsp;{step.deliverable}
                                    </p>

                                    {step.loop && (
                                        <p className="relative mt-3 flex w-fit items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-medium text-brand">
                                            <Icon
                                                icon={faRotate}
                                                className="size-3 animate-[spin_4s_linear_infinite] motion-reduce:animate-none"
                                            />
                                            {step.loop}
                                        </p>
                                    )}
                                </article>
                            </li>
                        ))}
                    </ol>
                </div>
            </div>
        </section>
    );
}
