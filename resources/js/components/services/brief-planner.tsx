import { faWhatsapp } from '@fortawesome/free-brands-svg-icons/faWhatsapp';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons/faArrowRight';
import { faCalendarCheck } from '@fortawesome/free-solid-svg-icons/faCalendarCheck';
import { faCartShopping } from '@fortawesome/free-solid-svg-icons/faCartShopping';
import { faCheck } from '@fortawesome/free-solid-svg-icons/faCheck';
import { faCopy } from '@fortawesome/free-solid-svg-icons/faCopy';
import { faGlobe } from '@fortawesome/free-solid-svg-icons/faGlobe';
import { faLaptopCode } from '@fortawesome/free-solid-svg-icons/faLaptopCode';
import { faLightbulb } from '@fortawesome/free-solid-svg-icons/faLightbulb';
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons/faPaperPlane';
import { faRobot } from '@fortawesome/free-solid-svg-icons/faRobot';
import { faRotateLeft } from '@fortawesome/free-solid-svg-icons/faRotateLeft';
import { faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons/faWandMagicSparkles';
import { Form, Link, usePage } from '@inertiajs/react';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import BriefController from '@/actions/App/Http/Controllers/BriefController';
import ContactController from '@/actions/App/Http/Controllers/ContactController';
import WorkController from '@/actions/App/Http/Controllers/WorkController';
import { SplitHeading } from '@/components/motion/split-heading';
import { Icon } from '@/components/ui/icon';
import type { FontAwesomeIconData } from '@/components/ui/icon';
import {
    Screenshot,
    StackList,
    toolIconMap,
} from '@/components/work/project-media';
import { useClipboard } from '@/hooks/use-clipboard';
import { gsap, MOTION_OK, useGSAP } from '@/lib/gsap';
import { cn } from '@/lib/utils';
import type { ProjectBrief, ToolRow } from '@/types/content';

if (typeof window !== 'undefined') {
    gsap.registerPlugin(DrawSVGPlugin);
}

type BriefPlannerProps = {
    types: Record<string, string>;
    toolRows: ToolRow[];
};

type Status = 'idle' | 'loading' | 'done' | 'error';

const MIN_LENGTH = 40;
const MAX_LENGTH = 1000;

const TYPE_ICONS: Record<string, FontAwesomeIconData> = {
    website: faGlobe,
    'web-app': faLaptopCode,
    'e-commerce': faCartShopping,
    booking: faCalendarCheck,
    'ai-chatbot': faRobot,
    other: faLightbulb,
};

const EXAMPLES: { label: string; type: string; idea: string }[] = [
    {
        label: 'Car rental booking',
        type: 'booking',
        idea: 'A car rental website where customers search cars by brand and book them online, and my team manages bookings, cars and payments from an admin panel.',
    },
    {
        label: 'Clinic WhatsApp bot',
        type: 'ai-chatbot',
        idea: 'A WhatsApp assistant for my clinic that answers common questions, shares timings and books appointments, handing over to my staff when needed.',
    },
    {
        label: 'Clothing store',
        type: 'e-commerce',
        idea: 'An online store for handmade clothing with product sizes and colours, a cart, online payments, order tracking for customers and an admin to manage stock.',
    },
];

const LOADING_STEPS = [
    'Understanding your idea…',
    'Sketching the pages…',
    'Planning the phases…',
];

function xsrfToken(): string {
    const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);

    return match ? decodeURIComponent(match[1]) : '';
}

/** The brief as plain text, for the email, WhatsApp and the clipboard. */
function briefText(
    brief: ProjectBrief,
    typeLabel: string,
    idea: string,
): string {
    return [
        `Project brief: ${brief.title}`,
        `Type: ${typeLabel}`,
        '',
        `My idea: ${idea}`,
        '',
        brief.summary,
        '',
        `Pages: ${brief.sitemap
            .map((page) =>
                page.children.length > 0
                    ? `${page.name} (${page.children.join(', ')})`
                    : page.name,
            )
            .join('; ')}`,
        '',
        ...brief.phases.map(
            (phase) =>
                `${phase.name}: ${phase.goal} ${phase.features.join(', ')}.`,
        ),
        '',
        `Questions: ${brief.questions.map((question, index) => `${index + 1}) ${question}`).join(' ')}`,
        brief.stack.length > 0
            ? `Suggested stack: ${brief.stack.join(', ')}`
            : '',
    ]
        .filter((line, index, lines) => line !== '' || lines[index - 1] !== '')
        .join('\n')
        .trim();
}

