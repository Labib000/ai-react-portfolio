<?php

use App\Content\ContentRepository;
use App\Content\InvalidContentException;
use App\Content\SkillTier;
use Carbon\CarbonImmutable;

function fixtureContent(string $directory = 'content'): ContentRepository
{
    return new ContentRepository(base_path("tests/Fixtures/{$directory}"));
}

it('loads the real content files without errors', function () {
    $content = app(ContentRepository::class);

    expect($content->profile()->name)->not->toBeEmpty()
        ->and($content->experience())->not->toBeEmpty()
        ->and($content->skills())->not->toBeEmpty()
        ->and($content->tools())->not->toBeEmpty()
        ->and($content->services())->not->toBeEmpty()
        ->and($content->process())->not->toBeEmpty()
        ->and($content->faq())->not->toBeEmpty()
        ->and($content->projects())->each->toHaveProperty('slug');
});

it('has a logo file for every tool in content/tools.php', function () {
    $missing = app(ContentRepository::class)->tools()
        ->reject(fn ($tool) => file_exists(resource_path("images/tools/{$tool->icon}.svg"))
            || file_exists(resource_path("images/tools/{$tool->icon}.png")))
        ->pluck('icon')
        ->all();

    expect($missing)->toBe([]);
});

it('parses skills into evidence tiers', function () {
    $skills = fixtureContent()->skills();

    expect($skills->pluck('tier')->all())->toBe([SkillTier::Production, SkillTier::Learning])
        ->and($skills->first()->note)->toBeNull();
});

it('sorts projects by order and skips files starting with an underscore', function () {
    expect(fixtureContent()->projects()->pluck('slug')->all())
        ->toBe(['beta-shop', 'alpha-saas']);
});

it('parses the optional project card fields, with defaults when they are missing', function () {
    $content = fixtureContent();

    expect($content->project('alpha-saas'))
        ->company->toBe('Current Co')
        ->category->toBe('Booking SaaS')
        ->highlights->toBe(['Built the booking engine.'])
        ->metric->toBe(['value' => '25%', 'label' => 'faster checkout'])
        ->and($content->project('beta-shop'))
        ->company->toBeNull()
        ->category->toBe('')
        ->highlights->toBe([])
        ->metric->toBeNull();
});

it('renders the project body as markdown without raw html or unsafe links', function () {
    $project = fixtureContent()->project('beta-shop');

    expect($project->bodyHtml)
        ->toContain('<h2 id="the-problem">The problem</h2>')
        ->toContain('<strong>shop</strong>')
        ->not->toContain('<script>')
        ->not->toContain('javascript:');
});

it('lists the case study sections for a table of contents', function () {
    expect(fixtureContent()->project('beta-shop')->toArray()['sections'])
        ->toBe([['id' => 'the-problem', 'title' => 'The problem']]);
});

it('drops empty links from project and profile output', function () {
    $content = fixtureContent();

    expect($content->project('beta-shop')->toArray()['links'])->toBe(['live' => 'https://example.com'])
        ->and($content->profile()->toArray()['links'])->toBe(['email' => 'test@example.com', 'phone' => '+91 90000 00000', 'whatsapp' => '919000000000', 'github' => 'https://github.com/test']);
});

it('returns null for an unknown project slug', function () {
    expect(fixtureContent()->project('missing'))->toBeNull();
});

it('calculates experience from the career start while a role is current', function (string $asOf, string $expected) {
    expect(fixtureContent()->experienceDuration(CarbonImmutable::parse($asOf)))->toBe($expected);
})->with([
    'under a month' => ['2025-04-20', 'Less than a month'],
    'one month' => ['2025-05-02', '1 month'],
    'exact year' => ['2026-04-01', '1 year'],
    'today' => ['2026-09-29', '1 year 5 months'],
    'January 2027' => ['2027-01-15', '1 year 9 months'],
]);

it('stops counting experience at the last end date when no role is current', function () {
    expect(fixtureContent('content-without-current-role')->experienceDuration(CarbonImmutable::parse('2028-06-01')))
        ->toBe('1 year 9 months');
});

it('names the file when content is invalid', function (string $method, string $file) {
    expect(fn () => fixtureContent('invalid-content')->{$method}())
        ->toThrow(InvalidContentException::class, $file);
})->with([
    'php file missing keys' => ['profile', 'profile.php'],
    'markdown without front matter' => ['projects', 'no-front-matter.md'],
]);
