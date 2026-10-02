<?php

use App\Content\ContentRepository;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Testing\TestResponse;

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

/**
 * A Groq-style event stream that sends the given text chunks.
 */
function groqStream(string ...$chunks): string
{
    $events = array_map(
        fn (string $chunk): string => 'data: '.json_encode(['choices' => [['delta' => ['content' => $chunk]]]])."\n\n",
        $chunks,
    );

    return implode('', $events)."data: [DONE]\n\n";
}

/**
 * @param  list<array{role: string, content: string}>|null  $messages
 */
function ask(?array $messages = null): TestResponse
{
    return test()->postJson(route('ask'), [
        'messages' => $messages ?? [['role' => 'user', 'content' => 'What has he built with Laravel?']],
    ]);
}

beforeEach(function () {
    $this->app->instance(ContentRepository::class, new ContentRepository(base_path('tests/Fixtures/content')));
    config(['ai.provider' => 'groq', 'ai.providers.groq.key' => 'test-key']);
});

it('streams the answer from the provider', function () {
    Http::fake([GROQ_URL => Http::response(groqStream('He built ', 'booking systems.'))]);

    $content = ask()->assertOk()->streamedContent();

    expect($content)
        ->toContain('data: {"text":"He built "}')
        ->toContain('data: {"text":"booking systems."}')
        ->not->toContain('event: error');
});

it('grounds the prompt in the content files and passes the conversation along', function () {
    Http::fake([GROQ_URL => Http::response(groqStream('Yes.'))]);

    ask([
        ['role' => 'user', 'content' => 'Where does he work?'],
        ['role' => 'assistant', 'content' => 'At Current Co.'],
        ['role' => 'user', 'content' => 'Since when?'],
    ])->streamedContent();

    Http::assertSent(function (Request $request): bool {
        $messages = $request['messages'];

        return $request->hasHeader('Authorization', 'Bearer test-key')
            && $messages[0]['role'] === 'system'
            && str_contains($messages[0]['content'], 'Test Person')
            && str_contains($messages[0]['content'], 'Developer, Current Co')
            && str_contains($messages[0]['content'], 'Java (Course)')
            && str_contains($messages[0]['content'], "## How he works (waterfall model)\n1. Planning (Unlimited iterations): Agree the scope.")
            && str_contains($messages[0]['content'], '## Project: Alpha SaaS (Booking SaaS, built at Current Co, 2024)')
            && str_contains($messages[0]['content'], '- MERN stack apps: Delivered production-ready. Includes: REST APIs; React frontends. Stack: MongoDB, React. Best for: Startups. Evidence: Built end to end.')
            && ! str_contains($messages[0]['content'], '{{knowledge}}')
            && count($messages) === 4
            && $messages[3] === ['role' => 'user', 'content' => 'Since when?'];
    });
});

it('keeps answers to one project on case study pages', function () {
    Http::fake([GROQ_URL => Http::response(groqStream('It is a shop.'))]);

    test()->postJson(route('ask'), [
        'project' => 'beta-shop',
        'messages' => [['role' => 'user', 'content' => 'What is it?']],
    ])->assertOk()->streamedContent();

    Http::assertSent(function (Request $request): bool {
        $system = $request['messages'][0]['content'];

        return str_contains($system, '## Project: Beta Shop')
            && str_contains($system, 'Needed a shop.')
            && str_contains($system, 'Test Person')
            && ! str_contains($system, '## Project: Alpha SaaS');
    });
});

it('caches project answers separately from the home assistant', function () {
    Http::fake([GROQ_URL => Http::response(groqStream('Answer.'))]);
    $question = [['role' => 'user', 'content' => 'What is it?']];

    test()->postJson(route('ask'), ['messages' => $question])->streamedContent();
    test()->postJson(route('ask'), ['project' => 'beta-shop', 'messages' => $question])->streamedContent();

    Http::assertSentCount(2);
});

it('rejects an unknown project', function () {
    test()->postJson(route('ask'), [
        'project' => 'nope',
        'messages' => [['role' => 'user', 'content' => 'What is it?']],
    ])->assertUnprocessable()->assertJsonValidationErrors('project');
});

it('rejects invalid conversations', function (array $messages) {
    Http::fake();

    ask($messages)->assertUnprocessable()->assertJsonValidationErrors('messages');

    Http::assertNothingSent();
})->with([
    'empty' => [[]],
    'too many turns' => [array_fill(0, 7, ['role' => 'user', 'content' => 'Hi'])],
    'ends with an answer' => [[['role' => 'user', 'content' => 'Hi'], ['role' => 'assistant', 'content' => 'Hello']]],
]);

it('accepts follow-up questions after a long answer', function () {
    Http::fake([GROQ_URL => Http::response(groqStream('Yes.'))]);

    $content = ask([
        ['role' => 'user', 'content' => 'What did he do at Horizon Allienz?'],
        ['role' => 'assistant', 'content' => str_repeat('A long answer. ', 100)],
        ['role' => 'user', 'content' => 'Did he use Laravel there?'],
    ])->assertOk()->streamedContent();

    expect($content)->toContain('data: {"text":"Yes."}');
});

it('returns validation errors as JSON to the chat instead of redirecting', function () {
    $this->post(route('ask'), ['messages' => []], ['Accept' => 'application/json, text/event-stream'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('messages');
});

it('rejects questions over 500 characters', function () {
    ask([['role' => 'user', 'content' => str_repeat('a', 501)]])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('messages.0.content');
});

it('limits each visitor to 20 questions an hour', function () {
    Http::fake([GROQ_URL => Http::response(groqStream('Answer.'))]);

    foreach (range(1, 20) as $attempt) {
        ask()->assertOk();
    }

    ask()->assertTooManyRequests();
});

it('sends an error event when the provider fails', function () {
    Http::fake([GROQ_URL => Http::response('Server error', 500)]);

    expect(ask()->assertOk()->streamedContent())
        ->toContain('event: error')
        ->not->toContain('"text"');
});

it('sends an error event without calling the provider when no key is set', function () {
    config(['ai.providers.groq.key' => null]);
    Http::fake();

    expect(ask()->assertOk()->streamedContent())->toContain('event: error');

    Http::assertNothingSent();
});

it('answers a repeated opening question from the cache', function () {
    Http::fake([GROQ_URL => Http::response(groqStream('Cached ', 'answer.'))]);

    ask()->streamedContent();
    $content = ask([['role' => 'user', 'content' => '  what has he built with LARAVEL? ']])->streamedContent();

    expect($content)->toContain('data: {"text":"Cached answer."}');
    Http::assertSentCount(1);
});
