import { faArrowRight } from '@fortawesome/free-solid-svg-icons/faArrowRight';
import { faBuilding } from '@fortawesome/free-solid-svg-icons/faBuilding';
import { faCar } from '@fortawesome/free-solid-svg-icons/faCar';
import { faCircleQuestion } from '@fortawesome/free-solid-svg-icons/faCircleQuestion';
import { faGraduationCap } from '@fortawesome/free-solid-svg-icons/faGraduationCap';
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons/faPaperPlane';
import { faPaste } from '@fortawesome/free-solid-svg-icons/faPaste';
import { faPen } from '@fortawesome/free-solid-svg-icons/faPen';
import { faQuoteLeft } from '@fortawesome/free-solid-svg-icons/faQuoteLeft';
import { faRotateLeft } from '@fortawesome/free-solid-svg-icons/faRotateLeft';
import { faScissors } from '@fortawesome/free-solid-svg-icons/faScissors';
import { faStethoscope } from '@fortawesome/free-solid-svg-icons/faStethoscope';
import { faStop } from '@fortawesome/free-solid-svg-icons/faStop';
import { faUtensils } from '@fortawesome/free-solid-svg-icons/faUtensils';
import { Link } from '@inertiajs/react';
import { Flip } from 'gsap/Flip';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import LabController from '@/actions/App/Http/Controllers/LabController';
import WorkController from '@/actions/App/Http/Controllers/WorkController';
import { SplitHeading } from '@/components/motion/split-heading';
import { Icon } from '@/components/ui/icon';
import type { FontAwesomeIconData } from '@/components/ui/icon';
import { useAsk } from '@/hooks/use-ask';
import type { AskMessage, AskStatus } from '@/hooks/use-ask';
import { gsap, MOTION_OK, useGSAP } from '@/lib/gsap';
import { cn } from '@/lib/utils';
import type { LabSample } from '@/types/content';

if (typeof window !== 'undefined') {
    gsap.registerPlugin(Flip);
}

const ICONS: Record<string, FontAwesomeIconData> = {
    car: faCar,
    clinic: faStethoscope,
    school: faGraduationCap,
    restaurant: faUtensils,
    salon: faScissors,
    building: faBuilding,
};

const CUSTOM = 'custom';

const CUSTOM_STARTERS = [
    'What are your opening hours?',
    'How much does it cost?',
    'How can I book?',
];

const MAX_QUESTION = 500;

const statusNotices: Partial<Record<AskStatus, string>> = {
    unavailable:
        'The assistant is offline right now. The free AI quota may be used up for today; try again later.',
    'rate-limited':
        "You've reached the question limit for now. Try again in an hour.",
    invalid:
        "That couldn't be sent. Check the business text (50 to 3,000 characters) and keep questions short.",
};

type Parsed = {
    answer: string;
    /** The cited words; null when the answer isn't in the text; undefined while unknown. */
    source: string | null | undefined;
};

