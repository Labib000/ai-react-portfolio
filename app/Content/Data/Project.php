<?php

namespace App\Content\Data;

final readonly class Project
{
    /**
     * @param  'client'|'saas'|'personal'  $type
     * @param  list<string>  $stack
     * @param  array{live?: string|null, admin?: string|null, repo?: string|null}  $links
     * @param  list<string>  $highlights
     * @param  array{value: string, label: string}|null  $metric
     */
    public function __construct(
        public string $slug,
        public string $title,
        public string $summary,
        public string $type,
        public int $year,
        public string $role,
        public array $stack,
        public bool $featured,
        public int $order,
        public array $links,
        public ?string $cover,
        public string $bodyHtml,
        public ?string $company,
        public string $category,
        public array $highlights,
        public ?array $metric,
    ) {}

    /**
     * @param  array<string, mixed>  $meta  Parsed YAML front matter.
     */
    public static function fromArray(string $slug, array $meta, string $bodyHtml): self
    {
        return new self(
            slug: $slug,
            title: $meta['title'],
            summary: $meta['summary'],
            type: $meta['type'],
            year: (int) $meta['year'],
            role: $meta['role'],
            stack: $meta['stack'] ?? [],
            featured: (bool) ($meta['featured'] ?? false),
            order: (int) ($meta['order'] ?? 100),
            links: $meta['links'] ?? [],
            cover: $meta['cover'] ?? null,
            bodyHtml: $bodyHtml,
            company: $meta['company'] ?? null,
            category: $meta['category'] ?? '',
            highlights: $meta['highlights'] ?? [],
            metric: isset($meta['metric']) ? ['value' => (string) $meta['metric']['value'], 'label' => $meta['metric']['label']] : null,
        );
    }

    /**
     * Card-sized data for lists; excludes the case study body.
     *
     * @return array<string, mixed>
     */
    public function toSummaryArray(): array
    {
        return [
            'slug' => $this->slug,
            'title' => $this->title,
            'summary' => $this->summary,
            'type' => $this->type,
            'year' => $this->year,
            'stack' => $this->stack,
            'cover' => $this->cover,
            'featured' => $this->featured,
            'company' => $this->company,
            'category' => $this->category,
            'role' => $this->role,
            'highlights' => $this->highlights,
            'metric' => $this->metric,
            'links' => array_filter($this->links),
        ];
    }

    /**
     * The case study's h2 headings, for a table of contents.
     *
     * @return list<array{id: string, title: string}>
     */
    public function sections(): array
    {
        preg_match_all('#<h2 id="([^"]+)">(.*?)</h2>#s', $this->bodyHtml, $matches, PREG_SET_ORDER);

        return array_map(
            fn (array $match): array => ['id' => $match[1], 'title' => html_entity_decode(strip_tags($match[2]))],
            $matches,
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            ...$this->toSummaryArray(),
            'sections' => $this->sections(),
            'bodyHtml' => $this->bodyHtml,
        ];
    }
}
