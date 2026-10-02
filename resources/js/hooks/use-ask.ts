import { useRef, useState } from 'react';
import AskController from '@/actions/App/Http/Controllers/AskController';

export type AskMessage = {
    role: 'user' | 'assistant';
    content: string;
};

export type AskStatus =
    | 'idle'
    | 'streaming'
    | 'unavailable'
    | 'rate-limited'
    | 'invalid';

/** Turns sent with each question; matches config('ai.chat.history'). */
const HISTORY = 6;

/** Earlier answers are trimmed to this before being sent back as context. */
const MAX_ANSWER_CONTEXT = 3000;

function xsrfToken(): string {
    const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);

    return match ? decodeURIComponent(match[1]) : '';
}

/**
 * Chat state for "Ask about my work". Sends the recent conversation to the
 * ask endpoint and appends the streamed answer (server-sent events) to the
 * last message as it arrives.
 */
type UseAskOptions = {
    /** Case study slug: answers stay about that one project. */
    project?: string;
    /** Another streaming endpoint, such as the AI Lab chat. */
    url?: string;
    /** Extra fields sent with every question. */
    body?: Record<string, unknown>;
};

export function useAsk({ project, url, body }: UseAskOptions = {}) {
    const [messages, setMessages] = useState<AskMessage[]>([]);
    const [status, setStatus] = useState<AskStatus>('idle');
    const controller = useRef<AbortController | null>(null);

    const appendToAnswer = (text: string) =>
        setMessages((current) => {
            const last = current[current.length - 1];

            return [
                ...current.slice(0, -1),
                { ...last, content: last.content + text },
            ];
        });

    const dropEmptyAnswer = () =>
        setMessages((current) => {
            const last = current[current.length - 1];

            return last?.role === 'assistant' && last.content === ''
                ? current.slice(0, -1)
                : current;
        });

    // A safety net for the prompts' "no dashes" rule: once an answer is
    // complete, em and en dashes become commas, and the Unicode hyphens
    // models like to use ("well‑structured") become spaces. Plain hyphens
    // stay, so names like "E-Class" and links are untouched.
    const tidyAnswer = () =>
        setMessages((current) => {
            const last = current[current.length - 1];

            return last?.role === 'assistant'
                ? [
                      ...current.slice(0, -1),
                      {
                          ...last,
                          content: last.content
                              .replace(/\s*[—–]\s*/g, ', ')
                              .replace(
                                  /(\p{L})[\u2010\u2011](\p{L})/gu,
                                  '$1 $2',
                              ),
                      },
                  ]
                : current;
        });

    const send = async (question: string) => {
        const content = question.trim();

        if (content === '' || status === 'streaming') {
            return;
        }

        // Answers that failed before any text arrived were dropped, so the
        // empty filter only guards against sending blank turns.
        const history = [...messages, { role: 'user', content } as const]
            .filter((message) => message.content !== '')
            .slice(-HISTORY)
            .map((message) => ({
                ...message,
                content: message.content.slice(0, MAX_ANSWER_CONTEXT),
            }));

        setMessages((current) => [
            ...current,
            { role: 'user', content },
            { role: 'assistant', content: '' },
        ]);
        setStatus('streaming');

        controller.current = new AbortController();

        try {
            const response = await fetch(url ?? AskController.url(), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // JSON first, so validation and throttle errors come back
                    // as status codes instead of a redirect to the home page.
                    Accept: 'application/json, text/event-stream',
                    'X-XSRF-TOKEN': xsrfToken(),
                },
                body: JSON.stringify({ messages: history, project, ...body }),
                signal: controller.current.signal,
            });

            const isEventStream = response.headers
                .get('Content-Type')
                ?.includes('text/event-stream');

            if (!response.ok || !response.body || !isEventStream) {
                dropEmptyAnswer();
                setStatus(
                    response.status === 429
                        ? 'rate-limited'
                        : response.status === 422
                          ? 'invalid'
                          : 'unavailable',
                );

                return;
            }

            const reader = response.body
                .pipeThrough(new TextDecoderStream())
                .getReader();
            let buffer = '';
            let failed = false;

            for (;;) {
                const { value, done } = await reader.read();

                if (done) {
                    break;
                }

                buffer += value;
                const events = buffer.split('\n\n');
                buffer = events.pop() ?? '';

                for (const block of events) {
                    const event =
                        block.match(/^event: (.*)$/m)?.[1] ?? 'update';
                    const data = block.match(/^data: (.*)$/m)?.[1] ?? '';

                    if (event === 'error') {
                        failed = true;
                    } else if (data.startsWith('{')) {
                        appendToAnswer(JSON.parse(data).text ?? '');
                    }
                }
            }

            dropEmptyAnswer();
            tidyAnswer();
            setStatus(failed ? 'unavailable' : 'idle');
        } catch (error) {
            dropEmptyAnswer();
            setStatus(
                error instanceof DOMException && error.name === 'AbortError'
                    ? 'idle'
                    : 'unavailable',
            );
        } finally {
            controller.current = null;
        }
    };

    const stop = () => controller.current?.abort();

    /** Clears the conversation, stopping any answer in progress. */
    const reset = () => {
        controller.current?.abort();
        setMessages([]);
        setStatus('idle');
    };

    return { messages, status, send, stop, reset };
}
