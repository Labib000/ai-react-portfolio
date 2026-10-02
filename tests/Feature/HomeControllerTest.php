<?php

use App\Content\ContentRepository;
use Carbon\CarbonImmutable;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->app->instance(ContentRepository::class, new ContentRepository(base_path('tests/Fixtures/content')));
});

it('renders the home page with the profile and experience length', function () {
    $this->travelTo(CarbonImmutable::parse('2026-09-29'));

    $this->get(route('home'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('home')
            ->where('profile.name', 'Test Person')
            ->where('experienceDuration', '1 year 5 months')
            ->has('experience', 2)
            ->where('experience.0.metric', ['value' => '20+', 'label' => 'modules shipped'])
            ->where('experience.1.metric', null)
        );
});

it('groups tools into the development row first, then the ai row', function () {
    $this->get(route('home'))
        ->assertInertia(fn (Assert $page) => $page
            ->has('toolRows', 2)
            ->where('toolRows.0.row', 'development')
            ->where('toolRows.0.tools.0.name', 'Laravel')
            ->where('toolRows.0.tools.1.name', 'Java')
            ->where('toolRows.1.row', 'ai')
            ->where('toolRows.1.tools.0.name', 'Claude')
        );
});

it('shares the site name and only non-empty links with every page', function () {
    $this->get(route('home'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('site.name', 'Test Person')
            ->where('site.url', rtrim(config('app.url'), '/'))
            ->where('site.links', ['email' => 'test@example.com', 'phone' => '+91 90000 00000', 'whatsapp' => '919000000000', 'github' => 'https://github.com/test'])
        );
});

it('passes the process steps in order with their loop labels', function () {
    $this->get(route('home'))
        ->assertInertia(fn (Assert $page) => $page
            ->has('process', 2)
            ->where('process.0.title', 'Planning')
            ->where('process.0.loop', 'Unlimited iterations')
            ->where('process.1.loop', null)
        );
});

it('passes the services in order with their badges', function () {
    $this->get(route('home'))
        ->assertInertia(fn (Assert $page) => $page
            ->has('services', 2)
            ->where('services.0.title', 'MERN stack apps')
            ->where('services.0.badge', null)
            ->where('services.0.icons', ['mongodb', 'react'])
            ->where('services.0.proof', 'Built end to end')
            ->where('services.1.badge', 'Newest stack')
            ->where('services.1.metric', ['value' => '20+', 'label' => 'APIs shipped'])
        );
});

it('passes every project in order with its card details but without the case study body', function () {
    $this->get(route('home'))
        ->assertInertia(fn (Assert $page) => $page
            ->has('projects', 2)
            ->where('projects.0.slug', 'beta-shop')
            ->where('projects.0.links', ['live' => 'https://example.com'])
            ->where('projects.1.slug', 'alpha-saas')
            ->where('projects.1.featured', true)
            ->where('projects.1.company', 'Current Co')
            ->where('projects.1.category', 'Booking SaaS')
            ->where('projects.1.highlights', ['Built the booking engine.'])
            ->where('projects.1.metric', ['value' => '25%', 'label' => 'faster checkout'])
            ->missing('projects.1.bodyHtml')
        );
});
