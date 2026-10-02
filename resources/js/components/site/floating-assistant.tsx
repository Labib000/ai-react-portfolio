import { faArrowRight } from '@fortawesome/free-solid-svg-icons/faArrowRight';
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons/faPaperPlane';
import { faStop } from '@fortawesome/free-solid-svg-icons/faStop';
import { faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons/faWandMagicSparkles';
import { faXmark } from '@fortawesome/free-solid-svg-icons/faXmark';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import { ChatMessage } from '@/components/home/ask-section';
import { Icon } from '@/components/ui/icon';
import { useAsk } from '@/hooks/use-ask';
import type { AskStatus } from '@/hooks/use-ask';
import { gsap, MOTION_OK, useGSAP } from '@/lib/gsap';
import { cn } from '@/lib/utils';

type FloatingAssistantProps = {
    /** Panel title and launcher text, e.g. "Ask about Cardiwan". */
    label: string;
    /** Short launcher text on phones. */
    shortLabel?: string;
    subtitle: string;
    starters: string[];
    /** Case study slug: answers stay about that one project. */
    project?: string;
    /** Longest question allowed. */
    maxLength?: number;
};

const MAX_LENGTH = 300;

const notices: Partial<Record<AskStatus, string>> = {
    unavailable: 'The assistant is offline right now.',
    'rate-limited': "You've reached the question limit. Try again in an hour.",
    invalid: "That question couldn't be sent. Try a shorter one.",
};

function prefersReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * A small floating chat (case studies, resume). With `project` it gives
 * short, overview-level answers about that one project; without it, it uses
 * the general "ask about my work" assistant. The launcher pops in after the page's
 * entrance; the panel grows out of the launcher's corner and closes back
 * into it. On phones the panel is a bottom sheet.
 */
export function FloatingAssistant({
    label,
    shortLabel = 'Ask AI',
    subtitle,
    starters,
    project,
    maxLength = MAX_LENGTH,
}: FloatingAssistantProps) {
    const { messages, status, send, stop } = useAsk({ project });
    const [isOpen, setIsOpen] = useState(false);
    const [draft, setDraft] = useState('');
    const root = useRef<HTMLDivElement>(null);
    const panel = useRef<HTMLDivElement>(null);
    const launcher = useRef<HTMLButtonElement>(null);
    const input = useRef<HTMLInputElement>(null);
    const list = useRef<HTMLDivElement>(null);
    const isStreaming = status === 'streaming';
    const notice = notices[status];

    // The launcher pops in once the hero has settled, with one soft pulse.
    useGSAP(
        () => {
            const mm = gsap.matchMedia();

            mm.add(MOTION_OK, () => {
                gsap.timeline({ delay: 1.6 })
                    .fromTo(
                        launcher.current,
                        { autoAlpha: 0, scale: 0.5, y: 20 },
                        {
                            autoAlpha: 1,
                            scale: 1,
                            y: 0,
                            duration: 0.6,
                            ease: 'back.out(2)',
                        },
                    )
                    .to(launcher.current, {
                        scale: 1.06,
                        duration: 0.35,
                        yoyo: true,
                        repeat: 1,
                        ease: 'power1.inOut',
                    });
            });

            return () => mm.revert();
        },
        { scope: root },
    );

    useEffect(() => {
        list.current?.scrollTo({ top: list.current.scrollHeight });
    }, [messages, status]);

    const open = () => {
        setIsOpen(true);

        requestAnimationFrame(() => {
            if (panel.current && !prefersReducedMotion()) {
                gsap.fromTo(
                    panel.current,
                    { autoAlpha: 0, scale: 0.85, y: 24 },
                    {
                        autoAlpha: 1,
                        scale: 1,
                        y: 0,
                        duration: 0.45,
                        ease: 'expo.out',
                    },
                );
                gsap.fromTo(
                    panel.current.querySelectorAll('[data-chip]'),
                    { autoAlpha: 0, y: 10 },
                    {
                        autoAlpha: 1,
                        y: 0,
                        duration: 0.35,
                        stagger: 0.06,
                        delay: 0.15,
                    },
                );
            }

            input.current?.focus();
        });
    };

    const close = () => {
        const finish = () => {
            setIsOpen(false);
            launcher.current?.focus();
        };

        if (!panel.current || prefersReducedMotion()) {
            finish();

            return;
        }

        gsap.to(panel.current, {
            autoAlpha: 0,
            scale: 0.85,
            y: 24,
            duration: 0.25,
            ease: 'power2.in',
            onComplete: finish,
        });
    };

    const ask = (question: string) => {
        if (question.trim() === '' || isStreaming) {
            return;
        }

        setDraft('');
        void send(question);
    };

    const onSubmit = (event: FormEvent) => {
        event.preventDefault();
        ask(draft);
    };

    const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Escape') {
            event.stopPropagation();
            close();
        }
    };

    return (
        <div ref={root}>
            {isOpen && (
                <div
                    ref={panel}
                    role="dialog"
                    aria-modal="false"
                    aria-labelledby="floating-assistant-title"
                    onKeyDown={onKeyDown}
                    className="fixed inset-x-0 bottom-0 z-40 flex h-[70svh] origin-bottom flex-col overflow-hidden rounded-t-3xl border bg-card shadow-2xl shadow-black/40 sm:inset-x-auto sm:right-6 sm:bottom-24 sm:h-[32rem] sm:w-[23rem] sm:origin-bottom-right sm:rounded-3xl"
                >
                    <div className="flex items-start gap-3 border-b px-5 py-4">
                        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand/15 text-brand">
                            <Icon
                                icon={faWandMagicSparkles}
                                className="size-4"
                            />
                        </span>
                        <div className="min-w-0 flex-1">
                            <p
                                id="floating-assistant-title"
                                className="truncate text-sm font-semibold"
                            >
                                {label}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {subtitle}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={close}
                            aria-label="Close the project assistant"
                            className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                            <Icon icon={faXmark} className="size-4" />
                        </button>
                    </div>

                    <div
                        ref={list}
                        aria-busy={isStreaming}
                        className="flex flex-1 flex-col gap-3 overflow-y-auto overscroll-contain p-4"
                    >
                        {messages.length === 0 && (
                            <div className="mt-auto">
                                <p className="text-sm text-muted-foreground">
                                    Pick a question or ask your own:
                                </p>
                                <div className="mt-3 flex flex-col items-start gap-2">
                                    {starters.map((question) => (
                                        <button
                                            key={question}
                                            data-chip
                                            type="button"
                                            onClick={() => ask(question)}
                                            className="rounded-full border bg-background/60 px-3.5 py-1.5 text-left text-sm transition-colors hover:border-brand hover:text-brand active:scale-[0.98]"
                                        >
                                            {question}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {messages.map((message, index) => (
                            <ChatMessage
                                key={index}
                                message={message}
                                isStreaming={
                                    isStreaming && index === messages.length - 1
                                }
                            />
                        ))}

                        {notice && (
                            <p className="rounded-xl border border-dashed px-3 py-2.5 text-sm text-muted-foreground">
                                {notice}
                            </p>
                        )}
                    </div>

                    <form
                        onSubmit={onSubmit}
                        className="flex items-center gap-2 border-t p-2.5"
                    >
                        <input
                            ref={input}
                            value={draft}
                            onChange={(event) => setDraft(event.target.value)}
                            maxLength={maxLength}
                            aria-label={`Your question: ${label}`}
                            placeholder="Type your question"
                            className="h-10 min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground"
                        />
                        {isStreaming ? (
                            <button
                                type="button"
                                onClick={stop}
                                aria-label="Stop the answer"
                                className="grid size-10 shrink-0 place-items-center rounded-full border transition-colors hover:border-brand hover:text-brand"
                            >
                                <Icon icon={faStop} className="size-3.5" />
                            </button>
                        ) : (
                            <button
                                type="submit"
                                disabled={draft.trim() === ''}
                                aria-label="Send question"
                                className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/85 disabled:opacity-40"
                            >
                                <Icon icon={faPaperPlane} className="size-4" />
                            </button>
                        )}
                    </form>

                    <a
                        href="/#ask"
                        className="group flex items-center justify-center gap-2 border-t px-4 py-2.5 text-xs text-muted-foreground transition-colors hover:text-brand"
                    >
                        Ask about anything else
                        <Icon
                            icon={faArrowRight}
                            className="size-2.5 transition-transform group-hover:translate-x-0.5"
                        />
                    </a>
                </div>
            )}

            <button
                ref={launcher}
                type="button"
                onClick={isOpen ? close : open}
                aria-expanded={isOpen}
                aria-label={isOpen ? 'Close the project assistant' : label}
                className={cn(
                    'fixed right-4 bottom-4 z-40 inline-flex h-14 items-center gap-2.5 rounded-full bg-primary pr-5 pl-4 text-sm font-medium text-primary-foreground shadow-2xl shadow-primary/40 transition-colors hover:bg-primary/90 active:scale-[0.97] sm:right-6 sm:bottom-6',
                    isOpen && 'max-sm:hidden',
                )}
            >
                <span className="grid size-8 place-items-center rounded-full bg-primary-foreground/15">
                    <Icon
                        icon={isOpen ? faXmark : faWandMagicSparkles}
                        className="size-4"
                    />
                </span>
                <span className="hidden sm:inline">
                    {isOpen ? 'Close' : label}
                </span>
                <span className="sm:hidden">
                    {isOpen ? 'Close' : shortLabel}
                </span>
            </button>
        </div>
    );
}
