<?php

/*
|--------------------------------------------------------------------------
| Skills by evidence tier
|--------------------------------------------------------------------------
|
| tier: "production" = used in a paid job, "projects" = used in projects
| outside a job, "learning" = studying it now. The AI features are not
| allowed to move a skill to a higher tier than the one set here.
|
| "projects" lists slugs from content/projects that prove the skill.
| "group" places the skill on the resume: backend | frontend | data | ai | cms.
|
*/

return [
    ['name' => 'PHP', 'group' => 'backend', 'tier' => 'production', 'note' => 'Laravel and Core PHP across every role'],
    ['name' => 'Laravel', 'group' => 'backend', 'tier' => 'production', 'note' => 'Main framework at Digital Advengers and Horizon Allienz'],
    ['name' => 'MySQL / SQL', 'group' => 'data', 'tier' => 'production', 'note' => 'Query optimization and indexing'],
    ['name' => 'REST APIs', 'group' => 'backend', 'tier' => 'production', 'note' => 'Designing and integrating APIs'],
    ['name' => 'Redis', 'group' => 'data', 'tier' => 'production', 'note' => 'Caching at Digital Advengers'],
    ['name' => 'JavaScript', 'group' => 'frontend', 'tier' => 'production', 'note' => 'Frontend work at Horizon Allienz'],
    ['name' => 'TypeScript', 'group' => 'frontend', 'tier' => 'production', 'note' => 'Typed React frontends in production work'],
    ['name' => 'WordPress', 'group' => 'cms', 'tier' => 'production', 'note' => 'Custom plugins and CPTs'],
    ['name' => 'Third party APIs', 'group' => 'backend', 'tier' => 'production', 'note' => 'Facebook Graph API, FFmpeg pipelines'],
    ['name' => 'React', 'group' => 'frontend', 'tier' => 'production', 'note' => 'Frontend modules at Digital Advengers'],
    ['name' => 'Redux', 'group' => 'frontend', 'tier' => 'production', 'note' => 'State management at Digital Advengers'],

    ['name' => 'Node.js', 'group' => 'backend', 'tier' => 'projects', 'note' => 'MERN stack projects'],
    ['name' => 'Express', 'group' => 'backend', 'tier' => 'projects', 'note' => 'MERN stack projects'],
    ['name' => 'MongoDB', 'group' => 'data', 'tier' => 'projects', 'note' => 'MERN stack projects'],

    ['name' => 'Java', 'group' => 'backend', 'tier' => 'learning', 'note' => 'AccioJob AI Engineering course'],
    ['name' => 'Spring Boot', 'group' => 'backend', 'tier' => 'learning', 'note' => 'AccioJob AI Engineering course'],
    ['name' => 'Generative AI', 'group' => 'ai', 'tier' => 'projects', 'note' => 'WhatsApp and Telegram bots for sales and reception, this site\'s AI assistant, AccioJob AI Engineering course'],
];
