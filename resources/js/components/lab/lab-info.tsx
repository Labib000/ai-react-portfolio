import { faWhatsapp } from '@fortawesome/free-brands-svg-icons/faWhatsapp';
import { faBan } from '@fortawesome/free-solid-svg-icons/faBan';
import { faClock } from '@fortawesome/free-solid-svg-icons/faClock';
import { faDatabase } from '@fortawesome/free-solid-svg-icons/faDatabase';
import { faGaugeHigh } from '@fortawesome/free-solid-svg-icons/faGaugeHigh';
import { faHandshake } from '@fortawesome/free-solid-svg-icons/faHandshake';
import { faLock } from '@fortawesome/free-solid-svg-icons/faLock';
import { faPlugCircleBolt } from '@fortawesome/free-solid-svg-icons/faPlugCircleBolt';
import { faQuoteLeft } from '@fortawesome/free-solid-svg-icons/faQuoteLeft';
import { faShieldHalved } from '@fortawesome/free-solid-svg-icons/faShieldHalved';
import { Link, usePage } from '@inertiajs/react';
import { useRef } from 'react';
import { whatsappHref } from '@/components/contact/contact-hero';
import { Magnetic } from '@/components/motion/magnetic';
import { SplitHeading } from '@/components/motion/split-heading';
import { HIRE_ME_HREF } from '@/components/site/nav-items';
import { Icon } from '@/components/ui/icon';
import type { FontAwesomeIconData } from '@/components/ui/icon';
import { gsap, MOTION_OK, ScrollTrigger, useGSAP } from '@/lib/gsap';

const BENEFITS: { icon: FontAwesomeIconData; title: string; body: string }[] = [
    {
        icon: faWhatsapp,
        title: 'On your website or WhatsApp',
        body: 'The same assistant can sit in a chat bubble on your site or answer on WhatsApp and Telegram.',
    },
    {
        icon: faClock,
        title: 'Answers at any hour',
        body: 'Customers get correct answers at 2 am, and your team stops repeating the same replies.',
    },
    {
        icon: faHandshake,
        title: 'Hands leads to you',
        body: 'When a customer is ready to book or buy, it collects their details and passes them to your team.',
    },
    {
        icon: faDatabase,
        title: 'Built on your own data',
        body: 'It answers from your FAQs, price lists and documents, and stays current as you update them.',
    },
];

const GUARDRAILS: { icon: FontAwesomeIconData; title: string; body: string }[] =
    [
        {
            icon: faQuoteLeft,
            title: 'Grounded, with sources',
            body: 'Answers come only from the business text, and each one cites the words it used.',
        },
        {
            icon: faBan,
            title: 'Says "I don\'t know"',
            body: "If the text doesn't cover a question, it says so and points to the business instead of guessing.",
        },
        {
            icon: faShieldHalved,
            title: 'Guards against prompt injection',
            body: 'Visitor messages and pasted text are treated as data, never as instructions. It has no tools and no secrets to leak.',
        },
        {
            icon: faLock,
            title: 'Nothing stored',
            body: 'Pasted text is sent to the AI model to answer your question, but this site never saves, logs or caches it.',
        },
        {
            icon: faGaugeHigh,
            title: 'Limits and caching',
            body: 'Limits for each visitor, caps on input and answer length, and cached answers to common questions keep costs predictable.',
        },
        {
            icon: faPlugCircleBolt,
            title: 'Fails gracefully',
            body: 'If the AI provider is down, the page still works and says so, instead of breaking.',
        },
    ];

/**
 * Below the demo: what a business gets, how the demo is built (for the
 * technical reader), and the call to action. Cards rise in a stagger as
 * each grid scrolls in.
 */
