import { faPlus } from '@fortawesome/free-solid-svg-icons/faPlus';
import { useEffect, useRef, useState } from 'react';
import { SplitHeading } from '@/components/motion/split-heading';
import { Icon } from '@/components/ui/icon';
import { gsap } from '@/lib/gsap';
import { cn } from '@/lib/utils';
import type { FaqItem } from '@/types/content';

/**
 * "Questions clients ask": an accordion, one answer open at a time. The
 * first answer is open in the server-rendered page; heights animate with
 * GSAP when you switch.
 */
export function Faq({ items }: { items: FaqItem[] }) {
    const list = useRef<HTMLUListElement>(null);
    const [open, setOpen] = useState<number | null>(0);
    const isFirstRender = useRef(true);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;

            return;
        }

        const isReduced = window.matchMedia(
            '(prefers-reduced-motion: reduce)',
        ).matches;

        list.current
            ?.querySelectorAll<HTMLElement>('[data-answer]')
            .forEach((answer, index) => {
                const isOpen = index === open;

                gsap.to(answer, {
                    height: isOpen ? 'auto' : 0,
                    autoAlpha: isOpen ? 1 : 0,
                    duration: isReduced ? 0 : 0.45,
                    ease: 'power3.inOut',
                    overwrite: true,
                });
            });
    }, [open]);

    return (
        <section
            aria-labelledby="faq-heading"
            className="mx-auto max-w-4xl px-4 py-20 sm:px-6 sm:py-28"
        >
            <div className="text-center">
                <SplitHeading
                    as="h2"
                    id="faq-heading"
                    className="text-3xl font-semibold tracking-tight sm:text-4xl"
                >
                    Questions clients ask
                </SplitHeading>
                <p className="mx-auto mt-4 max-w-xl text-pretty text-muted-foreground sm:text-lg">
                    Straight answers before we talk.
                </p>
            </div>

            <ul ref={list} className="mt-12 flex flex-col gap-3">
                {items.map((item, index) => {
                    const isOpen = index === open;

                    return (
                        <li
                            key={item.question}
                            className={cn(
                                'rounded-2xl border transition-colors duration-300',
                                isOpen
                                    ? 'border-brand/40 bg-card'
                                    : 'bg-card/50 hover:border-brand/30',
                            )}
                        >
                            <h3>
                                <button
                                    type="button"
                                    id={`faq-question-${index}`}
                                    aria-expanded={isOpen}
                                    aria-controls={`faq-answer-${index}`}
                                    onClick={() =>
                                        setOpen(isOpen ? null : index)
                                    }
                                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-medium sm:px-6 sm:py-5 sm:text-lg"
                                >
                                    {item.question}
                                    <span
                                        className={cn(
                                            'grid size-8 shrink-0 place-items-center rounded-full border transition-all duration-500',
                                            isOpen
                                                ? 'rotate-45 border-brand bg-brand text-primary-foreground'
                                                : 'text-muted-foreground',
                                        )}
                                    >
                                        <Icon
                                            icon={faPlus}
                                            className="size-3"
                                        />
                                    </span>
                                </button>
                            </h3>
                            <div
                                id={`faq-answer-${index}`}
                                role="region"
                                aria-labelledby={`faq-question-${index}`}
                                data-answer
                                inert={!isOpen}
                                className="overflow-hidden"
                                style={
                                    index === 0
                                        ? undefined
                                        : {
                                              height: 0,
                                              opacity: 0,
                                              visibility: 'hidden',
                                          }
                                }
                            >
                                <p className="px-5 pb-5 text-pretty text-muted-foreground sm:px-6 sm:pb-6">
                                    {item.answer}
                                </p>
                            </div>
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}
