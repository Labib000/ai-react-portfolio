<?php

namespace App\Ai;

use App\Content\ContentRepository;
use App\Content\Data\Experience;
use App\Content\Data\FaqItem;
use App\Content\Data\ProcessStep;
use App\Content\Data\Project;
use App\Content\Data\Service;
use App\Content\Data\Skill;
use App\Content\Data\Tool;
use App\Content\SkillTier;

/**
 * The content files as compact plain text: the only facts the AI features
 * are allowed to use.
 */
class KnowledgePack
{
    public function __construct(private readonly ContentRepository $content) {}

    public function text(): string
    {
        return once(fn (): string => implode("\n\n", array_filter([
            $this->profile(),
            $this->services(),
            $this->process(),
            $this->faq(),
            $this->experience(),
            $this->projects(),
            $this->skills(),
            $this->tools(),
        ])));
    }

    /**
     * Changes whenever any content changes, so cached answers go stale with it.
     */
    public function version(): string
    {
        return hash('xxh128', $this->text());
    }

    private function profile(): string
    {
        $profile = $this->content->profile();

        $lines = [
            '## Profile',
            "Name: {$profile->name} (full name {$profile->fullName})",
            "Role: {$profile->role}, based in {$profile->location}",
            "Professional experience: {$this->content->experienceDuration()}, since {$profile->careerStartedAt->format('F Y')}",
            "Summary: {$profile->bio}",
        ];

        foreach ($profile->impact as $impact) {
            $detail = $impact['detail'] ? " ({$impact['detail']})" : '';
            $lines[] = "Result: {$impact['value']}{$impact['suffix']} {$impact['label']}{$detail}";
        }

        foreach ($profile->education as $education) {
            $grade = $education['grade'] ? ", {$education['grade']}" : '';
            $lines[] = "Education: {$education['degree']}, {$education['institution']}, graduated {$education['graduated']}{$grade}";
        }

        foreach ($profile->courses as $course) {
            $lines[] = "Course ({$course['status']}): {$course['title']}, {$course['provider']}";
        }

        return implode("\n", $lines);
    }

    private function services(): string
    {
        $services = $this->content->services()->map(function (Service $service): string {
            $badge = $service->badge ? " ({$service->badge})" : '';

            $metric = $service->metric ? "{$service->metric['value']} {$service->metric['label']}. " : '';
            $for = $service->for ? " Best for: {$service->for}." : '';
            $proof = $service->proof ? " Evidence: {$metric}{$service->proof}." : '';

            return "- {$service->title}{$badge}: {$service->summary} Includes: ".implode('; ', $service->points).'. Stack: '.implode(', ', $service->stack).".{$for}{$proof}";
        });

        return $services->isEmpty() ? '' : "## What he builds for clients\n".$services->implode("\n");
    }

    private function process(): string
    {
        $steps = $this->content->process()->values()->map(function (ProcessStep $step, int $index): string {
            $loop = $step->loop ? " ({$step->loop})" : '';

            return ($index + 1).". {$step->title}{$loop}: {$step->summary} Client gets: {$step->deliverable}.";
        });

        return $steps->isEmpty() ? '' : "## How he works (waterfall model)\n".$steps->implode("\n");
    }

    private function faq(): string
    {
        $items = $this->content->faq()->map(fn (FaqItem $item): string => "Q: {$item->question}\nA: {$item->answer}");

        return $items->isEmpty() ? '' : "## FAQ for clients\n".$items->implode("\n");
    }

    private function experience(): string
    {
        return $this->content->experience()
            ->map(function (Experience $role): string {
                $data = $role->toArray();
                $lines = ["## {$role->title}, {$role->company} ({$data['period']}, {$role->type})"];

                if ($role->tools !== []) {
                    $lines[] = 'Tools: '.implode(', ', $role->tools);
                }

                foreach ($role->highlights as $highlight) {
                    $lines[] = "- {$highlight}";
                }

                return implode("\n", $lines);
            })
            ->implode("\n\n");
    }

    private function projects(): string
    {
        return $this->content->projects()
            ->map(fn (Project $project): string => $this->projectFacts($project))
            ->implode("\n\n");
    }

    /**
     * One project's facts plus its case study, for the project assistant.
     */
    public function project(string $slug): ?string
    {
        $project = $this->content->project($slug);

        if (! $project) {
            return null;
        }

        $caseStudy = trim(html_entity_decode(strip_tags(str_replace('</h2>', ":\n", $project->bodyHtml))));

        return $this->projectFacts($project)."\n\n## Case study\n".$caseStudy;
    }

    /**
     * A short line about Labib, so project answers can say who built it.
     */
    public function summary(): string
    {
        $profile = $this->content->profile();

        return "{$profile->name} is a {$profile->role} in {$profile->location} with {$this->content->experienceDuration()} of professional experience. {$profile->bio}";
    }

    private function projectFacts(Project $project): string
    {
        $company = $project->company ? ", built at {$project->company}" : '';
        $lines = ["## Project: {$project->title} ({$project->category}{$company}, {$project->year})"];
        $lines[] = $project->summary;
        $lines[] = "His role: {$project->role}";
        $lines[] = 'Stack: '.implode(', ', $project->stack);

        foreach ($project->highlights as $highlight) {
            $lines[] = "- {$highlight}";
        }

        if ($project->metric) {
            $lines[] = "Result: {$project->metric['value']} {$project->metric['label']}";
        }

        if (! empty($project->links['live'])) {
            $lines[] = "Live site: {$project->links['live']}";
        }

        return implode("\n", $lines);
    }

    private function skills(): string
    {
        $headings = [
            SkillTier::Production->value => 'Used in paid, production work',
            SkillTier::Projects->value => 'Used in own projects, not yet in a paid job',
            SkillTier::Learning->value => 'Currently learning, not yet used in real work',
        ];

        $groups = [];

        foreach (SkillTier::cases() as $tier) {
            $skills = $this->content->skills()
                ->filter(fn (Skill $skill): bool => $skill->tier === $tier)
                ->map(fn (Skill $skill): string => $skill->note ? "{$skill->name} ({$skill->note})" : $skill->name);

            if ($skills->isNotEmpty()) {
                $groups[] = "## Skills: {$headings[$tier->value]}\n".$skills->implode(', ');
            }
        }

        return implode("\n\n", $groups);
    }

    private function tools(): string
    {
        $tools = $this->content->tools()->map(fn (Tool $tool): string => $tool->name);

        return $tools->isEmpty() ? '' : "## Other tools he uses\n".$tools->implode(', ');
    }
}
