import { useRef } from 'react';
import type { ReactNode } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';

type MagneticProps = {
    children: ReactNode;
    /** How far the element follows the pointer, 0–1. */
    strength?: number;
    className?: string;
};

/**
 * Pulls its content slightly toward the mouse. Only on devices with a fine
 * pointer and when reduced motion is off; touch users get a plain element.
 */
export function Magnetic({
    children,
    strength = 0.3,
    className,
}: MagneticProps) {
    const wrapper = useRef<HTMLSpanElement>(null);

    useGSAP(() => {
        const element = wrapper.current;

        if (!element) {
            return;
        }

        const mm = gsap.matchMedia();

        mm.add(
            '(pointer: fine) and (prefers-reduced-motion: no-preference)',
            () => {
                const moveX = gsap.quickTo(element, 'x', {
                    duration: 0.4,
                    ease: 'power3.out',
                });
                const moveY = gsap.quickTo(element, 'y', {
                    duration: 0.4,
                    ease: 'power3.out',
                });

                const onMove = (event: PointerEvent) => {
                    const box = element.getBoundingClientRect();
                    moveX(
                        (event.clientX - box.left - box.width / 2) * strength,
                    );
                    moveY(
                        (event.clientY - box.top - box.height / 2) * strength,
                    );
                };

                const onLeave = () => {
                    moveX(0);
                    moveY(0);
                };

                element.addEventListener('pointermove', onMove);
                element.addEventListener('pointerleave', onLeave);

                return () => {
                    element.removeEventListener('pointermove', onMove);
                    element.removeEventListener('pointerleave', onLeave);
                };
            },
        );

        return () => mm.revert();
    });

    return (
        <span ref={wrapper} className={className ?? 'inline-block'}>
            {children}
        </span>
    );
}
