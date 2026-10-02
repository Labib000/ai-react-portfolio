import { faGithub } from '@fortawesome/free-brands-svg-icons/faGithub';
import { faLinkedinIn } from '@fortawesome/free-brands-svg-icons/faLinkedinIn';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons/faArrowRight';
import { faCheck } from '@fortawesome/free-solid-svg-icons/faCheck';
import { faDownload } from '@fortawesome/free-solid-svg-icons/faDownload';
import { faEnvelope } from '@fortawesome/free-solid-svg-icons/faEnvelope';
import { faGlobe } from '@fortawesome/free-solid-svg-icons/faGlobe';
import { faLink } from '@fortawesome/free-solid-svg-icons/faLink';
import { faLocationDot } from '@fortawesome/free-solid-svg-icons/faLocationDot';
import { faMagnifyingGlassChart } from '@fortawesome/free-solid-svg-icons/faMagnifyingGlassChart';
import { faPhone } from '@fortawesome/free-solid-svg-icons/faPhone';
import { faPrint } from '@fortawesome/free-solid-svg-icons/faPrint';
import { Link, usePage } from '@inertiajs/react';
import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import ContactController from '@/actions/App/Http/Controllers/ContactController';
import WorkController from '@/actions/App/Http/Controllers/WorkController';
import { Magnetic } from '@/components/motion/magnetic';
import { SplitHeading } from '@/components/motion/split-heading';
import { JobMatcher } from '@/components/resume/job-matcher';
import { SeoHead } from '@/components/site/seo-head';
import type { PageMeta } from '@/types/content';
import { Icon } from '@/components/ui/icon';
import type { FontAwesomeIconData } from '@/components/ui/icon';
import { StackList, toolIconMap } from '@/components/work/project-media';
import { useClipboard } from '@/hooks/use-clipboard';
import { cn } from '@/lib/utils';
import { gsap, MOTION_OK, useGSAP } from '@/lib/gsap';
import type {
    Experience,
    Profile,
    ProjectSummary,
    SkillGroup,
    ToolRow,
} from '@/types/content';

type ResumeProps = {
    meta: PageMeta;
    profile: Profile;
    experienceDuration: string;
    experience: Experience[];
    projects: ProjectSummary[];
    skillGroups: SkillGroup[];
    toolRows: ToolRow[];
    resumePdf: string | null;
};

function formatImpact(value: number, suffix: string): string {
    return `${value.toLocaleString('en-US')}${suffix}`;
}

/** "https://www.linkedin.com/in/x/" → "linkedin.com/in/x", for print. */
function shortUrl(url: string): string {
    return url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
}

function graduationYear(date: string): string {
    return date.slice(0, 4);
}

