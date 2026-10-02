import { faClipboardList } from '@fortawesome/free-solid-svg-icons/faClipboardList';
import { faCode } from '@fortawesome/free-solid-svg-icons/faCode';
import { faLaptopCode } from '@fortawesome/free-solid-svg-icons/faLaptopCode';
import { faPenRuler } from '@fortawesome/free-solid-svg-icons/faPenRuler';
import { faRocket } from '@fortawesome/free-solid-svg-icons/faRocket';
import { faRotate } from '@fortawesome/free-solid-svg-icons/faRotate';
import { faScrewdriverWrench } from '@fortawesome/free-solid-svg-icons/faScrewdriverWrench';
import { faVial } from '@fortawesome/free-solid-svg-icons/faVial';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { useRef } from 'react';
import type { CSSProperties } from 'react';
import { SplitHeading } from '@/components/motion/split-heading';
import { Icon } from '@/components/ui/icon';
import type { FontAwesomeIconData } from '@/components/ui/icon';
import { gsap, MOTION_OK, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { cn } from '@/lib/utils';
import type { ProcessStep } from '@/types/content';

if (typeof window !== 'undefined') {
    gsap.registerPlugin(DrawSVGPlugin, MotionPathPlugin);
}

type ProcessSectionProps = {
    steps: ProcessStep[];
};

const stepIcons: Record<string, FontAwesomeIconData> = {
    planning: faClipboardList,
    design: faPenRuler,
    development: faLaptopCode,
    testing: faVial,
    deployment: faRocket,
    maintenance: faScrewdriverWrench,
};

/**
 * How far each step moves right on wide screens, as a percentage of the
 * list width. With 6 steps at 46% wide, the last one ends at the right edge.
 */
const STEP_SHIFT = 10.8;
const STEP_WIDTH = 46;

/** Where the arrows start and end, as a percentage of a step's width. */
const ARROW_START = 12;
const ARROW_END = ARROW_START + (STEP_SHIFT / STEP_WIDTH) * 100;

/** Below lg the steps stack, so the arrow runs straight down the middle. */
const ARROW_STACKED = 50;

/** Only one of each arrow variant is displayed at a given width. */
function isShown(element: Element): boolean {
    return element.getClientRects().length > 0;
}

function padded(value: number): string {
    return String(value).padStart(2, '0');
}

/**
 * "How I work": the waterfall process as a staircase of steps. Each step
 * drops into place as it scrolls in, the arrows between steps draw with the
 * scroll while a droplet flows down them, and the stages that repeat get a
 * loop arrow. Server-rendered as the finished diagram.
 */
export function ProcessSection({ steps }: ProcessSectionProps) {
    const section = useRef<HTMLElement>(null);

    useGSAP(
        () => {
            const root = section.current;

            if (!root) {
                return;
            }

            const mm = gsap.matchMedia();

            // Re-runs when crossing lg, where the arrows switch shape.
            mm.add(
                { motion: MOTION_OK, wide: '(min-width: 64rem)' },
                (context) => {
                    if (!context.conditions?.motion) {
                        return;
                    }

                    gsap.utils
                        .toArray<HTMLElement>('[data-step]', root)
                        .forEach((step, index) => {
                            const card =
                                step.querySelector<HTMLElement>('[data-card]');
                            const number =
                                step.querySelector<HTMLElement>(
                                    '[data-number]',
                                );
                            const loop =
                                step.querySelectorAll('[data-loop-path]');

                            const landing = gsap.timeline({
                                scrollTrigger: {
                                    trigger: card,
                                    start: 'top 85%',
                                    once: true,
                                },
                            });

                            landing
                                .fromTo(
                                    card,
                                    { autoAlpha: 0, y: -40, rotation: -2 },
                                    {
                                        autoAlpha: 1,
                                        y: 0,
                                        rotation: 0,
                                        duration: 0.9,
                                        ease: 'back.out(1.6)',
                                    },
                                    0,
                                )
                                .fromTo(
                                    step.querySelectorAll('[data-step-icon]'),
                                    { scale: 0, rotation: -45 },
                                    {
                                        scale: 1,
                                        rotation: 0,
                                        duration: 0.6,
                                        ease: 'back.out(2.5)',
                                    },
                                    0.25,
                                )
                                .fromTo(
                                    loop,
                                    { drawSVG: '0%' },
                                    {
                                        drawSVG: '100%',
                                        duration: 1.2,
                                        ease: 'power2.inOut',
                                    },
                                    0.5,
                                )
                                .fromTo(
                                    step.querySelectorAll('[data-loop-part]'),
                                    { autoAlpha: 0, scale: 0.6 },
                                    {
                                        autoAlpha: 1,
                                        scale: 1,
                                        duration: 0.5,
                                        stagger: 0.1,
                                        ease: 'back.out(2)',
                                    },
                                    1.2,
                                );

                            if (number) {
                                const count = { value: 0 };
                                number.textContent = padded(0);
                                landing.to(
                                    count,
                                    {
                                        value: index + 1,
                                        duration: 0.8,
                                        ease: 'power2.out',
                                        onUpdate: () => {
                                            number.textContent = padded(
                                                Math.round(count.value),
                                            );
                                        },
                                    },
                                    0.2,
                                );
                            }
                        });

                    // Arrows draw with the scroll while a droplet flows down them.
                    gsap.utils
                        .toArray<HTMLElement>('[data-connector]', root)
                        .forEach((connector) => {
                            const path = Array.from(
                                connector.querySelectorAll<SVGPathElement>(
                                    '[data-arrow-path]',
                                ),
                            ).find(isShown);
                            const droplet =
                                connector.querySelector<HTMLElement>(
                                    '[data-droplet]',
                                );
                            const head = Array.from(
                                connector.querySelectorAll<HTMLElement>(
                                    '[data-arrow-head]',
                                ),
                            ).find(isShown);

                            if (!path || !head) {
                                return;
                            }

                            const flow = gsap.timeline({
                                scrollTrigger: {
                                    trigger: connector,
                                    start: 'top 80%',
                                    end: 'bottom 50%',
                                    scrub: 0.6,
                                },
                            });

                            flow.fromTo(
                                path,
                                { drawSVG: '0%' },
                                { drawSVG: '100%', ease: 'none', duration: 1 },
                                0,
                            )
                                .fromTo(
                                    droplet,
                                    { autoAlpha: 0 },
                                    { autoAlpha: 1, duration: 0.1 },
                                    0,
                                )
                                .to(
                                    droplet,
                                    {
                                        motionPath: {
                                            path,
                                            align: path,
                                            alignOrigin: [0.5, 0.5],
                                        },
                                        ease: 'none',
                                        duration: 1,
                                    },
                                    0,
                                )
                                .to(
                                    droplet,
                                    { autoAlpha: 0, duration: 0.1 },
                                    0.9,
                                )
                                .fromTo(
                                    head,
                                    { autoAlpha: 0, scale: 0.4 },
                                    { autoAlpha: 1, scale: 1, duration: 0.15 },
                                    0.85,
                                );
                        });

                    // Loop icons turn only while the section is on screen.
                    const spin = gsap.to(
                        root.querySelectorAll('[data-loop-icon]'),
                        {
                            rotation: 360,
                            duration: 4,
                            ease: 'none',
                            repeat: -1,
                            paused: true,
                        },
                    );

                    ScrollTrigger.create({
                        trigger: root,
                        start: 'top bottom',
                        end: 'bottom top',
                        onToggle: (self) =>
                            self.isActive ? spin.play() : spin.pause(),
                    });
                },
            );

            return () => mm.revert();
        },
        { scope: section },
    );

    return (
        <section
            ref={section}
            id="process"
            aria-labelledby="process-heading"
            className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28"
        >
            <div className="mx-auto max-w-2xl text-center md:mx-0 md:text-left">
                <SplitHeading
                    as="h2"
                    id="process-heading"
                    className="text-3xl font-semibold tracking-tight sm:text-4xl"
                >
                    How I work
                </SplitHeading>
                <p className="mt-4 text-pretty text-muted-foreground sm:text-lg">
                    You always know what happens next. We refine the plan until
                    the scope is right, and after launch I keep improving the
                    product as your business grows.
                </p>
            </div>

            <ol className="mt-14 sm:mt-16">
                {steps.map((step, index) => (
                    <li
                        key={step.title}
                        data-step
                        style={{ '--i': index } as CSSProperties}
                        className="lg:ml-[calc(var(--i)*10.8%)] lg:w-[46%]"
                    >
                        <StepCard
                            step={step}
                            index={index}
                            loopSide={
                                index < steps.length / 2 ? 'right' : 'left'
                            }
                        />
                        {index < steps.length - 1 && <Connector />}
                    </li>
                ))}
            </ol>
        </section>
    );
}

function StepCard({
    step,
    index,
    loopSide,
}: {
    step: ProcessStep;
    index: number;
    loopSide: 'left' | 'right';
}) {
    const hasLoop = step.loop !== null;

    return (
        <article
            data-card
            className={cn(
                'group relative rounded-2xl border p-6 text-center transition-[translate,border-color] duration-500 ease-out hover:-translate-y-1 sm:p-7 md:text-left',
                hasLoop
                    ? 'border-brand/40 bg-brand/5 hover:border-brand/70'
                    : 'bg-card/60 hover:border-brand/40',
            )}
        >
            <div className="flex items-start justify-between gap-4">
                <span
                    data-step-icon
                    className="grid size-12 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand transition-transform duration-500 ease-out group-hover:-rotate-6"
                >
                    <Icon
                        icon={stepIcons[step.icon] ?? faCode}
                        className="size-5"
                    />
                </span>
                <span
                    data-number
                    aria-hidden
                    className="text-5xl leading-none font-semibold text-transparent tabular-nums opacity-70 [-webkit-text-stroke:1px_var(--color-brand)]"
                >
                    {padded(index + 1)}
                </span>
            </div>

            <h3 className="mt-5 text-xl font-semibold tracking-tight">
                <span className="sr-only">Step {index + 1}: </span>
                {step.title}
            </h3>
            <p className="mt-2.5 text-sm leading-relaxed text-pretty text-muted-foreground sm:text-[0.9375rem]">
                {step.summary}
            </p>
            <p className="mt-4 text-sm">
                <span className="font-medium text-brand">You get:</span>{' '}
                {step.deliverable}
            </p>

            {hasLoop && (
                <>
                    <p
                        data-loop-part
                        className="mt-5 inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-medium text-brand"
                    >
                        <span data-loop-icon className="inline-flex">
                            <Icon icon={faRotate} className="size-3" />
                        </span>
                        {step.loop}
                    </p>

                    {/* Loop arrow leaving the card and curving back into it. */}
                    <svg
                        aria-hidden
                        viewBox="0 0 64 120"
                        fill="none"
                        className={cn(
                            'pointer-events-none absolute top-1/2 hidden h-28 w-16 -translate-y-1/2 text-brand lg:block',
                            loopSide === 'right'
                                ? 'left-full'
                                : 'right-full -scale-x-100',
                        )}
                    >
                        <path
                            data-loop-path
                            d="M 2 24 C 58 24, 58 96, 8 96"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            className="opacity-70 transition-opacity group-hover:opacity-100"
                        />
                        <path
                            data-loop-part
                            d="M 14 90 L 6 96 L 14 102"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </>
            )}
        </article>
    );
}

/**
 * The arrow between two steps: straight down on small screens, curving
 * right into the next step on wide screens.
 */
function Connector() {
    return (
        <div
            data-connector
            aria-hidden
            className="relative h-16 text-brand sm:h-20 lg:h-24"
        >
            <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                fill="none"
                className="absolute inset-0 size-full overflow-visible"
            >
                {/* Small screens: straight down. */}
                <path
                    data-arrow-path
                    d={`M ${ARROW_STACKED} 0 L ${ARROW_STACKED} 88`}
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                    className="opacity-70 lg:hidden"
                />
                {/* Wide screens: curve right into the next step. */}
                <path
                    data-arrow-path
                    d={`M ${ARROW_START} 0 C ${ARROW_START} 55, ${ARROW_END} 40, ${ARROW_END} 88`}
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                    className="hidden opacity-70 lg:block"
                />
            </svg>

            {/* Arrowheads sit outside the stretched SVG so they keep their shape. */}
            <span
                data-arrow-head
                className="absolute bottom-0 -translate-x-1/2 lg:hidden"
                style={{ left: `${ARROW_STACKED}%` }}
            >
                <ArrowHead />
            </span>
            <span
                data-arrow-head
                className="absolute bottom-0 hidden -translate-x-1/2 lg:block"
                style={{ left: `${ARROW_END}%` }}
            >
                <ArrowHead />
            </span>

            <span
                data-droplet
                className="pointer-events-none absolute top-0 left-0 size-2.5 rounded-full bg-brand opacity-0 shadow-[0_0_12px_4px] shadow-brand/60"
            />
        </div>
    );
}

function ArrowHead() {
    return (
        <svg viewBox="0 0 14 10" className="block h-2.5 w-3.5" fill="none">
            <path
                d="M 1 1 L 7 8 L 13 1"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}
