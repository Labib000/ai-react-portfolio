<?php

namespace App\Content\Data;

final readonly class Tool
{
    /**
     * @param  'development'|'ai'  $row
     */
    public function __construct(
        public string $name,
        public string $icon,
        public string $row,
        public string $brand,
        public bool $resume = true,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public static function fromArray(array $data): self
    {
        return new self(
            name: $data['name'],
            icon: $data['icon'],
            row: $data['row'],
            brand: $data['brand'],
            resume: $data['resume'] ?? true,
        );
    }

    /**
     * @return array{name: string, icon: string, brand: string}
     */
    public function toArray(): array
    {
        return [
            'name' => $this->name,
            'icon' => $this->icon,
            'brand' => $this->brand,
        ];
    }
}
