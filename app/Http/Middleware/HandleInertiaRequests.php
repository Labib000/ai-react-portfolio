<?php

namespace App\Http\Middleware;

use App\Content\ContentRepository;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    public function __construct(private readonly ContentRepository $content) {}

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'site' => fn (): array => $this->site(),
        ];
    }

    /**
     * Profile details the header and footer need on every page.
     *
     * @return array{name: string, role: string, location: string, links: array<string, string>, url: string}
     */
    private function site(): array
    {
        $profile = $this->content->profile();
        $links = $profile->toArray()['links'];

        return [
            'name' => $profile->name,
            'role' => $profile->role,
            'location' => $profile->location,
            'links' => $links,
            // The live domain for canonical links and share tags, so they
            // never point at localhost or a temporary hosting address.
            'url' => rtrim($profile->website ?? config('app.url'), '/'),
        ];
    }
}
