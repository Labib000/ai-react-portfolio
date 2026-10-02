<?php

use Inertia\Testing\AssertableInertia as Assert;

test('home page renders', function () {
    $this->get(route('home'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('home'));
});

test('auth routes no longer exist', function (string $uri) {
    $this->get($uri)->assertNotFound();
})->with(['/login', '/register', '/dashboard', '/settings/profile']);
