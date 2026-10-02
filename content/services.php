<?php

/*
|--------------------------------------------------------------------------
| What I build
|--------------------------------------------------------------------------
|
| The service cards on the home page, in display order; the first two are
| shown larger. The AI assistant also reads these to answer "can he build
| ...?" questions, so keep them to work you can deliver.
|
| icons: 1-4 keys. Logo file names from resources/images/tools (shown in
|        their brand colour), or whatsapp | telegram | gauge | diagram.
| for:   who the service suits (for clients).
| proof: the evidence behind it (for recruiters). "metric" is an optional
|        big number shown instead of the sentence; it counts up.
| badge: optional small label on the card.
| example: optional case study slug that shows the service (used on /services).
|
*/

return [
    [
        'title' => 'Laravel development',
        'summary' => 'Secure, well structured backends that stay fast as your users grow, and are easy for the next developer to pick up.',
        'points' => [
            'Booking, rental and ecommerce backends',
            'REST APIs and third party integrations',
            'Admin panels with roles and permissions',
            'Database design, query tuning and caching',
        ],
        'stack' => ['Laravel', 'PHP', 'MySQL', 'Redis'],
        'icons' => ['laravel'],
        'for' => 'Businesses that need a solid backend, admin panel or API',
        'proof' => 'For rental and ecommerce platforms with 10,000+ monthly users',
        'metric' => ['value' => '20+', 'label' => 'modules and REST APIs shipped'],
        'example' => 'cardiwan',
    ],
    [
        'title' => 'MERN development',
        'summary' => 'Complete web apps in one JavaScript stack, from the database and API to the React interface your users see.',
        'points' => [
            'REST APIs with Node.js and Express',
            'React frontends with Redux',
            'MongoDB data modelling',
            'Built, tested and deployed end to end',
        ],
        'stack' => ['MongoDB', 'Express', 'React', 'Node.js'],
        'icons' => ['mongodb', 'express', 'react', 'nodedotjs'],
        'for' => 'Startups that want one JavaScript stack end to end',
        'proof' => 'Full MERN apps built end to end, from API to UI',
    ],
    [
        'title' => 'Java full stack',
        'summary' => 'Spring Boot REST APIs with React frontends, for teams whose backend runs on Java.',
        'points' => [
            'Spring Boot REST APIs',
            'React frontends',
            'Gen AI features on a Java backend',
        ],
        'stack' => ['Java', 'Spring Boot', 'React', 'MySQL'],
        'icons' => ['java', 'springboot'],
        'badge' => 'Newest stack',
        'for' => 'Teams building on Java backends',
        'proof' => 'AI Engineering (Java Full Stack with Gen AI) at AccioJob',
    ],
    [
        'title' => 'React development',
        'summary' => 'Fast, responsive interfaces and dashboards, connected to your existing API or paired with a Laravel backend.',
        'points' => [
            'Single page apps and dashboards',
            'State management with Redux',
            'Responsive on every screen',
        ],
        'stack' => ['React', 'TypeScript', 'Redux', 'Tailwind CSS'],
        'icons' => ['react', 'redux'],
        'for' => 'Products that need a polished UI on an existing API',
        'proof' => 'React and Redux frontend modules in production at Digital Advengers',
        'example' => 'zeromax',
    ],
    [
        'title' => 'Gen AI development',
        'summary' => 'AI features that answer from your own data instead of guessing, added to a new or existing product.',
        'points' => [
            'AI assistants grounded in company data',
            'RAG with vector databases',
            'AI agents and LLM API integrations',
        ],
        'stack' => ['RAG', 'LangChain', 'Pinecone', 'Claude'],
        'icons' => ['aiagents', 'rag', 'langchain'],
        'for' => 'Companies that want AI answering from their own data',
        'proof' => 'The AI Lab on this site: an assistant that answers only from a business\'s own text',
    ],
    [
        'title' => 'AI chatbots & automation',
        'summary' => 'WhatsApp and Telegram bots that answer customers instantly and handle enquiries around the clock.',
        'points' => [
            'Sales assistants that answer and qualify enquiries',
            'Virtual receptionists for common questions',
            'Workflow automation that cuts manual work',
        ],
        'stack' => ['AI agents', 'Prompt engineering'],
        'icons' => ['whatsapp', 'telegram'],
        'for' => 'Businesses that get enquiries at all hours',
        'proof' => 'WhatsApp and Telegram bots working as sales assistants and receptionists',
    ],
    [
        'title' => 'API performance',
        'summary' => 'Slow pages and APIs found, measured and made fast, without rewriting what already works.',
        'points' => [
            'Query optimisation',
            'Database indexing',
            'Redis caching',
        ],
        'stack' => ['MySQL', 'Redis', 'Laravel'],
        'icons' => ['gauge'],
        'for' => 'Apps that got slow as they grew',
        'proof' => 'Through query optimisation, indexing and Redis caching',
        'metric' => ['value' => '40%', 'label' => 'faster API responses'],
    ],
    [
        'title' => 'Workflows & dashboards',
        'summary' => 'Tools with roles and permissions that let your team run things themselves, without waiting on a developer.',
        'points' => [
            'Approval workflows with roles and permissions',
            'Notifications, app alerts and audit logs',
            'CMS and blogs your team can manage',
        ],
        'stack' => ['Laravel', 'WordPress', 'JavaScript'],
        'icons' => ['diagram'],
        'for' => 'Teams that wait on developers for every change',
        'proof' => 'Approval workflows and a CMS for a college, run by staff with no coding background',
        'metric' => ['value' => '30 to 40%', 'label' => 'faster content publishing'],
        'example' => 'msit-cms',
    ],
];
