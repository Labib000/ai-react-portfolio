<?php

use App\Content\ContentRepository;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;

const GROQ_COMPLETIONS = 'https://api.groq.com/openai/v1/chat/completions';

/**
 * @param  array<string, mixed>|string  $content
 */
function groqJson(array|string $content): array
{
    return ['choices' => [['message' => ['content' => is_string($content) ? $content : json_encode($content)]]]];
}

function jobDescription(): string
{
    return 'We are hiring a backend developer with strong Laravel experience, Java knowledge and Kubernetes for deployments. You will build REST APIs.';
}

beforeEach(function () {
    $this->app->instance(ContentRepository::class, new ContentRepository(base_path('tests/Fixtures/content')));
    config(['ai.provider' => 'groq', 'ai.providers.groq.key' => 'test-key']);
});

it('scores each requirement from the content files, not from the model', function () {
    Http::fake([GROQ_COMPLETIONS => Http::response(groqJson([
        'summary' => 'Strong on Laravel, learning Java, no Kubernetes yet.',
        'requirements' => [
            ['requirement' => 'Laravel', 'skill' => 'Laravel', 'evidence' => 'Used at Current Co.', 'company' => 'Current Co'],
            ['requirement' => 'Java', 'skill' => 'java', 'evidence' => 'Learning it.', 'tier' => 'production'],
            ['requirement' => 'Kubernetes', 'skill' => 'Kubernetes', 'evidence' => 'Not in his background.'],
            ['requirement' => 'AI features', 'skill' => 'Claude', 'evidence' => 'Built with it.', 'project' => 'alpha-saas'],
        ],
    ]))]);

    $this->postJson(route('resume.match'), ['description' => jobDescription()])
        ->assertOk()
        ->assertJsonPath('requirements.0.tier', 'production')
        ->assertJsonPath('requirements.0.link', ['label' => 'Role at Current Co', 'href' => '/#experience'])
        ->assertJsonPath('requirements.1.tier', 'learning')
        ->assertJsonPath('requirements.1.skill', 'Java')
        ->assertJsonPath('requirements.2.tier', 'gap')
        ->assertJsonPath('requirements.2.skill', null)
        ->assertJsonPath('requirements.3.tier', 'projects')
        ->assertJsonPath('requirements.3.link.href', '/work/alpha-saas')
        ->assertJsonPath('counts', ['production' => 1, 'projects' => 1, 'learning' => 1, 'gap' => 1])
        // (1 + 0.35 + 0 + 0.75) / 4 = 52.5% → 53
        ->assertJsonPath('fit', ['score' => 53, 'label' => 'Partial fit']);
});

it('drops links to projects and companies that do not exist', function () {
    Http::fake([GROQ_COMPLETIONS => Http::response(groqJson([
        'summary' => 'Fit.',
        'requirements' => [
            ['requirement' => 'Laravel', 'skill' => 'Laravel', 'evidence' => 'Yes.', 'project' => 'made-up', 'company' => 'Google'],
        ],
    ]))]);

    $this->postJson(route('resume.match'), ['description' => jobDescription()])
        ->assertOk()
        ->assertJsonPath('requirements.0.link', null);
});

it('sends the skill list and the job description to the model', function () {
    Http::fake([GROQ_COMPLETIONS => Http::response(groqJson(['summary' => 'Ok.', 'requirements' => [
        ['requirement' => 'Laravel', 'skill' => 'Laravel', 'evidence' => 'Yes.'],
    ]]))]);

    $this->postJson(route('resume.match'), ['description' => jobDescription()])->assertOk();

    Http::assertSent(function (Request $request): bool {
        return $request['response_format'] === ['type' => 'json_object']
            && str_contains($request['messages'][0]['content'], 'SKILL LIST: Laravel, Java, Claude')
            && str_contains($request['messages'][0]['content'], 'beta-shop (Beta Shop)')
            && str_contains($request['messages'][1]['content'], 'Kubernetes for deployments');
    });
});

it('rejects job descriptions that are too short or too long', function (string $description) {
    Http::fake();

    $this->postJson(route('resume.match'), ['description' => $description])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('description');

    Http::assertNothingSent();
})->with([
    'too short' => ['Laravel dev'],
    'too long' => [str_repeat('a', 6001)],
]);

it('returns 503 when the provider fails or sends back something unusable', function (mixed $response) {
    Http::fake([GROQ_COMPLETIONS => $response]);

    $this->postJson(route('resume.match'), ['description' => jobDescription()])
        ->assertStatus(503)
        ->assertJsonStructure(['message']);
})->with([
    'server error' => fn () => Http::response('Down', 500),
    'not json' => fn () => Http::response(groqJson('Sorry, I cannot help with that.')),
    'no requirements' => fn () => Http::response(groqJson(['summary' => 'Hmm.', 'requirements' => []])),
]);

it('limits each visitor to 5 matches an hour', function () {
    Http::fake([GROQ_COMPLETIONS => Http::response(groqJson(['summary' => 'Ok.', 'requirements' => [
        ['requirement' => 'Laravel', 'skill' => 'Laravel', 'evidence' => 'Yes.'],
    ]]))]);

    foreach (range(1, 5) as $attempt) {
        $this->postJson(route('resume.match'), ['description' => jobDescription()." #{$attempt}"])->assertOk();
    }

    $this->postJson(route('resume.match'), ['description' => jobDescription()])->assertTooManyRequests();
});

it('answers a repeated job description from the cache', function () {
    Http::fake([GROQ_COMPLETIONS => Http::response(groqJson(['summary' => 'Ok.', 'requirements' => [
        ['requirement' => 'Laravel', 'skill' => 'Laravel', 'evidence' => 'Yes.'],
    ]]))]);

    $this->postJson(route('resume.match'), ['description' => jobDescription()])->assertOk();
    $this->postJson(route('resume.match'), ['description' => '  '.strtoupper(jobDescription())])->assertOk();

    Http::assertSentCount(1);
});
