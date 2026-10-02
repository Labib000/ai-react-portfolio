<?php

namespace App\Content\Data;

final readonly class ProcessStep
{
    public function __construct(
        public string $title,
        public string $summary,
        public string $deliverable,
        public string $icon,
        public ?string $loop,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public static function fromArray(array $data): self
    {
        return new self(
            title: $data['title'],
            summary: $data['summary'],
            deliverable: $data['deliverable'],
            icon: $data['icon'],
            loop: $data['loop'] ?? null,
        );
    }

    /**
     * @return array{title: string, summary: string, deliverable: string, icon: string, loop: string|null}
     */
    public function toArray(): array
    {
        return [
            'title' => $this->title,
            'summary' => $this->summary,
            'deliverable' => $this->deliverable,
            'icon' => $this->icon,
            'loop' => $this->loop,
        ];
    }
}
