<?php

use App\Content\ContentRepository;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->app->instance(ContentRepository::class, new ContentRepository(base_path('tests/Fixtures/content')));
});

it('renders the services page with services, process, FAQ and projects', function () {
    $this->get(route('services'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('services')
            ->has('services', 2)
            ->where('services.0.example', 'alpha-saas')
            ->where('services.1.example', null)
            ->has('process', 2)
            ->has('faq', 2)
            ->where('faq.0.question', 'How much does it cost?')
            ->has('projects', 2)
            ->has('toolRows', 2)
            ->where('briefTypes.web-app', 'Web app')
        );
});

it('permanently redirects the old hire page to services', function () {
    $this->get('/hire')->assertRedirect('/services')->assertStatus(301);
});
