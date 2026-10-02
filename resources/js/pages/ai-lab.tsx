import { usePage } from '@inertiajs/react';
import { AssistantDemo } from '@/components/lab/assistant-demo';
import { LabHero } from '@/components/lab/lab-hero';
import { LabInfo } from '@/components/lab/lab-info';
import { SeoHead } from '@/components/site/seo-head';
import type { PageMeta } from '@/types/content';
import type { LabSample } from '@/types/content';

type AiLabProps = {
    meta: PageMeta;
    samples: LabSample[];
    knowledgeMax: number;
};

export default function AiLab({ meta, samples, knowledgeMax }: AiLabProps) {
    const { site } = usePage().props;
    const description = meta.description;

    return (
        <>
            <SeoHead
                meta={meta}
                schema={{
                    '@context': 'https://schema.org',
                    '@graph': [
                        {
                            '@type': 'WebApplication',
                            name: 'AI business assistant demo',
                            url: `${site.url}/ai-lab`,
                            description,
                            applicationCategory: 'BusinessApplication',
                            operatingSystem: 'Web browser',
                            isAccessibleForFree: true,
                            offers: {
                                '@type': 'Offer',
                                price: '0',
                                priceCurrency: 'USD',
                            },
                            creator: {
                                '@type': 'Person',
                                name: site.name,
                                jobTitle: site.role,
                                url: site.url,
                            },
                        },
                        {
                            '@type': 'BreadcrumbList',
                            itemListElement: [
                                {
                                    '@type': 'ListItem',
                                    position: 1,
                                    name: 'Home',
                                    item: site.url,
                                },
                                {
                                    '@type': 'ListItem',
                                    position: 2,
                                    name: 'AI Lab',
                                    item: `${site.url}/ai-lab`,
                                },
                            ],
                        },
                    ],
                }}
            />

            <LabHero />

            <AssistantDemo samples={samples} knowledgeMax={knowledgeMax} />

            <LabInfo />
        </>
    );
}
