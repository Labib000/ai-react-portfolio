<?php

namespace App\Content\Data;

final readonly class Service
{
    /**
     * @param  list<string>  $points
     * @param  list<string>  $stack  Tool names; ones in content/tools.php get their logo.
     * @param  list<string>  $icons  Tool logo file names, or whatsapp, telegram, gauge or diagram.
     * @param  array{value: string, label: string}|null  $metric
     * @param  string|null  $example  Slug of a case study that shows this service.
     */
    public function __construct(
        public string $title,
        public string $summary,
        public array $points,
        public array $stack,
        public array $icons,
        public ?string $badge,
        public ?string $for,
        public ?string $proof,
        public ?array $metric,
        public ?string $example = null,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public static function fromArray(array $data): self
    {
        return new self(
            title: $data['title'],
            summary: $data['summary'],
            points: $data['points'] ?? [],
            stack: $data['stack'] ?? [],
            icons: $data['icons'] ?? [],
            badge: $data['badge'] ?? null,
            for: $data['for'] ?? null,
            proof: $data['proof'] ?? null,
            metric: $data['metric'] ?? null,
            example: $data['example'] ?? null,
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'title' => $this->title,
            'summary' => $this->summary,
            'points' => $this->points,
            'stack' => $this->stack,
            'icons' => $this->icons,
            'badge' => $this->badge,
            'for' => $this->for,
            'proof' => $this->proof,
            'metric' => $this->metric,
            'example' => $this->example,
        ];
    }
}
