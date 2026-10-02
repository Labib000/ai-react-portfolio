<?php

/*
|--------------------------------------------------------------------------
| Profile
|--------------------------------------------------------------------------
|
| Everything on the site and everything the AI features say comes from the
| files in this folder. Keep claims here to what you can back up in an
| interview.
|
*/

return [
    'name' => 'Labib Alam',
    'full_name' => 'Md Labib Alam',
    'role' => 'Full Stack Developer',
    'location' => 'Kolkata, India',

    // The live domain. Canonical links, the sitemap, share previews and the
    // resume use it, so they always point here, even when testing locally.
    'website' => 'https://labibalam.in',

    // Experience length is calculated from this date, so it stays accurate.
    'career_started_at' => '2025-04',

    'bio' => 'Full stack developer in Kolkata building Laravel and React web apps for rental and ecommerce platforms. I care about code that is fast, reliable and easy for the next developer to pick up.',

    // One line under the hero headline.
    'intro' => 'My Laravel and React work runs in production on rental and ecommerce platforms with 10,000+ monthly users.',

    // Hero headline per audience (see the audience switch on the home page).
    // Words in [square brackets] get the animated colour.
    'headlines' => [
        'default' => 'I build web apps that are [fast, reliable] and easy to hand over.',
        'recruiter' => 'Full stack developer shipping [Laravel systems] for rental and ecommerce platforms.',
        'client' => 'I build [websites and web apps] for your business, from booking flows to the admin behind them.',
    ],

    // Results shown in the hero. Only numbers you can explain in an interview.
    'impact' => [
        [
            'value' => 40,
            'suffix' => '%',
            'label' => 'faster API responses',
            'detail' => 'Query optimisation, database indexing and Redis caching',
            'tags' => ['Query optimisation', 'Indexing', 'Redis caching'],
        ],
        [
            'value' => 20,
            'suffix' => '+',
            'label' => 'modules and REST APIs shipped',
            'detail' => 'For rental and ecommerce platforms',
        ],
        [
            'value' => 10000,
            'suffix' => '+',
            'label' => 'monthly users on the platforms I work on',
            'detail' => null,
        ],
    ],

    'links' => [
        'email' => 'Labib.Alam@outlook.com',
        // Shown on the site and used for call links.
        'phone' => '+91 81004 94661',
        // Never shown; only used for the wa.me chat link (country code + number).
        'whatsapp' => '918100494661',
        'github' => 'https://github.com/Labib000',
        'linkedin' => 'https://www.linkedin.com/in/labib-alam-05b11424a/',
    ],

    // Path to your resume PDF in public/, e.g. '/files/labib-alam-resume.pdf'.
    // Leave null to offer "Print / Save as PDF" instead.
    'resume_pdf' => null,

    'education' => [
        [
            'degree' => 'B.Tech, Computer Science Engineering',
            'institution' => 'Techno International Batanagar',
            'graduated' => '2025-07',
            'grade' => 'CGPA 8.57',
        ],
    ],

    'courses' => [
        [
            'title' => 'AI Engineering (Java Full Stack with Gen AI)',
            'provider' => 'AccioJob',
            'status' => 'ongoing',
        ],
        [
            'title' => 'Full Stack Development',
            'provider' => 'Internshala',
            'status' => 'completed',
        ],
    ],
];
