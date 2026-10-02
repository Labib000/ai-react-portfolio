<?php

/*
|--------------------------------------------------------------------------
| How I work
|--------------------------------------------------------------------------
|
| The waterfall process on the home page, in order. The AI assistant also
| reads this to answer "how does he work?".
|
| icon: planning | design | development | testing | deployment | maintenance
| loop: optional label for a stage that repeats as often as needed.
|
*/

return [
    [
        'title' => 'Requirements & planning',
        'summary' => 'We agree on goals, features, users and scope together. Nothing is built until you approve the plan.',
        'deliverable' => 'A written scope and feature list',
        'icon' => 'planning',
        'loop' => 'Unlimited iterations',
    ],
    [
        'title' => 'Design',
        'summary' => 'Architecture, database design and wireframes of the key screens, so the build starts on solid ground.',
        'deliverable' => 'Wireframes and a technical plan',
        'icon' => 'design',
    ],
    [
        'title' => 'Development',
        'summary' => 'I build in clean, tested stages and share progress regularly, so you see the product take shape.',
        'deliverable' => 'A working staging link',
        'icon' => 'development',
    ],
    [
        'title' => 'Testing',
        'summary' => 'Feature tests, checks on every device and performance tuning before anything goes live.',
        'deliverable' => 'A tested build, ready to launch',
        'icon' => 'testing',
    ],
    [
        'title' => 'Deployment',
        'summary' => 'Go live on your domain and hosting, with a clear handover of everything you need.',
        'deliverable' => 'A live product and handover notes',
        'icon' => 'deployment',
    ],
    [
        'title' => 'Maintenance',
        'summary' => 'Bug fixes, updates, new features and performance care after launch, as your product grows.',
        'deliverable' => 'Ongoing support',
        'icon' => 'maintenance',
        'loop' => 'Unlimited iterations',
    ],
];
