<?php

use App\Content\ContentRepository;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->app->instance(ContentRepository::class, new ContentRepository(base_path('tests/Fixtures/content')));
});

it('renders the resume from the content files', function () {
    $this->get(route('resume'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('resume')
            ->where('profile.name', 'Test Person')
            ->has('experience', 2)
            ->has('projects', 2)
            ->where('resumePdf', null)
        );
});

it('groups skills by area and adds tools that are not already skills', function () {
    $this->get(route('resume'))
        ->assertInertia(fn (Assert $page) => $page
            ->has('skillGroups', 2)
            ->where('skillGroups.0', ['key' => 'backend', 'label' => 'Backend', 'items' => ['Laravel', 'Java']])
            ->where('skillGroups.1', ['key' => 'ai', 'label' => 'AI & Gen AI', 'items' => ['Claude']])
        );
});
