import { faBars } from '@fortawesome/free-solid-svg-icons/faBars';
import { faXmark } from '@fortawesome/free-solid-svg-icons/faXmark';
import { router, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import type { MouseEvent, SyntheticEvent } from 'react';
import { HIRE_ME_HREF, isOnPage, navItems } from '@/components/site/nav-items';
import { SocialLinks } from '@/components/site/social-links';
import { ThemeToggle } from '@/components/site/theme-toggle';
import { Icon } from '@/components/ui/icon';
import { gsap, MOTION_OK, MOTION_REDUCED, useGSAP } from '@/lib/gsap';
import { cn } from '@/lib/utils';

type MobileNavProps = {
    activeSection: string | null;
};

/**
 * Slide-in menu for screens below lg, built on the native <dialog> element:
 * showModal() makes the page behind it inert (focus trap), Esc is caught
 * through the cancel event, and focus returns to the hamburger on close.
 *
 * The dialog is always in the DOM, so the opening timeline is built once
 * and replayed; closing uses a short slide-out of its own.
 */
export function MobileNav({ activeSection }: MobileNavProps) {
    const { props, url } = usePage();
    const { site } = props;
    const dialog = useRef<HTMLDialogElement>(null);
    const barsIcon = useRef<HTMLSpanElement>(null);
    const timeline = useRef<gsap.core.Timeline | null>(null);
    const pendingHref = useRef<string | null>(null);
    const isClosing = useRef(false);
    const [isOpen, setIsOpen] = useState(false);

    const finishClosing = () => {
        isClosing.current = false;
        // Rewinding the opening timeline resets every element for next time.
        timeline.current?.pause(0);
        dialog.current?.close();
        document.documentElement.style.overflow = '';
        setIsOpen(false);

        const href = pendingHref.current;
        pendingHref.current = null;

        if (href) {
            goTo(href);
        }
    };

    const open = () => {
        const element = dialog.current;

        if (!element || element.open) {
            return;
        }

        element.showModal();
        document.documentElement.style.overflow = 'hidden';
        setIsOpen(true);
        timeline.current?.play(0);
    };

    /**
     * Closing gets its own short ease-in slide rather than reversing the
     * opening timeline: a reversed ease-out starts with a flat stretch that
     * reads as a delay before the panel moves.
     */
    const close = () => {
        const element = dialog.current;

        if (!element?.open || isClosing.current) {
            return;
        }

        if (!timeline.current) {
            finishClosing();

            return;
        }

        isClosing.current = true;
        timeline.current.pause();

        const panel = element.querySelector('[data-menu-panel]');
        const overlay = element.querySelector('[data-menu-overlay]');
        const closing = gsap.timeline({ onComplete: finishClosing });

        if (window.matchMedia(MOTION_REDUCED).matches) {
            closing.to([panel, overlay], { autoAlpha: 0, duration: 0.15 });

            return;
        }

        closing
            .to(panel, { xPercent: 100, duration: 0.4, ease: 'power3.in' }, 0)
            .to(
                overlay,
                { autoAlpha: 0, duration: 0.35, ease: 'power2.in' },
                0.05,
            )
            .to(
                barsIcon.current,
                { rotate: 0, autoAlpha: 1, duration: 0.3, ease: 'power2.out' },
                0.15,
            );
    };

    const onLinkClick = (
        event: MouseEvent<HTMLAnchorElement>,
        href: string,
    ) => {
        event.preventDefault();
        pendingHref.current = href;
        close();
    };

    // Esc: run the animated close instead of the browser's instant one.
    const onCancel = (event: SyntheticEvent<HTMLDialogElement>) => {
        event.preventDefault();
        close();
    };

    useGSAP(
        () => {
            const mm = gsap.matchMedia();

            const build = (isReduced: boolean) => {
                const menu = gsap.timeline({
                    paused: true,
                    defaults: { ease: 'power3.out' },
                });

                if (isReduced) {
                    menu.fromTo(
                        '[data-menu-fade]',
                        { autoAlpha: 0 },
                        { autoAlpha: 1, duration: 0.15, ease: 'none' },
                    );
                } else {
                    menu.to(
                        barsIcon.current,
                        { rotate: 90, autoAlpha: 0, duration: 0.3 },
                        0,
                    )
                        .fromTo(
                            '[data-menu-overlay]',
                            { autoAlpha: 0 },
                            { autoAlpha: 1, duration: 0.4, ease: 'power2.out' },
                            0,
                        )
                        .fromTo(
                            '[data-menu-panel]',
                            { xPercent: 100 },
                            {
                                xPercent: 0,
                                duration: 0.65,
                                ease: 'expo.out',
                                force3D: true,
                            },
                            0,
                        )
                        .fromTo(
                            '[data-close-icon]',
                            { rotate: -90, autoAlpha: 0 },
                            { rotate: 0, autoAlpha: 1, duration: 0.4 },
                            0.15,
                        )
                        .fromTo(
                            '[data-nav-link]',
                            { yPercent: 110 },
                            {
                                yPercent: 0,
                                duration: 0.6,
                                stagger: 0.05,
                                ease: 'power4.out',
                            },
                            0.18,
                        )
                        .fromTo(
                            '[data-menu-footer]',
                            { autoAlpha: 0, y: 16 },
                            { autoAlpha: 1, y: 0, duration: 0.45 },
                            0.35,
                        );
                }

                timeline.current = menu;

                return () => {
                    menu.kill();
                    timeline.current = null;
                };
            };

            mm.add(MOTION_OK, () => build(false));
            mm.add(MOTION_REDUCED, () => build(true));

            return () => mm.revert();
        },
        { scope: dialog },
    );

    // Close instantly on Inertia navigation, or when the screen grows to
    // desktop size where this menu is hidden.
    useEffect(() => {
        const removeNavigateListener = router.on('navigate', () => {
            if (dialog.current?.open) {
                finishClosing();
            }
        });
        const desktop = window.matchMedia('(min-width: 1024px)');
        const onResize = () => {
            if (desktop.matches && dialog.current?.open) {
                finishClosing();
            }
        };
        desktop.addEventListener('change', onResize);

        return () => {
            removeNavigateListener();
            desktop.removeEventListener('change', onResize);
        };
    }, []);

    return (
        <>
            <button
                type="button"
                onClick={open}
                aria-label="Open menu"
                aria-expanded={isOpen}
                aria-controls="site-menu"
                className="grid size-10 place-items-center rounded-full border text-foreground transition-colors hover:border-brand hover:text-brand lg:hidden"
            >
                <span ref={barsIcon} className="grid place-items-center">
                    <Icon icon={faBars} className="size-4" />
                </span>
            </button>

            <dialog
                ref={dialog}
                id="site-menu"
                aria-label="Site menu"
                onCancel={onCancel}
                onClose={() => {
                    // Covers the browser closing the dialog without our help.
                    if (isOpen) {
                        finishClosing();
                    }
                }}
                className="site-menu lg:hidden"
            >
                <div
                    data-menu-overlay
                    data-menu-fade
                    onClick={close}
                    className="absolute inset-0 bg-background/75"
                />

                <div
                    data-menu-panel
                    data-menu-fade
                    className="absolute inset-y-0 right-0 flex w-[min(88vw,380px)] flex-col border-l bg-card bg-[radial-gradient(28rem_18rem_at_100%_0%,var(--glow),transparent_70%)] shadow-2xl shadow-black/40"
                >
                    <div className="flex h-16 shrink-0 items-center justify-end px-4 sm:px-6">
                        <button
                            type="button"
                            onClick={close}
                            aria-label="Close menu"
                            className="grid size-10 place-items-center rounded-full border text-foreground transition-colors hover:border-brand hover:text-brand"
                        >
                            <span
                                data-close-icon
                                className="grid place-items-center"
                            >
                                <Icon icon={faXmark} className="size-4" />
                            </span>
                        </button>
                    </div>

                    <nav aria-label="Main" className="flex-1 px-6 pt-8">
                        <ul className="flex flex-col gap-3">
                            {navItems.map((item) => {
                                const isActive =
                                    item.section === activeSection ||
                                    isOnPage(item, url);

                                return (
                                    <li
                                        key={item.href}
                                        className="overflow-hidden py-1"
                                    >
                                        <a
                                            href={item.href}
                                            data-nav-link
                                            aria-current={
                                                isActive ? 'true' : undefined
                                            }
                                            onClick={(event) =>
                                                onLinkClick(event, item.href)
                                            }
                                            className={cn(
                                                'group flex items-center gap-3 text-3xl font-semibold tracking-tight transition-colors hover:text-brand',
                                                isActive
                                                    ? 'text-foreground'
                                                    : 'text-muted-foreground',
                                            )}
                                        >
                                            {item.label}
                                            <span
                                                aria-hidden
                                                className={cn(
                                                    'size-2 rounded-full bg-brand transition-all duration-300',
                                                    isActive
                                                        ? 'scale-100 opacity-100'
                                                        : 'scale-0 opacity-0 group-hover:scale-100 group-hover:opacity-100',
                                                )}
                                            />
                                        </a>
                                    </li>
                                );
                            })}
                        </ul>
                    </nav>

                    <div
                        data-menu-footer
                        className="flex flex-col gap-5 border-t px-6 py-6"
                    >
                        <a
                            href={HIRE_ME_HREF}
                            onClick={(event) =>
                                onLinkClick(event, HIRE_ME_HREF)
                            }
                            className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/85 active:scale-[0.98]"
                        >
                            Hire me
                        </a>
                        <p className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span
                                aria-hidden
                                className="size-2 rounded-full bg-brand"
                            />
                            Open to freelance projects and full time roles
                        </p>
                        <div className="flex items-center justify-between gap-4">
                            <SocialLinks links={site.links} />
                            <ThemeToggle className="ml-auto" />
                        </div>
                    </div>
                </div>
            </dialog>
        </>
    );
}

/** Scrolls to a section on the current page, or loads the page it lives on. */
function goTo(href: string) {
    const url = new URL(href, window.location.origin);
    const target = url.hash ? document.querySelector(url.hash) : null;

    // Other pages load through Inertia; anchors on another page need a full load.
    if (!url.hash) {
        router.visit(url.pathname + url.search);

        return;
    }

    if (url.pathname !== window.location.pathname || !target) {
        window.location.assign(url.href);

        return;
    }

    target.scrollIntoView();
    history.replaceState(history.state, '', url.hash);
}
