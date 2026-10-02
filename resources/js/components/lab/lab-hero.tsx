import { faQuoteLeft } from '@fortawesome/free-solid-svg-icons/faQuoteLeft';
import { faRobot } from '@fortawesome/free-solid-svg-icons/faRobot';
import { faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons/faWandMagicSparkles';
import { Link } from '@inertiajs/react';
import { useRef } from 'react';
import { Magnetic } from '@/components/motion/magnetic';
import { HIRE_ME_HREF } from '@/components/site/nav-items';
import { Icon } from '@/components/ui/icon';
import { gsap, MOTION_OK, ScrollTrigger, useGSAP } from '@/lib/gsap';

/** Lines of the preview "business document"; one of them gets cited. */
const DOC_LINES = [
    'Opening hours: every day, 8 am to 10 pm.',
    'Economy cars from AED 99 per day.',
    'No deposit for economy and SUV cars.',
    'Free cancellation up to 24 hours before.',
];
const CITED_LINE = 2;

/**
 * "An AI assistant that answers from your business". Beside the heading, a
 * preview plays the idea in a loop: a customer asks, the matching line in
 * the business document lights up, and the answer arrives citing it.
 */
export function LabHero() {
    const root = useRef<HTMLElement>(null);

    useGSAP(
        () => {
            const scope = root.current;

            if (!scope) {
                return;
            }

            const q = gsap.utils.selector(scope);
            const mm = gsap.matchMedia();

            mm.add(MOTION_OK, () => {
                gsap.timeline({ defaults: { ease: 'power3.out' }, delay: 0.1 })
                    .fromTo(
                        q('[data-hero-line]'),
                        { yPercent: 110 },
                        {
                            yPercent: 0,
                            duration: 1,
                            stagger: 0.1,
                            ease: 'expo.out',
                        },
                    )
                    .fromTo(
                        q('[data-hero-item]'),
                        { autoAlpha: 0, y: 20 },
                        { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.08 },
                        0.35,
                    )
                    .fromTo(
                        q('[data-preview]'),
                        { autoAlpha: 0, y: 50, rotationY: -12 },
                        {
                            autoAlpha: 1,
                            y: 0,
                            rotationY: 0,
                            transformPerspective: 1200,
                            duration: 1.1,
                            ease: 'expo.out',
                        },
                        0.3,
                    );

                const loop = gsap.timeline({
                    repeat: -1,
                    repeatDelay: 3,
                    delay: 1.2,
                    defaults: { ease: 'power3.out' },
                });

                loop.set(q('[data-question], [data-answer], [data-cite]'), {
                    autoAlpha: 0,
                })
                    .set(q('[data-scan]'), { autoAlpha: 0, yPercent: 0 })
                    .set(q('[data-doc-line]'), { opacity: 0.45 })
                    .set(q('[data-highlight]'), { scaleX: 0 })
                    .fromTo(
                        q('[data-question]'),
                        { autoAlpha: 0, y: 14, scale: 0.94 },
                        {
                            autoAlpha: 1,
                            y: 0,
                            scale: 1,
                            duration: 0.5,
                            ease: 'back.out(1.7)',
                        },
                    )
                    // The assistant "reads" the document, top to bottom.
                    .to(
                        q('[data-scan]'),
                        { autoAlpha: 1, duration: 0.2 },
                        '+=0.2',
                    )
                    .fromTo(
                        q('[data-scan]'),
                        { y: 0 },
                        {
                            y: () =>
                                (q('[data-doc-line]')[CITED_LINE]?.offsetTop ??
                                    0) - 4,
                            duration: 0.9,
                            ease: 'power2.inOut',
                        },
                        '<',
                    )
                    .to(q('[data-scan]'), { autoAlpha: 0, duration: 0.2 })
                    .to(
                        q('[data-doc-line]')[CITED_LINE],
                        { opacity: 1, duration: 0.3 },
                        '<',
                    )
                    .to(
                        q('[data-highlight]'),
                        { scaleX: 1, duration: 0.5, ease: 'expo.out' },
                        '<',
                    )
                    .fromTo(
                        q('[data-answer]'),
                        { autoAlpha: 0, y: 14, scale: 0.94 },
                        {
                            autoAlpha: 1,
                            y: 0,
                            scale: 1,
                            duration: 0.5,
                            ease: 'back.out(1.7)',
                        },
                        '+=0.15',
                    )
                    .fromTo(
                        q('[data-cite]'),
                        { autoAlpha: 0, x: -8 },
                        { autoAlpha: 1, x: 0, duration: 0.4 },
                        '+=0.1',
                    );

                const trigger = ScrollTrigger.create({
                    trigger: scope,
                    start: 'top bottom',
                    end: 'bottom top',
                    onToggle: (self) =>
                        self.isActive ? loop.resume() : loop.pause(),
                });

                return () => trigger.kill();
            });

            return () => mm.revert();
        },
        { scope: root },
    );

    return (
        <section
            ref={root}
            aria-labelledby="lab-heading"
            className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-14 overflow-x-clip px-4 pt-12 pb-16 sm:px-6 sm:pt-20 lg:grid-cols-12 lg:gap-10 lg:pb-20"
        >
            <div className="min-w-0 text-center lg:col-span-7 lg:text-left">
                <p
                    data-hero-item
                    className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-medium text-brand sm:text-sm"
                >
                    <Icon icon={faWandMagicSparkles} className="size-3.5" />
                    AI Lab: a live demo, not a video
                </p>

                <h1
                    id="lab-heading"
                    className="mt-6 text-[clamp(2.3rem,4.4vw+0.8rem,4.1rem)] leading-[1.05] font-semibold tracking-tight"
                >
                    <span className="block overflow-hidden pb-1">
                        <span data-hero-line className="block">
                            An AI assistant that
                        </span>
                    </span>{' '}
                    <span className="block overflow-hidden pb-1">
                        <span data-hero-line className="block">
                            answers from{' '}
                            <span className="text-shine">your business</span>,
                        </span>
                    </span>{' '}
                    <span className="block overflow-hidden pb-1">
                        <span data-hero-line className="block">
                            not from guesses.
                        </span>
                    </span>
                </h1>

                <p
                    data-hero-item
                    className="mx-auto mt-6 max-w-xl text-lg text-pretty text-muted-foreground lg:mx-0"
                >
                    Pick a sample business or paste your own FAQ, then ask it
                    anything. Every answer shows the exact line it came from,
                    and when something isn't there, it says so.
                </p>

                <div
                    data-hero-item
                    className="mt-9 flex flex-wrap justify-center gap-3 lg:justify-start"
                >
                    <Magnetic>
                        <a
                            href="#demo"
                            className="inline-flex h-12 items-center gap-2.5 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-colors hover:bg-primary/85 active:scale-[0.98]"
                        >
                            <Icon icon={faRobot} className="size-4" />
                            Try it now
                        </a>
                    </Magnetic>
                    <Magnetic>
                        <Link
                            href={HIRE_ME_HREF}
                            className="inline-flex h-12 items-center gap-2.5 rounded-full border px-6 text-sm font-medium transition-colors hover:border-brand hover:text-brand active:scale-[0.98]"
                        >
                            Get this for your business
                        </Link>
                    </Magnetic>
                </div>
            </div>

            {/* Decorative preview of the idea; the real demo is below. */}
            <div aria-hidden className="lg:col-span-5">
                <div
                    data-preview
                    className="relative mx-auto w-full max-w-md overflow-hidden rounded-3xl border bg-card p-5 shadow-2xl shadow-black/30 sm:p-6"
                >
                    <div className="pointer-events-none absolute -top-24 -right-24 size-64 rounded-full bg-brand/15 blur-3xl" />

                    <p
                        data-question
                        className="relative ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-primary-foreground"
                    >
                        Do I need a deposit for an SUV?
                    </p>

                    <div className="relative mt-4 rounded-2xl border bg-background/60 p-4">
                        <p className="text-[0.6875rem] font-medium text-muted-foreground">
                            Business info
                        </p>
                        <div className="relative mt-2.5 flex flex-col gap-2">
                            <span
                                data-scan
                                className="pointer-events-none absolute inset-x-0 top-0 h-6 rounded-md bg-brand/15 opacity-0"
                            />
                            {DOC_LINES.map((line, index) => (
                                <p
                                    key={line}
                                    data-doc-line
                                    className="relative text-xs leading-relaxed"
                                >
                                    {index === CITED_LINE && (
                                        <span
                                            data-highlight
                                            className="absolute -inset-x-1 -inset-y-0.5 origin-left rounded bg-brand/20"
                                        />
                                    )}
                                    <span className="relative">{line}</span>
                                </p>
                            ))}
                        </div>
                    </div>

                    <div className="relative mt-4">
                        <p
                            data-answer
                            className="w-fit max-w-[90%] rounded-2xl rounded-bl-md border bg-background px-4 py-2.5 text-sm"
                        >
                            No, you don't need a deposit for an SUV. Deposits
                            aren't needed for economy cars either.
                        </p>
                        <p
                            data-cite
                            className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-2.5 py-1 text-[0.6875rem] font-medium text-brand"
                        >
                            <Icon icon={faQuoteLeft} className="size-2.5" />
                            Source: No deposit for economy and SUV cars.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
