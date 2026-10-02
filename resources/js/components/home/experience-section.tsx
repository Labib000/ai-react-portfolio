import { faArrowRight } from '@fortawesome/free-solid-svg-icons/faArrowRight';
import { faCheck } from '@fortawesome/free-solid-svg-icons/faCheck';
import { Link } from '@inertiajs/react';
import { useRef, useState } from 'react';
import ResumeController from '@/actions/App/Http/Controllers/ResumeController';
import { SplitHeading } from '@/components/motion/split-heading';
import { Icon } from '@/components/ui/icon';
import { gsap, MOTION_OK, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { cn } from '@/lib/utils';
import type { Experience } from '@/types/content';

type ExperienceSectionProps = {
    experience: Experience[];
    experienceDuration: string;
};

/** Space above the first stacked card (clears the header) and the step between cards. */
const STACK_TOP = 80;
const STACK_STEP = 20;

/**
 * Roles as a deck of envelopes, newest first, so the current role opens the
 * section. Each envelope arrives sealed; as it scrolls into view the seal
 * pops, the flap swings open and the letter (the role's highlights) slides
 * out. Envelopes stick near the top while the next one slides over, and the
 * ones underneath shrink and dim with the scroll. Envelopes taller than the
 * screen (phones) stick by their bottom edge so they are always readable in
 * full.
 *
 * The server renders every envelope already open, which is also what users
 * with reduced motion see; the script closes them before first paint.
 */
export function ExperienceSection({
    experience,
    experienceDuration,
}: ExperienceSectionProps) {
    const section = useRef<HTMLElement>(null);
    const [activeIndex, setActiveIndex] = useState(0);
    // Newest first: the current role is the first card.
    const roles = experience;

    useGSAP(
        () => {
            const root = section.current;

            if (!root) {
                return;
            }

            const mm = gsap.matchMedia();

            mm.add(
                {
                    motion: MOTION_OK,
                },
                (context) => {
                    if (!context.conditions?.motion) {
                        return;
                    }

                    const cards = gsap.utils.toArray<HTMLElement>(
                        '[data-card]',
                        root,
                    );
                    const lastIndex = cards.length - 1;
                    const tops: number[] = [];

                    // Each card sticks at its deck position, or, if it is taller
                    // than the screen, by its bottom edge so it can still be read
                    // in full before the next card covers it.
                    const setTops = () =>
                        cards.forEach((card, index) => {
                            tops[index] = Math.min(
                                STACK_TOP + index * STACK_STEP,
                                window.innerHeight - card.offsetHeight - 16,
                            );
                            card.style.setProperty(
                                '--stack-top',
                                `${tops[index]}px`,
                            );
                        });

                    root.dataset.stacked = 'true';
                    setTops();
                    ScrollTrigger.addEventListener('refreshInit', setTops);

                    cards.forEach((card, index) => {
                        const find = (selector: string) =>
                            card.querySelector<HTMLElement>(selector)!;
                        const inner = find('[data-card-inner]');
                        const shade = find('[data-card-shade]');
                        const flap = find('[data-flap]');
                        const seal = find('[data-seal]');
                        const letter = find('[data-letter]');
                        const number = card.querySelector<HTMLElement>(
                            '[data-metric-number]',
                        );

                        // Deck: while later cards slide over this one, it shrinks
                        // and dims, tied directly to the scroll position.
                        if (index < lastIndex) {
                            const cardsAbove = lastIndex - index;

                            gsap.timeline({
                                scrollTrigger: {
                                    trigger: cards[index + 1],
                                    start: 'top bottom',
                                    endTrigger: cards[lastIndex],
                                    end: () => `top ${tops[lastIndex]}px`,
                                    scrub: 0.4,
                                    invalidateOnRefresh: true,
                                },
                            })
                                .to(
                                    inner,
                                    {
                                        scale: 1 - 0.05 * cardsAbove,
                                        ease: 'none',
                                    },
                                    0,
                                )
                                .to(
                                    shade,
                                    {
                                        opacity: 0.3 + 0.15 * (cardsAbove - 1),
                                        ease: 'none',
                                    },
                                    0,
                                );
                        }

                        // Seal the envelope: flap closed over the face, seal on,
                        // letter tucked away.
                        gsap.set(flap, {
                            rotationX: 0,
                            zIndex: 30,
                            transformPerspective: 1200,
                        });
                        gsap.set(seal, { autoAlpha: 1, scale: 1, rotation: 0 });
                        gsap.set(letter, {
                            clipPath: 'inset(0% 0% 100% 0%)',
                            y: -32,
                        });

                        const opening = gsap.timeline({
                            paused: true,
                            defaults: { ease: 'power3.out' },
                        });

                        opening
                            // The seal gives a little, then pops off.
                            .to(seal, {
                                scale: 1.15,
                                duration: 0.18,
                                ease: 'power2.out',
                            })
                            .to(seal, {
                                scale: 0.4,
                                rotation: -25,
                                autoAlpha: 0,
                                duration: 0.3,
                                ease: 'power2.in',
                            })
                            // The flap swings down; halfway it passes behind the letter.
                            .to(
                                flap,
                                {
                                    rotationX: 180,
                                    duration: 0.75,
                                    ease: 'power2.inOut',
                                },
                                0.3,
                            )
                            .set(flap, { zIndex: 0 }, 0.65)
                            // The letter slides out underneath.
                            .to(
                                letter,
                                {
                                    clipPath: 'inset(0% 0% 0% 0%)',
                                    y: 0,
                                    duration: 0.9,
                                    ease: 'expo.out',
                                },
                                0.75,
                            )
                            .fromTo(
                                letter.querySelectorAll('[data-highlight]'),
                                { autoAlpha: 0, x: -12 },
                                {
                                    autoAlpha: 1,
                                    x: 0,
                                    duration: 0.5,
                                    stagger: 0.07,
                                },
                                0.95,
                            );

                        const [, digits, rest] =
                            number?.dataset.value?.match(/^(\d+)(.*)$/) ?? [];

                        if (number && digits) {
                            const count = { value: 0 };
                            number.textContent = `0${rest}`;
                            opening.to(
                                count,
                                {
                                    value: Number(digits),
                                    duration: 1.2,
                                    ease: 'power2.out',
                                    onUpdate: () => {
                                        number.textContent = `${Math.round(count.value)}${rest}`;
                                    },
                                },
                                0.4,
                            );
                        }

                        // Open once the whole sealed envelope is on screen.
                        ScrollTrigger.create({
                            trigger: find('.envelope-face'),
                            start: 'bottom 88%',
                            onEnter: () => {
                                opening.play();
                                setActiveIndex(index);
                            },
                            onLeaveBack: () =>
                                setActiveIndex(Math.max(0, index - 1)),
                        });
                    });

                    ScrollTrigger.refresh();

                    return () => {
                        ScrollTrigger.removeEventListener(
                            'refreshInit',
                            setTops,
                        );
                        delete root.dataset.stacked;
                        cards.forEach((card) =>
                            card.style.removeProperty('--stack-top'),
                        );
                    };
                },
            );

            return () => mm.revert();
        },
        { scope: section },
    );

    return (
        <section
            ref={section}
            id="experience"
            aria-labelledby="experience-heading"
            className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28"
        >
            <div className="flex flex-col items-center gap-6 text-center md:flex-row md:items-end md:justify-between md:text-left">
                <div className="max-w-2xl">
                    <SplitHeading
                        as="h2"
                        id="experience-heading"
                        className="text-3xl font-semibold tracking-tight sm:text-4xl"
                    >
                        Where I've worked
                    </SplitHeading>
                    <p className="mt-4 text-pretty text-muted-foreground sm:text-lg">
                        {experienceDuration} of professional experience across{' '}
                        {roles.length} roles, from intern to associate
                        developer, building for rental, ecommerce and education
                        platforms.
                    </p>
                    <Link
                        href={ResumeController.url()}
                        prefetch
                        className="group mt-5 inline-flex items-center gap-2 text-sm font-medium text-brand"
                    >
                        See my full resume
                        <Icon
                            icon={faArrowRight}
                            className="size-2.5 transition-transform group-hover:translate-x-0.5"
                        />
                    </Link>
                </div>

                {roles.length > 1 && (
                    <div
                        aria-hidden
                        className="flex items-center gap-3 text-sm text-muted-foreground tabular-nums motion-reduce:hidden"
                    >
                        <span>
                            {activeIndex + 1} / {roles.length}
                        </span>
                        <span className="flex items-center gap-1.5">
                            {roles.map((role, index) => (
                                <span
                                    key={role.title + role.period}
                                    className={cn(
                                        'h-1.5 rounded-full transition-all duration-500',
                                        index === activeIndex
                                            ? 'w-6 bg-brand'
                                            : 'w-1.5 bg-muted-foreground/40',
                                    )}
                                />
                            ))}
                        </span>
                    </div>
                )}
            </div>

            <ol className="deck mt-12 flex flex-col gap-10 sm:mt-14">
                {roles.map((role) => (
                    <li key={role.title + role.period} data-card>
                        <EnvelopeCard role={role} />
                    </li>
                ))}
            </ol>
        </section>
    );
}

function EnvelopeCard({ role }: { role: Experience }) {
    // Only single numbers ("20+") count up; ranges like "30 to 40%" just appear.
    const canCount = /^\d+\D*$/.test(role.metric?.value ?? '');
    const [startDate, endDate] = role.period.split(' to ');

    return (
        <article data-card-inner className="relative origin-top">
            {/* Envelope face: the "address" side. */}
            <div className="relative">
                <div className="envelope-face relative z-20 overflow-hidden rounded-2xl border bg-card shadow-2xl shadow-black/25">
                    <div aria-hidden className="airmail-stripe h-1" />
                    <div
                        aria-hidden
                        className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-black/30 to-transparent sm:h-28 md:h-32"
                    />

                    <div className="relative p-5 pb-24 sm:p-8 sm:pb-28 md:p-10 md:pb-32">
                        <div
                            className={cn(
                                'min-w-0',
                                role.metric && 'pr-28 sm:pr-64 md:pr-72',
                            )}
                        >
                            <p className="text-xs text-muted-foreground">
                                From
                            </p>
                            <p className="mt-0.5 font-medium text-brand">
                                {role.company}
                            </p>

                            <h3 className="mt-5 text-2xl font-semibold tracking-tight text-balance md:text-3xl">
                                {role.title}
                            </h3>

                            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                                <span className="text-muted-foreground">
                                    {role.period}
                                </span>
                                <span className="rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground">
                                    {role.type === 'internship'
                                        ? 'Internship'
                                        : 'Full time'}
                                </span>
                                {role.isCurrent && (
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/15 px-2.5 py-0.5 text-xs font-medium text-brand">
                                        <span className="relative flex size-1.5">
                                            <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand opacity-70 motion-reduce:hidden" />
                                            <span className="relative inline-flex size-1.5 rounded-full bg-brand" />
                                        </span>
                                        Current role
                                    </span>
                                )}
                            </div>
                        </div>

                        {role.metric && (
                            <div className="absolute top-5 right-4 sm:top-8 sm:right-8 md:top-10 md:right-10">
                                {/* Postmark: decorative, the dates are in the text above. */}
                                <div
                                    aria-hidden
                                    className="absolute -top-2 right-full mr-[-1.5rem] hidden size-24 -rotate-12 place-items-center rounded-full border-2 border-dashed border-muted-foreground/30 text-center text-[0.625rem] leading-tight font-semibold text-muted-foreground/60 sm:grid"
                                >
                                    <span>
                                        {startDate}
                                        <br />
                                        {role.isCurrent ? 'Today' : endDate}
                                    </span>
                                </div>

                                <div className="stamp relative w-24 rotate-3 bg-brand/10 p-1.5 sm:w-32 md:w-36">
                                    <div className="flex aspect-[4/5] flex-col justify-between border border-brand/30 p-2 sm:p-3">
                                        <p className="text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl">
                                            <span
                                                data-metric-number
                                                data-value={
                                                    canCount
                                                        ? role.metric.value
                                                        : ''
                                                }
                                                className="text-shine tabular-nums"
                                            >
                                                {role.metric.value}
                                            </span>
                                        </p>
                                        <p className="text-[0.6875rem] leading-snug text-muted-foreground">
                                            {role.metric.label}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Flap, hinged on the bottom edge. Front: closed and sealed;
                    back: the patterned lining seen once it has swung open. */}
                <div
                    data-flap
                    aria-hidden
                    className="envelope-flap absolute inset-x-0 bottom-0 z-0 h-24 origin-bottom sm:h-28 md:h-32"
                >
                    <svg
                        viewBox="0 0 100 40"
                        preserveAspectRatio="none"
                        className="absolute inset-0 size-full drop-shadow-[0_-6px_12px_oklch(0_0_0/0.25)] backface-hidden"
                    >
                        <defs>
                            <linearGradient
                                id="envelope-flap-front"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <stop
                                    offset="0"
                                    className="[stop-color:var(--accent)]"
                                />
                                <stop
                                    offset="1"
                                    className="[stop-color:var(--secondary)]"
                                />
                            </linearGradient>
                        </defs>
                        <polygon
                            points="0,40 50,0 100,40"
                            fill="url(#envelope-flap-front)"
                            className="stroke-brand/30"
                            strokeWidth="1"
                            vectorEffect="non-scaling-stroke"
                        />
                    </svg>
                    <svg
                        viewBox="0 0 100 40"
                        preserveAspectRatio="none"
                        className="absolute inset-0 size-full rotate-x-180 backface-hidden"
                    >
                        <defs>
                            <pattern
                                id="envelope-lining"
                                width="4"
                                height="4"
                                patternUnits="userSpaceOnUse"
                                patternTransform="rotate(45)"
                            >
                                <rect
                                    width="2"
                                    height="4"
                                    className="fill-brand/20"
                                />
                            </pattern>
                        </defs>
                        <polygon
                            points="0,40 50,0 100,40"
                            className="fill-accent"
                        />
                        <polygon
                            points="0,40 50,0 100,40"
                            fill="url(#envelope-lining)"
                            className="stroke-border"
                            strokeWidth="0.4"
                            vectorEffect="non-scaling-stroke"
                        />
                    </svg>

                    {/* Wax seal on the flap's tip. */}
                    <div
                        data-seal
                        className="envelope-seal absolute top-0 left-1/2 grid size-14 -translate-x-1/2 -translate-y-1/3 place-items-center rounded-full sm:size-16"
                    >
                        <img
                            src="/img/logo-72.webp"
                            alt=""
                            width={44}
                            height={36}
                            className="h-6 w-auto brightness-0 invert-[0.92] sm:h-7"
                        />
                    </div>
                </div>
            </div>

            {/* The letter: slides out from under the envelope. */}
            <div
                data-letter
                className="letter-paper relative z-10 mx-3 -mt-3 rounded-b-2xl border border-t-0 bg-card px-5 pt-8 pb-6 shadow-xl shadow-black/15 sm:mx-6 sm:px-8 md:mx-10 md:px-10 md:pt-10 md:pb-8"
            >
                <ul className="flex flex-col gap-3.5">
                    {role.highlights.map((highlight) => (
                        <li
                            key={highlight}
                            data-highlight
                            className="flex gap-3 text-sm leading-relaxed text-muted-foreground md:text-base"
                        >
                            <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-brand/15 text-brand md:mt-1">
                                <Icon icon={faCheck} className="size-2.5" />
                            </span>
                            {highlight}
                        </li>
                    ))}
                </ul>

                {role.tools.length > 0 && (
                    <ul
                        aria-label="Tools used"
                        className="mt-6 flex flex-wrap gap-2"
                    >
                        {role.tools.map((tool) => (
                            <li
                                key={tool}
                                className="rounded-full border bg-background/40 px-3 py-1 text-xs text-foreground/80"
                            >
                                {tool}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Dims the whole envelope as later ones stack on top of it. */}
            <div
                aria-hidden
                data-card-shade
                className="pointer-events-none absolute inset-0 z-40 rounded-2xl bg-background opacity-0"
            />
        </article>
    );
}
