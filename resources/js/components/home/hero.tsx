import { Link } from '@inertiajs/react';
import { useRef } from 'react';
import { Magnetic } from '@/components/motion/magnetic';
import { HIRE_ME_HREF } from '@/components/site/nav-items';
import { ApiTraceCard } from '@/components/home/api-trace-card';
import { HighlightedText } from '@/components/home/highlighted-text';
import { Portrait } from '@/components/home/portrait';
import { SplitText } from 'gsap/SplitText';
import {
    gsap,
    MOTION_OK,
    MOTION_REDUCED,
    ScrollTrigger,
    useGSAP,
} from '@/lib/gsap';
import type { Profile } from '@/types/content';

type HeroProps = {
    profile: Profile;
    experienceDuration: string;
};

if (typeof window !== 'undefined') {
    gsap.registerPlugin(SplitText);
}

export function Hero({ profile, experienceDuration }: HeroProps) {
    const root = useRef<HTMLElement>(null);
    const tilt = useRef<HTMLDivElement>(null);
    const city = profile.location.split(',')[0];
    const impact = profile.impact[0];

    useGSAP(
        () => {
            const q = gsap.utils.selector(root);
            const mm = gsap.matchMedia();

            // One orchestrated entrance, ~1.9s. Everything is server-rendered in
            // its final state; these tweens animate *into* that state.
            mm.add(MOTION_OK, () => {
                const headline = q('[data-hero="headline"]')[0];

                const split = SplitText.create(headline, {
                    type: 'lines',
                    mask: 'lines',
                    aria: 'none',
                    autoSplit: true,
                    onSplit(self) {
                        gsap.set(headline, { autoAlpha: 1 });

                        return gsap.from(self.lines, {
                            yPercent: 110,
                            duration: 1.1,
                            stagger: 0.1,
                            ease: 'expo.out',
                            delay: 0.2,
                        });
                    },
                });

                const timeline = gsap.timeline({
                    defaults: { ease: 'power3.out' },
                });

                timeline
                    .fromTo(
                        q('[data-hero="name"]'),
                        { autoAlpha: 0, y: 12 },
                        { autoAlpha: 1, y: 0, duration: 0.6 },
                        0.1,
                    )
                    .fromTo(
                        q('[data-hero="arch"]'),
                        { autoAlpha: 1, clipPath: 'inset(100% 0% 0% 0%)' },
                        {
                            clipPath: 'inset(0% 0% 0% 0%)',
                            duration: 1,
                            ease: 'expo.inOut',
                        },
                        0.35,
                    )
                    .fromTo(
                        q('[data-hero="photo"]'),
                        { autoAlpha: 0, y: 60, scale: 1.06 },
                        { autoAlpha: 1, y: 0, scale: 1, duration: 1.1 },
                        0.65,
                    )
                    .fromTo(
                        q('[data-hero="intro"]'),
                        { autoAlpha: 0, y: 16 },
                        { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.08 },
                        0.75,
                    );

                if (impact) {
                    const pill = q('[data-hero="pill"]')[0];
                    const afterValue = q('[data-hero="after-value"]')[0];
                    const count = { value: 0 };

                    timeline
                        .fromTo(
                            q('[data-hero="card"]'),
                            { autoAlpha: 0, y: 24 },
                            { autoAlpha: 1, y: 0, duration: 0.7 },
                            1.15,
                        )
                        .fromTo(
                            q('[data-hero="after-bar"]'),
                            { scaleX: 1 },
                            {
                                scaleX: (100 - impact.value) / 100,
                                duration: 1.1,
                                ease: 'power2.inOut',
                            },
                            1.35,
                        )
                        .to(
                            count,
                            {
                                value: impact.value,
                                duration: 1.1,
                                ease: 'power2.inOut',
                                onUpdate: () => {
                                    const value = Math.round(count.value);
                                    pill.textContent = `${value}`;
                                    afterValue.textContent = `${100 - value}%`;
                                },
                            },
                            1.35,
                        )
                        .from(
                            q('[data-hero="tag"]'),
                            {
                                autoAlpha: 0,
                                y: 8,
                                scale: 0.9,
                                duration: 0.4,
                                stagger: 0.08,
                                ease: 'back.out(2)',
                            },
                            2.1,
                        );
                }

                // The colour-shifting gradients only run while the hero is on
                // screen, so they cost nothing once you scroll past.
                const shines = q('.text-shine, .bg-shine');
                ScrollTrigger.create({
                    trigger: root.current,
                    start: 'top bottom',
                    end: 'bottom top',
                    onToggle: (self) =>
                        gsap.set(shines, {
                            animationPlayState: self.isActive
                                ? 'running'
                                : 'paused',
                        }),
                });

                return () => split.revert();
            });

            mm.add(MOTION_REDUCED, () => {
                gsap.set(q('[data-animate]'), { autoAlpha: 1 });
            });

            // Subtle 3D tilt that follows the mouse. Mouse only, never on touch.
            mm.add(
                '(pointer: fine) and (prefers-reduced-motion: no-preference)',
                () => {
                    const hero = root.current;

                    if (!hero || !tilt.current) {
                        return;
                    }

                    gsap.set(tilt.current, { transformPerspective: 900 });

                    const rotateY = gsap.quickTo(tilt.current, 'rotationY', {
                        duration: 0.8,
                        ease: 'power3.out',
                    });
                    const rotateX = gsap.quickTo(tilt.current, 'rotationX', {
                        duration: 0.8,
                        ease: 'power3.out',
                    });
                    const cardX = gsap.quickTo(q('[data-hero="card"]'), 'x', {
                        duration: 0.8,
                        ease: 'power3.out',
                    });

                    const onMove = (event: PointerEvent) => {
                        const box = hero.getBoundingClientRect();
                        const x = (event.clientX - box.left) / box.width - 0.5;
                        const y = (event.clientY - box.top) / box.height - 0.5;

                        rotateY(x * 8);
                        rotateX(y * -8);
                        cardX(x * -16);
                    };

                    const onLeave = () => {
                        rotateY(0);
                        rotateX(0);
                        cardX(0);
                    };

                    hero.addEventListener('pointermove', onMove);
                    hero.addEventListener('pointerleave', onLeave);

                    return () => {
                        hero.removeEventListener('pointermove', onMove);
                        hero.removeEventListener('pointerleave', onLeave);
                    };
                },
            );

            return () => mm.revert();
        },
        { scope: root },
    );

    return (
        <section
            ref={root}
            aria-labelledby="hero-heading"
            className="mx-auto grid max-w-6xl items-center gap-14 px-4 pt-10 pb-20 sm:px-6 sm:pt-16 lg:min-h-[calc(100svh-4rem)] lg:grid-cols-12 lg:gap-8 lg:py-16"
        >
            <div className="text-center lg:col-span-7 lg:text-left">
                <h1 id="hero-heading">
                    <span
                        data-hero="name"
                        data-animate
                        className="block text-base font-medium text-brand sm:text-lg"
                    >
                        {profile.name}, {profile.role.toLowerCase()} in {city}
                    </span>
                    <span className="sr-only">. </span>
                    <span
                        data-hero="headline"
                        data-animate
                        className="mx-auto mt-5 block max-w-3xl text-[clamp(2.25rem,4.5vw+1rem,4.25rem)] leading-[1.06] font-semibold tracking-tight text-balance lg:mx-0 lg:max-w-none"
                    >
                        <HighlightedText text={profile.headlines.default} />
                    </span>
                </h1>

                <p
                    data-hero="intro"
                    data-animate
                    className="mx-auto mt-7 max-w-xl text-lg text-pretty text-muted-foreground lg:mx-0"
                >
                    {profile.intro}
                </p>

                <ul
                    data-hero="intro"
                    data-animate
                    className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm lg:justify-start"
                >
                    <li>{experienceDuration} of professional experience</li>
                    <li className="inline-flex items-center gap-2">
                        <span aria-hidden className="relative flex size-2">
                            <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand opacity-60 motion-reduce:hidden" />
                            <span className="relative inline-flex size-2 rounded-full bg-brand" />
                        </span>
                        Open to freelance projects and full time roles
                    </li>
                </ul>

                <div
                    data-hero="intro"
                    data-animate
                    className="mt-10 flex flex-wrap justify-center gap-3 lg:justify-start"
                >
                    <Magnetic>
                        <a
                            href="#experience"
                            className="inline-flex h-12 items-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-colors hover:bg-primary/85 active:scale-[0.98]"
                        >
                            View my experience
                        </a>
                    </Magnetic>
                    <Magnetic>
                        <Link
                            href={HIRE_ME_HREF}
                            className="inline-flex h-12 items-center rounded-full border px-6 text-sm font-medium transition-colors hover:border-brand hover:text-brand active:scale-[0.98]"
                        >
                            Hire me
                        </Link>
                    </Magnetic>
                </div>
            </div>

            <div className="relative mx-auto w-full max-w-[340px] sm:max-w-[380px] lg:col-span-5 lg:max-w-[440px]">
                <div ref={tilt}>
                    <Portrait name={profile.name} />
                </div>

                {impact && (
                    <ApiTraceCard
                        impact={impact}
                        className="relative z-10 mx-auto -mt-16 w-[min(100%,20.5rem)] lg:absolute lg:bottom-8 lg:-left-6 lg:mt-0 xl:-left-12"
                    />
                )}
            </div>
        </section>
    );
}
