import { useRef } from 'react';
import type { ReactNode } from 'react';
import { SplitText } from 'gsap/SplitText';
import { gsap, MOTION_OK, MOTION_REDUCED, useGSAP } from '@/lib/gsap';

type SplitHeadingProps = {
    children: ReactNode;
    className?: string;
    as?: 'h1' | 'h2';
    id?: string;
};

if (typeof window !== 'undefined') {
    gsap.registerPlugin(SplitText);
}

/**
 * Heading whose lines slide up from behind a mask the first time it scrolls
 * into view. Splitting by line keeps words intact, so screen readers read it
 * normally; autoSplit re-splits after fonts load or the viewport resizes.
 */
export function SplitHeading({
    children,
    className,
    as: Tag = 'h1',
    id,
}: SplitHeadingProps) {
    const heading = useRef<HTMLHeadingElement>(null);

    useGSAP(
        () => {
            if (!heading.current) {
                return;
            }

            const mm = gsap.matchMedia();

            mm.add(MOTION_OK, () => {
                const split = SplitText.create(heading.current, {
                    type: 'lines',
                    mask: 'lines',
                    aria: 'none',
                    autoSplit: true,
                    onSplit(self) {
                        gsap.set(heading.current, { autoAlpha: 1 });

                        return gsap.from(self.lines, {
                            yPercent: 110,
                            duration: 1.1,
                            stagger: 0.12,
                            ease: 'expo.out',
                            scrollTrigger: {
                                trigger: heading.current,
                                start: 'top 85%',
                                once: true,
                            },
                        });
                    },
                });

                return () => split.revert();
            });

            mm.add(MOTION_REDUCED, () => {
                gsap.set(heading.current, { autoAlpha: 1 });
            });

            return () => mm.revert();
        },
        { scope: heading },
    );

    return (
        <Tag ref={heading} id={id} data-split className={className}>
            {children}
        </Tag>
    );
}
