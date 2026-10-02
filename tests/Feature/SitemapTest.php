<?php

use App\Content\ContentRepository;

beforeEach(function () {
    $this->app->instance(ContentRepository::class, new ContentRepository(base_path('tests/Fixtures/content')));
    config(['app.url' => 'https://example.test']);
});

it('lists every page and case study as valid XML', function () {
    $response = $this->get(route('sitemap'))
        ->assertOk()
        ->assertHeader('Content-Type', 'application/xml; charset=UTF-8');

    $xml = simplexml_load_string($response->getContent());
    $urls = array_map(fn ($loc): string => (string) $loc, $xml->xpath('//*[local-name()="loc"]'));

    expect($urls)->toBe([
        'https://example.test/',
        'https://example.test/services',
        'https://example.test/work',
        // Case studies follow the Work page's order.
        'https://example.test/work/beta-shop',
        'https://example.test/work/alpha-saas',
        'https://example.test/ai-lab',
        'https://example.test/resume',
        'https://example.test/contact',
    ]);

    expect((string) $xml->xpath('//*[local-name()="lastmod"]')[0])->toMatch('/^\d{4}-\d{2}-\d{2}$/');
});
