import { faClipboardList } from '@fortawesome/free-solid-svg-icons/faClipboardList';
import { faEnvelopeOpenText } from '@fortawesome/free-solid-svg-icons/faEnvelopeOpenText';
import { faVideo } from '@fortawesome/free-solid-svg-icons/faVideo';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { useRef } from 'react';
import { Icon } from '@/components/ui/icon';
import { gsap, MOTION_OK, useGSAP } from '@/lib/gsap';

if (typeof window !== 'undefined') {
    gsap.registerPlugin(DrawSVGPlugin);
}

const STEPS = [
    {
        icon: faEnvelopeOpenText,
        title: 'I read it and reply',
        body: 'Within 24 hours, with any first questions about your goals, users and timeline.',
    },
    {
        icon: faVideo,
        title: 'A short call',
        body: 'We talk through the idea or role, so nothing important is lost in messages.',
    },
    {
        icon: faClipboardList,
        title: 'A clear plan',
        body: 'For projects: scope, milestones and a quote. Nothing is built until you approve it.',
    },
];

/**
 * "What happens next": three steps on a line that draws itself down as it
 * scrolls in, with each step's icon popping as the line reaches it.
 */
export function NextSteps() {
    const root = useRef<HTMLDivElement>(null);

    useGSAP(
        () => {
            const scope = root.current;

            if (!scope) {
                return;
            }

            const mm = gsap.matchMedia();

            mm.add(MOTION_OK, () => {
                gsap.timeline({
                    defaults: { ease: 'power3.out' },
                    scrollTrigger: {
                        trigger: scope,
                        start: 'top 75%',
                        once: true,
                    },
                })
                    .fromTo(
                        scope.querySelector('[data-line]'),
                        { drawSVG: '0%' },
                        { drawSVG: '100%', duration: 1.4, ease: 'none' },
                        0,
                    )
                    .fromTo(
                        scope.querySelectorAll('[data-step-icon]'),
                        { scale: 0, rotation: -45 },
                        {
                            scale: 1,
                            rotation: 0,
                            duration: 0.5,
                            stagger: 0.55,
                            ease: 'back.out(2.5)',
                        },
                        0,
                    )
                    .fromTo(
                        scope.querySelectorAll('[data-step-text]'),
                        { autoAlpha: 0, x: 16 },
                        { autoAlpha: 1, x: 0, duration: 0.6, stagger: 0.55 },
                        0.1,
                    );
            });

            return () => mm.revert();
        },
        { scope: root },
    );

    return (
        <div ref={root} className="lg:sticky lg:top-28">
            <h2 className="text-xl font-semibold tracking-tight">
                What happens next
            </h2>
            <div className="relative mt-6">
                <svg
                    aria-hidden
                    className="absolute top-6 bottom-6 left-6 h-[calc(100%-3rem)] w-px overflow-visible"
                    preserveAspectRatio="none"
                    viewBox="0 0 1 100"
                >
                    <line
                        x1="0.5"
                        y1="0"
                        x2="0.5"
                        y2="100"
                        className="stroke-border"
                        strokeWidth="2"
                        vectorEffect="non-scaling-stroke"
                    />
                    <line
                        data-line
                        x1="0.5"
                        y1="0"
                        x2="0.5"
                        y2="100"
                        className="stroke-brand"
                        strokeWidth="2"
                        vectorEffect="non-scaling-stroke"
                    />
                </svg>
                <ol className="relative flex flex-col gap-8">
                    {STEPS.map((step, index) => (
                        <li key={step.title} className="flex gap-5">
                            <span
                                data-step-icon
                                className="grid size-12 shrink-0 place-items-center rounded-2xl border bg-card text-brand shadow-lg shadow-black/10"
                            >
                                <Icon icon={step.icon} className="size-4.5" />
                            </span>
                            <div data-step-text className="pt-1">
                                <p className="text-xs font-medium text-muted-foreground tabular-nums">
                                    Step {index + 1}
                                </p>
                                <h3 className="mt-0.5 font-semibold tracking-tight">
                                    {step.title}
                                </h3>
                                <p className="mt-1.5 text-sm text-pretty text-muted-foreground">
                                    {step.body}
                                </p>
                            </div>
                        </li>
                    ))}
                </ol>
            </div>
        </div>
    );
}
