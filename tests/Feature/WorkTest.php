<?php

use App\Content\ContentRepository;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->app->instance(ContentRepository::class, new ContentRepository(base_path('tests/Fixtures/content')));
});

it('lists every project in order on the work page', function () {
    $this->get(route('work.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('work/index')
            ->has('projects', 2)
            ->where('projects.0.slug', 'beta-shop')
            ->where('projects.1.slug', 'alpha-saas')
            ->missing('projects.0.bodyHtml')
            ->has('toolRows', 2)
        );
});

it('shows a case study with its sections and the projects either side', function () {
    $this->get(route('work.show', 'beta-shop'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('work/show')
            ->where('project.slug', 'beta-shop')
            ->where('project.sections', [['id' => 'the-problem', 'title' => 'The problem']])
            ->where('project.bodyHtml', fn (string $html) => str_contains($html, '<strong>shop</strong>'))
            ->where('next.slug', 'alpha-saas')
            ->where('previous.slug', 'alpha-saas')
        );
});

it('returns 404 for an unknown project', function () {
    $this->get('/work/does-not-exist')->assertNotFound();
});