export function LabInfo() {
    const { site } = usePage().props;
    const root = useRef<HTMLDivElement>(null);
    const { whatsapp } = site.links;

    useGSAP(
        () => {
            const scope = root.current;

            if (!scope) {
                return;
            }

            const mm = gsap.matchMedia();

            mm.add(MOTION_OK, () => {
                const triggers = gsap.utils
                    .toArray<HTMLElement>('[data-info-grid]', scope)
                    .map((grid) => {
                        const items = grid.querySelectorAll('[data-info-item]');
                        const icons = grid.querySelectorAll('[data-info-icon]');
                        gsap.set(items, { autoAlpha: 0, y: 32 });
                        gsap.set(icons, { scale: 0, rotation: -25 });

                        return ScrollTrigger.create({
                            trigger: grid,
                            start: 'top 85%',
                            once: true,
                            onEnter: () => {
                                gsap.to(items, {
                                    autoAlpha: 1,
                                    y: 0,
                                    duration: 0.8,
                                    stagger: 0.07,
                                    ease: 'expo.out',
                                });
                                gsap.to(icons, {
                                    scale: 1,
                                    rotation: 0,
                                    duration: 0.55,
                                    stagger: 0.07,
                                    delay: 0.2,
                                    ease: 'back.out(2.5)',
                                });
                            },
                        });
                    });

                const band = scope.querySelector('[data-cta]');
                const bandTween = band
                    ? gsap.fromTo(
                          band,
                          { autoAlpha: 0, y: 40, scale: 0.97 },
                          {
                              autoAlpha: 1,
                              y: 0,
                              scale: 1,
                              duration: 1,
                              ease: 'expo.out',
                              scrollTrigger: {
                                  trigger: band,
                                  start: 'top 85%',
                                  once: true,
                              },
                          },
                      )
                    : null;

                return () => {
                    triggers.forEach((trigger) => trigger.kill());
                    bandTween?.scrollTrigger?.kill();
                };
            });

            return () => mm.revert();
        },
        { scope: root },
    );

    return (
        <div ref={root}>
            <section
                aria-labelledby="benefits-heading"
                className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20"
            >
                <div className="max-w-2xl">
                    <SplitHeading
                        as="h2"
                        id="benefits-heading"
                        className="text-3xl font-semibold tracking-tight sm:text-4xl"
                    >
                        What your business would get
                    </SplitHeading>
                    <p className="mt-4 text-pretty text-muted-foreground sm:text-lg">
                        The demo shows the core idea. A real build is shaped
                        around your channels, your data and your team.
                    </p>
                </div>
                <ul
                    data-info-grid
                    className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
                >
                    {BENEFITS.map((item) => (
                        <InfoCard key={item.title} {...item} />
                    ))}
                </ul>
            </section>

            <section
                aria-labelledby="built-heading"
                className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20"
            >
                <div className="max-w-2xl">
                    <SplitHeading
                        as="h2"
                        id="built-heading"
                        className="text-3xl font-semibold tracking-tight sm:text-4xl"
                    >
                        How it's built
                    </SplitHeading>
                    <p className="mt-4 text-pretty text-muted-foreground sm:text-lg">
                        Laravel streams the answer from a large language model
                        to React as it's written. The hard part is not the API
                        call; it's making it safe, honest and cheap to run.
                    </p>
                </div>
                <ul
                    data-info-grid
                    className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
                >
                    {GUARDRAILS.map((item) => (
                        <InfoCard key={item.title} {...item} />
                    ))}
                </ul>
            </section>

            <section
                aria-labelledby="lab-cta-heading"
                className="mx-auto max-w-6xl px-4 pt-8 pb-24 sm:px-6"
            >
                <div
                    data-cta
                    className="relative overflow-hidden rounded-[2rem] border bg-card px-6 py-14 text-center sm:px-12 sm:py-20"
                >
                    <div
                        aria-hidden
                        className="pointer-events-none absolute -top-32 left-1/2 size-96 -translate-x-1/2 rounded-full bg-brand/15 blur-3xl"
                    />
                    <h2
                        id="lab-cta-heading"
                        className="relative mx-auto max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-5xl"
                    >
                        Want this on your website or WhatsApp?
                    </h2>
                    <p className="relative mx-auto mt-4 max-w-xl text-pretty text-muted-foreground sm:text-lg">
                        Tell me about your business and the questions customers
                        ask most. I'll reply within 24 hours with how I'd build
                        it.
                    </p>
                    <div className="relative mt-10 flex flex-wrap justify-center gap-3">
                        <Magnetic>
                            <Link
                                href={HIRE_ME_HREF}
                                className="inline-flex h-12 items-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-colors hover:bg-primary/85 active:scale-[0.98]"
                            >
                                Start a project
                            </Link>
                        </Magnetic>
                        {whatsapp && (
                            <Magnetic>
                                <a
                                    href={whatsappHref(whatsapp)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex h-12 items-center gap-2.5 rounded-full border px-6 text-sm font-medium transition-colors hover:border-[#25D366] hover:text-[#1f9d55] active:scale-[0.98]"
                                >
                                    <Icon
                                        icon={faWhatsapp}
                                        className="size-4 text-[#25D366]"
                                    />
                                    WhatsApp me
                                </a>
                            </Magnetic>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}

function InfoCard({
    icon,
    title,
    body,
}: {
    icon: FontAwesomeIconData;
    title: string;
    body: string;
}) {
    return (
        <li
            data-info-item
            className="rounded-3xl border bg-card/60 p-6 transition-colors hover:border-brand/40"
        >
            <span
                data-info-icon
                className="grid size-11 place-items-center rounded-2xl bg-brand/10 text-brand"
            >
                <Icon icon={icon} className="size-4.5" />
            </span>
            <h3 className="mt-5 font-semibold tracking-tight">{title}</h3>
            <p className="mt-2 text-sm text-pretty text-muted-foreground">
                {body}
            </p>
        </li>
    );
}
