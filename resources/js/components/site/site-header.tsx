import { Link, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { Magnetic } from '@/components/motion/magnetic';
import { Logo } from '@/components/site/logo';
import { MobileNav } from '@/components/site/mobile-nav';
import { HIRE_ME_HREF, isOnPage, navItems } from '@/components/site/nav-items';
import { ThemeToggle } from '@/components/site/theme-toggle';
import { useScrollSpy } from '@/hooks/use-scroll-spy';
import { gsap, MOTION_OK, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { cn } from '@/lib/utils';

/**
 * Site-wide header. Lives in the persistent layout, so it mounts once and its
 * entrance animation only plays on the first page load.
 */
export function SiteHeader() {
    const { props, url } = usePage();
    const { site } = props;
    const header = useRef<HTMLElement>(null);
    const [isScrolled, setIsScrolled] = useState(false);
    const activeSection = useScrollSpy(navItems.map((item) => item.section));

    useEffect(() => {
        const onScroll = () => setIsScrolled(window.scrollY > 24);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });

        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useGSAP(
        () => {
            const mm = gsap.matchMedia();

            mm.add(MOTION_OK, () => {
                gsap.from(header.current, {
                    yPercent: -100,
                    autoAlpha: 0,
                    duration: 0.7,
                    ease: 'power3.out',
                });

                // Hide while scrolling down, reveal on any scroll up.
                let isHidden = false;

                ScrollTrigger.create({
                    start: 0,
                    end: 'max',
                    onUpdate: (self) => {
                        const shouldHide =
                            self.direction === 1 && self.scroll() > 160;

                        if (shouldHide !== isHidden) {
                            isHidden = shouldHide;
                            gsap.to(header.current, {
                                yPercent: shouldHide ? -100 : 0,
                                duration: 0.35,
                                ease: 'power2.out',
                                overwrite: true,
                            });
                        }
                    },
                });
            });

            return () => mm.revert();
        },
        { scope: header },
    );

    return (
        <header
            ref={header}
            data-animate
            className={cn(
                'sticky top-0 z-40 border-b transition-[background-color,border-color,backdrop-filter] duration-300 print:hidden',
                isScrolled
                    ? 'border-border/70 bg-background/95 lg:bg-background/75 lg:backdrop-blur-lg'
                    : 'border-transparent bg-transparent',
            )}
        >
            <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
                <Logo name={site.name} />

                <nav aria-label="Main" className="hidden lg:block">
                    <ul className="flex items-center gap-8">
                        {navItems.map((item) => {
                            const isActive =
                                item.section === activeSection ||
                                isOnPage(item, url);
                            const LinkTag = item.href.includes('#')
                                ? 'a'
                                : Link;

                            return (
                                <li key={item.href}>
                                    <LinkTag
                                        href={item.href}
                                        aria-current={
                                            isActive ? 'true' : undefined
                                        }
                                        className={cn(
                                            'relative py-1 text-sm font-medium transition-colors after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:origin-left after:scale-x-0 after:rounded-full after:bg-brand after:transition-transform after:duration-300 hover:text-foreground hover:after:scale-x-100 focus-visible:after:scale-x-100',
                                            isActive
                                                ? 'text-foreground after:scale-x-100'
                                                : 'text-muted-foreground',
                                        )}
                                    >
                                        {item.label}
                                    </LinkTag>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                <div className="flex items-center gap-2 sm:gap-3">
                    <ThemeToggle />
                    <Magnetic className="hidden md:inline-block">
                        <Link
                            href={HIRE_ME_HREF}
                            className="inline-flex h-10 items-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/85 active:scale-[0.98]"
                        >
                            Hire me
                        </Link>
                    </Magnetic>
                    <MobileNav activeSection={activeSection} />
                </div>
            </div>
        </header>
    );
}
