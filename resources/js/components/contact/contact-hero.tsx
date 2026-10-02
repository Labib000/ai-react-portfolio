import { faWhatsapp } from '@fortawesome/free-brands-svg-icons/faWhatsapp';
import { faCheckDouble } from '@fortawesome/free-solid-svg-icons/faCheckDouble';
import { faClock } from '@fortawesome/free-solid-svg-icons/faClock';
import { faFileLines } from '@fortawesome/free-solid-svg-icons/faFileLines';
import { faPen } from '@fortawesome/free-solid-svg-icons/faPen';
import { Link, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import ResumeController from '@/actions/App/Http/Controllers/ResumeController';
import type { ContactReason } from '@/components/contact/contact-form';
import { Magnetic } from '@/components/motion/magnetic';
import { Icon } from '@/components/ui/icon';
import { gsap, MOTION_OK, ScrollTrigger, useGSAP } from '@/lib/gsap';

export const WHATSAPP_GREETING = "Hi Labib, I'd like to talk about a project.";

export function whatsappHref(number: string): string {
    return `https://wa.me/${number}?text=${encodeURIComponent(WHATSAPP_GREETING)}`;
}

/** The current time in Kolkata, e.g. "11:32 am". Client-only. */
function useKolkataTime(): string | null {
    const [time, setTime] = useState<string | null>(null);

    useEffect(() => {
        const format = new Intl.DateTimeFormat('en-IN', {
            hour: 'numeric',
            minute: '2-digit',
            timeZone: 'Asia/Kolkata',
        });
        const tick = () => setTime(format.format(new Date()));
        tick();
        const timer = window.setInterval(tick, 15_000);

        return () => window.clearInterval(timer);
    }, []);

    return time;
}

/**
 * "Let's build something together". The heading rises line by line, and a
 * chat preview plays a short conversation: your message lands, I start
 * typing, and the reply arrives with read ticks. It replays gently while in
 * view and stops off-screen.
 */
/** What each visitor came for: clients arrive from "Hire me", recruiters from the resume. */
const INTROS: Record<ContactReason, string> = {
    project:
        "Tell me what you want to build: a website, a web app, an online store or an AI chatbot. Message me on WhatsApp, send an email or use the form below, and I'll reply within 24 hours.",
    hiring: "Hiring for a Laravel, React or full stack role? Send me the job details through the form below or by email, and I'll reply within 24 hours.",
};

export function ContactHero({ reason }: { reason: ContactReason }) {
    const { site } = usePage().props;
    const root = useRef<HTMLElement>(null);
    const time = useKolkataTime();
    const { whatsapp } = site.links;
    const city = site.location.split(',')[0];

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
                    delay: 0.1,
                });

                intro
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
                        q('[data-phone]'),
                        { autoAlpha: 0, y: 60, rotation: 4 },
                        {
                            autoAlpha: 1,
                            y: 0,
                            rotation: 0,
                            duration: 1.1,
                            ease: 'expo.out',
                        },
                        0.3,
                    );

                // The conversation, replayed every few seconds.
                const chat = gsap.timeline({
                    repeat: -1,
                    repeatDelay: 3.5,
                    delay: 1.1,
                    defaults: { ease: 'back.out(1.7)' },
                });

                chat.set(q('[data-bubble], [data-typing], [data-ticks]'), {
                    autoAlpha: 0,
                })
                    .fromTo(
                        q('[data-bubble="visitor"]'),
                        { autoAlpha: 0, y: 16, scale: 0.9 },
                        {
                            autoAlpha: 1,
                            y: 0,
                            scale: 1,
                            duration: 0.5,
                            transformOrigin: '100% 100%',
                        },
                    )
                    .to(
                        q('[data-ticks]'),
                        { autoAlpha: 1, duration: 0.3 },
                        '+=0.4',
                    )
                    .fromTo(
                        q('[data-typing]'),
                        { autoAlpha: 0, scale: 0.8 },
                        {
                            autoAlpha: 1,
                            scale: 1,
                            duration: 0.35,
                            transformOrigin: '0% 100%',
                        },
                        '+=0.3',
                    )
                    .fromTo(
                        q('[data-typing-dot]'),
                        { y: 0 },
                        {
                            y: -4,
                            duration: 0.3,
                            stagger: 0.12,
                            repeat: 3,
                            yoyo: true,
                            ease: 'sine.inOut',
                        },
                        '<',
                    )
                    .to(q('[data-typing]'), { autoAlpha: 0, duration: 0.2 })
                    .fromTo(
                        q('[data-bubble="me"]'),
                        { autoAlpha: 0, y: 16, scale: 0.9 },
                        {
                            autoAlpha: 1,
                            y: 0,
                            scale: 1,
                            duration: 0.5,
                            transformOrigin: '0% 100%',
                        },
                        '<',
                    );

                const trigger = ScrollTrigger.create({
                    trigger: scope,
                    start: 'top bottom',
                    end: 'bottom top',
                    onToggle: (self) =>
                        self.isActive ? chat.resume() : chat.pause(),
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
            aria-labelledby="contact-page-heading"
            className="relative mx-auto grid max-w-6xl items-center gap-14 overflow-x-clip px-4 pt-12 pb-16 sm:px-6 sm:pt-20 lg:grid-cols-12 lg:gap-10 lg:pb-24"
        >
            <div className="min-w-0 text-center lg:col-span-7 lg:text-left">
                <p
                    data-hero-item
                    className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-medium text-brand sm:text-sm"
                >
                    <span className="relative flex size-1.5">
                        <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand opacity-60 motion-reduce:hidden" />
                        <span className="relative inline-flex size-1.5 rounded-full bg-brand" />
                    </span>
                    Open to freelance projects and full time roles
                </p>

                <h1
                    id="contact-page-heading"
                    className="mt-6 text-[clamp(2.4rem,4.6vw+0.8rem,4.25rem)] leading-[1.05] font-semibold tracking-tight"
                >
                    <span
                        data-hero-item
                        className="mb-4 block text-base font-medium tracking-normal text-brand sm:text-lg"
                    >
                        Contact {site.name}, full stack developer in {city}
                    </span>
                    <span className="sr-only">. </span>
                    <span className="block overflow-hidden pb-1">
                        <span data-hero-line className="block">
                            Let's build
                        </span>
                    </span>{' '}
                    <span className="block overflow-hidden pb-1">
                        <span data-hero-line className="block">
                            something{' '}
                            <span className="text-shine">together.</span>
                        </span>
                    </span>
                </h1>

                <p
                    data-hero-item
                    className="mx-auto mt-6 max-w-xl text-lg text-pretty text-muted-foreground lg:mx-0"
                >
                    {INTROS[reason]}
                </p>

                <div
                    data-hero-item
                    className="mt-9 flex flex-wrap justify-center gap-3 lg:justify-start"
                >
                    {reason === 'project' && whatsapp && (
                        <Magnetic>
                            <a
                                href={whatsappHref(whatsapp)}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex h-12 items-center gap-2.5 rounded-full bg-[#25D366] px-6 text-sm font-semibold text-[#073b1d] shadow-lg shadow-[#25D366]/25 transition-transform hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <Icon icon={faWhatsapp} className="size-5" />
                                Chat on WhatsApp
                            </a>
                        </Magnetic>
                    )}
                    <Magnetic>
                        <a
                            href="#message"
                            className={
                                reason === 'hiring'
                                    ? 'inline-flex h-12 items-center gap-2.5 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-colors hover:bg-primary/85 active:scale-[0.98]'
                                    : 'inline-flex h-12 items-center gap-2.5 rounded-full border px-6 text-sm font-medium transition-colors hover:border-brand hover:text-brand active:scale-[0.98]'
                            }
                        >
                            <Icon icon={faPen} className="size-3.5" />
                            {reason === 'hiring'
                                ? 'Send the role details'
                                : 'Write a message'}
                        </a>
                    </Magnetic>
                    {reason === 'hiring' && (
                        <Magnetic>
                            <Link
                                href={ResumeController.url()}
                                className="inline-flex h-12 items-center gap-2.5 rounded-full border px-6 text-sm font-medium transition-colors hover:border-brand hover:text-brand active:scale-[0.98]"
                            >
                                <Icon icon={faFileLines} className="size-3.5" />
                                View my resume
                            </Link>
                        </Magnetic>
                    )}
                </div>

                <p
                    data-hero-item
                    className="mt-8 inline-flex items-center gap-2 text-sm text-muted-foreground"
                >
                    <Icon icon={faClock} className="size-3.5 text-brand" />
                    <span>
                        {time ? (
                            <>
                                It's{' '}
                                <span className="font-medium text-foreground tabular-nums">
                                    {time}
                                </span>{' '}
                                in {city} (IST)
                            </>
                        ) : (
                            <>{city}, India (IST)</>
                        )}
                    </span>
                </p>
            </div>

            {/* A chat preview: decorative, the real channels are above. */}
            <div aria-hidden className="lg:col-span-5">
                <div
                    data-phone
                    className="relative mx-auto w-full max-w-sm overflow-hidden rounded-[2rem] border bg-card shadow-2xl shadow-black/30"
                >
                    <div
                        aria-hidden
                        className="pointer-events-none absolute -top-20 -right-20 size-56 rounded-full bg-brand/15 blur-3xl"
                    />
                    <div className="relative flex items-center gap-3 border-b px-5 py-4">
                        <span className="grid size-10 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                            LA
                        </span>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold">{site.name}</p>
                            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <span className="size-1.5 rounded-full bg-[#25D366]" />
                                Replies within 24 hours
                            </p>
                        </div>
                        <Icon
                            icon={faWhatsapp}
                            className="size-5 text-[#25D366]"
                        />
                    </div>

                    <div className="relative flex min-h-64 flex-col justify-end gap-3 bg-[radial-gradient(circle_at_1px_1px,color-mix(in_oklab,var(--color-foreground)_7%,transparent)_1px,transparent_0)] [background-size:18px_18px] px-4 py-6">
                        <div className="flex flex-col items-end gap-1">
                            <p
                                data-bubble="visitor"
                                className="max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-primary-foreground shadow-md"
                            >
                                {WHATSAPP_GREETING}
                            </p>
                            <span
                                data-ticks
                                className="flex items-center gap-1 text-[0.6875rem] text-muted-foreground"
                            >
                                Seen
                                <Icon
                                    icon={faCheckDouble}
                                    className="size-3 text-brand"
                                />
                            </span>
                        </div>

                        <div className="relative min-h-16">
                            <span
                                data-typing
                                className="absolute bottom-0 left-0 inline-flex gap-1 rounded-2xl rounded-bl-md border bg-background px-4 py-3.5"
                            >
                                {[0, 1, 2].map((dot) => (
                                    <span
                                        key={dot}
                                        data-typing-dot
                                        className="size-1.5 rounded-full bg-muted-foreground"
                                    />
                                ))}
                            </span>
                            <p
                                data-bubble="me"
                                className="max-w-[85%] rounded-2xl rounded-bl-md border bg-background px-4 py-2.5 text-sm shadow-md"
                            >
                                Hi! Happy to help. Tell me what you're building
                                and when you'd like to launch.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
