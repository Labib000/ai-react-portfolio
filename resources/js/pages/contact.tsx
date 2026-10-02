import { usePage } from '@inertiajs/react';
import { useRef } from 'react';
import { ChannelCards } from '@/components/contact/channel-cards';
import { ContactForm } from '@/components/contact/contact-form';
import type { ContactReason } from '@/components/contact/contact-form';
import { ContactHero } from '@/components/contact/contact-hero';
import { NextSteps } from '@/components/contact/next-steps';
import { Faq } from '@/components/services/faq';
import { SeoHead } from '@/components/site/seo-head';
import type { PageMeta } from '@/types/content';
import { gsap, MOTION_OK, useGSAP } from '@/lib/gsap';
import type { FaqItem } from '@/types/content';

type ContactProps = {
    meta: PageMeta;
    reason: ContactReason;
    faq: FaqItem[];
};

export default function Contact({ meta, reason, faq }: ContactProps) {
    const { site } = usePage().props;
    const { email, phone, github, linkedin } = site.links;
    const description = meta.description;

    return (
        <>
            <SeoHead
                meta={meta}
                schema={{
                    '@context': 'https://schema.org',
                    '@graph': [
                        {
                            '@type': 'ContactPage',
                            name: `Contact ${site.name}`,
                            url: `${site.url}/contact`,
                            description,
                            mainEntity: {
                                '@type': 'Person',
                                name: site.name,
                                jobTitle: site.role,
                                url: site.url,
                                ...(email ? { email: `mailto:${email}` } : {}),
                                ...(phone ? { telephone: phone } : {}),
                                address: {
                                    '@type': 'PostalAddress',
                                    addressLocality:
                                        site.location.split(',')[0],
                                    addressCountry: 'IN',
                                },
                                sameAs: [github, linkedin].filter(Boolean),
                                contactPoint: {
                                    '@type': 'ContactPoint',
                                    contactType: 'sales',
                                    ...(email ? { email } : {}),
                                    ...(phone ? { telephone: phone } : {}),
                                    areaServed: 'Worldwide',
                                    availableLanguage: ['English'],
                                },
                            },
                        },
                        {
                            '@type': 'BreadcrumbList',
                            itemListElement: [
                                {
                                    '@type': 'ListItem',
                                    position: 1,
                                    name: 'Home',
                                    item: site.url,
                                },
                                {
                                    '@type': 'ListItem',
                                    position: 2,
                                    name: 'Contact',
                                    item: `${site.url}/contact`,
                                },
                            ],
                        },
                    ],
                }}
            />

            <ContactHero reason={reason} />

            <ChannelCards />

            <MessageSection reason={reason} />

            {faq.length > 0 && <Faq items={faq} />}
        </>
    );
}

/** The form card beside "What happens next". The card rises as it enters. */
function MessageSection({ reason }: { reason: ContactReason }) {
    const section = useRef<HTMLElement>(null);

    useGSAP(
        () => {
            const card = section.current?.querySelector('[data-form-card]');

            if (!card) {
                return;
            }

            const mm = gsap.matchMedia();

            mm.add(MOTION_OK, () => {
                gsap.fromTo(
                    card,
                    { autoAlpha: 0, y: 48, rotationX: 6 },
                    {
                        autoAlpha: 1,
                        y: 0,
                        rotationX: 0,
                        transformPerspective: 1200,
                        duration: 1,
                        ease: 'expo.out',
                        scrollTrigger: {
                            trigger: card,
                            start: 'top 85%',
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
            id="message"
            aria-label="Send a message"
            className="mx-auto grid max-w-6xl scroll-mt-20 grid-cols-1 gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-12 lg:gap-12"
        >
            <div
                data-form-card
                className="relative min-w-0 rounded-3xl border bg-card p-5 shadow-2xl shadow-black/20 sm:p-8 lg:col-span-7"
            >
                <div
                    aria-hidden
                    className="pointer-events-none absolute -top-24 -left-24 size-64 rounded-full bg-brand/10 blur-3xl"
                />
                <div className="relative">
                    <ContactForm
                        defaultReason={reason}
                        idPrefix="contact-page"
                        titleAs="h2"
                    />
                </div>
            </div>
            <div className="min-w-0 lg:col-span-5">
                <NextSteps />
            </div>
        </section>
    );
}
