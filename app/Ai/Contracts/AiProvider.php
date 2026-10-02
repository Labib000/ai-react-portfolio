<?php

namespace App\Ai\Contracts;

use App\Ai\AiUnavailableException;
use Generator;

interface AiProvider
{
    /**
     * Stream a chat completion as text chunks.
     *
     * @param  list<array{role: 'user'|'assistant', content: string}>  $messages
     * @return Generator<int, string>
     *
     * @throws AiUnavailableException
     */
    public function stream(string $system, array $messages, int $maxTokens, float $temperature): Generator;

    /**
     * Ask for a JSON object and return it decoded.
     *
     * @param  list<array{role: 'user'|'assistant', content: string}>  $messages
     * @return array<string, mixed>
     *
     * @throws AiUnavailableException
     */
    public function completeJson(string $system, array $messages, int $maxTokens): array;
}
