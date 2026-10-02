<?php

use App\Content\ContentRepository;
use Illuminate\Support\Facades\Route;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->app->instance(ContentRepository::class, new ContentRepository(base_path('tests/Fixtures/content')));
});

it('renders unknown pages as the error page with the requested path', function () {
    $this->get('/no-such-page')
        ->assertNotFound()
        ->assertInertia(fn (Assert $page) => $page
            ->component('error')
            ->where('status', 404)
            ->where('method', 'GET')
            ->where('path', '/no-such-page')
            ->where('suggestion', null)
            ->has('site.name')
        );
});

it('suggests the closest real page for a mistyped path', function (string $typed, string $suggestion) {
    $this->get($typed)
        ->assertNotFound()
        ->assertInertia(fn (Assert $page) => $page->where('suggestion', $suggestion));
})->with([
    'page' => ['/servics', '/services'],
    'case study' => ['/work/alpha-sass', '/work/alpha-saas'],
]);

it('renders a missing case study as the error page', function () {
    $this->get(route('work.show', 'missing-project'))
        ->assertNotFound()
        ->assertInertia(fn (Assert $page) => $page->component('error')->where('status', 404));
});

it('keeps JSON error responses for JSON requests', function () {
    $this->getJson('/no-such-page')
        ->assertNotFound()
        ->assertJsonStructure(['message']);
});

it('shows the error page for server errors only outside debug mode', function () {
    Route::get('/boom', fn () => throw new RuntimeException('Boom'))->middleware('web');

    config(['app.debug' => false]);
    $this->get('/boom')
        ->assertInternalServerError()
        ->assertInertia(fn (Assert $page) => $page->component('error')->where('status', 500));

    config(['app.debug' => true]);
    $this->get('/boom')
        ->assertInternalServerError()
        ->assertDontSee('"component":"error"', false);
});
