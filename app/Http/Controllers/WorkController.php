<?php

namespace App\Http\Controllers;

use App\Content\ContentRepository;
use App\Content\Data\Project;
use App\Http\Responses\PageMeta;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class WorkController extends Controller
{
    public function index(ContentRepository $content): Response
    {
        return Inertia::render('work/index', [
            'meta' => (new PageMeta(
                title: 'Full Stack Projects and Case Studies',
                shareTitle: 'Full stack projects by Labib Alam, with case studies',
                description: 'Case studies of live full stack projects by Labib Alam: car rental platforms in Dubai, a learning platform, a college CMS and a social media console.',
                path: '/work',
                keywords: [
                    'full stack projects',
                    'full stack developer portfolio',
                    'web development case studies',
                    'web app development',
                    'car rental website developer',
                    'Laravel and React projects',
                ],
            ))->toArray(),
            'projects' => $content->projects()->map(fn (Project $project) => $project->toSummaryArray())->all(),
            'toolRows' => $content->toolRows(),
        ]);
    }

    public function show(ContentRepository $content, string $slug): Response
    {
        $projects = $content->projects()->values();
        $index = $projects->search(fn (Project $project) => $project->slug === $slug);

        abort_if($index === false, 404);

        $count = $projects->count();
        $project = $projects[$index];
        $category = Str::lower($project->category);

        return Inertia::render('work/show', [
            'meta' => (new PageMeta(
                title: $this->caseStudyTitle($project),
                shareTitle: "{$project->title}: a {$category} case study by {$content->profile()->name}",
                description: $project->summary,
                path: "/work/{$project->slug}",
                keywords: [
                    "{$project->title} case study",
                    "{$category} development",
                    'full stack developer',
                    ...array_map(fn (string $tool): string => "{$tool} developer", array_slice($project->stack, 0, 2)),
                ],
                image: $project->cover ? "{$project->cover}-1400.webp" : '/og.png',
                type: 'article',
            ))->toArray(),
            'project' => $projects[$index]->toArray(),
            'next' => $projects[($index + 1) % $count]->toSummaryArray(),
            'previous' => $projects[($index - 1 + $count) % $count]->toSummaryArray(),
            'toolRows' => $content->toolRows(),
        ]);
    }

    /**
     * "Cardiwan: Car rental case study", or just "Zeromax Lease to Own case
     * study" when the category would push the title past what Google shows
     * (about 60 characters, including the " | name" suffix).
     */
    private function caseStudyTitle(Project $project): string
    {
        $full = "{$project->title}: {$project->category} case study";

        return mb_strlen($full) <= 46 ? $full : "{$project->title} case study";
    }
}
