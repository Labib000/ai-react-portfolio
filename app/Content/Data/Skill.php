<?php

namespace App\Content\Data;

use App\Content\SkillTier;

final readonly class Skill
{
    /**
     * @param  list<string>  $projects  Slugs of projects that prove the skill.
     * @param  string  $group  Resume section: backend, frontend, data, ai or cms.
     */
    public function __construct(
        public string $name,
        public SkillTier $tier,
        public ?string $note,
        public array $projects,
        public string $group,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public static function fromArray(array $data): self
    {
        return new self(
            name: $data['name'],
            tier: SkillTier::from($data['tier']),
            note: $data['note'] ?? null,
            projects: $data['projects'] ?? [],
            group: $data['group'] ?? 'other',
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'name' => $this->name,
            'tier' => $this->tier->value,
            'note' => $this->note,
            'projects' => $this->projects,
            'group' => $this->group,
        ];
    }
}
