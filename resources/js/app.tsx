import { createInertiaApp, router } from '@inertiajs/react';
import { Toaster } from '@/components/ui/sonner';
import { initializeTheme } from '@/hooks/use-appearance';
import SiteLayout from '@/layouts/site-layout';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

void createInertiaApp({
    title: (title) => (title ? `${title} | ${appName}` : appName),
    layout: () => SiteLayout,
    strictMode: true,
    withApp(app) {
        return (
            <>
                {app}
                <Toaster />
            </>
        );
    },
    progress: {
        color: '#2a9d8f',
    },
});

// This will set light / dark mode on load...
initializeTheme();

// Google Tag Manager: the first page is counted by GTM itself; every later
// page opens without a full reload, so report it as a page_view event.
let isFirstPage = true;

router.on('navigate', (event) => {
    if (isFirstPage) {
        isFirstPage = false;

        // The server's crawler-only heading and links (app.blade.php) are
        // replaced by the rendered page.
        document.getElementById('seo-fallback')?.remove();

        return;
    }

    const layer = (window as unknown as { dataLayer?: unknown[] }).dataLayer;

    // Wait a moment so the page's new <title> is in place.
    window.setTimeout(() => {
        layer?.push({
            event: 'page_view',
            page_path: event.detail.page.url,
            page_title: document.title,
            page_location: window.location.href,
        });
    }, 50);
});
