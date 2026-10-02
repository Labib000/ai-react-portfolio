<?php

namespace App\Content\Data;

use Carbon\CarbonImmutable;

final readonly class Experience
{
    /**
     * @param  'full-time'|'internship'  $type
     * @param  list<string>  $tools
     * @param  list<string>  $highlights
     * @param  array{value: string, label: string}|null  $metric
     */
    public function __construct(
        public string $company,
        public string $title,
        public string $type,
        public CarbonImmutable $start,
        public ?CarbonImmutable $end,
        public array $tools,
        public array $highlights,
        public ?array $metric,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public static function fromArray(array $data): self
    {
        return new self(
            company: $data['company'],
            title: $data['title'],
            type: $data['type'],
            start: CarbonImmutable::createFromFormat('!Y-m', $data['start']),
            end: $data['end'] === null ? null : CarbonImmutable::createFromFormat('!Y-m', $data['end'])->endOfMonth(),
            tools: $data['tools'] ?? [],
            highlights: $data['highlights'] ?? [],
            metric: $data['metric'] ?? null,
        );
    }

    public function isCurrent(): bool
    {
        return $this->end === null;
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'company' => $this->company,
            'title' => $this->title,
            'type' => $this->type,
            'period' => $this->start->format('M Y').' to '.($this->end?->format('M Y') ?? 'Present'),
            'isCurrent' => $this->isCurrent(),
            'tools' => $this->tools,
            'highlights' => $this->highlights,
            'metric' => $this->metric,
        ];
    }
}
