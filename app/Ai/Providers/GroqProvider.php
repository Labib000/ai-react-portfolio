<?php

namespace App\Ai\Providers;

use App\Ai\AiUnavailableException;
use App\Ai\Contracts\AiProvider;
use Generator;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Psr\Http\Message\StreamInterface;

/**
 * Groq's OpenAI-compatible chat completions API, streamed.
 */
class GroqProvider implements AiProvider
{
    /**
     * @param  array<string, mixed>  $options  Extra request fields, e.g. reasoning settings.
     */
    public function __construct(
        private readonly ?string $key,
        private readonly string $model,
        private readonly string $url,
        private readonly array $options = [],
    ) {}

    public function stream(string $system, array $messages, int $maxTokens, float $temperature): Generator
    {
        if (blank($this->key)) {
            throw new AiUnavailableException('No Groq API key is configured.');
        }

        try {
            $response = Http::withToken($this->key)
                ->acceptJson()
                ->timeout(30)
                ->withOptions(['stream' => true])
                ->post($this->url, [
                    ...$this->options,
                    'model' => $this->model,
                    'stream' => true,
                    'temperature' => $temperature,
                    'max_completion_tokens' => $maxTokens,
                    'messages' => [
                        ['role' => 'system', 'content' => $system],
                        ...$messages,
                    ],
                ]);
        } catch (ConnectionException $exception) {
            throw new AiUnavailableException('Could not reach Groq.', previous: $exception);
        }

        if ($response->failed()) {
            throw new AiUnavailableException("Groq returned HTTP {$response->status()}: {$response->body()}");
        }

        foreach ($this->lines($response->toPsrResponse()->getBody()) as $line) {
            if (! str_starts_with($line, 'data:')) {
                continue;
            }

            $data = trim(substr($line, 5));

            if ($data === '[DONE]') {
                return;
            }

            $chunk = json_decode($data, true)['choices'][0]['delta']['content'] ?? null;

            if (is_string($chunk) && $chunk !== '') {
                yield $chunk;
            }
        }
    }

    public function completeJson(string $system, array $messages, int $maxTokens): array
    {
        if (blank($this->key)) {
            throw new AiUnavailableException('No Groq API key is configured.');
        }

        try {
            $response = Http::withToken($this->key)
                ->acceptJson()
                ->timeout(60)
                ->post($this->url, [
                    ...$this->options,
                    'model' => $this->model,
                    'temperature' => 0.1,
                    'max_completion_tokens' => $maxTokens,
                    'response_format' => ['type' => 'json_object'],
                    'messages' => [
                        ['role' => 'system', 'content' => $system],
                        ...$messages,
                    ],
                ]);
        } catch (ConnectionException $exception) {
            throw new AiUnavailableException('Could not reach Groq.', previous: $exception);
        }

        if ($response->failed()) {
            throw new AiUnavailableException("Groq returned HTTP {$response->status()}: {$response->body()}");
        }

        $content = (string) $response->json('choices.0.message.content', '');
        $decoded = json_decode($content, true);

        // Some models wrap the JSON in prose or code fences; keep the object.
        if (! is_array($decoded) && preg_match('/\{.*\}/s', $content, $match)) {
            $decoded = json_decode($match[0], true);
        }

        if (! is_array($decoded)) {
            throw new AiUnavailableException('Groq returned something that is not a JSON object.');
        }

        return $decoded;
    }

    /**
     * Split the response body into lines as it arrives.
     *
     * @return Generator<int, string>
     */
    private function lines(StreamInterface $body): Generator
    {
        $buffer = '';

        while (! $body->eof()) {
            $buffer .= $body->read(1024);

            while (($position = strpos($buffer, "\n")) !== false) {
                yield rtrim(substr($buffer, 0, $position), "\r");
                $buffer = substr($buffer, $position + 1);
            }
        }

        if ($buffer !== '') {
            yield rtrim($buffer, "\r");
        }
    }
}
