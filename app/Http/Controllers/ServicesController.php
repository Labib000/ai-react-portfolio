<?php

namespace App\Http\Controllers;

use App\Ai\BriefPlanner;
use App\Content\ContentRepository;
use App\Content\Data\FaqItem;
use App\Content\Data\ProcessStep;
use App\Content\Data\Project;
use App\Content\Data\Service;
use App\Http\Responses\PageMeta;
use Inertia\Inertia;
use Inertia\Response;

class ServicesController extends Controller
{
    public function __invoke(ContentRepository $content): Response
    {
        return Inertia::render('services', [
            'meta' => (new PageMeta(
                title: 'Full Stack & Gen AI Development Services',
                shareTitle: 'Full stack and Gen AI development services by Labib Alam',
                description: 'Hire a freelance full stack and Gen AI developer for web apps, online stores, booking systems and AI chatbots, built with Laravel, MERN or Java. Plan it free.',
                path: '/services',
                keywords: [
                    'full stack development services',
                    'Gen AI development services',
                    'AI chatbot development',
                    'web app development',
                    'MERN stack development',
                    'Laravel development services',
                    'Java full stack development',
                    'hire freelance full stack developer',
                ],
            ))->toArray(),
            'impact' => $content->profile()->impact,
            'services' => $content->services()->map(fn (Service $service) => $service->toArray())->all(),
            'process' => $content->process()->map(fn (ProcessStep $step) => $step->toArray())->all(),
            'faq' => $content->faq()->map(fn (FaqItem $item) => $item->toArray())->all(),
            'projects' => $content->projects()->map(fn (Project $project) => $project->toSummaryArray())->all(),
            'toolRows' => $content->toolRows(),
            'briefTypes' => BriefPlanner::TYPES,
        ]);
    }
}
