import { faWhatsapp } from '@fortawesome/free-brands-svg-icons/faWhatsapp';
import { faArrowUp } from '@fortawesome/free-solid-svg-icons/faArrowUp';
import { faEnvelope } from '@fortawesome/free-solid-svg-icons/faEnvelope';
import { Link, usePage } from '@inertiajs/react';
import ServicesController from '@/actions/App/Http/Controllers/ServicesController';
import { Logo } from '@/components/site/logo';
import { HIRE_ME_HREF, navItems } from '@/components/site/nav-items';
import { SocialLinks } from '@/components/site/social-links';
import { Icon } from '@/components/ui/icon';

/** The four stacks I build with, each linking to its service on /services. */
const STACKS = [
    { label: 'Laravel development', anchor: 'service-laravel-development' },
    { label: 'MERN development', anchor: 'service-mern-development' },
    { label: 'Java full stack', anchor: 'service-java-full-stack' },
    { label: 'Gen AI development', anchor: 'service-gen-ai-development' },
];

const linkClass = 'text-muted-foreground transition-colors hover:text-brand';

export function SiteFooter() {
    const { site } = usePage().props;
    const city = site.location.split(',')[0];
    const { email, whatsapp } = site.links;

    const backToTop = () => {
        const prefersReducedMotion = window.matchMedia(
            '(prefers-reduced-motion: reduce)',
        ).matches;

        window.scrollTo({
            top: 0,
            behavior: prefersReducedMotion ? 'auto' : 'smooth',
        });
        document.getElementById('content')?.focus({ preventScroll: true });
    };

    return (
        <footer className="border-t print:hidden">
            <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 py-14 sm:grid-cols-2 sm:px-6 lg:grid-cols-[1.5fr_1fr_1fr_1.2fr] lg:gap-8">
                <div className="flex flex-col gap-4">
                    <Logo name={site.name} />
                    <p className="max-w-xs text-sm text-pretty text-muted-foreground">
                        {site.role.charAt(0)}
                        {site.role.slice(1).toLowerCase()} in {city}. I build
                        web apps and AI features with Laravel, MERN, Java and
                        Gen AI, from the first idea to launch.
                    </p>
                    <p className="inline-flex items-center gap-2 text-sm">
                        <span aria-hidden className="relative flex size-2">
                            <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand opacity-60 motion-reduce:hidden" />
                            <span className="relative inline-flex size-2 rounded-full bg-brand" />
                        </span>
                        Open to freelance projects and full time roles
                    </p>
                </div>

                <nav aria-labelledby="footer-stacks">
                    <p id="footer-stacks" className="text-sm font-semibold">
                        What I build
                    </p>
                    <ul className="mt-4 flex flex-col gap-2.5 text-sm">
                        {STACKS.map((stack) => (
                            <li key={stack.anchor}>
                                <Link
                                    href={`${ServicesController.url()}#${stack.anchor}`}
                                    className={linkClass}
                                >
                                    {stack.label}
                                </Link>
                            </li>
                        ))}
                        <li>
                            <Link
                                href={ServicesController.url()}
                                className="font-medium text-brand transition-colors hover:text-foreground"
                            >
                                All services
                            </Link>
                        </li>
                    </ul>
                </nav>

                <nav aria-labelledby="footer-pages">
                    <p id="footer-pages" className="text-sm font-semibold">
                        Explore
                    </p>
                    <ul className="mt-4 flex flex-col gap-2.5 text-sm">
                        {navItems.map((item) => (
                            <li key={item.href}>
                                {item.href.includes('#') ? (
                                    <a href={item.href} className={linkClass}>
                                        {item.label}
                                    </a>
                                ) : (
                                    <Link
                                        href={item.href}
                                        className={linkClass}
                                    >
                                        {item.label}
                                    </Link>
                                )}
                            </li>
                        ))}
                    </ul>
                </nav>

                <div className="flex flex-col gap-4">
                    <p className="text-sm font-semibold">Get in touch</p>
                    <ul className="flex flex-col gap-2.5 text-sm">
                        {email && (
                            <li>
                                <a
                                    href={`mailto:${email}`}
                                    className={`inline-flex items-center gap-2 break-all ${linkClass}`}
                                >
                                    <Icon
                                        icon={faEnvelope}
                                        className="size-3.5 shrink-0 text-brand"
                                    />
                                    {email}
                                </a>
                            </li>
                        )}
                        {whatsapp && (
                            <li>
                                <a
                                    href={`https://wa.me/${whatsapp}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={`inline-flex items-center gap-2 ${linkClass}`}
                                >
                                    <Icon
                                        icon={faWhatsapp}
                                        className="size-3.5 shrink-0 text-[#25D366]"
                                    />
                                    Chat on WhatsApp
                                </a>
                            </li>
                        )}
                    </ul>
                    <Link
                        href={HIRE_ME_HREF}
                        className="inline-flex h-10 w-fit items-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/85 active:scale-[0.98]"
                    >
                        Hire me
                    </Link>
                </div>
            </div>

            <div className="border-t">
                <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <p>
                        © {new Date().getFullYear()} {site.name}
                    </p>
                    <div className="flex items-center justify-between gap-6">
                        <SocialLinks links={site.links} />
                        <button
                            type="button"
                            onClick={backToTop}
                            className="group inline-flex shrink-0 items-center gap-2 transition-colors hover:text-brand"
                        >
                            Back to top
                            <Icon
                                icon={faArrowUp}
                                className="size-3 transition-transform group-hover:-translate-y-0.5"
                            />
                        </button>
                    </div>
                </div>
            </div>
        </footer>
    );
}
