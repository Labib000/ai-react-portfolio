import { faArrowRight } from '@fortawesome/free-solid-svg-icons/faArrowRight';
import { faCheck } from '@fortawesome/free-solid-svg-icons/faCheck';
import { faCopy } from '@fortawesome/free-solid-svg-icons/faCopy';
import { faMagnifyingGlassChart } from '@fortawesome/free-solid-svg-icons/faMagnifyingGlassChart';
import { faRotateLeft } from '@fortawesome/free-solid-svg-icons/faRotateLeft';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import JobMatchController from '@/actions/App/Http/Controllers/JobMatchController';
import { SplitHeading } from '@/components/motion/split-heading';
import { Icon } from '@/components/ui/icon';
import { useClipboard } from '@/hooks/use-clipboard';
import { gsap, MOTION_OK, useGSAP } from '@/lib/gsap';
import { cn } from '@/lib/utils';
import type { JobMatch, MatchTier } from '@/types/content';

if (typeof window !== 'undefined') {
    gsap.registerPlugin(DrawSVGPlugin);
}

type Status = 'idle' | 'loading' | 'done' | 'error';

const MIN_LENGTH = 80;
const MAX_LENGTH = 6000;

const SAMPLE_JOB = `Full Stack Developer (Laravel + React)

We're looking for a developer to build and maintain our booking platform.

Requirements:
- 1+ years of professional experience with PHP and Laravel
- Building REST APIs and integrating third-party services
- React and Redux on the frontend
- MySQL: schema design, query optimisation and indexing
- Caching with Redis
- Experience with Docker and Kubernetes
- Nice to have: Node.js, and experience adding AI features with LLM APIs`;

const LOADING_STEPS = [
    'Reading the requirements…',
    'Checking my experience…',
    'Scoring the fit…',
];

export const tierStyles: Record<
    MatchTier,
    { label: string; badge: string; dot: string }
> = {
    production: {
        label: 'Used in production',
        badge: 'border-tier-production/30 bg-tier-production/10 text-tier-production',
        dot: 'bg-tier-production',
    },
    projects: {
        label: 'Hands-on',
        badge: 'border-tier-projects/30 bg-tier-projects/10 text-tier-projects',
        dot: 'bg-tier-projects',
    },
    learning: {
        label: 'Learning',
        badge: 'border-tier-learning/30 bg-tier-learning/10 text-tier-learning',
        dot: 'bg-tier-learning',
    },
    gap: {
        label: 'Not yet',
        badge: 'border-muted-foreground/25 bg-muted text-muted-foreground',
        dot: 'bg-muted-foreground/50',
    },
};

function xsrfToken(): string {
    const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);

    return match ? decodeURIComponent(match[1]) : '';
}

function asNote(result: JobMatch): string {
    return [
        `Labib Alam: ${result.fit.label} (${result.fit.score}%)`,
        result.summary,
        '',
        ...result.requirements.map(
            (item) =>
                `- ${item.requirement}: ${tierStyles[item.tier].label}. ${item.evidence}`,
        ),
    ].join('\n');
}

/**
 * "Check my fit for your role": a recruiter pastes a job description and
 * gets each requirement badged against Labib's real background, with an
 * honest fit score. Tiers and the score are decided on the server.
 */
