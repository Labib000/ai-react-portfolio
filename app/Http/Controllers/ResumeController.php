<?php

namespace App\Http\Controllers;

use App\Content\ContentRepository;
use App\Content\Data\Experience;
use App\Content\Data\Project;
use App\Content\Data\Skill;
use App\Content\Data\Tool;
use App\Http\Responses\PageMeta;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ResumeController extends Controller
{
    /** Resume skill sections, in display order. */
    private const GROUPS = [
        'backend' => 'Backend',
        'frontend' => 'Frontend',
        'data' => 'Databases & caching',
        'ai' => 'AI & Gen AI',
        'cms' => 'CMS',
        'tools' => 'Tools',
    ];

    public function __invoke(ContentRepository $content): Response
    {
        $profile = $content->profile();

        $city = explode(',', $profile->location)[0];

        return Inertia::render('resume', [
            'meta' => (new PageMeta(
                title: 'Resume: Full Stack & Gen AI Developer',
                shareTitle: "{$profile->name}'s resume, full stack and Gen AI developer in {$city}",
                description: "{$profile->name}'s resume: full stack developer in {$city} with {$content->experienceDuration()} in production, plus Gen AI projects. Paste a job description to see how I fit.",
                path: '/resume',
                keywords: [
                    'full stack developer resume',
                    'Gen AI developer',
                    'hire full stack developer',
                    'MERN stack developer',
                    'Laravel developer',
                    'full stack developer Kolkata',
                ],
                type: 'profile',
            ))->toArray(),
            'profile' => $profile->toArray(),
            'experienceDuration' => $content->experienceDuration(),
            'experience' => $content->experience()->map(fn (Experience $role) => $role->toArray())->all(),
            'projects' => $content->projects()->map(fn (Project $project) => $project->toSummaryArray())->all(),
            'skillGroups' => $this->skillGroups($content),
            'toolRows' => $content->toolRows(),
            'resumePdf' => $profile->resumePdf,
        ]);
    }

    /**
     * Skills by area. AI tools join the AI group and the remaining
     * development tools form a Tools group; tools already listed as a skill
     * (or marked resume => false) are left out.
     *
     * @return list<array{key: string, label: string, items: list<string>}>
     */
    private function skillGroups(ContentRepository $content): array
    {
        $items = array_fill_keys(array_keys(self::GROUPS), []);
        $skillNames = $content->skills()->map(fn (Skill $skill) => Str::lower($skill->name));

        $content->skills()->each(function (Skill $skill) use (&$items): void {
            $items[array_key_exists($skill->group, $items) ? $skill->group : 'tools'][] = $skill->name;
        });

        $content->tools()
            ->filter(fn (Tool $tool) => $tool->resume)
            ->reject(fn (Tool $tool) => $skillNames->contains(fn (string $name) => Str::startsWith($name, Str::lower($tool->name))))
            ->each(function (Tool $tool) use (&$items): void {
                $items[$tool->row === 'ai' ? 'ai' : 'tools'][] = $tool->name;
            });

        $groups = [];

        foreach (self::GROUPS as $key => $label) {
            if ($items[$key] !== []) {
                $groups[] = ['key' => $key, 'label' => $label, 'items' => $items[$key]];
            }
        }

        return $groups;
    }
}
