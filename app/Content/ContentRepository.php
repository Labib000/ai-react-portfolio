<?php

namespace App\Content;

use App\Content\Data\Experience;
use App\Content\Data\FaqItem;
use App\Content\Data\LabSample;
use App\Content\Data\ProcessStep;
use App\Content\Data\Profile;
use App\Content\Data\Project;
use App\Content\Data\Service;
use App\Content\Data\Skill;
use App\Content\Data\Tool;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use InvalidArgumentException;
use Symfony\Component\Yaml\Yaml;
use Throwable;

/**
 * Reads the site content from the files in content/. Every page and every
 * AI feature gets its facts from here, so they can never disagree.
 */
class ContentRepository
{
    public function __construct(private readonly string $path) {}

    public function profile(): Profile
    {
        return once(fn () => $this->load(
            'profile.php',
            fn (array $data): Profile => Profile::fromArray($data),
        ));
    }

    /**
     * @return Collection<int, Experience>
     */
    public function experience(): Collection
    {
        return once(fn () => $this->load(
            'experience.php',
            fn (array $rows): Collection => collect($rows)->map(fn (array $row) => Experience::fromArray($row))->values(),
        ));
    }

    /**
     * @return Collection<int, Skill>
     */
    public function skills(): Collection
    {
        return once(fn () => $this->load(
            'skills.php',
            fn (array $rows): Collection => collect($rows)->map(fn (array $row) => Skill::fromArray($row))->values(),
        ));
    }

    /**
     * @return Collection<int, Tool>
     */
    public function tools(): Collection
    {
        return once(fn () => $this->load(
            'tools.php',
            fn (array $rows): Collection => collect($rows)->map(fn (array $row) => Tool::fromArray($row))->values(),
        ));
    }

    /**
     * The two logo rows under the hero, development first.
     *
     * @return list<array{row: string, label: string, tools: list<array{name: string, icon: string, brand: string}>}>
     */
    public function toolRows(): array
    {
        $labels = [
            'development' => 'Development and workflow tools',
            'ai' => 'AI, Gen AI and design tools',
        ];

        $rows = [];

        foreach ($labels as $row => $label) {
            $tools = array_values($this->tools()
                ->filter(fn (Tool $tool) => $tool->row === $row)
                ->map(fn (Tool $tool) => $tool->toArray())
                ->all());

            if ($tools !== []) {
                $rows[] = ['row' => $row, 'label' => $label, 'tools' => $tools];
            }
        }

        return $rows;
    }

    /**
     * @return Collection<int, FaqItem>
     */
    public function faq(): Collection
    {
        return once(fn () => $this->load(
            'faq.php',
            fn (array $rows): Collection => collect($rows)->map(fn (array $row) => FaqItem::fromArray($row))->values(),
        ));
    }

    /**
     * The sample businesses for the AI Lab demo.
     *
     * @return Collection<int, LabSample>
     */
    public function labSamples(): Collection
    {
        return once(fn () => $this->load(
            'lab-samples.php',
            fn (array $rows): Collection => collect($rows)->map(fn (array $row) => LabSample::fromArray($row))->values(),
        ));
    }

    /**
     * @return Collection<int, ProcessStep>
     */
    public function process(): Collection
    {
        return once(fn () => $this->load(
            'process.php',
            fn (array $rows): Collection => collect($rows)->map(fn (array $row) => ProcessStep::fromArray($row))->values(),
        ));
    }

    /**
     * @return Collection<int, Service>
     */
    public function services(): Collection
    {
        return once(fn () => $this->load(
            'services.php',
            fn (array $rows): Collection => collect($rows)->map(fn (array $row) => Service::fromArray($row))->values(),
        ));
    }

    /**
     * Projects sorted by their "order" value, then title. Files starting with
     * an underscore (like _template.md) are ignored.
     *
     * @return Collection<int, Project>
     */
    public function projects(): Collection
    {
        return once(fn () => collect(File::glob($this->path.'/projects/*.md'))
            ->reject(fn (string $file) => str_starts_with(basename($file), '_'))
            ->map(fn (string $file) => $this->parseProject($file))
            ->sortBy([['order', 'asc'], ['title', 'asc']])
            ->values());
    }

    public function project(string $slug): ?Project
    {
        return $this->projects()->firstWhere('slug', $slug);
    }

    /**
     * When a content file last changed, for the sitemap's lastmod. With no
     * file, the newest change across all content.
     */
    public function modifiedAt(?string $file = null): CarbonImmutable
    {
        $files = $file !== null
            ? [$this->path.'/'.$file]
            : [...File::glob($this->path.'/*.php'), ...File::glob($this->path.'/projects/*.md')];

        $timestamps = array_map(fn (string $path): int => File::exists($path) ? File::lastModified($path) : 0, $files);

        return CarbonImmutable::createFromTimestamp(max([0, ...$timestamps]));
    }

    /**
     * Human-readable time since the career start date, e.g. "1 year 5 months".
     * Stops counting at the last end date once no role is current.
     */
    public function experienceDuration(?CarbonInterface $asOf = null): string
    {
        $asOf ??= now();
        $experience = $this->experience();

        $until = $experience->contains(fn (Experience $role) => $role->isCurrent())
            ? $asOf
            : ($experience->max(fn (Experience $role) => $role->end) ?? $asOf);

        $months = (int) $this->profile()->careerStartedAt->diffInMonths($until);
        $years = intdiv($months, 12);
        $remainingMonths = $months % 12;

        $parts = array_filter([
            $years > 0 ? $years.' '.Str::plural('year', $years) : null,
            $remainingMonths > 0 ? $remainingMonths.' '.Str::plural('month', $remainingMonths) : null,
        ]);

        return $parts === [] ? 'Less than a month' : implode(' ', $parts);
    }

    /**
     * @template T
     *
     * @param  callable(array<mixed>): T  $map
     * @return T
     */
    private function load(string $file, callable $map): mixed
    {
        $path = $this->path.'/'.$file;

        try {
            return $map(File::getRequire($path));
        } catch (Throwable $e) {
            throw InvalidContentException::in($path, $e);
        }
    }

    private function parseProject(string $file): Project
    {
        try {
            if (! preg_match('/\A---\R(.*?)\R---\R?(.*)\z/s', File::get($file), $matches)) {
                throw new InvalidArgumentException('Missing YAML front matter between --- lines.');
            }

            return Project::fromArray(
                slug: basename($file, '.md'),
                meta: Yaml::parse($matches[1]),
                bodyHtml: $this->withHeadingIds(Str::markdown($matches[2], [
                    'html_input' => 'strip',
                    'allow_unsafe_links' => false,
                ])),
            );
        } catch (Throwable $e) {
            throw InvalidContentException::in($file, $e);
        }
    }

    /**
     * Gives each h2 in a case study an id, so the page can link to it.
     */
    private function withHeadingIds(string $html): string
    {
        return preg_replace_callback(
            '#<h2>(.*?)</h2>#s',
            fn (array $match): string => '<h2 id="'.Str::slug(strip_tags($match[1])).'">'.$match[1].'</h2>',
            $html,
        ) ?? $html;
    }
}
