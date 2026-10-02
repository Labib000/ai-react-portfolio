import { gsap } from '@/lib/gsap';

/**
 * Adds the "page load" sequence for a BrowserFrame inside `scope` to a
 * timeline: the frame rises and straightens, its dots pop, the domain types
 * into the address bar, a loading bar runs and the screenshot wipes in.
 */
export function addFrameLoad(
    timeline: gsap.core.Timeline,
    scope: Element,
    position = 0,
): void {
    const frame = scope.querySelector<HTMLElement>('[data-frame]');
    const shot = scope.querySelector<HTMLElement>('[data-shot]');
    const bar = scope.querySelector<HTMLElement>('[data-loadbar]');
    const url = scope.querySelector<HTMLElement>('[data-url]');

    if (!frame) {
        return;
    }

    timeline
        .fromTo(
            frame,
            {
                autoAlpha: 0,
                y: 60,
                rotationX: 10,
                transformPerspective: 1200,
                transformOrigin: '50% 100%',
            },
            {
                autoAlpha: 1,
                y: 0,
                rotationX: 0,
                duration: 1,
                ease: 'expo.out',
            },
            position,
        )
        .fromTo(
            scope.querySelectorAll('[data-dot]'),
            { scale: 0 },
            { scale: 1, duration: 0.4, stagger: 0.08, ease: 'back.out(3)' },
            position + 0.35,
        );

    if (bar) {
        timeline
            .fromTo(
                bar,
                { autoAlpha: 1, scaleX: 0 },
                { scaleX: 1, duration: 0.7, ease: 'power2.inOut' },
                position + 0.6,
            )
            .to(bar, { autoAlpha: 0, duration: 0.3 }, position + 1.3);
    }

    if (shot) {
        timeline.fromTo(
            shot,
            { clipPath: 'inset(0% 0% 100% 0%)', scale: 1.15 },
            {
                clipPath: 'inset(0% 0% 0% 0%)',
                scale: 1,
                duration: 1.2,
                ease: 'expo.inOut',
            },
            position + 1.05,
        );
    }

    const fullUrl = url?.dataset.text ?? '';

    if (url && fullUrl) {
        const typed = { length: 0 };
        url.textContent = '';
        timeline.to(
            typed,
            {
                length: fullUrl.length,
                duration: Math.min(0.9, fullUrl.length * 0.04),
                ease: 'none',
                onUpdate: () => {
                    url.textContent = fullUrl.slice(
                        0,
                        Math.round(typed.length),
                    );
                },
            },
            position + 0.45,
        );
    }
}

/** Counts an element's text from one number to another on a timeline. */
export function countUp(
    timeline: gsap.core.Timeline,
    element: HTMLElement | null,
    from: number,
    to: number,
    format: (value: number) => string,
    position: number,
): void {
    if (!element) {
        return;
    }

    const count = { value: from };
    element.textContent = format(from);
    timeline.to(
        count,
        {
            value: to,
            duration: 1.1,
            ease: 'power2.out',
            onUpdate: () => {
                element.textContent = format(Math.round(count.value));
            },
        },
        position,
    );
}

/**
 * Counts up a metric like "25%" or "20+" held in data-value. Ranges such as
 * "30–40%" have no data-value and just appear.
 */
export function countUpMetric(
    timeline: gsap.core.Timeline,
    element: HTMLElement | null,
    position: number,
): void {
    const [, digits, rest] =
        element?.dataset.value?.match(/^(\d+)(\D*)$/) ?? [];

    if (element && digits) {
        countUp(
            timeline,
            element,
            0,
            Number(digits),
            (value) => `${value}${rest}`,
            position,
        );
    }
}

/**
 * Mouse tilt and glare for every [data-tilt] inside root. Returns cleanup.
 */
export function tiltFrames(root: Element, degrees = 8): () => void {
    const cleanups = gsap.utils
        .toArray<HTMLElement>('[data-tilt]', root)
        .map((tilt) => {
            const frame = tilt.querySelector<HTMLElement>('[data-frame]');

            gsap.set(tilt, { transformPerspective: 1000 });

            const rotateX = gsap.quickTo(tilt, 'rotationX', {
                duration: 0.6,
                ease: 'power3.out',
            });
            const rotateY = gsap.quickTo(tilt, 'rotationY', {
                duration: 0.6,
                ease: 'power3.out',
            });

            const onMove = (event: PointerEvent) => {
                const box = tilt.getBoundingClientRect();
                const x = (event.clientX - box.left) / box.width;
                const y = (event.clientY - box.top) / box.height;

                rotateY((x - 0.5) * degrees);
                rotateX((y - 0.5) * -degrees);
                frame?.style.setProperty('--glare-x', `${x * 100}%`);
                frame?.style.setProperty('--glare-y', `${y * 100}%`);
            };

            const onLeave = () => {
                rotateX(0);
                rotateY(0);
            };

            tilt.addEventListener('pointermove', onMove);
            tilt.addEventListener('pointerleave', onLeave);

            return () => {
                tilt.removeEventListener('pointermove', onMove);
                tilt.removeEventListener('pointerleave', onLeave);
            };
        });

    return () => cleanups.forEach((cleanup) => cleanup());
}
