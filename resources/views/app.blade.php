@php
    $site = $page['props']['site'] ?? [];
    $siteName = $site['name'] ?? config('app.name');
    $siteUrl = $site['url'] ?? rtrim(config('app.url'), '/');
    $meta = $page['props']['meta'] ?? null;
@endphp
<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => ($appearance ?? 'dark') !== 'light'])>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="theme-color" content="#0b1719">

        {{-- Apply the theme and the motion flag before first paint --}}
        <script>
            (function() {
                const root = document.documentElement;
                const appearance = '{{ $appearance ?? "dark" }}';

                if (appearance === 'system') {
                    root.classList.toggle('dark', window.matchMedia('(prefers-color-scheme: dark)').matches);
                }

                // Hide elements that GSAP will animate in, only when motion is allowed.
                // Failsafe: if the JS bundle hasn't loaded in 3s, show everything.
                if (window.matchMedia('(prefers-reduced-motion: no-preference)').matches) {
                    root.classList.add('motion');

                    setTimeout(function () {
                        if (!root.dataset.motionReady) {
                            root.classList.remove('motion');
                        }
                    }, 3000);
                }
            })();
        </script>

        {{-- Match the page background in app.css so there's no flash --}}
        <style>
            html {
                background-color: oklch(0.985 0.004 190);
            }

            html.dark {
                background-color: oklch(0.155 0.014 205);
            }
        </style>

        <link rel="icon" href="/favicon.ico" sizes="32x32">
        <link rel="icon" href="/favicon-32.png" type="image/png" sizes="32x32">
        <link rel="apple-touch-icon" href="/apple-touch-icon.png">
        <link rel="manifest" href="/site.webmanifest">

        @fonts

        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        {{--
            Search and share tags from the page's "meta" prop, in the HTML the
            server sends, so crawlers and link previews see them without
            JavaScript. The data-inertia keys match the React SeoHead's, so it
            takes these tags over after load instead of adding duplicates.
            With SSR running, Inertia's own server render replaces this block.
        --}}
        <x-inertia::head>
            @if ($meta)
                @php
                    $url = $siteUrl.$meta['path'];
                    $image = str_starts_with($meta['image'], 'http') ? $meta['image'] : $siteUrl.$meta['image'];
                @endphp
                <title data-inertia="">{{ $meta['title'] }} | {{ $siteName }}</title>
                <meta data-inertia="description" name="description" content="{{ $meta['description'] }}">
                @if ($meta['keywords'])
                    <meta data-inertia="keywords" name="keywords" content="{{ implode(', ', $meta['keywords']) }}">
                @endif
                @if ($meta['noindex'])
                    <meta data-inertia="robots" name="robots" content="noindex">
                @else
                    <link data-inertia="canonical" rel="canonical" href="{{ $url }}">
                @endif
                <meta data-inertia="og:type" property="og:type" content="{{ $meta['type'] }}">
                <meta data-inertia="og:site_name" property="og:site_name" content="{{ $siteName }}">
                <meta data-inertia="og:title" property="og:title" content="{{ $meta['shareTitle'] }}">
                <meta data-inertia="og:description" property="og:description" content="{{ $meta['description'] }}">
                <meta data-inertia="og:url" property="og:url" content="{{ $url }}">
                <meta data-inertia="og:image" property="og:image" content="{{ $image }}">
                <meta data-inertia="twitter:card" name="twitter:card" content="summary_large_image">
                <meta data-inertia="twitter:title" name="twitter:title" content="{{ $meta['shareTitle'] }}">
                <meta data-inertia="twitter:description" name="twitter:description" content="{{ $meta['description'] }}">
                <meta data-inertia="twitter:image" name="twitter:image" content="{{ $image }}">
            @else
                <title data-inertia="">{{ $siteName }}</title>
            @endif
        </x-inertia::head>

        @if ($verification = config('services.google.site_verification'))
            <meta name="google-site-verification" content="{{ $verification }}">
        @endif

        @if ($gtm = config('services.google.tag_manager_id'))
            {{-- Google Tag Manager --}}
            <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer',@json($gtm));</script>
        @endif
    </head>
    <body class="font-sans antialiased">
        @if ($gtm)
            <noscript><iframe src="https://www.googletagmanager.com/ns.html?id={{ $gtm }}" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
        @endif
        <x-inertia::app />

        {{--
            Without SSR the app's own HTML is an empty div until JavaScript runs,
            so crawlers that don't run it (Bing, link checkers) would see no
            heading or links. This gives them the page's h1, description and
            main links. It is visually hidden and removed by app.tsx once the
            page has rendered, so visitors and screen readers get the real page.
        --}}
        @if ($meta && ! config('inertia.ssr.enabled'))
            <div id="seo-fallback" class="sr-only">
                <h1>{{ $meta['title'] }}</h1>
                <p>{{ $meta['description'] }}</p>
                <nav aria-label="Main">
                    <a href="{{ route('home') }}">Home</a>
                    <a href="{{ route('services') }}">Services</a>
                    <a href="{{ route('work.index') }}">Work</a>
                    <a href="{{ route('lab') }}">AI Lab</a>
                    <a href="{{ route('resume') }}">Resume</a>
                    <a href="{{ route('contact') }}">Contact</a>
                </nav>
                @if ($meta['path'] === '/' && $site)
                    @php
                        $schema = [
                            '@context' => 'https://schema.org',
                            '@graph' => [
                                [
                                    '@type' => 'Person',
                                    'name' => $siteName,
                                    'jobTitle' => $site['role'],
                                    'url' => $siteUrl.'/',
                                    'image' => $siteUrl.'/og.png',
                                    'description' => $meta['description'],
                                    'address' => [
                                        '@type' => 'PostalAddress',
                                        'addressLocality' => explode(',', $site['location'])[0],
                                        'addressCountry' => 'IN',
                                    ],
                                    'sameAs' => array_values(array_filter([
                                        $site['links']['github'] ?? null,
                                        $site['links']['linkedin'] ?? null,
                                    ])),
                                ],
                                [
                                    '@type' => 'WebSite',
                                    'name' => $siteName,
                                    'url' => $siteUrl.'/',
                                ],
                            ],
                        ];
                    @endphp
                    <script type="application/ld+json">{!! json_encode($schema, JSON_HEX_TAG | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) !!}</script>
                @endif
            </div>
        @endif
    </body>
</html>
