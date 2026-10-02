import { faPaperPlane } from '@fortawesome/free-solid-svg-icons/faPaperPlane';
import { faSpinner } from '@fortawesome/free-solid-svg-icons/faSpinner';
import { Form } from '@inertiajs/react';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import ContactController from '@/actions/App/Http/Controllers/ContactController';
import { Icon } from '@/components/ui/icon';
import { gsap, MOTION_OK, useGSAP } from '@/lib/gsap';
import { cn } from '@/lib/utils';

if (typeof window !== 'undefined') {
    gsap.registerPlugin(DrawSVGPlugin, MotionPathPlugin);
}

export type ContactReason = 'hiring' | 'project';

const MAX_MESSAGE = 2000;

const reasons: { value: ContactReason; label: string; placeholder: string }[] =
    [
        {
            value: 'hiring',
            label: 'Hiring for a role',
            placeholder:
                'Tell me about the role: the team, the stack and what you need…',
        },
        {
            value: 'project',
            label: 'Need something built',
            placeholder:
                'Tell me about your project: what it does, who it is for and any deadline…',
        },
    ];

type ContactFormProps = {
    defaultReason?: ContactReason;
    /** Keeps field ids unique if the form appears twice. */
    idPrefix?: string;
    titleAs?: 'h2' | 'h3';
};

function prefersReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * The contact form. It posts to ContactController@store, which saves the
 * message and emails both sides. On success the paper plane in the button
 * takes off, then the form swaps to a thank-you panel whose check mark
 * draws itself.
 */