/**
 * "Plan your project in 60 seconds": a client describes an idea, the AI
 * drafts a brief (sitemap, phases, questions), and the client can send it
 * straight to Labib through the contact form or WhatsApp.
 */
export function BriefPlanner({ types, toolRows }: BriefPlannerProps) {
    const { site } = usePage().props;
    const section = useRef<HTMLElement>(null);
    const [type, setType] = useState('web-app');
    const [idea, setIdea] = useState('');
    const [status, setStatus] = useState<Status>('idle');
    const [brief, setBrief] = useState<ProjectBrief | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [step, setStep] = useState(0);
    const [isSent, setIsSent] = useState(false);
    const [copiedText, copy] = useClipboard();
    const icons = toolIconMap(toolRows);
    const isLoading = status === 'loading';
    const typeLabel = types[type] ?? type;
    const text = brief ? briefText(brief, typeLabel, idea.trim()) : '';

    useEffect(() => {
        if (!isLoading) {
            return;
        }

        setStep(0);
        const timer = window.setInterval(
            () => setStep((current) => (current + 1) % LOADING_STEPS.length),
            1500,
        );

        return () => window.clearInterval(timer);
    }, [isLoading]);

    // Loading: a blueprint draws itself and its nodes pulse.
    useGSAP(
        () => {
            const blueprint =
                section.current?.querySelector('[data-blueprint]');

            if (!isLoading || !blueprint) {
                return;
            }

            const mm = gsap.matchMedia();

            mm.add(MOTION_OK, () => {
                gsap.fromTo(
                    blueprint.querySelectorAll('[data-bp-line]'),
                    { drawSVG: '0%' },
                    {
                        drawSVG: '100%',
                        duration: 1.2,
                        stagger: 0.15,
                        ease: 'power2.inOut',
                        repeat: -1,
                        yoyo: true,
                        repeatDelay: 0.3,
                    },
                );
                gsap.fromTo(
                    blueprint.querySelectorAll('[data-bp-node]'),
                    { scale: 0.4, autoAlpha: 0.3, transformOrigin: 'center' },
                    {
                        scale: 1,
                        autoAlpha: 1,
                        duration: 0.6,
                        stagger: { each: 0.12, repeat: -1, yoyo: true },
                        ease: 'sine.inOut',
                    },
                );
            });

            return () => mm.revert();
        },
        { scope: section, dependencies: [isLoading] },
    );

    // Result: the tree grows from the root, then phases and questions.
    useGSAP(
        () => {
            const result = section.current?.querySelector('[data-brief]');

            if (!brief || !result) {
                return;
            }

            const mm = gsap.matchMedia();

            mm.add(MOTION_OK, () => {
                const find = (selector: string) =>
                    result.querySelectorAll(selector);

                gsap.timeline({ defaults: { ease: 'power3.out' } })
                    .fromTo(
                        find('[data-brief-head]'),
                        { autoAlpha: 0, y: 20 },
                        { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.07 },
                    )
                    .fromTo(
                        find('[data-root]'),
                        { autoAlpha: 0, scale: 0.6 },
                        {
                            autoAlpha: 1,
                            scale: 1,
                            duration: 0.6,
                            ease: 'back.out(2)',
                        },
                        0.3,
                    )
                    .fromTo(
                        find('[data-stem]'),
                        { scaleY: 0 },
                        { scaleY: 1, duration: 0.35, transformOrigin: 'top' },
                        0.7,
                    )
                    .fromTo(
                        find('[data-rail]'),
                        { scaleX: 0 },
                        { scaleX: 1, duration: 0.5, stagger: 0.05 },
                        0.85,
                    )
                    .fromTo(
                        find('[data-node]'),
                        { autoAlpha: 0, y: -12, scale: 0.85 },
                        {
                            autoAlpha: 1,
                            y: 0,
                            scale: 1,
                            duration: 0.5,
                            stagger: 0.08,
                            ease: 'back.out(2)',
                        },
                        1,
                    )
                    .fromTo(
                        find('[data-leaf]'),
                        { autoAlpha: 0, x: -10 },
                        { autoAlpha: 1, x: 0, duration: 0.35, stagger: 0.03 },
                        1.3,
                    )
                    .fromTo(
                        find('[data-phase]'),
                        { autoAlpha: 0, y: 30 },
                        { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.12 },
                        1.6,
                    )
                    .fromTo(
                        find('[data-phase-arrow]'),
                        { autoAlpha: 0, x: -10 },
                        { autoAlpha: 1, x: 0, duration: 0.4, stagger: 0.12 },
                        1.9,
                    )
                    .fromTo(
                        find('[data-after]'),
                        { autoAlpha: 0, y: 24 },
                        { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.1 },
                        2.1,
                    );
            });

            return () => mm.revert();
        },
        { scope: section, dependencies: [brief] },
    );

    // The success check draws itself.
    useGSAP(
        () => {
            const check = section.current?.querySelectorAll('[data-sent-path]');

            if (!isSent || !check?.length) {
                return;
            }

            const mm = gsap.matchMedia();
            mm.add(MOTION_OK, () => {
                gsap.fromTo(
                    check,
                    { drawSVG: '0%' },
                    {
                        drawSVG: '100%',
                        duration: 0.7,
                        stagger: 0.25,
                        ease: 'power2.inOut',
                    },
                );
            });

            return () => mm.revert();
        },
        { scope: section, dependencies: [isSent] },
    );

    const submit = async (event: FormEvent) => {
        event.preventDefault();

        if (idea.trim().length < MIN_LENGTH) {
            setError(
                `Tell me a little more about your idea (at least ${MIN_LENGTH} characters).`,
            );

            return;
        }

        setStatus('loading');
        setError(null);

        try {
            const response = await fetch(BriefController.url(), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-XSRF-TOKEN': xsrfToken(),
                },
                body: JSON.stringify({ type, idea: idea.trim() }),
            });
            const data = await response.json().catch(() => ({}));

            if (response.ok) {
                setBrief(data as ProjectBrief);
                setIsSent(false);
                setStatus('done');

                return;
            }

            setStatus('error');
            setError(
                response.status === 429
                    ? "You've planned a few projects already. Try again in an hour, or just message me."
                    : response.status === 422
                      ? (data.errors?.idea?.[0] ??
                        data.errors?.type?.[0] ??
                        'Please check your idea.')
                      : (data.message ??
                        'The planner is unavailable right now. Message me instead.'),
            );
        } catch {
            setStatus('error');
            setError(
                'The planner is unavailable right now. Message me instead.',
            );
        }
    };

    const startOver = () => {
        setBrief(null);
        setStatus('idle');
        setIsSent(false);
        section.current?.scrollIntoView({ block: 'start' });
    };

    return (
        <section
            ref={section}
            id="planner"
            aria-labelledby="planner-heading"
            className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6 sm:py-28"
        >
            <div className="mx-auto max-w-2xl text-center">
                <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-brand/10 text-brand">
                    <Icon icon={faWandMagicSparkles} className="size-5" />
                </span>
                <SplitHeading
                    as="h2"
                    id="planner-heading"
                    className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl"
                >
                    Plan your project in 60 seconds
                </SplitHeading>
                <p className="mt-4 text-pretty text-muted-foreground sm:text-lg">
                    Describe your idea and AI drafts a first plan: the pages,
                    the phases and the questions I'd ask you. It's free, a
                    starting point for our chat, not a quote.
                </p>
            </div>

            <div className="relative mt-12 overflow-hidden rounded-3xl border bg-card p-5 shadow-2xl shadow-black/20 sm:p-8 lg:p-10">
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)] bg-[size:32px_32px] opacity-25"
                />

                {brief ? (
                    <div data-brief className="relative">
                        {/* Header */}
                        <div className="text-center md:text-left">
                            <p
                                data-brief-head
                                className="inline-flex items-center gap-2 rounded-full border border-tier-learning/30 bg-tier-learning/10 px-3 py-1 text-xs font-medium text-tier-learning"
                            >
                                Draft for discussion
                            </p>
                            <h3
                                data-brief-head
                                className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl"
                            >
                                {brief.title}
                            </h3>
                            <p
                                data-brief-head
                                className="mt-3 max-w-3xl text-pretty text-muted-foreground"
                            >
                                {brief.summary}
                            </p>
                        </div>

                        {/* Sitemap tree */}
                        <div className="mt-10">
                            <p
                                data-brief-head
                                className="text-center text-sm font-medium text-muted-foreground"
                            >
                                Sitemap
                            </p>
                            <div className="mt-4 flex flex-col items-center">
                                <span
                                    data-root
                                    className="rounded-2xl bg-primary px-5 py-2.5 text-center text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30"
                                >
                                    {brief.title}
                                </span>
                                <span
                                    aria-hidden
                                    data-stem
                                    className="h-6 w-px bg-brand/60"
                                />
                            </div>

                            <ul className="relative grid gap-x-4 gap-y-12 pl-6 sm:grid-cols-2 md:pt-6 md:pl-0 lg:grid-cols-4">
                                <li
                                    aria-hidden
                                    className="absolute top-0 bottom-6 left-0 w-px bg-brand/40 md:hidden"
                                />
                                {brief.sitemap.map((page) => (
                                    <li key={page.name} className="relative">
                                        {/* Connectors: a rail and stem on
                                            wide screens, a tick on phones. */}
                                        <span
                                            aria-hidden
                                            data-rail
                                            className="absolute -top-6 -right-2 -left-2 hidden h-px bg-brand/40 md:block"
                                        />
                                        <span
                                            aria-hidden
                                            data-stem
                                            className="absolute -top-6 left-1/2 hidden h-6 w-px bg-brand/40 md:block"
                                        />
                                        <span
                                            aria-hidden
                                            className="absolute top-5 -left-6 h-px w-6 bg-brand/40 md:hidden"
                                        />

                                        <div
                                            data-node
                                            className="rounded-2xl border bg-background/80 p-4 backdrop-blur-sm"
                                        >
                                            <p className="font-semibold tracking-tight">
                                                {page.name}
                                            </p>
                                            {page.children.length > 0 && (
                                                <ul className="mt-3 space-y-1.5 border-l border-brand/30 pl-3">
                                                    {page.children.map(
                                                        (child) => (
                                                            <li
                                                                key={child}
                                                                data-leaf
                                                                className="relative text-sm text-muted-foreground before:absolute before:top-1/2 before:-left-3 before:h-px before:w-2 before:bg-brand/30"
                                                            >
                                                                {child}
                                                            </li>
                                                        ),
                                                    )}
                                                </ul>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Phases */}
                        <div className="mt-14">
                            <p className="text-center text-sm font-medium text-muted-foreground md:text-left">
                                Phases
                            </p>
                            <ol className="mt-4 grid gap-4 md:grid-cols-3 md:gap-8">
                                {brief.phases.map((phase, index) => (
                                    <li
                                        key={phase.name}
                                        data-phase
                                        className="relative rounded-2xl border bg-background/60 p-5"
                                    >
                                        {index < brief.phases.length - 1 && (
                                            <span
                                                aria-hidden
                                                data-phase-arrow
                                                className="absolute top-1/2 -right-7 z-10 hidden size-6 -translate-y-1/2 place-items-center rounded-full bg-brand text-primary-foreground md:grid"
                                            >
                                                <Icon
                                                    icon={faArrowRight}
                                                    className="size-2.5"
                                                />
                                            </span>
                                        )}
                                        <p className="inline-flex rounded-full bg-brand/15 px-2.5 py-0.5 text-xs font-semibold text-brand">
                                            {phase.name}
                                        </p>
                                        <p className="mt-3 text-sm font-medium">
                                            {phase.goal}
                                        </p>
                                        <ul className="mt-3 space-y-2">
                                            {phase.features.map((feature) => (
                                                <li
                                                    key={feature}
                                                    className="flex gap-2 text-sm text-muted-foreground"
                                                >
                                                    <Icon
                                                        icon={faCheck}
                                                        className="mt-1 size-2.5 shrink-0 text-brand"
                                                    />
                                                    {feature}
                                                </li>
                                            ))}
                                        </ul>
                                    </li>
                                ))}
                            </ol>
                        </div>

                        <div className="mt-12 grid gap-6 lg:grid-cols-2">
                            {/* Questions */}
                            <div
                                data-after
                                className="rounded-2xl border bg-background/60 p-5 sm:p-6"
                            >
                                <p className="font-semibold tracking-tight">
                                    Questions I'd ask you
                                </p>
                                <ol className="mt-4 space-y-3">
                                    {brief.questions.map((question, index) => (
                                        <li
                                            key={question}
                                            className="flex gap-3 text-sm"
                                        >
                                            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand/15 text-xs font-semibold text-brand tabular-nums">
                                                {index + 1}
                                            </span>
                                            <span className="text-muted-foreground">
                                                {question}
                                            </span>
                                        </li>
                                    ))}
                                </ol>
                            </div>

                            <div className="flex flex-col gap-6">
                                {brief.stack.length > 0 && (
                                    <div
                                        data-after
                                        className="rounded-2xl border bg-background/60 p-5 sm:p-6"
                                    >
                                        <p className="font-semibold tracking-tight">
                                            Suggested stack
                                        </p>
                                        <StackList
                                            stack={brief.stack}
                                            icons={icons}
                                            className="mt-4 gap-1.5"
                                        />
                                    </div>
                                )}

                                {brief.closest && (
                                    <Link
                                        data-after
                                        href={WorkController.show.url(
                                            brief.closest.slug,
                                        )}
                                        prefetch
                                        className="group flex items-center gap-4 rounded-2xl border bg-background/60 p-3 transition-colors hover:border-brand/50"
                                    >
                                        <span className="w-28 shrink-0 overflow-hidden rounded-xl border sm:w-36">
                                            <Screenshot
                                                project={brief.closest}
                                                sizes="144px"
                                                className="aspect-[1400/846] w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                                            />
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block text-xs text-muted-foreground">
                                                Closest thing I've built
                                            </span>
                                            <span className="block font-semibold tracking-tight group-hover:text-brand">
                                                {brief.closest.title}
                                            </span>
                                            <span className="mt-0.5 block text-xs text-brand">
                                                {brief.closest.category}
                                            </span>
                                        </span>
                                        <Icon
                                            icon={faArrowRight}
                                            className="mr-2 size-3 shrink-0 transition-transform group-hover:translate-x-1"
                                        />
                                    </Link>
                                )}
                            </div>
                        </div>

                        {/* Send it */}
                        <div
                            data-after
                            className="mt-10 rounded-2xl border border-brand/40 bg-brand/5 p-5 sm:p-8"
                        >
                            {isSent ? (
                                <div className="flex flex-col items-center py-4 text-center">
                                    <svg
                                        aria-hidden
                                        viewBox="0 0 64 64"
                                        fill="none"
                                        className="size-14 text-brand"
                                    >
                                        <circle
                                            data-sent-path
                                            cx="32"
                                            cy="32"
                                            r="29"
                                            stroke="currentColor"
                                            strokeWidth="3"
                                        />
                                        <path
                                            data-sent-path
                                            d="M20 33 L28.5 41.5 L45 24"
                                            stroke="currentColor"
                                            strokeWidth="3.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                    <p className="mt-4 text-xl font-semibold tracking-tight">
                                        Brief sent
                                    </p>
                                    <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                                        I'll read it and reply within 24 hours.
                                        A copy is on its way to your inbox.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div className="text-center md:text-left">
                                        <p className="text-lg font-semibold tracking-tight">
                                            Happy with this? Send it to me.
                                        </p>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            I'll reply within 24 hours to talk
                                            it through, no obligation.
                                        </p>
                                    </div>
                                    <Form
                                        {...ContactController.store.form()}
                                        options={{ preserveScroll: true }}
                                        onSuccess={() => setIsSent(true)}
                                        className="relative mt-5 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-start"
                                    >
                                        {({ errors, processing }) => (
                                            <>
                                                <input
                                                    type="hidden"
                                                    name="reason"
                                                    value="project"
                                                />
                                                <input
                                                    type="hidden"
                                                    name="message"
                                                    value={text.slice(0, 2000)}
                                                />
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
                                                <div>
                                                    <label
                                                        htmlFor="brief-name"
                                                        className="sr-only"
                                                    >
                                                        Your name
                                                    </label>
                                                    <input
                                                        id="brief-name"
                                                        name="name"
                                                        required
                                                        maxLength={100}
                                                        autoComplete="name"
                                                        placeholder="Your name"
                                                        className="block h-12 w-full rounded-full border bg-background px-4 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                                                    />
                                                    {errors.name && (
                                                        <p className="mt-1 px-2 text-xs text-destructive">
                                                            {errors.name}
                                                        </p>
                                                    )}
                                                </div>
                                                <div>
                                                    <label
                                                        htmlFor="brief-email"
                                                        className="sr-only"
                                                    >
                                                        Your email
                                                    </label>
                                                    <input
                                                        id="brief-email"
                                                        name="email"
                                                        type="email"
                                                        required
                                                        maxLength={150}
                                                        autoComplete="email"
                                                        placeholder="Your email"
                                                        className="block h-12 w-full rounded-full border bg-background px-4 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                                                    />
                                                    {errors.email && (
                                                        <p className="mt-1 px-2 text-xs text-destructive">
                                                            {errors.email}
                                                        </p>
                                                    )}
                                                </div>
                                                <button
                                                    type="submit"
                                                    disabled={processing}
                                                    className="inline-flex h-12 items-center justify-center gap-2.5 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-colors hover:bg-primary/85 active:scale-[0.98] disabled:opacity-60"
                                                >
                                                    <Icon
                                                        icon={faPaperPlane}
                                                        className="size-4"
                                                    />
                                                    {processing
                                                        ? 'Sending…'
                                                        : 'Send this brief to Labib'}
                                                </button>
                                                {errors.message && (
                                                    <p className="text-xs text-destructive sm:col-span-3">
                                                        {errors.message}
                                                    </p>
                                                )}
                                            </>
                                        )}
                                    </Form>
                                </>
                            )}

                            <div className="mt-5 flex flex-wrap justify-center gap-2 border-t border-brand/20 pt-5 md:justify-start">
                                {site.links.whatsapp && (
                                    <a
                                        href={`https://wa.me/${site.links.whatsapp}?text=${encodeURIComponent(text.slice(0, 1500))}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors hover:border-[#25D366] hover:text-[#1f9d55]"
                                    >
                                        <Icon
                                            icon={faWhatsapp}
                                            className="size-4 text-[#25D366]"
                                        />
                                        Send on WhatsApp
                                    </a>
                                )}
                                <button
                                    type="button"
                                    onClick={() => void copy(text)}
                                    className="inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors hover:border-brand hover:text-brand"
                                >
                                    <Icon
                                        icon={
                                            copiedText === text
                                                ? faCheck
                                                : faCopy
                                        }
                                        className="size-3.5"
                                    />
                                    {copiedText === text
                                        ? 'Copied'
                                        : 'Copy brief'}
                                </button>
                                <button
                                    type="button"
                                    onClick={startOver}
                                    className="inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium text-muted-foreground transition-colors hover:text-brand"
                                >
                                    <Icon
                                        icon={faRotateLeft}
                                        className="size-3.5"
                                    />
                                    Plan another idea
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={submit} className="relative">
                        <fieldset>
                            <legend className="text-sm font-medium">
                                What are you building?
                            </legend>
                            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                                {Object.entries(types).map(([value, label]) => {
                                    const isActive = value === type;

                                    return (
                                        <label
                                            key={value}
                                            className={cn(
                                                'flex cursor-pointer flex-col items-center gap-2 rounded-2xl border px-3 py-4 text-center text-sm font-medium transition-all has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand',
                                                isActive
                                                    ? 'border-brand bg-brand/10 text-foreground shadow-lg shadow-brand/10'
                                                    : 'text-muted-foreground hover:border-brand/40 hover:text-foreground',
                                            )}
                                        >
                                            <input
                                                type="radio"
                                                name="type"
                                                value={value}
                                                checked={isActive}
                                                onChange={() => setType(value)}
                                                disabled={isLoading}
                                                className="sr-only"
                                            />
                                            <Icon
                                                icon={
                                                    TYPE_ICONS[value] ??
                                                    faLightbulb
                                                }
                                                className={cn(
                                                    'size-5 transition-transform',
                                                    isActive
                                                        ? 'scale-110 text-brand'
                                                        : '',
                                                )}
                                            />
                                            {label}
                                        </label>
                                    );
                                })}
                            </div>
                        </fieldset>

                        <div className="mt-6 flex items-baseline justify-between gap-3">
                            <label
                                htmlFor="brief-idea"
                                className="text-sm font-medium"
                            >
                                Describe your idea
                            </label>
                            <span className="text-xs text-muted-foreground tabular-nums">
                                {idea.length}/{MAX_LENGTH}
                            </span>
                        </div>
                        <div className="relative mt-2">
                            <textarea
                                id="brief-idea"
                                value={idea}
                                onChange={(event) => {
                                    setIdea(event.target.value);
                                    setError(null);
                                }}
                                disabled={isLoading}
                                maxLength={MAX_LENGTH}
                                rows={5}
                                placeholder="What should it do, who is it for, and what matters most to you?"
                                aria-invalid={Boolean(error) || undefined}
                                aria-describedby="brief-help"
                                className="block min-h-36 w-full resize-y rounded-2xl border bg-background/80 px-4 py-3.5 text-sm leading-relaxed outline-none placeholder:text-muted-foreground/70 focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:opacity-60"
                            />

                            {isLoading && (
                                <div
                                    data-blueprint
                                    aria-hidden
                                    className="absolute inset-0 grid place-items-center rounded-2xl bg-card/85 backdrop-blur-sm"
                                >
                                    <svg
                                        viewBox="0 0 240 110"
                                        fill="none"
                                        className="w-56 text-brand"
                                    >
                                        <path
                                            data-bp-line
                                            d="M120 18 V44 M40 44 H200 M40 44 V70 M120 44 V70 M200 44 V70"
                                            stroke="currentColor"
                                            strokeWidth="1.5"
                                            strokeDasharray="4 4"
                                        />
                                        <path
                                            data-bp-line
                                            d="M40 80 V96 M120 80 V96 M200 80 V96"
                                            stroke="currentColor"
                                            strokeWidth="1.5"
                                        />
                                        {[
                                            [120, 14],
                                            [40, 74],
                                            [120, 74],
                                            [200, 74],
                                            [40, 100],
                                            [120, 100],
                                            [200, 100],
                                        ].map(([cx, cy]) => (
                                            <circle
                                                key={`${cx}-${cy}`}
                                                data-bp-node
                                                cx={cx}
                                                cy={cy}
                                                r={cy < 20 ? 8 : 6}
                                                fill="currentColor"
                                                fillOpacity={0.25}
                                                stroke="currentColor"
                                                strokeWidth="1.5"
                                            />
                                        ))}
                                    </svg>
                                </div>
                            )}
                        </div>

                        <div
                            id="brief-help"
                            className="mt-3 flex flex-wrap items-center gap-2 text-xs"
                        >
                            {error ? (
                                <p role="alert" className="text-destructive">
                                    {error}
                                </p>
                            ) : (
                                <>
                                    <span className="text-muted-foreground">
                                        Try an example:
                                    </span>
                                    {EXAMPLES.map((example) => (
                                        <button
                                            key={example.label}
                                            type="button"
                                            disabled={isLoading}
                                            onClick={() => {
                                                setType(example.type);
                                                setIdea(example.idea);
                                            }}
                                            className="rounded-full border bg-background/60 px-3 py-1 font-medium transition-colors hover:border-brand hover:text-brand disabled:opacity-50"
                                        >
                                            {example.label}
                                        </button>
                                    ))}
                                </>
                            )}
                        </div>

                        <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
                            <p
                                aria-live="polite"
                                className="order-2 text-sm text-muted-foreground sm:order-1"
                            >
                                {isLoading
                                    ? LOADING_STEPS[step]
                                    : 'No prices or deadlines here. We agree those together.'}
                            </p>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="order-1 inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-full bg-primary px-7 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-colors hover:bg-primary/85 active:scale-[0.98] disabled:opacity-70 sm:order-2 sm:w-auto"
                            >
                                <Icon
                                    icon={faWandMagicSparkles}
                                    className={cn(
                                        'size-4',
                                        isLoading && 'animate-pulse',
                                    )}
                                />
                                {isLoading ? 'Planning…' : 'Plan my project'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </section>
    );
}
