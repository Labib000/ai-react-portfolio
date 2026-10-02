<?php

namespace App\Ai;

use App\Ai\Contracts\AiProvider;
use Generator;
use Illuminate\Http\StreamedEvent;
use Illuminate\Support\Facades\Cache;
use Throwable;

/**
 * Streams a chat answer as server-sent event payloads. Text arrives as
 * {"text": "..."} updates; a provider failure sends one "error" event
 * instead of failing the request. With a cache key, a finished answer is
 * stored and replayed whole next time.
 */
class AnswerStream
{
    public function __construct(private readonly AiProvider $ai) {}

    /**
     * @param  list<array{role: 'user'|'assistant', content: string}>  $conversation
     * @param  array{max_tokens: int, temperature: float, cache_ttl?: int}  $options
     * @return Generator<int, array{text: string}|StreamedEvent>
     */
    public function stream(string $system, array $conversation, array $options, ?string $cacheKey = null): Generator
    {
        $cached = $cacheKey ? Cache::get($cacheKey) : null;

        if (is_string($cached)) {
            yield ['text' => $cached];

            return;
        }

        $answer = '';

        try {
            foreach ($this->ai->stream($system, $conversation, $options['max_tokens'], $options['temperature']) as $chunk) {
                $answer .= $chunk;

                yield ['text' => $chunk];
            }
        } catch (Throwable $exception) {
            report($exception);
        }

        if (trim($answer) === '') {
            yield new StreamedEvent(event: 'error', data: ['message' => 'unavailable']);

            return;
        }

        if ($cacheKey) {
            Cache::put($cacheKey, $answer, $options['cache_ttl'] ?? 0);
        }
    }
}
