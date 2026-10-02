<?php

/*
|--------------------------------------------------------------------------
| Experience
|--------------------------------------------------------------------------
|
| Newest first. Dates are "YYYY-MM". Leave "end" as null for your current
| role; when you leave, set the month you left.
|
| "metric" is the big number on the role's card: one result you can explain
| in an interview.
|
*/

return [
    [
        'company' => 'Digital Advengers FZCO',
        'title' => 'Associate Software Developer',
        'type' => 'full-time',
        'start' => '2026-02',
        'end' => null,
        'tools' => ['Laravel', 'React', 'Redux', 'SQL', 'Redis', 'Core PHP'],
        'metric' => ['value' => '20+', 'label' => 'modules and REST APIs shipped'],
        'highlights' => [
            'Developed and maintained 20+ backend and frontend modules and REST APIs for rental and ecommerce platforms with 10,000+ monthly users.',
            'Designed and integrated REST APIs that connect different parts of the platform and link it to external services.',
            'Reduced API response time by 40% through query optimization, database indexing and caching.',
            'Shipped backend and frontend features to production, built to scale and easy for the next developer to maintain.',
        ],
    ],
    [
        'company' => 'Horizon Allienz Pvt Ltd',
        'title' => 'Junior Software Engineer',
        'type' => 'full-time',
        'start' => '2025-09',
        'end' => '2025-12',
        'tools' => ['Laravel', 'JavaScript', 'Facebook Graph API', 'FFmpeg'],
        'metric' => ['value' => '25 to 30%', 'label' => 'less manual campaign work'],
        'highlights' => [
            'Built a central console for managing social media posts, using Laravel, JavaScript, the Facebook Graph API and FFmpeg.',
            'Designed approval workflows for admins, authors and approvers, with email notifications, app alerts and audit trails.',
            'Stored platform credentials securely and integrated the APIs needed to publish to several platforms at once.',
            'Automated post scheduling and publishing, cutting manual campaign work by roughly 25 to 30%.',
        ],
    ],
    [
        'company' => 'Horizon Allienz Pvt Ltd',
        'title' => 'Web Development Intern',
        'type' => 'internship',
        'start' => '2025-04',
        'end' => '2025-09',
        'tools' => ['WordPress', 'Laravel'],
        'metric' => ['value' => '30 to 40%', 'label' => 'faster content publishing'],
        'highlights' => [
            'Built a low code publishing system with custom WordPress plugins and post types, connected to a Laravel admin panel.',
            'Added approval workflows so the Principal, Director and HODs could publish content on their own, without a developer.',
            'Built dashboards with roles and permissions, grading, data exports and audit logs for an exam portal.',
            'Created a responsive doctor appointment booking system with department and staff modules.',
        ],
    ],
];
