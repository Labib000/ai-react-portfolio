<?php

use App\Content\ContentRepository;
use App\Content\Data\Profile;
use Illuminate\Testing\TestResponse;

beforeEach(function () {
    $this->app->instance(ContentRepository::class, new ContentRepository(base_path('tests/Fixtures/content')));
    // As on shared hosting: no SSR server, so the root template renders the tags.
    config(['inertia.ssr.enabled' => false, 'app.url' => 'https://example.test']);
});

/**
 * Count the tags in the raw HTML that match the pattern.
 */
function countTags(TestResponse $response, string $pattern): int
{
    return preg_match_all($pattern, $response->getContent());
}

it('puts each page\'s title, description, canonical and share tags in the server HTML', function (string $url, string $title, string $canonical) {
    $response = $this->get($url)->assertOk();

    $response
        ->assertSee('<title data-inertia="">'.e($title).' | Test Person</title>', false)
        ->assertSee('<link data-inertia="canonical" rel="canonical" href="'.$canonical.'">', false)
        ->assertSee('property="og:title"', false)
        ->assertSee('content="https://example.test/og.png"', false)
        ->assertSee('name="twitter:card" content="summary_large_image"', false)
        ->assertDontSee('name="robots" content="noindex"', false);

    expect(countTags($response, '/<title\b/'))->toBe(1)
        ->and(countTags($response, '/name="description"/'))->toBe(1)
        ->and(countTags($response, '/rel="canonical"/'))->toBe(1);
})->with([
    'home' => ['/', 'Full Stack & Gen AI Developer in Kolkata', 'https://example.test/'],
    'services' => ['/services', 'Full Stack & Gen AI Development Services', 'https://example.test/services'],
    'contact' => ['/contact', 'Hire a Full Stack & Gen AI Developer in Kolkata', 'https://example.test/contact'],
    'case study' => ['/work/alpha-saas', 'Alpha SaaS: Booking SaaS case study', 'https://example.test/work/alpha-saas'],
]);

it('marks error pages noindex, without a canonical link', function () {
    $response = $this->get('/no-such-page')->assertNotFound();

    $response
        ->assertSee('<title data-inertia="">404 Not Found | Test Person</title>', false)
        ->assertSee('<meta data-inertia="robots" name="robots" content="noindex">', false)
        ->assertDontSee('rel="canonical"', false);
});

it('adds Google Tag Manager and Search Console verification only when configured', function () {
    config(['services.google.tag_manager_id' => null, 'services.google.site_verification' => null]);

    $this->get('/')
        ->assertDontSee('googletagmanager.com', false)
        ->assertDontSee('google-site-verification', false);

    config(['services.google.tag_manager_id' => 'GTM-TEST123', 'services.google.site_verification' => 'verify-token']);

    $this->get('/')
        ->assertSee('"GTM-TEST123"', false)
        ->assertSee('https://www.googletagmanager.com/ns.html?id=GTM-TEST123', false)
        ->assertSee('<meta name="google-site-verification" content="verify-token">', false);
});

it('uses the live domain from the profile for canonical links when one is set', function () {
    $profile = require base_path('tests/Fixtures/content/profile.php');
    $content = Mockery::mock(ContentRepository::class, [base_path('tests/Fixtures/content')])->makePartial();
    $content->shouldReceive('profile')->andReturn(Profile::fromArray([...$profile, 'website' => 'https://labibalam.in']));
    $this->app->instance(ContentRepository::class, $content);

    $this->get('/services')
        ->assertSee('<link data-inertia="canonical" rel="canonical" href="https://labibalam.in/services">', false);
});

it('gives crawlers one h1, the main links and Person data in the server HTML when SSR is off', function (string $url, string $title) {
    $response = $this->get($url)->assertOk();

    $response
        ->assertSee('<div id="seo-fallback"', false)
        ->assertSee('<h1>'.e($title).'</h1>', false)
        ->assertSee('href="'.route('services').'"', false)
        ->assertSee('href="'.route('contact').'"', false);

    expect(countTags($response, '/<h1\b/'))->toBe(1);
})->with([
    'home' => ['/', 'Full Stack & Gen AI Developer in Kolkata'],
    'services' => ['/services', 'Full Stack & Gen AI Development Services'],
    'case study' => ['/work/alpha-saas', 'Alpha SaaS: Booking SaaS case study'],
]);

it('puts Person and WebSite structured data in the home page HTML only', function () {
    $this->get('/')
        ->assertSee('application/ld+json', false)
        ->assertSee('"@type":"Person"', false)
        ->assertSee('"@type":"WebSite"', false);

    $this->get('/services')->assertDontSee('"@type":"Person"', false);
});

it('leaves the crawler fallback out when SSR is enabled', function () {
    config(['inertia.ssr.enabled' => true]);

    $this->get('/')->assertDontSee('id="seo-fallback"', false);
});
