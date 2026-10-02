import { faBolt } from '@fortawesome/free-solid-svg-icons/faBolt';
import { faComments } from '@fortawesome/free-solid-svg-icons/faComments';
import { faEye } from '@fortawesome/free-solid-svg-icons/faEye';
import { faKey } from '@fortawesome/free-solid-svg-icons/faKey';
import { faLifeRing } from '@fortawesome/free-solid-svg-icons/faLifeRing';
import { faRotate } from '@fortawesome/free-solid-svg-icons/faRotate';
import { useRef } from 'react';
import { SplitHeading } from '@/components/motion/split-heading';
import { Icon } from '@/components/ui/icon';
import type { FontAwesomeIconData } from '@/components/ui/icon';
import { gsap, MOTION_OK, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { cn } from '@/lib/utils';

const PROMISES: {
    icon: FontAwesomeIconData;
    title: string;
    text: string;
    wide?: boolean;
}[] = [
    {
        icon: faComments,
        title: 'Talk to the developer, not a middleman',
        text: 'You work directly with me from the first call to launch. Questions get answered by the person writing the code.',
        wide: true,
    },
    {
        icon: faRotate,
        title: 'Unlimited planning iterations',
        text: 'We refine the plan until it is exactly right. Nothing gets built until you approve it.',
    },
    {
        icon: faEye,
        title: 'Progress you can see',
        text: 'Regular updates and a staging link, so you watch the product take shape.',
    },
    {
        icon: faBolt,
        title: 'Fast and easy to find',
        text: 'Quick load times, clean markup and pages built for search engines from day one.',
    },
    {
        icon: faKey,
        title: 'You own everything',
        text: "Full source code, access and handover notes at launch. You're never locked in.",
    },
    {
        icon: faLifeRing,
        title: 'Support after launch',
        text: 'Maintenance with unlimited iterations: fixes, updates and new features as you grow.',
        wide: true,
    },
];

/**
 * "Why work with me": six promises in a bento grid. Cards flip up into
 * place as they scroll in; icons bounce on hover.
 */
export function Promises() {
    const section = useRef<HTMLElement>(null);

    useGSAP(
        () => {
            const mm = gsap.matchMedia();

            mm.add(MOTION_OK, () => {
                const cards = gsap.utils.toArray<HTMLElement>(
                    '[data-promise]',
                    section.current,
                );
                gsap.set(cards, {
                    autoAlpha: 0,
                    rotationX: -55,
                    y: 30,
                    transformPerspective: 900,
                    transformOrigin: '50% 0%',
                });

                const triggers = ScrollTrigger.batch(cards, {
                    start: 'top 88%',
                    once: true,
                    onEnter: (batch) =>
                        gsap.to(batch, {
                            autoAlpha: 1,
                            rotationX: 0,
                            y: 0,
                            duration: 0.9,
                            stagger: 0.08,
                            ease: 'expo.out',
                        }),
                });

                return () => triggers.forEach((trigger) => trigger.kill());
            });

            return () => mm.revert();
        },
        { scope: section },
    );

    return (
        <section
            ref={section}
            aria-labelledby="promises-heading"
            className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28"
        >
            <div className="mx-auto max-w-2xl text-center md:mx-0 md:text-left">
                <SplitHeading
                    as="h2"
                    id="promises-heading"
                    className="text-3xl font-semibold tracking-tight sm:text-4xl"
                >
                    Why work with me
                </SplitHeading>
                <p className="mt-4 text-pretty text-muted-foreground sm:text-lg">
                    What you can count on, on every project.
                </p>
            </div>

            <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-6 lg:gap-5">
                {PROMISES.map((promise, index) => (
                    <li
                        key={promise.title}
                        data-promise
                        className={cn(
                            'group relative overflow-hidden rounded-2xl border bg-card/60 p-6 text-center transition-colors hover:border-brand/40 sm:p-7 md:text-left',
                            promise.wide
                                ? 'sm:col-span-2 lg:col-span-4'
                                : 'lg:col-span-2',
                            index === PROMISES.length - 1 && 'lg:col-start-2',
                        )}
                    >
                        <span
                            aria-hidden
                            className="pointer-events-none absolute -right-10 -bottom-10 text-foreground opacity-[0.04] transition-opacity duration-500 group-hover:opacity-[0.08]"
                        >
                            <Icon icon={promise.icon} className="size-36" />
                        </span>
                        <span className="relative mx-auto grid size-12 place-items-center rounded-xl bg-brand/10 text-brand transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-translate-y-1 group-hover:-rotate-8 md:mx-0">
                            <Icon icon={promise.icon} className="size-5" />
                        </span>
                        <h3 className="relative mt-5 text-lg font-semibold tracking-tight">
                            {promise.title}
                        </h3>
                        <p className="relative mt-2 text-sm leading-relaxed text-pretty text-muted-foreground">
                            {promise.text}
                        </p>
                    </li>
                ))}
            </ul>
        </section>
    );
}
