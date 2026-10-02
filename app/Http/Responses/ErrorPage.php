<?php

namespace App\Http\Responses;

use App\Content\ContentRepository;
use App\Content\Data\Project;
use Illuminate\Http\Request;
use Inertia\ExceptionResponse;

/**
 * Renders HTTP errors as the site's own "error" Inertia page instead of
 * Laravel's default screens. JSON requests (the AI endpoints) and, in debug
 * mode, server errors keep Laravel's own response.
 */
class ErrorPage
{
    /** Statuses that get the custom page, with the reason shown in the title. */
    public const REASONS = [
        403 => 'Forbidden',
        404 => 'Not Found',
        419 => 'Page Expired',
        429 => 'Too Many Requests',
        500 => 'Server Error',
        503 => 'Service Unavailable',
    ];

    public function __construct(private readonly ContentRepository $content) {}

    public function __invoke(ExceptionResponse $response): ?ExceptionResponse
    {
        $status = $response->statusCode();

        if (! $this->handles($status, $response->request)) {
            return null;
        }

        return $response
            ->render('error', $this->props($status, $response->request))
            ->withSharedData();
    }

    public function handles(int $status, Request $request): bool
    {
        if (! array_key_exists($status, self::REASONS) || $request->expectsJson()) {
            return false;
        }

        return ! ($status >= 500 && $status !== 503 && config('app.debug'));
    }

    /**
     * @return array{meta: array<string, mixed>, status: int, method: string, path: string, suggestion: string|null}
     */
    public function props(int $status, Request $request): array
    {
        $path = '/'.ltrim($request->path(), '/');

        return [
            'meta' => (new PageMeta(
                title: $status.' '.self::REASONS[$status],
                description: "This page couldn't be shown. Find everything I've built and the services I offer from the home page.",
                path: $path,
                noindex: true,
            ))->toArray(),
            'status' => $status,
            'method' => $request->method(),
            'path' => $path,
            'suggestion' => $status === 404 ? $this->closestPath($path) : null,
        ];
    }

    /**
     * The real page whose path is closest to a mistyped one, such as
     * "/servics" → "/services". Null when nothing is close enough.
     */
    public function closestPath(string $path): ?string
    {
        $path = strtolower(rtrim($path, '/')) ?: '/';
        $candidates = [
            '/work',
            '/services',
            '/resume',
            ...$this->content->projects()->map(fn (Project $project): string => "/work/{$project->slug}")->all(),
        ];

        $best = null;
        $bestDistance = PHP_INT_MAX;

        foreach ($candidates as $candidate) {
            $distance = levenshtein($path, $candidate);

            if ($distance < $bestDistance) {
                $best = $candidate;
                $bestDistance = $distance;
            }
        }

        $allowed = max(2, intdiv(strlen((string) $best), 3));

        return $bestDistance > 0 && $bestDistance <= $allowed ? $best : null;
    }
}