export default function Resume({
    meta,
    profile,
    experienceDuration,
    experience,
    projects,
    skillGroups,
    toolRows,
    resumePdf,
}: ResumeProps) {
    const { site } = usePage().props;
    const root = useRef<HTMLDivElement>(null);
    const icons = toolIconMap(toolRows);
    const [copiedText, copy] = useClipboard();
    const [isCopied, setIsCopied] = useState(false);
    const { email, phone, linkedin, github } = profile.links;
    const pageUrl = `${site.url}/resume`;
    const siteDomain = site.url.replace(/^https?:\/\//, '');

    const copyLink = async () => {
        if (await copy(pageUrl)) {
            setIsCopied(true);
            window.setTimeout(() => setIsCopied(false), 2000);
        }
    };

    useGSAP(
        () => {
            const scope = root.current;

            if (!scope) {
                return;
            }

            const mm = gsap.matchMedia();

            mm.add(MOTION_OK, () => {
                const findAll = (selector: string) =>
                    gsap.utils.toArray<HTMLElement>(selector, scope);

                // Hero, then the sheet slides up and settles flat.
                const intro = gsap.timeline({
                    defaults: { ease: 'power3.out' },
                    delay: 0.15,
                });
                intro
                    .fromTo(
                        findAll('[data-hero-item]'),
                        { autoAlpha: 0, y: 20 },
                        { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.08 },
                    )
                    .fromTo(
                        scope.querySelector('[data-sheet]'),
                        {
                            autoAlpha: 0,
                            y: 90,
                            rotationX: 8,
                            transformPerspective: 1400,
                            transformOrigin: '50% 0%',
                        },
                        {
                            autoAlpha: 1,
                            y: 0,
                            rotationX: 0,
                            duration: 1,
                            ease: 'expo.out',
                        },
                        0.3,
                    )
                    .fromTo(
                        findAll('[data-sheet-head]'),
                        { autoAlpha: 0, y: 14 },
                        { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.06 },
                        0.7,
                    );

                // Impact numbers count up.
                findAll('[data-impact]').forEach((element) => {
                    const target = Number(element.dataset.impact);
                    const suffix = element.dataset.suffix ?? '';
                    const count = { value: 0 };

                    intro.to(
                        count,
                        {
                            value: target,
                            duration: 1.3,
                            ease: 'power2.out',
                            onUpdate: () => {
                                element.textContent = formatImpact(
                                    Math.round(count.value),
                                    suffix,
                                );
                            },
                        },
                        0.9,
                    );
                });

                // Each section appears as one unit when it comes into view:
                // heading and blocks together, skill pills in one quick sweep.
                findAll('[data-sheet-section]').forEach((section) => {
                    const blocks = section.querySelectorAll('[data-reveal]');
                    const pills = section.querySelectorAll('[data-pill]');

                    gsap.timeline({
                        defaults: { ease: 'power3.out' },
                        scrollTrigger: {
                            trigger: section,
                            start: 'top 88%',
                            once: true,
                        },
                    })
                        .fromTo(
                            blocks,
                            { autoAlpha: 0, y: 16 },
                            {
                                autoAlpha: 1,
                                y: 0,
                                duration: 0.5,
                                stagger: 0.04,
                            },
                        )
                        .fromTo(
                            pills,
                            { autoAlpha: 0, scale: 0.85 },
                            {
                                autoAlpha: 1,
                                scale: 1,
                                duration: 0.3,
                                stagger: 0.015,
                                ease: 'back.out(2)',
                            },
                            0.1,
                        );
                });

                // The experience line draws with the scroll; dots pop as
                // each role comes in.
                const timelineList = scope.querySelector('[data-timeline]');

                gsap.fromTo(
                    scope.querySelector('[data-timeline-line]'),
                    { scaleY: 0 },
                    {
                        scaleY: 1,
                        ease: 'none',
                        scrollTrigger: {
                            trigger: timelineList,
                            start: 'top 75%',
                            end: 'bottom 60%',
                            scrub: 0.4,
                        },
                    },
                );
                findAll('[data-timeline-dot]').forEach((dot) =>
                    gsap.fromTo(
                        dot,
                        { scale: 0 },
                        {
                            scale: 1,
                            duration: 0.5,
                            ease: 'back.out(3)',
                            scrollTrigger: {
                                trigger: dot,
                                start: 'top 75%',
                                once: true,
                            },
                        },
                    ),
                );
            });

            return () => mm.revert();
        },
        { scope: root },
    );

    return (
        <div ref={root}>
            <SeoHead
                meta={meta}
                schema={{
                    '@context': 'https://schema.org',
                    '@type': 'ProfilePage',
                    url: pageUrl,
                    mainEntity: {
                        '@type': 'Person',
                        name: profile.name,
                        alternateName: profile.fullName,
                        jobTitle: profile.role,
                        worksFor: experience[0]
                            ? {
                                  '@type': 'Organization',
                                  name: experience[0].company,
                              }
                            : undefined,
                        alumniOf: profile.education.map((item) => ({
                            '@type': 'EducationalOrganization',
                            name: item.institution,
                        })),
                        knowsAbout: skillGroups.flatMap((group) => group.items),
                        email: email ? `mailto:${email}` : undefined,
                        sameAs: [linkedin, github].filter(Boolean),
                    },
                }}
            />

            {/* Hero */}
            <section
                aria-labelledby="resume-heading"
                className="mx-auto max-w-4xl px-4 pt-12 text-center sm:px-6 sm:pt-20 md:text-left print:hidden"
            >
                <SplitHeading
                    as="h1"
                    id="resume-heading"
                    className="text-[clamp(2.5rem,5vw+1rem,4.5rem)] leading-[1.05] font-semibold tracking-tight"
                >
                    {`${profile.name}'s resume`}
                </SplitHeading>
                <p
                    data-hero-item
                    className="mx-auto mt-5 max-w-2xl text-lg text-pretty text-muted-foreground md:mx-0"
                >
                    I've spent {experienceDuration} building Laravel, React and
                    MERN apps and Gen AI features. Hiring? Check your job
                    description against my experience below.
                </p>

                <div
                    data-hero-item
                    className="mt-8 flex flex-wrap justify-center gap-3 md:justify-start"
                >
                    <Magnetic>
                        {resumePdf ? (
                            <a
                                href={resumePdf}
                                download
                                className="inline-flex h-12 items-center gap-2.5 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-colors hover:bg-primary/85 active:scale-[0.98]"
                            >
                                <Icon icon={faDownload} className="size-4" />
                                Download PDF
                            </a>
                        ) : (
                            <button
                                type="button"
                                onClick={() => window.print()}
                                className="inline-flex h-12 items-center gap-2.5 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-colors hover:bg-primary/85 active:scale-[0.98]"
                            >
                                <Icon icon={faPrint} className="size-4" />
                                Print or save as PDF
                            </button>
                        )}
                    </Magnetic>
                    <Magnetic>
                        <a
                            href="#matcher"
                            className="inline-flex h-12 items-center gap-2.5 rounded-full border px-6 text-sm font-medium transition-colors hover:border-brand hover:text-brand active:scale-[0.98]"
                        >
                            <Icon
                                icon={faMagnifyingGlassChart}
                                className="size-4 text-brand"
                            />
                            Check fit for your role
                        </a>
                    </Magnetic>
                    <button
                        type="button"
                        onClick={copyLink}
                        aria-label={
                            isCopied && copiedText === pageUrl
                                ? 'Link copied'
                                : 'Copy the link to this resume'
                        }
                        className="inline-flex h-12 items-center gap-2.5 rounded-full border px-6 text-sm font-medium transition-colors hover:border-brand hover:text-brand active:scale-[0.98]"
                    >
                        <Icon
                            icon={isCopied ? faCheck : faLink}
                            className="size-3.5"
                        />
                        {isCopied ? 'Copied' : 'Copy link'}
                    </button>
                </div>
            </section>

            {/* The resume itself */}
            <div className="mx-auto max-w-4xl px-4 pt-12 sm:px-6 sm:pt-16 print:max-w-none print:p-0">
                <article
                    data-sheet
                    aria-label={`Resume of ${profile.name}`}
                    className="resume-sheet relative overflow-hidden rounded-[2rem] border bg-card p-6 shadow-2xl shadow-black/25 sm:p-10 lg:p-14 print:overflow-visible"
                >
                    <span
                        aria-hidden
                        className="pointer-events-none absolute -top-32 -right-32 size-80 rounded-full bg-brand/10 blur-3xl print:hidden"
                    />

                    {/* Header */}
                    <header className="relative grid gap-6 border-b pb-8 text-center md:grid-cols-[1fr_auto] md:items-start md:gap-10 md:text-left print:grid-cols-1 print:gap-2 print:pb-4 print:text-left">
                        <div>
                            <p
                                data-sheet-head
                                className="text-3xl font-semibold tracking-tight sm:text-4xl print:text-[22pt]"
                            >
                                {profile.name}
                            </p>
                            <p
                                data-sheet-head
                                className="mt-1.5 text-lg font-medium text-brand print:mt-0.5 print:text-[12pt]"
                            >
                                {profile.role}
                            </p>
                            <p
                                data-sheet-head
                                className="mt-4 inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-medium text-brand print:hidden"
                            >
                                <span className="relative flex size-1.5">
                                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand opacity-60 motion-reduce:hidden" />
                                    <span className="relative inline-flex size-1.5 rounded-full bg-brand" />
                                </span>
                                Open to freelance projects and full time roles
                            </p>
                        </div>

                        <ul
                            data-sheet-head
                            aria-label="Contact details"
                            className="flex flex-col items-center gap-2 text-sm text-muted-foreground md:items-end print:flex-row print:flex-wrap print:items-start print:gap-x-5 print:gap-y-1"
                        >
                            {email && (
                                <ContactItem icon={faEnvelope}>
                                    <a
                                        href={`mailto:${email}`}
                                        className="break-all hover:text-brand"
                                    >
                                        {email}
                                    </a>
                                </ContactItem>
                            )}
                            {phone && (
                                <ContactItem icon={faPhone}>
                                    <a
                                        href={`tel:${phone.replace(/[^+\d]/g, '')}`}
                                        className="whitespace-nowrap hover:text-brand"
                                    >
                                        {phone}
                                    </a>
                                </ContactItem>
                            )}
                            <ContactItem icon={faLocationDot}>
                                {profile.location}
                            </ContactItem>
                            <ContactItem icon={faGlobe}>
                                <a href={site.url} className="hover:text-brand">
                                    {siteDomain}
                                </a>
                            </ContactItem>
                            {linkedin && (
                                <ContactItem icon={faLinkedinIn}>
                                    <a
                                        href={linkedin}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="hover:text-brand"
                                    >
                                        <span className="print:hidden">
                                            LinkedIn
                                        </span>
                                        <span className="hidden print:inline">
                                            {shortUrl(linkedin)}
                                        </span>
                                    </a>
                                </ContactItem>
                            )}
                            {github && (
                                <ContactItem icon={faGithub}>
                                    <a
                                        href={github}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="hover:text-brand"
                                    >
                                        <span className="print:hidden">
                                            GitHub
                                        </span>
                                        <span className="hidden print:inline">
                                            {shortUrl(github)}
                                        </span>
                                    </a>
                                </ContactItem>
                            )}
                        </ul>
                    </header>

                    {/* Summary */}
                    <SheetSection id="summary" title="Summary">
                        <p data-reveal className="text-pretty">
                            {profile.bio}
                        </p>
                        {profile.impact.length > 0 && (
                            <ul
                                data-reveal
                                className="mt-6 grid gap-3 sm:grid-cols-3 print:hidden"
                            >
                                {profile.impact.map((item) => (
                                    <li
                                        key={item.label}
                                        className="rounded-2xl border bg-background/40 p-4"
                                    >
                                        <p
                                            data-impact={item.value}
                                            data-suffix={item.suffix}
                                            className="text-shine text-2xl font-semibold tracking-tight tabular-nums"
                                        >
                                            {formatImpact(
                                                item.value,
                                                item.suffix,
                                            )}
                                        </p>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {item.label}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        )}
                        {profile.impact.length > 0 && (
                            <p className="mt-2 hidden font-medium print:block">
                                {profile.impact
                                    .map(
                                        (item) =>
                                            `${formatImpact(item.value, item.suffix)} ${item.label}`,
                                    )
                                    .join(', ')}
                            </p>
                        )}
                    </SheetSection>

                    {/* Experience */}
                    <SheetSection id="experience" title="Experience">
                        <ol data-timeline className="relative">
                            <span
                                aria-hidden
                                className="absolute top-2 bottom-2 left-[5px] w-px bg-border print:hidden"
                            >
                                <span
                                    data-timeline-line
                                    className="absolute inset-0 origin-top bg-brand"
                                />
                            </span>
                            {experience.map((role) => (
                                <li
                                    key={role.title + role.period}
                                    className="resume-block relative pb-10 pl-8 last:pb-0 print:pb-4 print:pl-0"
                                >
                                    <span
                                        aria-hidden
                                        data-timeline-dot
                                        className="absolute top-1.5 left-0 size-[11px] rounded-full border-2 border-brand bg-card print:hidden"
                                    />
                                    <div data-reveal>
                                        <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                                            <h3 className="text-lg font-semibold tracking-tight print:text-[11pt]">
                                                {role.title}
                                            </h3>
                                            <p className="shrink-0 text-sm text-muted-foreground tabular-nums">
                                                {role.period}
                                            </p>
                                        </div>
                                        <p className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                                            <span className="font-medium text-brand">
                                                {role.company}
                                            </span>
                                            <span className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground print:border-0 print:p-0">
                                                {role.type === 'internship'
                                                    ? 'Internship'
                                                    : 'Full time'}
                                            </span>
                                        </p>
                                        <ul className="mt-3 flex flex-col gap-2 print:mt-1.5 print:gap-0.5">
                                            {role.highlights.map(
                                                (highlight) => (
                                                    <li
                                                        key={highlight}
                                                        className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground"
                                                    >
                                                        <span
                                                            aria-hidden
                                                            className="mt-2 size-1 shrink-0 rounded-full bg-brand"
                                                        />
                                                        {highlight}
                                                    </li>
                                                ),
                                            )}
                                        </ul>
                                        {role.tools.length > 0 && (
                                            <p className="mt-3 text-xs text-muted-foreground">
                                                <span className="font-medium text-foreground">
                                                    Tools:
                                                </span>{' '}
                                                {role.tools.join(', ')}
                                            </p>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ol>
                    </SheetSection>

                    {/* Projects */}
                    <SheetSection id="projects" title="Selected projects">
                        <p className="mb-2 hidden text-muted-foreground print:block">
                            Case studies: {siteDomain}/work
                        </p>
                        <ul className="grid gap-3 sm:grid-cols-2 print:grid-cols-2 print:gap-x-6 print:gap-y-2">
                            {projects.map((project) => (
                                <li
                                    key={project.slug}
                                    data-reveal
                                    className="resume-block group relative flex flex-col rounded-2xl border bg-background/40 p-4 transition-colors hover:border-brand/50 print:border-0 print:bg-transparent print:p-0"
                                >
                                    <h3 className="font-semibold tracking-tight">
                                        <Link
                                            href={WorkController.show.url(
                                                project.slug,
                                            )}
                                            prefetch
                                            className="group-hover:text-brand after:absolute after:inset-0"
                                        >
                                            {project.title}
                                        </Link>
                                    </h3>
                                    <p className="mt-0.5 text-xs text-brand">
                                        {project.category}, {project.year}
                                    </p>
                                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground print:mt-0.5">
                                        {project.summary}
                                    </p>
                                    <span
                                        aria-hidden
                                        className="mt-3 inline-flex items-center gap-1.5 self-end text-xs font-medium text-brand print:hidden"
                                    >
                                        Case study
                                        <Icon
                                            icon={faArrowRight}
                                            className="size-2.5 transition-transform group-hover:translate-x-0.5"
                                        />
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </SheetSection>

                    {/* Skills */}
                    <SheetSection id="skills" title="Skills">
                        <dl className="flex flex-col gap-4 print:gap-1">
                            {skillGroups.map((group) => (
                                <div
                                    key={group.key}
                                    data-skill-row
                                    className="resume-block grid gap-2 sm:grid-cols-[10rem_1fr] sm:gap-4 print:grid-cols-[9rem_1fr] print:gap-2"
                                >
                                    <dt className="pt-1 text-sm font-medium print:pt-0">
                                        {group.label}
                                    </dt>
                                    <dd>
                                        <StackList
                                            stack={group.items}
                                            icons={icons}
                                            className="gap-1.5 print:hidden"
                                        />
                                        <p className="hidden print:block">
                                            {group.items.join(', ')}
                                        </p>
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </SheetSection>

                    {/* Education and courses */}
                    <div className="grid gap-x-10 md:grid-cols-2">
                        <SheetSection
                            id="education"
                            title="Education"
                            className="max-md:border-b"
                        >
                            {profile.education.map((item) => (
                                <div
                                    key={item.degree}
                                    data-reveal
                                    className="resume-block"
                                >
                                    <h3 className="font-semibold tracking-tight">
                                        {item.degree}
                                    </h3>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {item.institution}
                                    </p>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Graduated{' '}
                                        {graduationYear(item.graduated)}
                                        {item.grade && (
                                            <>
                                                ,{' '}
                                                <span className="font-medium text-foreground">
                                                    {item.grade}
                                                </span>
                                            </>
                                        )}
                                    </p>
                                </div>
                            ))}
                        </SheetSection>

                        <SheetSection id="courses" title="Courses" className="">
                            <ul className="flex flex-col gap-4">
                                {profile.courses.map((course) => (
                                    <li
                                        key={course.title}
                                        data-reveal
                                        className="resume-block"
                                    >
                                        <p className="font-medium">
                                            {course.title}
                                        </p>
                                        <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                                            {course.provider}
                                            <span
                                                className={
                                                    course.status === 'ongoing'
                                                        ? 'rounded-full bg-tier-learning/15 px-2 py-0.5 text-xs text-tier-learning'
                                                        : 'rounded-full bg-tier-production/15 px-2 py-0.5 text-xs text-tier-production'
                                                }
                                            >
                                                {course.status === 'ongoing'
                                                    ? 'Ongoing'
                                                    : 'Completed'}
                                            </span>
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        </SheetSection>
                    </div>
                </article>
            </div>

            <JobMatcher />

            {/* Closing CTA */}
            <section
                aria-labelledby="resume-cta-heading"
                className="mx-auto max-w-4xl px-4 pt-24 pb-28 sm:px-6 print:hidden"
            >
                <div className="relative overflow-hidden rounded-3xl border bg-card p-8 text-center sm:p-12 md:text-left">
                    <div
                        aria-hidden
                        className="pointer-events-none absolute -bottom-24 -left-24 size-72 rounded-full bg-brand/15 blur-3xl"
                    />
                    <h2
                        id="resume-cta-heading"
                        className="relative text-2xl font-semibold tracking-tight text-balance sm:text-3xl"
                    >
                        Hiring? Let's talk.
                    </h2>
                    <p className="relative mx-auto mt-3 max-w-xl text-pretty text-muted-foreground md:mx-0">
                        I reply to every message within 24 hours.
                    </p>
                    <div className="relative mt-8 flex flex-wrap justify-center gap-3 md:justify-start">
                        {email && (
                            <Magnetic>
                                <a
                                    href={`mailto:${email}?subject=${encodeURIComponent('Role for Labib Alam')}`}
                                    className="inline-flex h-12 items-center gap-2.5 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-colors hover:bg-primary/85 active:scale-[0.98]"
                                >
                                    <Icon
                                        icon={faEnvelope}
                                        className="size-4"
                                    />
                                    Email me
                                </a>
                            </Magnetic>
                        )}
                        <Magnetic>
                            <a
                                href={ContactController.show.url({
                                    query: { reason: 'hiring' },
                                })}
                                className="inline-flex h-12 items-center gap-2.5 rounded-full border px-6 text-sm font-medium transition-colors hover:border-brand hover:text-brand active:scale-[0.98]"
                            >
                                Contact form
                                <Icon icon={faArrowRight} className="size-3" />
                            </a>
                        </Magnetic>
                    </div>
                </div>
            </section>
        </div>
    );
}

function SheetSection({
    id,
    title,
    className = 'border-b last:border-b-0',
    children,
}: {
    id: string;
    title: string;
    className?: string;
    children: ReactNode;
}) {
    return (
        <section
            data-sheet-section
            aria-labelledby={`resume-${id}`}
            className={cn('relative py-8 sm:py-10 print:py-3', className)}
        >
            <h2
                id={`resume-${id}`}
                data-reveal
                className="mb-5 flex items-center gap-3 text-lg font-semibold tracking-tight print:mb-2 print:text-[12pt]"
            >
                <span aria-hidden className="h-4 w-1 rounded-full bg-brand" />
                {title}
            </h2>
            {children}
        </section>
    );
}

function ContactItem({
    icon,
    children,
}: {
    icon: FontAwesomeIconData;
    children: ReactNode;
}) {
    return (
        <li className="inline-flex max-w-full min-w-0 items-center gap-2.5 md:flex-row-reverse print:flex-row print:gap-1.5">
            <Icon icon={icon} className="size-3.5 shrink-0 text-brand" />
            <span className="min-w-0">{children}</span>
        </li>
    );
}
