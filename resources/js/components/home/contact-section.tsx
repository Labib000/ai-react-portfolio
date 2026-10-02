import { faWhatsapp } from '@fortawesome/free-brands-svg-icons/faWhatsapp';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons/faArrowRight';
import { faCheck } from '@fortawesome/free-solid-svg-icons/faCheck';
import { faCopy } from '@fortawesome/free-solid-svg-icons/faCopy';
import { faEnvelope } from '@fortawesome/free-solid-svg-icons/faEnvelope';
import { faFileLines } from '@fortawesome/free-solid-svg-icons/faFileLines';
import { faLocationDot } from '@fortawesome/free-solid-svg-icons/faLocationDot';
import { faPhone } from '@fortawesome/free-solid-svg-icons/faPhone';
import { Link, usePage } from '@inertiajs/react';
import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import ResumeController from '@/actions/App/Http/Controllers/ResumeController';
import { ContactForm } from '@/components/contact/contact-form';
import { SplitHeading } from '@/components/motion/split-heading';
import { Icon } from '@/components/ui/icon';
import { useClipboard } from '@/hooks/use-clipboard';
import { gsap, MOTION_OK, useGSAP } from '@/lib/gsap';
import { cn } from '@/lib/utils';

function telHref(phone: string): string {
    return `tel:${phone.replace(/[^+\d]/g, '')}`;
}

/**
 * "Let's work together": direct contact details and the contact form.
 */
export function ContactSection() {
    const { site } = usePage().props;
    const { email, phone, whatsapp } = site.links;
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

            const mm = gsap.matchMedia();

            mm.add(MOTION_OK, () => {
                gsap.timeline({
                    defaults: { ease: 'power3.out' },
                    scrollTrigger: {
                        trigger: root.querySelector('[data-contact-grid]'),
                        start: 'top 80%',
                        once: true,
                    },
                })
                    .fromTo(
                        root.querySelectorAll('[data-channel]'),
                        { autoAlpha: 0, x: -24 },
                        { autoAlpha: 1, x: 0, duration: 0.7, stagger: 0.08 },
                        0,
                    )
                    .fromTo(
                        root.querySelector('[data-form-card]'),
                        { autoAlpha: 0, y: 40 },
                        { autoAlpha: 1, y: 0, duration: 0.9, ease: 'expo.out' },
                        0.1,
                    );
            });

            return () => mm.revert();
        },
        { scope: section },
    );

    return (
        <section
            ref={section}
            id="contact"
            aria-labelledby="contact-heading"
            className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28"
        >
            <div className="mx-auto max-w-2xl text-center md:mx-0 md:text-left">
                <SplitHeading
                    as="h2"
                    id="contact-heading"
                    className="text-3xl font-semibold tracking-tight sm:text-4xl"
                >
                    Let's work together
                </SplitHeading>
                <p className="mt-4 text-pretty text-muted-foreground sm:text-lg">
                    Hiring for a role, or need a website or web app built? Tell
                    me about it and I'll reply within 24 hours.
                </p>
            </div>

            <div
                data-contact-grid
                className="mt-12 grid gap-8 sm:mt-14 lg:grid-cols-12 lg:gap-10"
            >
                {/* Direct contact */}
                <div className="lg:col-span-5">
                    <h3 className="text-center text-lg font-semibold tracking-tight lg:text-left">
                        Reach me directly
                    </h3>

                    <ul className="mt-5 flex flex-col gap-3">
                        {email && (
                            <ChannelRow
                                icon={faEnvelope}
                                label="Email"
                                value={
                                    <a
                                        href={`mailto:${email}`}
                                        className="break-all hover:text-brand"
                                    >
                                        {email}
                                    </a>
                                }
                                action={
                                    <button
                                        type="button"
                                        onClick={copyEmail}
                                        aria-label={
                                            isCopied && copiedText === email
                                                ? 'Email copied'
                                                : 'Copy email address'
                                        }
                                        className="grid size-10 shrink-0 place-items-center rounded-full border text-muted-foreground transition-colors hover:border-brand hover:text-brand active:scale-95"
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
                            <ChannelRow
                                icon={faPhone}
                                label="Phone"
                                value={
                                    <a
                                        href={telHref(phone)}
                                        className="whitespace-nowrap hover:text-brand"
                                    >
                                        {phone}
                                    </a>
                                }
                            />
                        )}

                        {(whatsapp || phone) && (
                            <li
                                data-channel
                                className="flex items-center justify-between gap-4 rounded-2xl border bg-card/60 p-4"
                            >
                                <div>
                                    <p className="text-sm font-medium">
                                        Message me
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Quickest way to reach me
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    {whatsapp && (
                                        <a
                                            href={`https://wa.me/${whatsapp}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            aria-label="Message me on WhatsApp"
                                            className="grid size-11 place-items-center rounded-full bg-[#25D366] text-white shadow-lg shadow-[#25D366]/25 transition-transform hover:scale-105 active:scale-95"
                                        >
                                            <Icon
                                                icon={faWhatsapp}
                                                className="size-5"
                                            />
                                        </a>
                                    )}
                                    {phone && (
                                        <a
                                            href={telHref(phone)}
                                            aria-label="Call me"
                                            className="grid size-11 place-items-center rounded-full border text-foreground transition-colors hover:border-brand hover:text-brand active:scale-95"
                                        >
                                            <Icon
                                                icon={faPhone}
                                                className="size-4"
                                            />
                                        </a>
                                    )}
                                </div>
                            </li>
                        )}
                    </ul>

                    <div
                        data-channel
                        className="mt-6 flex flex-col items-center gap-2.5 text-center text-sm lg:items-start lg:text-left"
                    >
                        <p className="inline-flex items-center gap-2">
                            <span aria-hidden className="relative flex size-2">
                                <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand opacity-60 motion-reduce:hidden" />
                                <span className="relative inline-flex size-2 rounded-full bg-brand" />
                            </span>
                            Open to freelance projects and full time roles
                        </p>
                        <p className="inline-flex items-center gap-2 text-muted-foreground">
                            <Icon
                                icon={faLocationDot}
                                className="size-3.5 text-brand"
                            />
                            {site.location}, working remotely worldwide
                        </p>
                        <Link
                            href={ResumeController.url()}
                            className="group inline-flex items-center gap-2 font-medium text-brand"
                        >
                            <Icon icon={faFileLines} className="size-3.5" />
                            View my resume
                            <Icon
                                icon={faArrowRight}
                                className="size-2.5 transition-transform group-hover:translate-x-0.5"
                            />
                        </Link>
                    </div>
                </div>

                {/* Form */}
                <div
                    data-form-card
                    className="relative rounded-2xl border bg-card p-5 shadow-2xl shadow-black/20 sm:p-8 lg:col-span-7"
                >
                    <ContactForm idPrefix="home-contact" />
                </div>
            </div>
        </section>
    );
}

function ChannelRow({
    icon,
    label,
    value,
    action,
}: {
    icon: Parameters<typeof Icon>[0]['icon'];
    label: string;
    value: ReactNode;
    action?: ReactNode;
}) {
    return (
        <li
            data-channel
            className="flex items-center gap-4 rounded-2xl border bg-card/60 p-4"
        >
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
                <Icon icon={icon} className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="mt-0.5 text-sm font-medium sm:text-base">
                    {value}
                </p>
            </div>
            {action}
        </li>
    );
}