export function JobMatcher() {
    const section = useRef<HTMLElement>(null);
    const scanTween = useRef<gsap.core.Tween | null>(null);
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState<Status>('idle');
    const [result, setResult] = useState<JobMatch | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [step, setStep] = useState(0);
    const [copiedText, copy] = useClipboard();
    const isLoading = status === 'loading';
    const note = result ? asNote(result) : '';

    // Cycle the loading labels while the model works.
    useEffect(() => {
        if (!isLoading) {
            return;
        }

        setStep(0);
        const timer = window.setInterval(
            () => setStep((current) => (current + 1) % LOADING_STEPS.length),
            1400,
        );

        return () => window.clearInterval(timer);
    }, [isLoading]);

    // The scanning light sweeps over the textarea while loading.
    useEffect(() => {
        const bar = section.current?.querySelector('[data-scan]');

        if (!isLoading || !bar) {
            scanTween.current?.kill();
            scanTween.current = null;

            return;
        }

        if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            scanTween.current = gsap.fromTo(
                bar,
                { top: '0%' },
                {
                    top: '100%',
                    duration: 1.4,
                    ease: 'sine.inOut',
                    repeat: -1,
                    yoyo: true,
                },
            );
        }

        return () => {
            scanTween.current?.kill();
        };
    }, [isLoading]);

    // Results: the gauge draws, numbers count up and rows flip in.
    useGSAP(
        () => {
            const panel = section.current?.querySelector('[data-result]');

            if (!result || !panel) {
                return;
            }

            const mm = gsap.matchMedia();

            mm.add(MOTION_OK, () => {
                const timeline = gsap.timeline({
                    defaults: { ease: 'power3.out' },
                });
                const score = { value: 0 };
                const scoreText =
                    panel.querySelector<HTMLElement>('[data-score]');

                timeline
                    .fromTo(
                        panel,
                        { autoAlpha: 0, y: 24 },
                        { autoAlpha: 1, y: 0, duration: 0.6 },
                    )
                    .fromTo(
                        panel.querySelector('[data-gauge]'),
                        { drawSVG: '0%' },
                        {
                            drawSVG: `0% ${Math.max(result.fit.score, 1)}%`,
                            duration: 1.4,
                            ease: 'power2.inOut',
                        },
                        0.2,
                    )
                    .to(
                        score,
                        {
                            value: result.fit.score,
                            duration: 1.4,
                            ease: 'power2.inOut',
                            onUpdate: () => {
                                if (scoreText) {
                                    scoreText.textContent = String(
                                        Math.round(score.value),
                                    );
                                }
                            },
                        },
                        0.2,
                    )
                    .fromTo(
                        panel.querySelectorAll('[data-counter]'),
                        { autoAlpha: 0, y: 12 },
                        { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.08 },
                        0.5,
                    )
                    .fromTo(
                        panel.querySelectorAll('[data-row]'),
                        { autoAlpha: 0, y: 20 },
                        { autoAlpha: 1, y: 0, duration: 0.55, stagger: 0.07 },
                        0.8,
                    )
                    .fromTo(
                        panel.querySelectorAll('[data-badge]'),
                        { rotationX: -90, transformPerspective: 400 },
                        {
                            rotationX: 0,
                            duration: 0.5,
                            stagger: 0.07,
                            ease: 'back.out(2)',
                        },
                        0.95,
                    );
            });

            return () => mm.revert();
        },
        { scope: section, dependencies: [result] },
    );

    const submit = async (event: FormEvent) => {
        event.preventDefault();

        const text = description.trim();

        if (text.length < MIN_LENGTH) {
            setError(
                `Paste a bit more of the job description (at least ${MIN_LENGTH} characters).`,
            );

            return;
        }

        setStatus('loading');
        setError(null);
        setResult(null);

        try {
            const response = await fetch(JobMatchController.url(), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-XSRF-TOKEN': xsrfToken(),
                },
                body: JSON.stringify({ description: text }),
            });
            const data = await response.json().catch(() => ({}));

            if (response.ok) {
                setResult(data as JobMatch);
                setStatus('done');

                return;
            }

            setStatus('error');
            setError(
                response.status === 429
                    ? "You've reached the limit for now. Try again in an hour, or email me the job description."
                    : response.status === 422
                      ? (data.errors?.description?.[0] ??
                        'Please check the job description.')
                      : (data.message ??
                        'The matcher is unavailable right now. Please try again later.'),
            );
        } catch {
            setStatus('error');
            setError(
                'The matcher is unavailable right now. Please try again later.',
            );
        }
    };

    const reset = () => {
        setResult(null);
        setStatus('idle');
        setError(null);
        section.current?.scrollIntoView({ block: 'start' });
    };

    return (
        <section
            ref={section}
            id="matcher"
            aria-labelledby="matcher-heading"
            className="mx-auto max-w-4xl scroll-mt-24 px-4 pt-24 sm:px-6 sm:pt-32 print:hidden"
        >
            <div className="text-center md:text-left">
                <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-brand/10 text-brand md:mx-0">
                    <Icon icon={faMagnifyingGlassChart} className="size-5" />
                </span>
                <SplitHeading
                    as="h2"
                    id="matcher-heading"
                    className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl"
                >
                    Check my fit for your role
                </SplitHeading>
                <p className="mx-auto mt-4 max-w-2xl text-pretty text-muted-foreground sm:text-lg md:mx-0">
                    Paste a job description. AI pulls out the requirements and
                    matches each one against my real experience, including the
                    gaps. The badges come from my actual background, not from
                    the AI.
                </p>
            </div>

            <div className="mt-10 rounded-3xl border bg-card p-5 shadow-2xl shadow-black/20 sm:p-8">
                {result ? (
                    <MatchResult
                        result={result}
                        isCopied={copiedText === note}
                        onCopy={() => void copy(note)}
                        onReset={reset}
                    />
                ) : (
                    <form onSubmit={submit}>
                        <div className="flex items-baseline justify-between gap-3">
                            <label
                                htmlFor="job-description"
                                className="text-sm font-medium"
                            >
                                Job description
                            </label>
                            <button
                                type="button"
                                onClick={() => {
                                    setDescription(SAMPLE_JOB);
                                    setError(null);
                                }}
                                disabled={isLoading}
                                className="text-xs font-medium text-brand underline-offset-4 hover:underline disabled:opacity-50"
                            >
                                Try a sample job description
                            </button>
                        </div>

                        <div className="relative mt-2 overflow-hidden rounded-2xl">
                            <textarea
                                id="job-description"
                                value={description}
                                onChange={(event) => {
                                    setDescription(event.target.value);
                                    setError(null);
                                }}
                                disabled={isLoading}
                                maxLength={MAX_LENGTH}
                                rows={10}
                                placeholder="Paste the job description here: the requirements, responsibilities and tech stack."
                                aria-invalid={Boolean(error) || undefined}
                                aria-describedby="job-description-help"
                                className="block min-h-56 w-full resize-y rounded-2xl border bg-background/60 px-4 py-3.5 text-sm leading-relaxed outline-none placeholder:text-muted-foreground/70 focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:opacity-70"
                            />
                            {isLoading && (
                                <span
                                    aria-hidden
                                    data-scan
                                    className="pointer-events-none absolute inset-x-0 top-0 h-16 -translate-y-1/2 bg-linear-to-b from-transparent via-brand/25 to-transparent"
                                />
                            )}
                        </div>

                        <div
                            id="job-description-help"
                            className="mt-2 flex items-start justify-between gap-4 text-xs"
                        >
                            <p
                                role={error ? 'alert' : undefined}
                                className={cn(
                                    error
                                        ? 'text-destructive'
                                        : 'text-muted-foreground',
                                )}
                            >
                                {error ??
                                    'Paste the job description only, no personal details.'}
                            </p>
                            <span className="shrink-0 text-muted-foreground tabular-nums">
                                {description.length}/{MAX_LENGTH}
                            </span>
                        </div>

                        <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
                            <p
                                aria-live="polite"
                                className="order-2 text-sm text-muted-foreground sm:order-1"
                            >
                                {isLoading ? LOADING_STEPS[step] : ''}
                            </p>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="order-1 inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-full bg-primary px-7 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-colors hover:bg-primary/85 active:scale-[0.98] disabled:opacity-70 sm:order-2 sm:w-auto"
                            >
                                {isLoading ? (
                                    <span
                                        aria-hidden
                                        className="size-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground"
                                    />
                                ) : (
                                    <Icon
                                        icon={faMagnifyingGlassChart}
                                        className="size-4"
                                    />
                                )}
                                {isLoading ? 'Checking…' : 'Check my fit'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </section>
    );
}

function MatchResult({
    result,
    isCopied,
    onCopy,
    onReset,
}: {
    result: JobMatch;
    isCopied: boolean;
    onCopy: () => void;
    onReset: () => void;
}) {
    return (
        <div data-result>
            <div className="flex flex-col items-center gap-8 md:flex-row md:items-center">
                {/* Fit gauge */}
                <div className="relative w-56 shrink-0">
                    <svg
                        viewBox="0 0 120 68"
                        className="w-full"
                        aria-hidden
                        fill="none"
                    >
                        <path
                            d="M 10 60 A 50 50 0 0 1 110 60"
                            stroke="currentColor"
                            strokeWidth="9"
                            strokeLinecap="round"
                            className="text-muted"
                        />
                        <path
                            data-gauge
                            d="M 10 60 A 50 50 0 0 1 110 60"
                            stroke="currentColor"
                            strokeWidth="9"
                            strokeLinecap="round"
                            // The arc is π × 50 ≈ 157 units long.
                            strokeDasharray={`${(result.fit.score / 100) * 157.08} 200`}
                            className="text-brand"
                        />
                    </svg>
                    <div className="absolute inset-x-0 bottom-0 text-center">
                        <p className="text-4xl font-semibold tracking-tight tabular-nums">
                            <span data-score>{result.fit.score}</span>
                            <span className="text-2xl text-muted-foreground">
                                %
                            </span>
                        </p>
                        <p className="text-sm font-medium text-brand">
                            {result.fit.label}
                        </p>
                    </div>
                </div>

                <div className="text-center md:text-left">
                    <p className="text-pretty text-muted-foreground">
                        {result.summary}
                    </p>
                    <dl className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {(Object.keys(tierStyles) as MatchTier[]).map(
                            (tier) => (
                                <div
                                    key={tier}
                                    data-counter
                                    className="rounded-xl border bg-background/50 px-3 py-2 text-left"
                                >
                                    <dt className="flex items-center gap-1.5 text-[0.6875rem] text-muted-foreground">
                                        <span
                                            className={cn(
                                                'size-1.5 rounded-full',
                                                tierStyles[tier].dot,
                                            )}
                                        />
                                        {tierStyles[tier].label}
                                    </dt>
                                    <dd className="mt-0.5 text-xl font-semibold tabular-nums">
                                        {result.counts[tier]}
                                    </dd>
                                </div>
                            ),
                        )}
                    </dl>
                </div>
            </div>

            <ul className="mt-8 divide-y border-y">
                {result.requirements.map((item) => (
                    <li
                        key={item.requirement}
                        data-row
                        className="flex flex-col gap-2 py-4 sm:flex-row sm:items-start sm:gap-5"
                    >
                        <div className="min-w-0 flex-1">
                            <p className="font-medium">{item.requirement}</p>
                            <p className="mt-1 text-sm text-pretty text-muted-foreground">
                                {item.evidence}
                            </p>
                            {item.link && (
                                <a
                                    href={item.link.href}
                                    className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-medium text-brand underline-offset-4 hover:underline"
                                >
                                    {item.link.label}
                                    <Icon
                                        icon={faArrowRight}
                                        className="size-2.5"
                                    />
                                </a>
                            )}
                        </div>
                        <span
                            data-badge
                            className={cn(
                                'inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
                                tierStyles[item.tier].badge,
                            )}
                        >
                            <span
                                className={cn(
                                    'size-1.5 rounded-full',
                                    tierStyles[item.tier].dot,
                                )}
                            />
                            {tierStyles[item.tier].label}
                        </span>
                    </li>
                ))}
            </ul>

            <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
                <p className="text-xs text-muted-foreground">
                    AI extracts the requirements; the badges come from my real
                    experience.
                </p>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={onCopy}
                        className="inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors hover:border-brand hover:text-brand"
                    >
                        <Icon
                            icon={isCopied ? faCheck : faCopy}
                            className={cn('size-3.5', isCopied && 'text-brand')}
                        />
                        {isCopied ? 'Copied' : 'Copy as note'}
                    </button>
                    <button
                        type="button"
                        onClick={onReset}
                        className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/85"
                    >
                        <Icon icon={faRotateLeft} className="size-3.5" />
                        Check another
                    </button>
                </div>
            </div>
        </div>
    );
}
