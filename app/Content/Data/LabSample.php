<?php

namespace App\Content\Data;

/**
 * A made-up business for the AI Lab demo: what the assistant knows about it
 * and the questions offered as starters.
 */
final readonly class LabSample
{
    /**
     * @param  list<string>  $starters
     */
    public function __construct(
        public string $slug,
        public string $name,
        public string $kind,
        public string $icon,
        public string $knowledge,
        public array $starters,
        public ?string $related,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public static function fromArray(array $data): self
    {
        return new self(
            slug: $data['slug'],
            name: $data['name'],
            kind: $data['kind'],
            icon: $data['icon'],
            knowledge: trim($data['knowledge']),
            starters: array_values($data['starters']),
            related: $data['related'] ?? null,
        );
    }

    /**
     * @return array{slug: string, name: string, kind: string, icon: string, knowledge: string, starters: list<string>, related: string|null}
     */
    public function toArray(): array
    {
        return [
            'slug' => $this->slug,
            'name' => $this->name,
            'kind' => $this->kind,
            'icon' => $this->icon,
            'knowledge' => $this->knowledge,
            'starters' => $this->starters,
            'related' => $this->related,
        ];
    }
}
