import { faWhatsapp } from '@fortawesome/free-brands-svg-icons/faWhatsapp';
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons/faPaperPlane';
import { faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons/faWandMagicSparkles';
import { Link, usePage } from '@inertiajs/react';
import { useRef } from 'react';
import { Magnetic } from '@/components/motion/magnetic';
import { BriefPlanner } from '@/components/services/brief-planner';
import { Faq } from '@/components/services/faq';
import { Journey } from '@/components/services/journey';
import { Promises } from '@/components/services/promises';
import { ServiceCatalogue } from '@/components/services/service-catalogue';
import { ServicesHero } from '@/components/services/services-hero';
import { HIRE_ME_HREF } from '@/components/site/nav-items';
import { SeoHead } from '@/components/site/seo-head';
import type { PageMeta } from '@/types/content';
import { Icon } from '@/components/ui/icon';
import { gsap, MOTION_OK, ScrollTrigger, useGSAP } from '@/lib/gsap';
import type {
    FaqItem,
    Impact,
    ProcessStep,
    ProjectSummary,
    Service,
    ToolRow,
} from '@/types/content';

type ServicesProps = {
    meta: PageMeta;
    impact: Impact[];
    services: Service[];
    process: ProcessStep[];
    faq: FaqItem[];
    projects: ProjectSummary[];
    toolRows: ToolRow[];
    briefTypes: Record<string, string>;
};

export default function Services({
    meta,
    impact,
    services,
    process,
    faq,
    projects,
    toolRows,
    briefTypes,
}: ServicesProps) {
    const { site } = usePage().props;
    const description = meta.description;

    return (
        <>
            <SeoHead
                meta={meta}
                schema={{
                    '@context': 'https://schema.org',
                    '@graph': [
                        {
                            '@type': 'ProfessionalService',
                            name: `${site.name}, ${site.role}`,
                            url: `${site.url}/services`,
                            description,
                            areaServed: 'Worldwide',
                            provider: {
                                '@type': 'Person',
                                name: site.name,
                                jobTitle: site.role,
                            },
                            hasOfferCatalog: {
                                '@type': 'OfferCatalog',
                                name: 'Development services',
                                itemListElement: services.map((service) => ({
                                    '@type': 'Offer',
                                    itemOffered: {
                                        '@type': 'Service',
                                        name: service.title,
                                        description: service.summary,
                                    },
                                })),
                            },
                        },
                        {
                            '@type': 'FAQPage',
                            mainEntity: faq.map((item) => ({
                                '@type': 'Question',
                                name: item.question,
                                acceptedAnswer: {
                                    '@type': 'Answer',
                                    text: item.answer,
                                },
                            })),
                        },
                    ],
                }}
            />

            <ServicesHero projects={projects} impact={impact} />

            <ServiceCatalogue
                services={services}
                projects={projects}
                toolRows={toolRows}
            />

            <BriefPlanner types={briefTypes} toolRows={toolRows} />

            {process.length > 0 && <Journey steps={process} />}

            <Promises />

            {faq.length > 0 && <Faq items={faq} />}

            <ClosingCta />
        </>
    );
}

/**
 * "Have an idea? Let's make it real.": a band with a slowly shifting
 * gradient border and a spotlight that follows the mouse.
 */
function ClosingCta() {
    const { site } = usePage().props;
    const band = useRef<HTMLElement>(null);
    const { whatsapp } = site.links;

    useGSAP(
        () => {
            const element = band.current;
            const border = element?.querySelector('[data-border]');

            if (!element || !border) {
                return;
            }

            const mm = gsap.matchMedia();

            mm.add(MOTION_OK, () => {
                const shift = gsap.to(border, {
                    backgroundPosition: '200% 50%',
                    duration: 6,
                    ease: 'none',
                    repeat: -1,
                    paused: true,
                });

                const trigger = ScrollTrigger.create({
                    trigger: element,
                    start: 'top bottom',
                    end: 'bottom top',
                    onToggle: (self) =>
                        self.isActive ? shift.play() : shift.pause(),
                });

                gsap.fromTo(
                    element.querySelectorAll('[data-cta-item]'),
                    { autoAlpha: 0, y: 24 },
                    {
                        autoAlpha: 1,
                        y: 0,
                        duration: 0.7,
                        stagger: 0.08,
                        ease: 'power3.out',
                        scrollTrigger: {
                            trigger: element,
                            start: 'top 80%',
                            once: true,
                        },
                    },
                );

                return () => trigger.kill();
            });

            mm.add('(pointer: fine)', () => {
                const onMove = (event: PointerEvent) => {
                    const box = element.getBoundingClientRect();
                    element.style.setProperty(
                        '--spot-x',
                        `${event.clientX - box.left}px`,
                    );
                    element.style.setProperty(
                        '--spot-y',
                        `${event.clientY - box.top}px`,
                    );
                };

                element.addEventListener('pointermove', onMove);

                return () => element.removeEventListener('pointermove', onMove);
            });

            return () => mm.revert();
        },
        { scope: band },
    );

    return (
        <section
            ref={band}
            aria-labelledby="hire-cta-heading"
            className="group mx-auto max-w-6xl px-4 pt-8 pb-28 sm:px-6"
        >
            <div
                data-border
                className="rounded-[2rem] bg-[linear-gradient(90deg,var(--color-brand),transparent,var(--color-brand),transparent,var(--color-brand))] bg-[length:200%_100%] p-px"
            >
                <div className="relative overflow-hidden rounded-[calc(2rem-1px)] bg-card px-6 py-14 text-center sm:px-12 sm:py-20">
                    <span
                        aria-hidden
                        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 pointer-fine:group-hover:opacity-100"
                        style={{
                            background:
                                'radial-gradient(26rem circle at var(--spot-x, 50%) var(--spot-y, 50%), color-mix(in oklab, var(--color-brand) 16%, transparent), transparent 70%)',
                        }}
                    />
                    <h2
                        id="hire-cta-heading"
                        data-cta-item
                        className="relative mx-auto max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-5xl"
                    >
                        Have an idea? Let's make it real.
                    </h2>
                    <p
                        data-cta-item
                        className="relative mx-auto mt-4 max-w-xl text-pretty text-muted-foreground sm:text-lg"
                    >
                        Tell me what you're building. I reply to every message
                        within 24 hours.
                    </p>
                    <div
                        data-cta-item
                        className="relative mt-10 flex flex-wrap justify-center gap-3"
                    >
                        <Magnetic>
                            <Link
                                href={HIRE_ME_HREF}
                                className="inline-flex h-12 items-center gap-2.5 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-colors hover:bg-primary/85 active:scale-[0.98]"
                            >
                                <Icon icon={faPaperPlane} className="size-4" />
                                Hire me
                            </Link>
                        </Magnetic>
                        {whatsapp && (
                            <Magnetic>
                                <a
                                    href={`https://wa.me/${whatsapp}?text=${encodeURIComponent("Hi Labib, I'd like to talk about a project.")}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex h-12 items-center gap-2.5 rounded-full border px-6 text-sm font-medium transition-colors hover:border-[#25D366] hover:text-[#1f9d55] active:scale-[0.98]"
                                >
                                    <Icon
                                        icon={faWhatsapp}
                                        className="size-4 text-[#25D366]"
                                    />
                                    WhatsApp
                                </a>
                            </Magnetic>
                        )}
                        <Magnetic>
                            <a
                                href="#planner"
                                className="inline-flex h-12 items-center gap-2.5 rounded-full border px-6 text-sm font-medium transition-colors hover:border-brand hover:text-brand active:scale-[0.98]"
                            >
                                <Icon
                                    icon={faWandMagicSparkles}
                                    className="size-4 text-brand"
                                />
                                Plan with AI
                            </a>
                        </Magnetic>
                    </div>
                </div>
            </div>
        </section>
    );
}
