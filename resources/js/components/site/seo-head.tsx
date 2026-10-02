import { Head, usePage } from '@inertiajs/react';
import type { PageMeta } from '@/types/content';

type SeoHeadProps = {
    /** The page's "meta" prop, built by its controller (App\Http\Responses\PageMeta). */
    meta: PageMeta;
    /** JSON-LD structured data. */
    schema?: Record<string, unknown>;
};

/**
 * Title, description, keywords, canonical URL, robots, Open Graph and
 * Twitter tags, plus optional JSON-LD. The server already renders the same
 * tags into the HTML (resources/views/app.blade.php) with matching
 * data-inertia keys, so this takes them over instead of duplicating them,
 * and keeps them current as visitors move between pages.
 */
export function SeoHead({ meta, schema }: SeoHeadProps) {
    const { site } = usePage().props;
    const url = `${site.url}${meta.path}`;
    const imageUrl = meta.image.startsWith('http')
        ? meta.image
        : `${site.url}${meta.image}`;

    return (
        <>
            <Head title={meta.title}>
                <meta
                    head-key="description"
                    name="description"
                    content={meta.description}
                />
                {meta.keywords.length > 0 && (
                    <meta
                        head-key="keywords"
                        name="keywords"
                        content={meta.keywords.join(', ')}
                    />
                )}
                {meta.noindex ? (
                    <meta head-key="robots" name="robots" content="noindex" />
                ) : (
                    <link head-key="canonical" rel="canonical" href={url} />
                )}
                <meta
                    head-key="og:type"
                    property="og:type"
                    content={meta.type}
                />
                <meta
                    head-key="og:site_name"
                    property="og:site_name"
                    content={site.name}
                />
                <meta
                    head-key="og:title"
                    property="og:title"
                    content={meta.shareTitle}
                />
                <meta
                    head-key="og:description"
                    property="og:description"
                    content={meta.description}
                />
                <meta head-key="og:url" property="og:url" content={url} />
                <meta
                    head-key="og:image"
                    property="og:image"
                    content={imageUrl}
                />
                <meta
                    head-key="twitter:card"
                    name="twitter:card"
                    content="summary_large_image"
                />
                <meta
                    head-key="twitter:title"
                    name="twitter:title"
                    content={meta.shareTitle}
                />
                <meta
                    head-key="twitter:description"
                    name="twitter:description"
                    content={meta.description}
                />
                <meta
                    head-key="twitter:image"
                    name="twitter:image"
                    content={imageUrl}
                />
            </Head>

            {schema && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify(schema).replace(/</g, '\\u003c'),
                    }}
                />
            )}
        </>
    );
}
