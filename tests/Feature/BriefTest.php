<?php

use App\Content\ContentRepository;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;

const BRIEF_GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

/**
 * @param  array<string, mixed>|string  $content
 */
function briefResponse(array|string $content): array
{
    return ['choices' => [['message' => ['content' => is_string($content) ? $content : json_encode($content)]]]];
}

/**
 * @return array<string, mixed>
 */
function goodBrief(array $overrides = []): array
{
    return [
        'title' => 'Car rental booking site',
        'summary' => 'A site where customers book cars. Staff manage bookings in an admin panel.',
        'sitemap' => [
            ['name' => 'Home', 'children' => ['Hero', 'Featured cars']],
            ['name' => 'Cars', 'children' => ['Search', 'Filters', 'Car details', 'Compare', 'Too many']],
            ['name' => 'Admin', 'children' => []],
        ],
        'phases' => [
            ['goal' => 'Take bookings', 'features' => ['Car list', 'Booking form']],
            ['goal' => 'Run the business', 'features' => ['Admin panel']],
            ['goal' => 'Grow', 'features' => ['Loyalty points']],
        ],
        'questions' => ['How many cars?', 'Online payments?', 'Which languages?', 'Existing brand?', 'Deposit rules?', 'Sixth question'],
        'stack' => ['Laravel', 'Kubernetes', 'claude'],
        'closest' => 'beta-shop',
        ...$overrides,
    ];
}

function idea(): string
{
    return 'A car rental website where customers can search cars and book them, and I manage bookings from an admin panel.';
}

beforeEach(function () {
    $this->app->instance(ContentRepository::class, new ContentRepository(base_path('tests/Fixtures/content')));
    config(['ai.provider' => 'groq', 'ai.providers.groq.key' => 'test-key']);
});

it('returns a cleaned brief with only real tech and a real closest project', function () {
    Http::fake([BRIEF_GROQ_URL => Http::response(briefResponse(goodBrief()))]);

    $this->postJson(route('services.brief'), ['type' => 'booking', 'idea' => idea()])
        ->assertOk()
        ->assertJsonPath('title', 'Car rental booking site')
        ->assertJsonCount(3, 'sitemap')
        ->assertJsonCount(4, 'sitemap.1.children')
        ->assertJsonPath('phases.0.name', 'MVP')
        ->assertJsonPath('phases.1.name', 'Version 1')
        ->assertJsonPath('phases.2.name', 'Later')
        ->assertJsonCount(5, 'questions')
        ->assertJsonPath('stack', ['Laravel', 'Claude'])
        ->assertJsonPath('closest.slug', 'beta-shop');
});

it('drops a closest project that does not exist', function () {
    Http::fake([BRIEF_GROQ_URL => Http::response(briefResponse(goodBrief(['closest' => 'made-up'])))]);

    $this->postJson(route('services.brief'), ['type' => 'booking', 'idea' => idea()])
        ->assertOk()
        ->assertJsonPath('closest', null);
});

it('sends the type, the idea and the no-prices rule to the model', function () {
    Http::fake([BRIEF_GROQ_URL => Http::response(briefResponse(goodBrief()))]);

    $this->postJson(route('services.brief'), ['type' => 'booking', 'idea' => idea()])->assertOk();

    Http::assertSent(function (Request $request): bool {
        $system = $request['messages'][0]['content'];
        $user = $request['messages'][1]['content'];

        return str_contains($system, 'Never mention prices')
            && str_contains($system, 'beta-shop: Beta Shop')
            && str_contains($user, 'Project type: Booking system')
            && str_contains($user, 'manage bookings from an admin panel');
    });
});

it('rejects invalid input', function (array $payload, string $field) {
    Http::fake();

    $this->postJson(route('services.brief'), $payload)
        ->assertUnprocessable()
        ->assertJsonValidationErrors($field);

    Http::assertNothingSent();
})->with([
    'unknown type' => [['type' => 'spaceship', 'idea' => str_repeat('An idea. ', 10)], 'type'],
    'idea too short' => [['type' => 'website', 'idea' => 'A website'], 'idea'],
    'idea too long' => [['type' => 'website', 'idea' => str_repeat('a', 1001)], 'idea'],
]);

it('returns 503 when the provider fails or the brief is unusable', function (mixed $response) {
    Http::fake([BRIEF_GROQ_URL => $response]);

    $this->postJson(route('services.brief'), ['type' => 'website', 'idea' => idea()])
        ->assertStatus(503)
        ->assertJsonStructure(['message']);
})->with([
    'server error' => fn () => Http::response('Down', 500),
    'not json' => fn () => Http::response(briefResponse('No.')),
    'empty sitemap' => fn () => Http::response(briefResponse(goodBrief(['sitemap' => []]))),
]);

it('limits each visitor to 5 briefs an hour', function () {
    Http::fake([BRIEF_GROQ_URL => Http::response(briefResponse(goodBrief()))]);

    foreach (range(1, 5) as $attempt) {
        $this->postJson(route('services.brief'), ['type' => 'website', 'idea' => idea()." #{$attempt}"])->assertOk();
    }

    $this->postJson(route('services.brief'), ['type' => 'website', 'idea' => idea()])->assertTooManyRequests();
});

it('answers a repeated idea from the cache', function () {
    Http::fake([BRIEF_GROQ_URL => Http::response(briefResponse(goodBrief()))]);

    $this->postJson(route('services.brief'), ['type' => 'website', 'idea' => idea()])->assertOk();
    $this->postJson(route('services.brief'), ['type' => 'website', 'idea' => '  '.strtoupper(idea())])->assertOk();

    Http::assertSentCount(1);
});
