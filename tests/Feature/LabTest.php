<?php

use App\Content\ContentRepository;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Testing\TestResponse;
use Inertia\Testing\AssertableInertia as Assert;

const LAB_GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

/**
 * A Groq-style event stream that sends the given text chunks.
 */
function labStream(string ...$chunks): string
{
    $events = array_map(
        fn (string $chunk): string => 'data: '.json_encode(['choices' => [['delta' => ['content' => $chunk]]]])."\n\n",
        $chunks,
    );

    return implode('', $events)."data: [DONE]\n\n";
}

/**
 * @param  array<string, mixed>  $payload
 */
function labChat(array $payload = []): TestResponse
{
    return test()->postJson(route('lab.chat'), [
        'messages' => [['role' => 'user', 'content' => 'Do you need a deposit?']],
        'sample' => 'test-rentals',
        ...$payload,
    ]);
}

beforeEach(function () {
    $this->app->instance(ContentRepository::class, new ContentRepository(base_path('tests/Fixtures/content')));
    config(['ai.provider' => 'groq', 'ai.providers.groq.key' => 'test-key']);
});

it('renders the lab with its sample businesses', function () {
    $this->get(route('lab'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('ai-lab')
            ->has('samples', 2)
            ->where('samples.0.name', 'Test Rentals')
            ->where('samples.0.starters.1', 'Do you offer financing?')
            ->where('samples.0.related', ['slug' => 'alpha-saas', 'title' => 'Alpha SaaS'])
            ->where('samples.1.related', null)
            ->where('knowledgeMax', 3000)
        );
});

it('answers from the chosen sample business', function () {
    Http::fake([LAB_GROQ_URL => Http::response(labStream('No deposit is needed.', "\n[source: \"No deposit is needed.\"]"))]);

    expect(labChat()->assertOk()->streamedContent())
        ->toContain('data: {"text":"No deposit is needed."}')
        ->not->toContain('event: error');

    Http::assertSent(fn (Request $request): bool => str_contains($request['messages'][0]['content'], 'called "Test Rentals"')
        && str_contains($request['messages'][0]['content'], 'A sedan costs 100 per day.')
        && ! str_contains($request['messages'][0]['content'], '{{knowledge}}')
        && $request['messages'][1] === ['role' => 'user', 'content' => 'Do you need a deposit?']);
});

it('answers from pasted business text without caching it', function () {
    Http::fake([LAB_GROQ_URL => Http::response(labStream('We open at 8.'))]);
    $knowledge = 'Corner Bakery opens at 8 am every day and sells fresh bread, cakes and coffee.';

    labChat(['sample' => null, 'knowledge' => $knowledge, 'business' => 'Corner Bakery'])->assertOk()->streamedContent();
    labChat(['sample' => null, 'knowledge' => $knowledge, 'business' => 'Corner Bakery'])->assertOk()->streamedContent();

    Http::assertSentCount(2);
    Http::assertSent(fn (Request $request): bool => str_contains($request['messages'][0]['content'], 'called "Corner Bakery"')
        && str_contains($request['messages'][0]['content'], $knowledge));
});

it('caches opening answers about a sample', function () {
    Http::fake([LAB_GROQ_URL => Http::response(labStream('No deposit.'))]);

    labChat()->streamedContent();
    expect(labChat()->streamedContent())->toContain('No deposit.');

    Http::assertSentCount(1);
});

it('rejects invalid requests', function (array $payload, string $field) {
    labChat($payload)->assertUnprocessable()->assertJsonValidationErrors($field);
})->with([
    'no business' => [['sample' => null], 'sample'],
    'unknown sample' => [['sample' => 'made-up'], 'sample'],
    'pasted text too short' => [['sample' => null, 'knowledge' => 'Too short.'], 'knowledge'],
    'pasted text too long' => [['sample' => null, 'knowledge' => str_repeat('a', 3001)], 'knowledge'],
    'question too long' => [['messages' => [['role' => 'user', 'content' => str_repeat('a', 501)]]], 'messages.0.content'],
]);

it('sends an error event when the provider fails', function () {
    Http::fake([LAB_GROQ_URL => Http::response('Server error', 500)]);

    expect(labChat()->assertOk()->streamedContent())->toContain('event: error');
});

it('limits each visitor to 30 questions an hour', function () {
    Http::fake([LAB_GROQ_URL => Http::response(labStream('Yes.'))]);

    foreach (range(1, 30) as $attempt) {
        labChat(['messages' => [['role' => 'user', 'content' => "Question {$attempt}?"]]])->assertOk();
    }

    labChat()->assertTooManyRequests();
});
