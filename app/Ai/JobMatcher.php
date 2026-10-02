<?php

namespace App\Ai;

use App\Ai\Contracts\AiProvider;
use App\Content\ContentRepository;
use App\Content\Data\Experience;
use App\Content\Data\Project;
use App\Content\Data\Skill;
use App\Content\Data\Tool;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

/**
 * Compares a job description with Labib's background. The model only
 * extracts requirements and points each one at a skill name from a fixed
 * list; how strong the match is (the tier) and the fit score are decided
 * here from the content files, so the model can never overstate anything.
 */
class JobMatcher
{
    /** How much each tier counts towards the fit score. */
    private const TIER_WEIGHTS = [
        'production' => 1.0,
        'projects' => 0.75,
        'learning' => 0.35,
        'gap' => 0.0,
    ];

    public function __construct(
        private readonly AiProvider $ai,
        private readonly ContentRepository $content,
        private readonly KnowledgePack $knowledge,
    ) {}

    /**
     * @return array{
     *     fit: array{score: int, label: string},
     *     summary: string,
     *     counts: array{production: int, projects: int, learning: int, gap: int},
     *     requirements: list<array{requirement: string, tier: string, skill: string|null, evidence: string, link: array{label: string, href: string}|null}>
     * }
     *
     * @throws AiUnavailableException
     */
    public function match(string $description): array
    {
        $key = 'job-match:'.hash('xxh128', Str::lower(Str::squish($description)).'|'.$this->knowledge->version());

        $cached = Cache::get($key);

        if (is_array($cached)) {
            return $cached;
        }

        $raw = $this->ai->completeJson(
            $this->systemPrompt(),
            [['role' => 'user', 'content' => "Job description:\n\"\"\"\n{$description}\n\"\"\""]],
            config('ai.job_match.max_tokens'),
        );

        $result = $this->score($raw);

        if ($result['requirements'] === []) {
            throw new AiUnavailableException('The model returned no requirements.');
        }

        Cache::put($key, $result, config('ai.job_match.cache_ttl'));

        return $result;
    }

    private function systemPrompt(): string
    {
        return str_replace(
            ['{{skills}}', '{{projects}}', '{{companies}}', '{{knowledge}}'],
            [
                $this->tiersByName()->keys()->implode(', '),
                $this->content->projects()->map(fn (Project $project): string => "{$project->slug} ({$project->title})")->implode(', '),
                $this->companies()->implode(', '),
                $this->knowledge->text(),
            ],
            File::get(resource_path('prompts/job-match.md')),
        );
    }

    /**
     * Every skill and tool name the model may point at, with its tier.
     * Skills keep their own tier; tools count as hands-on project use.
     *
     * @return Collection<string, string>
     */
    private function tiersByName(): Collection
    {
        $tiers = $this->content->skills()->mapWithKeys(fn (Skill $skill): array => [$skill->name => $skill->tier->value]);

        $this->content->tools()->each(function (Tool $tool) use ($tiers): void {
            if (! $tiers->has($tool->name)) {
                $tiers->put($tool->name, 'projects');
            }
        });

        return $tiers;
    }

    /**
     * @return Collection<int, string>
     */
    private function companies(): Collection
    {
        return $this->content->experience()->map(fn (Experience $role): string => $role->company)->unique()->values();
    }

    /**
     * @param  array<string, mixed>  $raw
     * @return array{
     *     fit: array{score: int, label: string},
     *     summary: string,
     *     counts: array{production: int, projects: int, learning: int, gap: int},
     *     requirements: list<array{requirement: string, tier: string, skill: string|null, evidence: string, link: array{label: string, href: string}|null}>
     * }
     */
    private function score(array $raw): array
    {
        $tiers = $this->tiersByName()->mapWithKeys(fn (string $tier, string $name): array => [Str::lower($name) => [$name, $tier]]);
        $projects = $this->content->projects()->keyBy('slug');
        $companies = $this->companies();

        $requirements = collect(is_array($raw['requirements'] ?? null) ? $raw['requirements'] : [])
            ->filter(fn ($item): bool => is_array($item) && filled($item['requirement'] ?? null))
            ->take(12)
            ->map(function (array $item) use ($tiers, $projects, $companies): array {
                $match = is_string($item['skill'] ?? null) ? $tiers->get(Str::lower(trim($item['skill']))) : null;

                return [
                    'requirement' => Str::limit(trim((string) $item['requirement']), 140),
                    'tier' => $match[1] ?? 'gap',
                    'skill' => $match[0] ?? null,
                    'evidence' => Str::limit(trim((string) ($item['evidence'] ?? '')), 220),
                    'link' => $this->link($item, $projects, $companies),
                ];
            })
            ->values();

        $counts = ['production' => 0, 'projects' => 0, 'learning' => 0, 'gap' => 0];

        foreach ($requirements as $requirement) {
            $counts[$requirement['tier']]++;
        }

        $score = $requirements->isEmpty()
            ? 0
            : (int) round($requirements->avg(fn (array $requirement): float => self::TIER_WEIGHTS[$requirement['tier']]) * 100);

        return [
            'fit' => ['score' => $score, 'label' => $this->label($score)],
            'summary' => Str::limit(trim((string) ($raw['summary'] ?? '')), 400),
            'counts' => $counts,
            'requirements' => $requirements->all(),
        ];
    }

    /**
     * Only links to things that exist: a known case study or a known role.
     *
     * @param  array<string, mixed>  $item
     * @param  Collection<string, Project>  $projects
     * @param  Collection<int, string>  $companies
     * @return array{label: string, href: string}|null
     */
    private function link(array $item, Collection $projects, Collection $companies): ?array
    {
        $project = is_string($item['project'] ?? null) ? $projects->get(trim($item['project'])) : null;

        if ($project) {
            return ['label' => "{$project->title} case study", 'href' => "/work/{$project->slug}"];
        }

        $company = is_string($item['company'] ?? null)
            ? $companies->first(fn (string $name): bool => Str::lower($name) === Str::lower(trim($item['company'])))
            : null;

        return $company ? ['label' => "Role at {$company}", 'href' => '/#experience'] : null;
    }

    private function label(int $score): string
    {
        return match (true) {
            $score >= 80 => 'Strong fit',
            $score >= 60 => 'Good fit',
            $score >= 40 => 'Partial fit',
            default => 'Stretch',
        };
    }
}
