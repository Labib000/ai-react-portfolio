<?php

namespace App\Http\Controllers;

use App\Content\ContentRepository;
use App\Content\Data\Experience;
use App\Content\Data\ProcessStep;
use App\Content\Data\Project;
use App\Content\Data\Service;
use App\Http\Responses\PageMeta;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function __invoke(ContentRepository $content): Response
    {
        $profile = $content->profile();
        $city = explode(',', $profile->location)[0];

        return Inertia::render('home', [
            'meta' => (new PageMeta(
                title: "Full Stack & Gen AI Developer in {$city}",
                shareTitle: "{$profile->name}, full stack and Gen AI developer in {$city}",
                description: "{$profile->name} is a full stack and Gen AI developer in {$city} building web apps, AI chatbots and booking systems. Open to freelance and full time work.",
                path: '/',
                keywords: [
                    'full stack developer Kolkata',
                    'Gen AI developer',
                    'AI chatbot developer',
                    'freelance full stack developer India',
                    'hire full stack developer',
                    'MERN stack developer',
                    'Laravel developer',
                    'Java full stack developer',
                ],
                type: 'profile',
            ))->toArray(),
            'profile' => $profile->toArray(),
            'experienceDuration' => $content->experienceDuration(),
            'toolRows' => $content->toolRows(),
            'experience' => $content->experience()->map(fn (Experience $role) => $role->toArray())->all(),
            'process' => $content->process()->map(fn (ProcessStep $step) => $step->toArray())->all(),
            'services' => $content->services()->map(fn (Service $service) => $service->toArray())->all(),
            'projects' => $content->projects()
                ->map(fn (Project $project) => $project->toSummaryArray())
                ->all(),
        ]);
    }
}
