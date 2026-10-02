/**
 * Mirrors the toArray() output of the DTOs in app/Content/Data.
 * Keep the two in sync when a field is added or renamed.
 */

export type Audience = 'default' | 'recruiter' | 'client';

export type Impact = {
    value: number;
    suffix: string;
    label: string;
    detail: string | null;
    tags?: string[];
};

export type Profile = {
    name: string;
    fullName: string;
    role: string;
    location: string;
    bio: string;
    intro: string;
    headlines: Record<Audience, string>;
    impact: Impact[];
    /** whatsapp is digits only (country code + number) and is never shown as text. */
    links: Partial<
        Record<'email' | 'phone' | 'whatsapp' | 'github' | 'linkedin', string>
    >;
    education: {
        degree: string;
        institution: string;
        graduated: string;
        grade: string | null;
    }[];
    courses: {
        title: string;
        provider: string;
        status: 'ongoing' | 'completed';
    }[];
};

export type Experience = {
    company: string;
    title: string;
    type: 'full-time' | 'internship';
    period: string;
    isCurrent: boolean;
    tools: string[];
    highlights: string[];
    metric: { value: string; label: string } | null;
};

export type ProjectSummary = {
    slug: string;
    title: string;
    summary: string;
    type: 'client' | 'saas' | 'personal';
    year: number;
    stack: string[];
    /** Base path; the files are `${cover}-800.webp` and `${cover}-1400.webp`. */
    cover: string | null;
    featured: boolean;
    company: string | null;
    category: string;
    role: string;
    highlights: string[];
    metric: { value: string; label: string } | null;
    links: { live?: string; admin?: string; repo?: string };
};

/** A case study: the summary plus its rendered body. */
export type ProjectDetail = ProjectSummary & {
    sections: { id: string; title: string }[];
    bodyHtml: string;
};

export type FaqItem = {
    question: string;
    answer: string;
};

export type ProjectBrief = {
    title: string;
    summary: string;
    sitemap: { name: string; children: string[] }[];
    phases: { name: string; goal: string; features: string[] }[];
    questions: string[];
    stack: string[];
    closest: ProjectSummary | null;
};

export type SkillGroup = {
    key: string;
    label: string;
    items: string[];
};

export type MatchTier = 'production' | 'projects' | 'learning' | 'gap';

export type JobMatch = {
    fit: { score: number; label: string };
    summary: string;
    counts: Record<MatchTier, number>;
    requirements: {
        requirement: string;
        tier: MatchTier;
        skill: string | null;
        evidence: string;
        link: { label: string; href: string } | null;
    }[];
};

export type ProcessStep = {
    title: string;
    summary: string;
    deliverable: string;
    /** planning | design | development | testing | deployment | maintenance */
    icon: string;
    /** Label for a stage that repeats as often as needed. */
    loop: string | null;
};

export type Service = {
    title: string;
    summary: string;
    points: string[];
    /** Tool names; ones in content/tools.php get their logo. */
    stack: string[];
    /** Tool logo file names, or whatsapp, telegram, gauge or diagram. */
    icons: string[];
    badge: string | null;
    for: string | null;
    proof: string | null;
    metric: { value: string; label: string } | null;
    /** Case study slug that shows this service. */
    example: string | null;
};

export type Tool = {
    name: string;
    icon: string;
    brand: string;
};

export type ToolRow = {
    row: 'development' | 'ai';
    label: string;
    tools: Tool[];
};

/** A made-up business for the AI Lab demo (content/lab-samples.php). */
export type LabSample = {
    slug: string;
    name: string;
    kind: string;
    /** car | clinic | school | restaurant | salon | building */
    icon: string;
    knowledge: string;
    starters: string[];
    /** A real case study in the same field. */
    related: { slug: string; title: string } | null;
};

/** A page's search and share tags (App\Http\Responses\PageMeta). */
export type PageMeta = {
    title: string;
    shareTitle: string;
    description: string;
    /** Path from the site root, starting with "/". */
    path: string;
    keywords: string[];
    /** Absolute or root-relative preview image. */
    image: string;
    type: 'website' | 'profile' | 'article';
    noindex: boolean;
};
