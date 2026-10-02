import { faGithub } from '@fortawesome/free-brands-svg-icons/faGithub';
import { faLinkedinIn } from '@fortawesome/free-brands-svg-icons/faLinkedinIn';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons/faWhatsapp';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons/faArrowRight';
import { faCheck } from '@fortawesome/free-solid-svg-icons/faCheck';
import { faCopy } from '@fortawesome/free-solid-svg-icons/faCopy';
import { faEnvelope } from '@fortawesome/free-solid-svg-icons/faEnvelope';
import { faPhone } from '@fortawesome/free-solid-svg-icons/faPhone';
import { usePage } from '@inertiajs/react';
import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { whatsappHref } from '@/components/contact/contact-hero';
import { SplitHeading } from '@/components/motion/split-heading';
import { Icon } from '@/components/ui/icon';
import type { FontAwesomeIconData } from '@/components/ui/icon';
import { useClipboard } from '@/hooks/use-clipboard';
import { gsap, MOTION_OK, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { cn } from '@/lib/utils';

function telHref(phone: string): string {
    return `tel:${phone.replace(/[^+\d]/g, '')}`;
}

/**
 * "Pick how you'd like to talk": WhatsApp leads for freelance clients,
 * then email (with copy), phone, LinkedIn and GitHub. Cards rise in a
 * stagger with their icons popping, and a spotlight follows the mouse.
 */
export function ChannelCards() {
    const { site } = usePage().props;
    const { email, phone, whatsapp, linkedin, github } = site.links;
    const section = useRef<HTMLElement>(null);
    const [copiedText, copy] = useClipboard();
    const [isCopied, setIsCopied] = useState(false);

    const copyEmail = async () => {
        if (email && (await copy(email))) {
            setIsCopied(true);
            window.setTimeout(() => setIsCopied(false), 2000);
        }
    };

    useGSAP(
        () => {
            const root = section.current;

            if (!root) {
                return;
            }

            const cards = gsap.utils.toArray<HTMLElement>(
                '[data-channel-card]',
                root,
            );
            const mm = gsap.matchMedia();

            mm.add(MOTION_OK, () => {
                gsap.set(cards, { autoAlpha: 0, y: 40 });
                gsap.set(root.querySelectorAll('[data-channel-icon]'), {
                    scale: 0,
                    rotation: -30,
                });

                const triggers = ScrollTrigger.batch(cards, {
                    start: 'top 88%',
                    once: true,
                    onEnter: (batch) => {
                        gsap.to(batch, {
                            autoAlpha: 1,
                            y: 0,
                            duration: 0.8,
                            stagger: 0.08,
                            ease: 'expo.out',
                        });
                        gsap.to(
                            (batch as HTMLElement[]).map((card) =>
                                card.querySelector('[data-channel-icon]'),
                            ),
                            {
                                scale: 1,
                                rotation: 0,
                                duration: 0.6,
                                stagger: 0.08,
                                delay: 0.2,
                                ease: 'back.out(2.5)',
                            },
                        );
                    },
                });

                return () => triggers.forEach((trigger) => trigger.kill());
            });

            mm.add('(pointer: fine)', () => {
                const onMove = (event: PointerEvent) => {
                    const card = event.currentTarget as HTMLElement;
                    const box = card.getBoundingClientRect();
                    card.style.setProperty(
                        '--spot-x',
                        `${event.clientX - box.left}px`,
                    );
                    card.style.setProperty(
                        '--spot-y',
                        `${event.clientY - box.top}px`,
                    );
                };

                cards.forEach((card) =>
                    card.addEventListener('pointermove', onMove),
                );

                return () =>
                    cards.forEach((card) =>
                        card.removeEventListener('pointermove', onMove),
                    );
            });

            return () => mm.revert();
        },
        { scope: section },
    );

    return (
        <section
            ref={section}
            aria-labelledby="channels-heading"
            className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20"
        >
            <div className="mx-auto max-w-2xl text-center md:mx-0 md:text-left">
                <SplitHeading
                    as="h2"
                    id="channels-heading"
                    className="text-3xl font-semibold tracking-tight sm:text-4xl"
                >
                    Pick how you'd like to talk
                </SplitHeading>
                <p className="mt-4 text-pretty text-muted-foreground sm:text-lg">
                    WhatsApp is the fastest for project enquiries. Email works
                    best for detailed briefs and job descriptions.
                </p>
            </div>

            <ul className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-5">
                {whatsapp && (
                    <ChannelCard
                        icon={faWhatsapp}
                        iconClassName="bg-[#25D366] text-white shadow-lg shadow-[#25D366]/30"
                        title="WhatsApp"
                        badge="Fastest reply"
                        description="Tell me about your project in a quick chat. Voice notes and screenshots welcome."
                        href={whatsappHref(whatsapp)}
                        cta="Start a chat"
                        isExternal
                        className="md:col-span-2"
                        isLead
                    />
                )}
                {email && (
                    <ChannelCard
                        icon={faEnvelope}
                        title="Email"
                        description={email}
                        href={`mailto:${email}`}
                        cta="Send an email"
                        action={
                            <button
                                type="button"
                                onClick={copyEmail}
                                aria-label={
                                    isCopied && copiedText === email
                                        ? 'Email copied'
                                        : 'Copy email address'
                                }
                                className="relative z-10 grid size-10 shrink-0 place-items-center rounded-full border text-muted-foreground transition-colors hover:border-brand hover:text-brand active:scale-95"
                            >
                                <Icon
                                    icon={isCopied ? faCheck : faCopy}
                                    className={cn(
                                        'size-3.5',
                                        isCopied && 'text-brand',
                                    )}
                                />
                            </button>
                        }
                    />
                )}
                {phone && (
                    <ChannelCard
                        icon={faPhone}
                        title="Call"
                        description={phone}
                        href={telHref(phone)}
                        cta="Call me"
                    />
                )}
                {linkedin && (
                    <ChannelCard
                        icon={faLinkedinIn}
                        iconClassName="bg-[#0A66C2] text-white"
                        title="LinkedIn"
                        description="For roles and professional introductions."
                        href={linkedin}
                        cta="Connect"
                        isExternal
                    />
                )}
                {github && (
                    <ChannelCard
                        icon={faGithub}
                        iconClassName="bg-foreground text-background"
                        title="GitHub"
                        description="See the code behind my projects."
                        href={github}
                        cta="View profile"
                        isExternal
                    />
                )}
            </ul>
        </section>
    );
}

function ChannelCard({
    icon,
    iconClassName,
    title,
    badge,
    description,
    href,
    cta,
    isExternal = false,
    isLead = false,
    action,
    className,
}: {
    icon: FontAwesomeIconData;
    iconClassName?: string;
    title: string;
    badge?: string;
    description: string;
    href: string;
    cta: string;
    isExternal?: boolean;
    isLead?: boolean;
    action?: ReactNode;
    className?: string;
}) {
    return (
        <li
            data-channel-card
            className={cn(
                'group relative flex flex-col overflow-hidden rounded-3xl border bg-card/60 p-6 transition-colors hover:border-brand/40 sm:p-7',
                isLead &&
                    'border-[#25D366]/30 bg-[linear-gradient(135deg,color-mix(in_oklab,#25D366_10%,transparent),transparent_60%)]',
                className,
            )}
        >
            <span
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 pointer-fine:group-hover:opacity-100"
                style={{
                    background: `radial-gradient(20rem circle at var(--spot-x, 50%) var(--spot-y, 50%), color-mix(in oklab, ${isLead ? '#25D366' : 'var(--color-brand)'} 12%, transparent), transparent 70%)`,
                }}
            />

            <div className="relative flex items-start justify-between gap-4">
                <span
                    data-channel-icon
                    className={cn(
                        'grid shrink-0 place-items-center rounded-2xl',
                        isLead ? 'size-14' : 'size-12',
                        iconClassName ?? 'bg-brand/10 text-brand',
                    )}
                >
                    <Icon
                        icon={icon}
                        className={isLead ? 'size-7' : 'size-5'}
                    />
                </span>
                {badge && (
                    <span className="inline-flex items-center gap-2 rounded-full border border-[#25D366]/40 bg-[#25D366]/10 px-3 py-1 text-xs font-medium text-[#1a8f47] dark:text-[#4ade80]">
                        <span className="relative flex size-1.5">
                            <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#25D366] opacity-70 motion-reduce:hidden" />
                            <span className="relative inline-flex size-1.5 rounded-full bg-[#25D366]" />
                        </span>
                        {badge}
                    </span>
                )}
                {action}
            </div>

            <h3
                className={cn(
                    'relative mt-6 font-semibold tracking-tight',
                    isLead ? 'text-2xl sm:text-3xl' : 'text-xl',
                )}
            >
                {title}
            </h3>
            <p
                className={cn(
                    'relative mt-2 text-pretty text-muted-foreground',
                    isLead ? 'max-w-md sm:text-lg' : 'text-sm break-words',
                )}
            >
                {description}
            </p>

            <a
                href={href}
                {...(isExternal ? { target: '_blank', rel: 'noreferrer' } : {})}
                className={cn(
                    'relative mt-auto inline-flex items-center gap-2 pt-6 text-sm font-medium transition-colors after:absolute after:inset-0 after:content-[""]',
                    isLead
                        ? 'text-[#1a8f47] dark:text-[#4ade80]'
                        : 'text-brand',
                )}
            >
                {cta}
                <span className="sr-only"> ({title})</span>
                <Icon
                    icon={faArrowRight}
                    className="size-3 transition-transform group-hover:translate-x-1"
                />
            </a>
        </li>
    );
}
