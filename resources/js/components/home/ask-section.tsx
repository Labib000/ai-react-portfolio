import { faArrowRight } from '@fortawesome/free-solid-svg-icons/faArrowRight';
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons/faPaperPlane';
import { faStop } from '@fortawesome/free-solid-svg-icons/faStop';
import { faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons/faWandMagicSparkles';
import { Link } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import LabController from '@/actions/App/Http/Controllers/LabController';
import { SplitHeading } from '@/components/motion/split-heading';
import { Icon } from '@/components/ui/icon';
import { useAsk } from '@/hooks/use-ask';
import type { AskMessage, AskStatus } from '@/hooks/use-ask';
import { cn } from '@/lib/utils';

const STARTER_QUESTIONS = [
    'What has he built with Laravel?',
    'Can he build a MERN stack app for me?',
    'Can he build AI chatbots or automation for my business?',
    'What is his experience with Java and Spring Boot?',
];

const MAX_LENGTH = 500;

const statusNotices: Partial<Record<AskStatus, string>> = {
    unavailable: 'The assistant is offline right now.',
    'rate-limited':
        "You've reached the question limit for now. Try again in an hour.",
    invalid: "That question couldn't be sent. Try a shorter one.",
};

/**
 * "Ask about my work": a chat that answers from the content files through
 * the ask endpoint. It only animates in response to what the visitor does.
 */
export function AskSection() {
    const { messages, status, send, stop } = useAsk();
    const [draft, setDraft] = useState('');
    const list = useRef<HTMLDivElement>(null);
    const isStreaming = status === 'streaming';
    const notice = statusNotices[status];
    const lastAnswer = messages.findLast(
        (message) => message.role === 'assistant',
    );

    useEffect(() => {
        list.current?.scrollTo({ top: list.current.scrollHeight });
    }, [messages, status]);

    const submit = (question: string) => {
        if (question.trim() === '' || isStreaming) {
            return;
        }

        setDraft('');
        void send(question);
    };

    const onSubmit = (event: FormEvent) => {
        event.preventDefault();
        submit(draft);
    };

    const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            submit(draft);
        }
    };

    return (
        <section
            id="ask"
            aria-labelledby="ask-heading"
            className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-12 lg:gap-8"
        >
            <div className="text-center lg:col-span-5 lg:text-left">
                <SplitHeading
                    as="h2"
                    id="ask-heading"
                    className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl"
                >
                    Ask about my work
                </SplitHeading>
                <p className="mx-auto mt-4 max-w-md text-pretty text-muted-foreground sm:text-lg lg:mx-0">
                    An assistant that answers from my real work history. If
                    something isn't in my background, it says so.
                </p>

                <ul className="mt-8 flex flex-wrap justify-center gap-2.5 lg:flex-col lg:items-start">
                    {STARTER_QUESTIONS.map((question) => (
                        <li key={question}>
                            <button
                                type="button"
                                onClick={() => submit(question)}
                                disabled={isStreaming}
                                className="rounded-full border bg-card/60 px-4 py-2 text-left text-sm transition-colors hover:border-brand hover:text-brand active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
                            >
                                {question}
                            </button>
                        </li>
                    ))}
                </ul>

                <p className="mx-auto mt-6 max-w-md text-xs text-muted-foreground lg:mx-0">
                    Answers are written by AI from my content and can be wrong.
                </p>

                <Link
                    href={LabController.show.url()}
                    prefetch
                    className="group mt-6 inline-flex items-center gap-2 text-sm font-medium text-brand"
                >
                    <Icon icon={faWandMagicSparkles} className="size-3.5" />
                    Try the AI Lab: an assistant for your business
                    <Icon
                        icon={faArrowRight}
                        className="size-2.5 transition-transform group-hover:translate-x-0.5"
                    />
                </Link>
            </div>

            <div className="flex flex-col overflow-hidden rounded-2xl border bg-card shadow-2xl shadow-black/25 lg:col-span-7">
                <div className="flex items-center gap-2.5 border-b px-4 py-3 sm:px-5">
                    <span aria-hidden className="relative flex size-2">
                        <span
                            className={cn(
                                'absolute inline-flex size-full rounded-full bg-brand opacity-60 motion-reduce:hidden',
                                isStreaming && 'animate-ping',
                            )}
                        />
                        <span className="relative inline-flex size-2 rounded-full bg-brand" />
                    </span>
                    <p className="text-sm font-medium">Portfolio assistant</p>
                    <p className="ml-auto text-xs text-muted-foreground">
                        {isStreaming ? 'Answering…' : 'Answers from my content'}
                    </p>
                </div>

                <div
                    ref={list}
                    aria-busy={isStreaming}
                    className="flex h-[24rem] flex-col gap-4 overflow-y-auto overscroll-contain p-4 sm:h-[28rem] sm:p-6"
                >
                    {messages.length === 0 && !notice && (
                        <p className="m-auto max-w-xs text-center text-sm text-pretty text-muted-foreground">
                            Pick a starter question or type your own about my
                            projects, experience or skills.
                        </p>
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
                        <p className="animate-in rounded-xl border border-dashed px-4 py-3 text-sm text-muted-foreground fade-in motion-reduce:animate-none">
                            {notice}{' '}
                            <a
                                href="#experience"
                                className="font-medium text-brand underline-offset-4 hover:underline"
                            >
                                See my experience
                            </a>
                        </p>
                    )}
                </div>

                <form
                    onSubmit={onSubmit}
                    className="flex items-end gap-2 border-t p-2.5 sm:p-3"
                >
                    <div className="relative min-w-0 flex-1">
                        <textarea
                            value={draft}
                            onChange={(event) => setDraft(event.target.value)}
                            onKeyDown={onKeyDown}
                            maxLength={MAX_LENGTH}
                            rows={1}
                            aria-label="Your question"
                            placeholder="Ask about my projects, stack or experience"
                            className="block field-sizing-content max-h-32 w-full resize-none bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground"
                        />
                        {draft.length > MAX_LENGTH - 100 && (
                            <span className="absolute right-2 -bottom-0.5 text-[0.6875rem] text-muted-foreground tabular-nums">
                                {draft.length}/{MAX_LENGTH}
                            </span>
                        )}
                    </div>

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
                            disabled={draft.trim() === ''}
                            aria-label="Send question"
                            className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 transition-colors hover:bg-primary/85 active:scale-95 disabled:opacity-40 disabled:shadow-none"
                        >
                            <Icon icon={faPaperPlane} className="size-4" />
                        </button>
                    )}
                </form>
            </div>

            {/* Announces each finished answer once, not every streamed chunk. */}
            <p aria-live="polite" className="sr-only">
                {!isStreaming && lastAnswer ? lastAnswer.content : ''}
            </p>
        </section>
    );
}

export function ChatMessage({
    message,
    isStreaming,
}: {
    message: AskMessage;
    isStreaming: boolean;
}) {
    if (message.role === 'user') {
        return (
            <p className="max-w-[85%] animate-in self-end rounded-2xl rounded-br-md bg-brand/15 px-4 py-2.5 text-sm text-pretty whitespace-pre-wrap duration-300 fade-in slide-in-from-bottom-2 motion-reduce:animate-none">
                {message.content}
            </p>
        );
    }

    return (
        <div className="max-w-[92%] animate-in self-start text-sm leading-relaxed text-pretty whitespace-pre-wrap text-foreground/90 duration-300 fade-in slide-in-from-bottom-2 motion-reduce:animate-none">
            {message.content === '' && isStreaming ? (
                <span className="inline-flex gap-1 py-2" aria-label="Thinking">
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
                    {message.content}
                    {isStreaming && (
                        <span
                            aria-hidden
                            className="ml-0.5 inline-block h-4 w-1.5 translate-y-0.5 animate-pulse rounded-sm bg-brand"
                        />
                    )}
                </>
            )}
        </div>
    );
}
