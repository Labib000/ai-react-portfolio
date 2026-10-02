<?php

namespace App\Content;

enum SkillTier: string
{
    case Production = 'production';
    case Projects = 'projects';
    case Learning = 'learning';

    public function label(): string
    {
        return match ($this) {
            self::Production => 'In production',
            self::Projects => 'Built projects with',
            self::Learning => 'Currently learning',
        };
    }
}
