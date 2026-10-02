import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * Media queries used with gsap.matchMedia(). Every animation must branch on
 * these so reduced-motion users get the final state instantly.
 */
export const MOTION_OK = '(prefers-reduced-motion: no-preference)';
export const MOTION_REDUCED = '(prefers-reduced-motion: reduce)';

/**
 * Scroll-linked extras (parallax drift) run on every scroll frame, so they
 * are kept to wide screens; phones get the one-time reveals only.
 */
export const SCRUB_EXTRAS_OK =
    '(prefers-reduced-motion: no-preference) and (min-width: 64rem)';

if (typeof window !== 'undefined') {
    // Heavier plugins (SplitText, Flip) are imported and registered by the
    // component that uses them, so they stay out of the site-wide bundle.
    gsap.registerPlugin(useGSAP, ScrollTrigger);
    gsap.defaults({ ease: 'power3.out', duration: 0.8 });

    // Phones resize the viewport whenever the address bar slides in or out.
    // Re-measuring every scroll animation then makes the page jump mid-scroll.
    ScrollTrigger.config({ ignoreMobileResize: true });

    // Tells the inline failsafe in app.blade.php that JS loaded, so it
    // shouldn't un-hide the elements that are waiting to animate in.
    document.documentElement.dataset.motionReady = 'true';

    watchPageHeight();
}

/**
 * ScrollTrigger measures start and end positions once, and only re-measures
 * on window resize. When content grows later (an AI answer, an accordion,
 * images loading), pinned sections would keep stale positions and overlap
 * what's above them. Re-measure whenever the page height settles on a new
 * value, but only once scrolling has stopped: a re-measure mid-scroll is a
 * visible hitch.
 */
function watchPageHeight(): void {
    let lastHeight = 0;
    let timer = 0;
    let lastScroll = 0;

    window.addEventListener(
        'scroll',
        () => {
            lastScroll = performance.now();
        },
        { passive: true },
    );

    const check = () => {
        // Still scrolling: look again once the page has been still a moment.
        if (performance.now() - lastScroll < 250) {
            timer = window.setTimeout(check, 250);

            return;
        }

        const height = document.body.scrollHeight;

        // Ignore sub-pixel differences. The height a refresh itself
        // produces (pin spacing) is recorded below, so it can't loop.
        if (Math.abs(height - lastHeight) < 2) {
            return;
        }

        lastHeight = height;
        ScrollTrigger.refresh();
        lastHeight = document.body.scrollHeight;
    };

    const observer = new ResizeObserver(() => {
        window.clearTimeout(timer);
        timer = window.setTimeout(check, 150);
    });

    const start = () => {
        lastHeight = document.body.scrollHeight;
        observer.observe(document.body);
    };

    if (document.body) {
        start();
    } else {
        document.addEventListener('DOMContentLoaded', start, { once: true });
    }
}

export { gsap, ScrollTrigger, useGSAP };