/** Splits the answer from its trailing [source: "..."] line. */
function parseAnswer(text: string): Parsed {
    const cut = text.search(/\n\s*\[|\[source/i);

    if (cut === -1) {
        return { answer: text.trim(), source: undefined };
    }

    const tag = text.slice(cut);
    const quoted = tag.match(/\[source:\s*"([^"]+)"/i);

    return {
        answer: text.slice(0, cut).trim(),
        source: quoted
            ? quoted[1].trim()
            : /\[source:\s*none/i.test(tag)
              ? null
              : undefined,
    };
}

/** Where the cited words sit in the business text, ignoring case. */
function findSource(
    knowledge: string,
    source: string,
): [number, number] | null {
    const haystack = knowledge.toLowerCase();
    const attempts = [
        source,
        source.replace(/[.,;:!?]+$/, ''),
        source.split(/\s+/).slice(0, 6).join(' '),
    ];

    for (const attempt of attempts) {
        const needle = attempt.toLowerCase().trim();
        const start = needle.length > 3 ? haystack.indexOf(needle) : -1;

        if (start !== -1) {
            return [start, start + needle.length];
        }
    }

    return null;
}

type AssistantDemoProps = {
    samples: LabSample[];
    knowledgeMax: number;
};

/**
 * The AI Lab demo: pick a sample business (or paste your own text), see
 * exactly what the assistant knows, and chat with it. Each answer cites
 * the words it came from, and the citation lights up in the text.
 */
export function AssistantDemo({ samples, knowledgeMax }: AssistantDemoProps) {
    const root = useRef<HTMLElement>(null);
    const panel = useRef<HTMLDivElement>(null);
    const list = useRef<HTMLDivElement>(null);
    const flipState = useRef<Flip.FlipState | null>(null);
    const [active, setActive] = useState(samples[0]?.slug ?? CUSTOM);
    const [draftName, setDraftName] = useState('');
    const [draftText, setDraftText] = useState('');
    const [custom, setCustom] = useState<{
        business: string;
        knowledge: string;
    } | null>(null);
    const [question, setQuestion] = useState('');
    const [pinned, setPinned] = useState<string | null>(null);

    const sample = samples.find((item) => item.slug === active);
    const isCustom = active === CUSTOM;
    const name = sample?.name ?? (custom?.business || 'Your business');
    const knowledge = sample?.knowledge ?? custom?.knowledge ?? '';
    const isReady = Boolean(sample || custom);

    const { messages, status, send, stop, reset } = useAsk({
        url: LabController.chat.url(),
        body: sample
            ? { sample: sample.slug }
            : {
                  knowledge: custom?.knowledge,
                  business: custom?.business || undefined,
              },
    });
    const isStreaming = status === 'streaming';
    const notice = statusNotices[status];
    const lastAnswer = messages.findLast(
        (message) => message.role === 'assistant',
    );
    const lastSource =
        !isStreaming && lastAnswer
            ? parseAnswer(lastAnswer.content).source
            : undefined;
    const highlight = pinned ?? (lastSource || null);
    const range = highlight ? findSource(knowledge, highlight) : null;
    const starters = sample?.starters ?? CUSTOM_STARTERS;

    const choose = (slug: string) => {
        if (slug === active) {
            return;
        }

        const icon = root.current?.querySelector(
            `[data-flip-id="biz-${slug}"]`,
        );
        flipState.current = icon ? Flip.getState(icon) : null;
        reset();
        setPinned(null);
        setActive(slug);
    };

    const applyCustom = (event: FormEvent) => {
        event.preventDefault();
        reset();
        setPinned(null);
        setCustom({
            business: draftName.trim(),
            knowledge: draftText.trim(),
        });
    };

    const ask = (text: string) => {
        if (text.trim() === '' || isStreaming || !isReady) {
            return;
        }

        setQuestion('');
        setPinned(null);
        void send(text);
    };

    const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            ask(question);
        }
    };

    useEffect(() => {
        list.current?.scrollTo({ top: list.current.scrollHeight });
    }, [messages, status]);

    // The picked card's icon flies into the knowledge panel, then the
    // business text rises in paragraph by paragraph.
    useLayoutEffect(() => {
        const state = flipState.current;
        flipState.current = null;
        const reduced = window.matchMedia(
            '(prefers-reduced-motion: reduce)',
        ).matches;

        if (reduced || !panel.current) {
            return;
        }

        const target = panel.current.querySelector('[data-panel-icon]');

        if (state && target) {
            Flip.from(state, {
                targets: target,
                duration: 0.7,
                ease: 'expo.out',
                scale: true,
                absolute: true,
            });
        }

        gsap.fromTo(
            panel.current.querySelectorAll('[data-knowledge-part]'),
            { autoAlpha: 0, y: 12 },
            {
                autoAlpha: 1,
                y: 0,
                duration: 0.5,
                stagger: 0.05,
                ease: 'power3.out',
                delay: 0.15,
            },
        );
    }, [active, custom]);

    // The cited words scroll into view in the panel and pulse.
    useEffect(() => {
        const mark = panel.current?.querySelector<HTMLElement>('mark');
        const scroller = panel.current?.querySelector<HTMLElement>(
            '[data-knowledge-scroll]',
        );

        if (!mark || !scroller) {
            return;
        }

        const reduced = window.matchMedia(
            '(prefers-reduced-motion: reduce)',
        ).matches;
        scroller.scrollTo({
            top: mark.offsetTop - scroller.clientHeight / 3,
            behavior: reduced ? 'auto' : 'smooth',
        });

        if (!reduced) {
            gsap.fromTo(
                mark,
                { backgroundColor: 'rgb(94 196 182 / 0.6)' },
                {
                    backgroundColor: 'rgb(94 196 182 / 0.22)',
                    duration: 1.2,
                    ease: 'power2.out',
                },
            );
        }
    }, [highlight, range?.[0]]);

    // Cards and panels rise once as the demo scrolls in.
    useGSAP(
        () => {
            const scope = root.current;

            if (!scope) {
                return;
            }

            const mm = gsap.matchMedia();

            mm.add(MOTION_OK, () => {
                gsap.timeline({
                    defaults: { ease: 'expo.out' },
                    scrollTrigger: {
                        trigger: scope.querySelector('[data-demo-grid]'),
                        start: 'top 80%',
                        once: true,
                    },
                })
                    .fromTo(
                        scope.querySelectorAll('[data-biz-card]'),
                        { autoAlpha: 0, y: 24, scale: 0.94 },
                        {
                            autoAlpha: 1,
                            y: 0,
                            scale: 1,
                            duration: 0.7,
                            stagger: 0.05,
                        },
                    )
                    .fromTo(
                        scope.querySelectorAll('[data-demo-card]'),
                        { autoAlpha: 0, y: 40 },
                        { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.1 },
                        0.15,
                    );
            });

            return () => mm.revert();
        },
        { scope: root },
    );

    return (
        <section
            ref={root}
            id="demo"
            aria-labelledby="demo-heading"
            className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6 sm:py-20"
        >
            <div className="max-w-2xl">
                <SplitHeading
                    as="h2"
                    id="demo-heading"
                    className="text-3xl font-semibold tracking-tight sm:text-4xl"
                >
                    Try it: pick a business
                </SplitHeading>
                <p className="mt-4 text-pretty text-muted-foreground sm:text-lg">
                    The sample businesses are made up. Try one of the starter
                    questions, including the last one: its answer isn't in the
                    text, so watch the assistant say so instead of guessing.
                </p>
            </div>

            <div
                data-demo-grid
                className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8"
            >
                <div className="flex min-w-0 flex-col gap-6 lg:col-span-5">
                    {/* Business picker */}
                    <div
                        role="group"
                        aria-label="Choose a business"
                        className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-2"
                    >
                        {samples.map((item) => (
                            <BusinessCard
                                key={item.slug}
                                id={item.slug}
                                icon={ICONS[item.icon] ?? faBuilding}
                                title={item.name}
                                subtitle={item.kind}
                                isActive={active === item.slug}
                                onSelect={choose}
                            />
                        ))}
                        <BusinessCard
                            id={CUSTOM}
                            icon={faPaste}
                            title="Use your own"
                            subtitle="Paste your FAQ"
                            isActive={isCustom}
                            onSelect={choose}
                            isDashed
                        />
                    </div>

                    {/* What the assistant knows */}
                    <div
                        ref={panel}
                        data-demo-card
                        className="overflow-hidden rounded-3xl border bg-card"
                    >
                        <div className="flex items-center gap-3 border-b px-5 py-4">
                            <span
                                data-panel-icon
                                data-flip-id={`biz-${active}`}
                                className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand/15 text-brand"
                            >
                                <Icon
                                    icon={
                                        sample
                                            ? (ICONS[sample.icon] ?? faBuilding)
                                            : faPaste
                                    }
                                    className="size-4"
                                />
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold">
                                    {name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    What the assistant knows
                                </p>
                            </div>
                            {isCustom && custom && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        reset();
                                        setCustom(null);
                                    }}
                                    className="inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors hover:border-brand hover:text-brand"
                                >
                                    <Icon icon={faPen} className="size-2.5" />
                                    Edit
                                </button>
                            )}
                        </div>

                        {isCustom && !custom ? (
                            <form
                                onSubmit={applyCustom}
                                className="flex flex-col gap-4 p-5"
                            >
                                <div>
                                    <label
                                        htmlFor="lab-business"
                                        className="text-sm font-medium"
                                    >
                                        Business name
                                    </label>
                                    <input
                                        id="lab-business"
                                        value={draftName}
                                        onChange={(event) =>
                                            setDraftName(event.target.value)
                                        }
                                        maxLength={80}
                                        placeholder="e.g. Corner Bakery"
                                        className="mt-2 block h-11 w-full rounded-xl border bg-background/60 px-3.5 text-sm outline-none placeholder:text-muted-foreground/70 focus:border-brand focus:ring-2 focus:ring-brand/20"
                                    />
                                </div>
                                <div>
                                    <div className="flex items-baseline justify-between gap-3">
                                        <label
                                            htmlFor="lab-knowledge"
                                            className="text-sm font-medium"
                                        >
                                            FAQ, prices or website text
                                        </label>
                                        <span className="text-xs text-muted-foreground tabular-nums">
                                            {draftText.length}/{knowledgeMax}
                                        </span>
                                    </div>
                                    <textarea
                                        id="lab-knowledge"
                                        value={draftText}
                                        onChange={(event) =>
                                            setDraftText(event.target.value)
                                        }
                                        required
                                        minLength={50}
                                        maxLength={knowledgeMax}
                                        rows={8}
                                        placeholder="Paste your opening hours, services, prices, policies…"
                                        className="mt-2 block w-full resize-y rounded-xl border bg-background/60 px-3.5 py-3 text-sm outline-none placeholder:text-muted-foreground/70 focus:border-brand focus:ring-2 focus:ring-brand/20"
                                    />
                                    <p className="mt-2 text-xs text-muted-foreground">
                                        Only used to answer this chat. This site
                                        never saves it.
                                    </p>
                                </div>
                                <button
                                    type="submit"
                                    disabled={draftText.trim().length < 50}
                                    className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/85 active:scale-[0.98] disabled:opacity-50"
                                >
                                    Use this text
                                </button>
                            </form>
                        ) : (
                            <>
                                <div
                                    data-knowledge-scroll
                                    className="relative max-h-64 overflow-y-auto overscroll-contain px-5 py-4 text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground lg:max-h-80"
                                >
                                    <KnowledgeText
                                        text={knowledge}
                                        range={range}
                                    />
                                </div>
                                {sample?.related && (
                                    <Link
                                        href={WorkController.show.url(
                                            sample.related.slug,
                                        )}
                                        className="group flex items-center gap-2 border-t px-5 py-3 text-xs text-muted-foreground transition-colors hover:text-foreground"
                                    >
                                        Real project in this field:
                                        <span className="font-medium text-brand">
                                            {sample.related.title}
                                        </span>
                                        <Icon
                                            icon={faArrowRight}
                                            className="size-2.5 text-brand transition-transform group-hover:translate-x-0.5"
                                        />
                                    </Link>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Chat */}
                <div
                    data-demo-card
                    className="flex min-w-0 flex-col overflow-hidden rounded-3xl border bg-card shadow-2xl shadow-black/25 lg:col-span-7"
                >
                    <div className="flex items-center gap-2.5 border-b px-5 py-3.5">
                        <span aria-hidden className="relative flex size-2">
                            <span
                                className={cn(
                                    'absolute inline-flex size-full rounded-full bg-brand opacity-60 motion-reduce:hidden',
                                    isStreaming && 'animate-ping',
                                )}
                            />
                            <span className="relative inline-flex size-2 rounded-full bg-brand" />
                        </span>
                        <p className="min-w-0 truncate text-sm font-medium">
                            Assistant for {name}
                        </p>
                        {messages.length > 0 && (
                            <button
                                type="button"
                                onClick={() => {
                                    reset();
                                    setPinned(null);
                                }}
                                className="ml-auto inline-flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                            >
                                <Icon icon={faRotateLeft} className="size-3" />
                                New chat
                            </button>
                        )}
                    </div>

                    <div
                        ref={list}
                        aria-busy={isStreaming}
                        className="flex h-[26rem] flex-col gap-4 overflow-y-auto overscroll-contain p-4 sm:h-[30rem] sm:p-6"
                    >
                        {messages.length === 0 && !notice && (
                            <div className="m-auto flex max-w-sm flex-col items-center text-center">
                                <span className="grid size-12 place-items-center rounded-2xl bg-brand/10 text-brand">
                                    <Icon
                                        icon={faCircleQuestion}
                                        className="size-5"
                                    />
                                </span>
                                <p className="mt-4 text-sm text-pretty text-muted-foreground">
                                    {isReady
                                        ? `Ask ${name} anything a customer would, or pick a question below.`
                                        : 'Paste your business text on the left to start.'}
                                </p>
                            </div>
                        )}

                        {messages.map((message, index) => (
                            <LabMessage
                                key={index}
                                message={message}
                                business={name}
                                isStreaming={
                                    isStreaming && index === messages.length - 1
                                }
                                isPinned={
                                    pinned !== null &&
                                    parseAnswer(message.content).source ===
                                        pinned
                                }
                                onCite={setPinned}
                            />
                        ))}

                        {notice && (
                            <p className="animate-in rounded-xl border border-dashed px-4 py-3 text-sm text-muted-foreground fade-in motion-reduce:animate-none">
                                {notice}
                            </p>
                        )}
                    </div>

                    {isReady && messages.length === 0 && (
                        <ul className="flex [scrollbar-width:none] gap-2 overflow-x-auto px-4 pb-3 sm:flex-wrap sm:px-6 [&::-webkit-scrollbar]:hidden">
                            {starters.map((starter) => (
                                <li key={starter} className="shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => ask(starter)}
                                        className="rounded-full border bg-background/60 px-3.5 py-1.5 text-left text-xs whitespace-nowrap transition-colors hover:border-brand hover:text-brand active:scale-[0.98] sm:text-sm"
                                    >
                                        {starter}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}

                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            ask(question);
                        }}
                        className="flex items-end gap-2 border-t p-2.5 sm:p-3"
                    >
                        <textarea
                            value={question}
                            onChange={(event) =>
                                setQuestion(event.target.value)
                            }
                            onKeyDown={onKeyDown}
                            maxLength={MAX_QUESTION}
                            rows={1}
                            disabled={!isReady}
                            aria-label={`Your question for ${name}`}
                            placeholder={
                                isReady
                                    ? `Ask ${name} a question`
                                    : 'Add your business text first'
                            }
                            className="block field-sizing-content max-h-32 min-w-0 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground disabled:opacity-50"
                        />
                        {isStreaming ? (
                            <button
                                type="button"
                                onClick={stop}
                                aria-label="Stop the answer"
                                className="grid size-10 shrink-0 place-items-center rounded-full border transition-colors hover:border-brand hover:text-brand active:scale-95"
                            >
                                <Icon icon={faStop} className="size-3.5" />
                            </button>
                        ) : (
                            <button
                                type="submit"
                                disabled={question.trim() === '' || !isReady}
                                aria-label="Send question"
                                className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 transition-colors hover:bg-primary/85 active:scale-95 disabled:opacity-40 disabled:shadow-none"
                            >
                                <Icon icon={faPaperPlane} className="size-4" />
                            </button>
                        )}
                    </form>
                </div>
            </div>

            {/* Announces each finished answer once, not every chunk. */}
            <p aria-live="polite" className="sr-only">
                {!isStreaming && lastAnswer
                    ? parseAnswer(lastAnswer.content).answer
                    : ''}
            </p>
        </section>
    );
}

function BusinessCard({
    id,
    icon,
    title,
    subtitle,
    isActive,
    onSelect,
    isDashed = false,
}: {
    id: string;
    icon: FontAwesomeIconData;
    title: string;
    subtitle: string;
    isActive: boolean;
    onSelect: (id: string) => void;
    isDashed?: boolean;
}) {
    return (
        <button
            type="button"
            data-biz-card
            aria-pressed={isActive}
            onClick={() => onSelect(id)}
            className={cn(
                'group flex min-w-0 items-center gap-3 rounded-2xl border p-3 text-left transition-colors active:scale-[0.98]',
                isDashed && 'border-dashed',
                isActive
                    ? 'border-brand bg-brand/10'
                    : 'bg-card/60 hover:border-brand/50',
            )}
        >
            <span
                data-flip-id={`biz-${id}`}
                className={cn(
                    'grid size-9 shrink-0 place-items-center rounded-xl transition-colors',
                    isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-brand/10 text-brand',
                )}
            >
                <Icon icon={icon} className="size-3.5" />
            </span>
            <span className="min-w-0">
                <span className="block text-sm leading-snug font-medium [overflow-wrap:anywhere]">
                    {title}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                    {subtitle}
                </span>
            </span>
        </button>
    );
}

/** The business text in paragraphs, with the cited words marked. */
function KnowledgeText({
    text,
    range,
}: {
    text: string;
    range: [number, number] | null;
}) {
    let offset = 0;

    return (
        <>
            {text.split(/(\n\s*\n)/).map((part, index) => {
                const start = offset;
                offset += part.length;

                // Paragraph gaps come from the margin between blocks.
                if (/^\n\s*\n$/.test(part)) {
                    return null;
                }

                const hasMark = range && range[0] >= start && range[0] < offset;

                return (
                    <span
                        key={index}
                        data-knowledge-part
                        className="block [&:not(:first-child)]:mt-3"
                    >
                        {hasMark ? (
                            <>
                                {part.slice(0, range[0] - start)}
                                <mark className="rounded bg-brand/20 px-0.5 text-foreground">
                                    {part.slice(
                                        range[0] - start,
                                        Math.min(range[1], offset) - start,
                                    )}
                                </mark>
                                {part.slice(Math.min(range[1], offset) - start)}
                            </>
                        ) : (
                            part
                        )}
                    </span>
                );
            })}
        </>
    );
}

function LabMessage({
    message,
    business,
    isStreaming,
    isPinned,
    onCite,
}: {
    message: AskMessage;
    business: string;
    isStreaming: boolean;
    isPinned: boolean;
    onCite: (source: string) => void;
}) {
    if (message.role === 'user') {
        return (
            <p className="max-w-[85%] animate-in self-end rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-pretty whitespace-pre-wrap text-primary-foreground duration-300 fade-in slide-in-from-bottom-2 motion-reduce:animate-none">
                {message.content}
            </p>
        );
    }

    const { answer, source } = parseAnswer(message.content);

    return (
        <div className="flex max-w-[92%] animate-in flex-col items-start gap-2 self-start duration-300 fade-in slide-in-from-bottom-2 motion-reduce:animate-none">
            <div className="rounded-2xl rounded-bl-md border bg-background px-4 py-2.5 text-sm leading-relaxed text-pretty whitespace-pre-wrap text-foreground/90">
                {answer === '' && isStreaming ? (
                    <span
                        className="inline-flex gap-1 py-1.5"
                        aria-label="Thinking"
                    >
                        {[0, 150, 300].map((delay) => (
                            <span
                                key={delay}
                                className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60 motion-reduce:animate-none"
                                style={{ animationDelay: `${delay}ms` }}
                            />
                        ))}
                    </span>
                ) : (
                    <>
                        {answer}
                        {isStreaming && (
                            <span
                                aria-hidden
                                className="ml-0.5 inline-block h-4 w-1.5 translate-y-0.5 animate-pulse rounded-sm bg-brand"
                            />
                        )}
                    </>
                )}
            </div>

            {!isStreaming && typeof source === 'string' && (
                <button
                    type="button"
                    onClick={() => onCite(source)}
                    className={cn(
                        'inline-flex max-w-full animate-in items-start gap-1.5 rounded-xl px-2.5 py-1.5 text-left text-xs font-medium text-brand transition-colors duration-500 fade-in hover:bg-brand/20 motion-reduce:animate-none',
                        isPinned ? 'bg-brand/20' : 'bg-brand/10',
                    )}
                >
                    <Icon
                        icon={faQuoteLeft}
                        className="mt-0.5 size-2.5 shrink-0"
                    />
                    <span>
                        <span className="sr-only">Source: </span>
                        {source}
                    </span>
                </button>
            )}
            {!isStreaming && source === null && (
                <p className="inline-flex animate-in items-center gap-1.5 rounded-xl bg-[#e0a84a]/15 px-2.5 py-1.5 text-xs font-medium text-[#a8741f] fade-in motion-reduce:animate-none dark:text-[#e0a84a]">
                    Not in {business}'s information, so it didn't guess
                </p>
            )}
        </div>
    );
}
