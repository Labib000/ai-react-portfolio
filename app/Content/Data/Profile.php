<?php

namespace App\Content\Data;

use Carbon\CarbonImmutable;

final readonly class Profile
{
    /**
     * @param  array{default: string, recruiter: string, client: string}  $headlines
     * @param  list<array{value: int, suffix: string, label: string, detail: string|null, tags?: list<string>}>  $impact
     * @param  array<string, string|null>  $links
     * @param  list<array{degree: string, institution: string, graduated: string, grade: string|null}>  $education
     * @param  list<array{title: string, provider: string, status: 'ongoing'|'completed'}>  $courses
     */
    public function __construct(
        public string $name,
        public string $fullName,
        public string $role,
        public string $location,
        public CarbonImmutable $careerStartedAt,
        public string $bio,
        public string $intro,
        public array $headlines,
        public array $impact,
        public array $links,
        public array $education,
        public array $courses,
        public ?string $resumePdf = null,
        public ?string $website = null,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public static function fromArray(array $data): self
    {
        return new self(
            name: $data['name'],
            fullName: $data['full_name'],
            role: $data['role'],
            location: $data['location'],
            careerStartedAt: CarbonImmutable::createFromFormat('!Y-m', $data['career_started_at']),
            bio: $data['bio'],
            intro: $data['intro'],
            headlines: $data['headlines'],
            impact: $data['impact'] ?? [],
            links: $data['links'] ?? [],
            education: $data['education'] ?? [],
            courses: $data['courses'] ?? [],
            resumePdf: $data['resume_pdf'] ?? null,
            website: $data['website'] ?? null,
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'name' => $this->name,
            'fullName' => $this->fullName,
            'role' => $this->role,
            'location' => $this->location,
            'bio' => $this->bio,
            'intro' => $this->intro,
            'headlines' => $this->headlines,
            'impact' => $this->impact,
            'links' => array_filter($this->links),
            'education' => $this->education,
            'courses' => $this->courses,
        ];
    }
}
