import { usePage } from '@inertiajs/react';
import { AskSection } from '@/components/home/ask-section';
import { ContactSection } from '@/components/home/contact-section';
import { ExperienceSection } from '@/components/home/experience-section';
import { Hero } from '@/components/home/hero';
import { ProcessSection } from '@/components/home/process-section';
import { ServicesSection } from '@/components/home/services-section';
import { ToolsMarquee } from '@/components/home/tools-marquee';
import { WorkSection } from '@/components/home/work-section';
import { SeoHead } from '@/components/site/seo-head';
import type { PageMeta } from '@/types/content';
import type {
    Experience,
    Profile,
    ProcessStep,
    ProjectSummary,
    Service,
    ToolRow,
} from '@/types/content';

type HomeProps = {
    meta: PageMeta;
    profile: Profile;
    experienceDuration: string;
    toolRows: ToolRow[];
    experience: Experience[];
    projects: ProjectSummary[];
    services: Service[];
    process: ProcessStep[];
};

export default function Home({
    meta,
    profile,
    experienceDuration,
    toolRows,
    experience,
    projects,
    services,
    process,
}: HomeProps) {
    const { site } = usePage().props;
    const description = meta.description;
    const current = experience.find((role) => role.isCurrent);
    const education = profile.education[0];
    const personSchema = {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: profile.name,
        alternateName: profile.fullName,
        jobTitle: profile.role,
        description,
        url: `${site.url}/`,
        image: `${site.url}/og.png`,
        email: profile.links.email
            ? `mailto:${profile.links.email}`
            : undefined,
        address: {
            '@type': 'PostalAddress',
            addressLocality: profile.location.split(',')[0],
            addressCountry: 'IN',
        },
        knowsAbout: [
            'Laravel',
            'PHP',
            'React',
            'MySQL',
            'REST APIs',
            'Redis',
            'Generative AI',
            ...services.map((service) => service.title),
        ],
        ...(current
            ? {
                  worksFor: {
                      '@type': 'Organization',
                      name: current.company,
                  },
              }
            : {}),
        ...(education
            ? {
                  alumniOf: {
                      '@type': 'CollegeOrUniversity',
                      name: education.institution,
                  },
              }
            : {}),
        sameAs: [profile.links.github, profile.links.linkedin].filter(Boolean),
    };

    return (
        <>
            <SeoHead meta={meta} schema={personSchema} />

            <Hero profile={profile} experienceDuration={experienceDuration} />

            {toolRows.length > 0 && <ToolsMarquee rows={toolRows} />}

            {experience.length > 0 && (
                <ExperienceSection
                    experience={experience}
                    experienceDuration={experienceDuration}
                />
            )}

            {projects.length > 0 && (
                <WorkSection projects={projects} toolRows={toolRows} />
            )}

            {services.length > 0 && (
                <ServicesSection services={services} toolRows={toolRows} />
            )}

            {process.length > 0 && <ProcessSection steps={process} />}

            <AskSection />

            <ContactSection />
        </>
    );
}
