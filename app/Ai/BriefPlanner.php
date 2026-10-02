<?php

namespace App\Ai;

use App\Ai\Contracts\AiProvider;
use App\Content\ContentRepository;
use App\Content\Data\Project;
use App\Content\Data\Skill;
use App\Content\Data\Tool;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

/**
 * Turns a client's project idea into a draft brief: a sitemap, three
 * phases, questions to ask and a suggested stack. The model's output is
 * clamped and checked here, so the stack only names tech Labib really uses
 * and the "closest project" is always a real case study.
 */
class BriefPlanner
{
    public const TYPES = [
        'website' => 'Website',
        'web-app' => 'Web app',
        'e-commerce' => 'Online store',
        'booking' => 'Booking system',
        'ai-chatbot' => 'AI chatbot',
        'other' => 'Something else',
    ];

    private const PHASES = ['MVP', 'Version 1', 'Later'];

    public function __construct(
        private readonly AiProvider $ai,
        private readonly ContentRepository $content,
        private readonly KnowledgePack $knowledge,
    ) {}

    /**
     * @return array{
     *     title: string,
     *     summary: string,
     *     sitemap: list<array{name: string, children: list<string>}>,
     *     phases: list<array{name: string, goal: string, features: list<string>}>,
     *     questions: list<string>,
     *     stack: list<string>,
     *     closest: array<string, mixed>|null
     * }
     *
     * @throws AiUnavailableException
     */
    public function plan(string $type, string $idea): array
    {
        $key = 'brief:'.hash('xxh128', $type.'|'.Str::lower(Str::squish($idea)).'|'.$this->knowledge->version());
        $cached = Cache::get($key);

        if (is_array($cached)) {
            return $cached;
        }

        $raw = $this->ai->completeJson(
            $this->systemPrompt(),
            [['role' => 'user', 'content' => 'Project type: '.self::TYPES[$type]."\nIdea:\n\"\"\"\n{$idea}\n\"\"\""]],
            config('ai.brief.max_tokens'),
        );

        $brief = $this->clean($raw);

        if (count($brief['sitemap']) < 2 || count($brief['phases']) < 2) {
            throw new AiUnavailableException('The model returned an incomplete brief.');
        }

        Cache::put($key, $brief, config('ai.brief.cache_ttl'));

        return $brief;
    }

    private function systemPrompt(): string
    {
        return str_replace(
            ['{{stack}}', '{{projects}}', '{{services}}'],
            [
                $this->knownTech()->implode(', '),
                $this->content->projects()->map(fn (Project $project): string => "{$project->slug}: {$project->title} ({$project->category}). {$project->summary}")->implode("\n"),
                $this->content->services()->map(fn ($service): string => "{$service->title}: {$service->summary}")->implode("\n"),
            ],
            File::get(resource_path('prompts/project-brief.md')),
        );
    }

    /**
     * Skill and tool names, which are the only tech a brief may suggest.
     *
     * @return Collection<int, string>
     */
    private function knownTech(): Collection
    {
        return $this->content->skills()->map(fn (Skill $skill): string => $skill->name)
            ->merge($this->content->tools()->filter(fn (Tool $tool): bool => $tool->resume)->map(fn (Tool $tool): string => $tool->name))
            ->unique()
            ->values();
    }

    /**
     * @param  array<string, mixed>  $raw
     * @return array{
     *     title: string,
     *     summary: string,
     *     sitemap: list<array{name: string, children: list<string>}>,
     *     phases: list<array{name: string, goal: string, features: list<string>}>,
     *     questions: list<string>,
     *     stack: list<string>,
     *     closest: array<string, mixed>|null
     * }
     */
    private function clean(array $raw): array
    {
        $sitemap = $this->list($raw['sitemap'] ?? null)
            ->filter(fn ($page): bool => is_array($page) && filled($page['name'] ?? null))
            ->take(8)
            ->map(fn (array $page): array => [
                'name' => $this->text($page['name'], 40),
                'children' => $this->strings($page['children'] ?? null, 4, 40),
            ])
            ->values()
            ->all();

        $phases = $this->list($raw['phases'] ?? null)
            ->filter(fn ($phase): bool => is_array($phase))
            ->take(3)
            ->values()
            ->map(fn (array $phase, int $index): array => [
                'name' => self::PHASES[$index],
                'goal' => $this->text($phase['goal'] ?? '', 120),
                'features' => $this->strings($phase['features'] ?? null, 6, 80),
            ])
            ->filter(fn (array $phase): bool => $phase['features'] !== [])
            ->values()
            ->all();

        $known = $this->knownTech()->mapWithKeys(fn (string $name): array => [Str::lower($name) => $name]);
        $stack = collect($this->strings($raw['stack'] ?? null, 8, 40))
            ->map(fn (string $name): ?string => $known->get(Str::lower($name)))
            ->filter()
            ->unique()
            ->values()
            ->all();

        $closest = is_string($raw['closest'] ?? null) ? $this->content->project(trim($raw['closest'])) : null;

        return [
            'title' => $this->text($raw['title'] ?? 'Your project', 60),
            'summary' => $this->text($raw['summary'] ?? '', 320),
            'sitemap' => $sitemap,
            'phases' => $phases,
            'questions' => $this->strings($raw['questions'] ?? null, 5, 160),
            'stack' => $stack,
            'closest' => $closest?->toSummaryArray(),
        ];
    }

    /**
     * @return Collection<int, mixed>
     */
    private function list(mixed $value): Collection
    {
        return collect(is_array($value) ? array_values($value) : []);
    }

    /**
     * @return list<string>
     */
    private function strings(mixed $value, int $limit, int $length): array
    {
        return $this->list($value)
            ->filter(fn ($item): bool => is_string($item) && trim($item) !== '')
            ->take($limit)
            ->map(fn (string $item): string => $this->text($item, $length))
            ->values()
            ->all();
    }

    private function text(mixed $value, int $length): string
    {
        return Str::limit(Str::squish(is_string($value) ? $value : ''), $length);
    }
}
