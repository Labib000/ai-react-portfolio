import type { ReactNode } from 'react';
import { SiteFooter } from '@/components/site/site-footer';
import { PageAssistant } from '@/components/site/page-assistant';
import { SiteHeader } from '@/components/site/site-header';

export default function SiteLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex min-h-svh flex-col bg-backdrop">
            <a
                href="#content"
                className="sr-only rounded-md bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50"
            >
                Skip to content
            </a>

            <SiteHeader />

            <main id="content" tabIndex={-1} className="flex-1 outline-none">
                {children}
            </main>

            <SiteFooter />

            <PageAssistant />
        </div>
    );
}