export function ContactForm({
    defaultReason = 'project',
    idPrefix = 'contact',
    titleAs: Title = 'h3',
}: ContactFormProps) {
    const root = useRef<HTMLDivElement>(null);
    const [reason, setReason] = useState<ContactReason>(defaultReason);
    const [messageLength, setMessageLength] = useState(0);
    const [isSent, setIsSent] = useState(false);
    const placeholder = reasons.find(
        (option) => option.value === reason,
    )?.placeholder;
    const id = (field: string) => `${idPrefix}-${field}`;

    const launchPlane = (onLanded: () => void) => {
        const plane = root.current?.querySelector('[data-plane]');

        if (!plane || prefersReducedMotion()) {
            onLanded();

            return;
        }

        gsap.timeline({ onComplete: onLanded })
            .to(plane, { x: -6, y: 4, rotation: -8, duration: 0.18 })
            .to(plane, {
                duration: 0.9,
                ease: 'power2.in',
                motionPath: {
                    path: [
                        { x: 0, y: 0 },
                        { x: 70, y: -30 },
                        { x: 150, y: -120 },
                        { x: 320, y: -280 },
                    ],
                    curviness: 1.4,
                    autoRotate: 45,
                },
                scale: 1.6,
                autoAlpha: 0,
            });
    };

    // The thank-you panel: the check circle draws itself, then the text rises.
    useGSAP(
        () => {
            const panel = root.current?.querySelector('[data-sent]');

            if (!isSent || !panel) {
                return;
            }

            const mm = gsap.matchMedia();

            mm.add(MOTION_OK, () => {
                gsap.timeline()
                    .fromTo(
                        panel,
                        { autoAlpha: 0, scale: 0.96 },
                        { autoAlpha: 1, scale: 1, duration: 0.4 },
                    )
                    .fromTo(
                        panel.querySelectorAll('[data-check-path]'),
                        { drawSVG: '0%' },
                        {
                            drawSVG: '100%',
                            duration: 0.7,
                            stagger: 0.25,
                            ease: 'power2.inOut',
                        },
                        0.1,
                    )
                    .fromTo(
                        panel.querySelectorAll('[data-sent-text]'),
                        { autoAlpha: 0, y: 14 },
                        {
                            autoAlpha: 1,
                            y: 0,
                            duration: 0.5,
                            stagger: 0.08,
                            ease: 'power3.out',
                        },
                        0.6,
                    );
            });

            return () => mm.revert();
        },
        { scope: root, dependencies: [isSent] },
    );

    return (
        <div ref={root}>
            {isSent ? (
                <div
                    data-sent
                    role="status"
                    className="flex min-h-[26rem] flex-col items-center justify-center text-center"
                >
                    <svg
                        aria-hidden
                        viewBox="0 0 64 64"
                        fill="none"
                        className="size-16 text-brand"
                    >
                        <circle
                            data-check-path
                            cx="32"
                            cy="32"
                            r="29"
                            stroke="currentColor"
                            strokeWidth="3"
                        />
                        <path
                            data-check-path
                            d="M20 33 L28.5 41.5 L45 24"
                            stroke="currentColor"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                    <Title
                        data-sent-text
                        className="mt-6 text-2xl font-semibold tracking-tight"
                    >
                        Message sent
                    </Title>
                    <p
                        data-sent-text
                        className="mt-2 max-w-sm text-pretty text-muted-foreground"
                    >
                        Thanks for reaching out. I'll reply within 24 hours. A
                        copy is on its way to your inbox.
                    </p>
                    <button
                        data-sent-text
                        type="button"
                        onClick={() => setIsSent(false)}
                        className="mt-8 inline-flex h-11 items-center rounded-full border px-5 text-sm font-medium transition-colors hover:border-brand hover:text-brand active:scale-[0.98]"
                    >
                        Send another message
                    </button>
                </div>
            ) : (
                <>
                    <Title className="text-center text-lg font-semibold tracking-tight md:text-left">
                        Send a message
                    </Title>

                    <Form
                        {...ContactController.store.form()}
                        options={{ preserveScroll: true }}
                        resetOnSuccess
                        onSuccess={() =>
                            launchPlane(() => {
                                setMessageLength(0);
                                setIsSent(true);
                            })
                        }
                        className="mt-5 flex flex-col gap-5"
                    >
                        {({ errors, processing }) => (
                            <>
                                <fieldset>
                                    <legend className="text-sm font-medium">
                                        I'm…
                                    </legend>
                                    <div className="relative mt-2 grid grid-cols-2 rounded-full border bg-background/60 p-1">
                                        <span
                                            aria-hidden
                                            className={cn(
                                                'absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-primary shadow-lg shadow-primary/25 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
                                                reason === 'project' &&
                                                    'translate-x-full',
                                            )}
                                        />
                                        {reasons.map((option) => (
                                            <label
                                                key={option.value}
                                                className={cn(
                                                    'relative z-10 cursor-pointer rounded-full px-2 py-2.5 text-center text-xs font-medium transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand sm:text-sm',
                                                    reason === option.value
                                                        ? 'text-primary-foreground'
                                                        : 'text-muted-foreground hover:text-foreground',
                                                )}
                                            >
                                                <input
                                                    type="radio"
                                                    name="reason"
                                                    value={option.value}
                                                    checked={
                                                        reason === option.value
                                                    }
                                                    onChange={() =>
                                                        setReason(option.value)
                                                    }
                                                    className="sr-only"
                                                />
                                                {option.label}
                                            </label>
                                        ))}
                                    </div>
                                    <FieldError
                                        id={id('reason-error')}
                                        message={errors.reason}
                                    />
                                </fieldset>

                                <div className="grid gap-5 sm:grid-cols-2">
                                    <Field
                                        id={id('name')}
                                        label="Your name"
                                        error={errors.name}
                                    >
                                        <input
                                            id={id('name')}
                                            name="name"
                                            autoComplete="name"
                                            required
                                            maxLength={100}
                                            aria-invalid={
                                                Boolean(errors.name) ||
                                                undefined
                                            }
                                            aria-describedby={
                                                errors.name
                                                    ? id('name-error')
                                                    : undefined
                                            }
                                            className={inputClass(errors.name)}
                                        />
                                    </Field>
                                    <Field
                                        id={id('email')}
                                        label="Email"
                                        error={errors.email}
                                    >
                                        <input
                                            id={id('email')}
                                            name="email"
                                            type="email"
                                            autoComplete="email"
                                            required
                                            maxLength={150}
                                            aria-invalid={
                                                Boolean(errors.email) ||
                                                undefined
                                            }
                                            aria-describedby={
                                                errors.email
                                                    ? id('email-error')
                                                    : undefined
                                            }
                                            className={inputClass(errors.email)}
                                        />
                                    </Field>
                                </div>

                                <Field
                                    id={id('company')}
                                    label="Company"
                                    hint="Optional"
                                    error={errors.company}
                                >
                                    <input
                                        id={id('company')}
                                        name="company"
                                        autoComplete="organization"
                                        maxLength={120}
                                        aria-invalid={
                                            Boolean(errors.company) || undefined
                                        }
                                        className={inputClass(errors.company)}
                                    />
                                </Field>

                                <Field
                                    id={id('message')}
                                    label="Message"
                                    hint={`${messageLength}/${MAX_MESSAGE}`}
                                    error={errors.message}
                                >
                                    <textarea
                                        id={id('message')}
                                        name="message"
                                        required
                                        rows={5}
                                        maxLength={MAX_MESSAGE}
                                        placeholder={placeholder}
                                        onChange={(event) =>
                                            setMessageLength(
                                                event.target.value.length,
                                            )
                                        }
                                        aria-invalid={
                                            Boolean(errors.message) || undefined
                                        }
                                        aria-describedby={
                                            errors.message
                                                ? id('message-error')
                                                : undefined
                                        }
                                        className={cn(
                                            inputClass(errors.message),
                                            'h-auto min-h-32 resize-y py-3',
                                        )}
                                    />
                                </Field>

                                {/* Honeypot: hidden from people, only bots fill it. */}
                                <div
                                    aria-hidden
                                    className="absolute -left-[9999px] h-px w-px overflow-hidden"
                                >
                                    <label>
                                        Website
                                        <input
                                            name="website"
                                            tabIndex={-1}
                                            autoComplete="off"
                                        />
                                    </label>
                                </div>

                                <div className="flex flex-col-reverse items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                                    <p className="text-xs text-muted-foreground">
                                        I reply to every message within 24
                                        hours.
                                    </p>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-full bg-primary px-7 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-colors hover:bg-primary/85 active:scale-[0.98] disabled:opacity-60 sm:w-auto"
                                    >
                                        {processing ? (
                                            <Icon
                                                icon={faSpinner}
                                                className="size-4 animate-spin"
                                            />
                                        ) : (
                                            <span
                                                data-plane
                                                className="relative z-10 inline-flex"
                                            >
                                                <Icon
                                                    icon={faPaperPlane}
                                                    className="size-4"
                                                />
                                            </span>
                                        )}
                                        {processing
                                            ? 'Sending…'
                                            : 'Send message'}
                                    </button>
                                </div>
                            </>
                        )}
                    </Form>
                </>
            )}
        </div>
    );
}

function inputClass(error: string | undefined): string {
    return cn(
        'block h-11 w-full rounded-xl border bg-background/60 px-3.5 text-sm transition-colors outline-none placeholder:text-muted-foreground/70 focus:border-brand focus:ring-2 focus:ring-brand/20',
        error &&
            'border-destructive focus:border-destructive focus:ring-destructive/20',
    );
}

function Field({
    id,
    label,
    hint,
    error,
    children,
}: {
    id: string;
    label: string;
    hint?: string;
    error?: string;
    children: ReactNode;
}) {
    return (
        <div>
            <div className="flex items-baseline justify-between gap-3">
                <label htmlFor={id} className="text-sm font-medium">
                    {label}
                </label>
                {hint && (
                    <span className="text-xs text-muted-foreground tabular-nums">
                        {hint}
                    </span>
                )}
            </div>
            <div className="mt-2">{children}</div>
            <FieldError id={`${id}-error`} message={error} />
        </div>
    );
}

function FieldError({ id, message }: { id: string; message?: string }) {
    if (!message) {
        return null;
    }

    return (
        <p id={id} role="alert" className="mt-1.5 text-xs text-destructive">
            {message}
        </p>
    );
}
