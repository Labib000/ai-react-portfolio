<?php

use App\Content\ContentRepository;
use App\Mail\ContactReceived;
use App\Mail\NewContactMessage;
use App\Models\ContactMessage;
use Illuminate\Support\Facades\Mail;
use Inertia\Testing\AssertableInertia as Assert;

/**
 * @param  array<string, mixed>  $overrides
 */
function contactForm(array $overrides = []): array
{
    return [
        'name' => 'Priya Sharma',
        'email' => 'priya@example.com',
        'reason' => 'project',
        'company' => 'Acme Rentals',
        'message' => 'We need a booking system for our car rental business.',
        ...$overrides,
    ];
}

beforeEach(function () {
    $this->app->instance(ContentRepository::class, new ContentRepository(base_path('tests/Fixtures/content')));
    Mail::fake();
    config(['mail.contact_to' => ['owner@example.com', 'owner@example.org']]);
});

it('renders the contact page with a few FAQ answers', function () {
    $this->get(route('contact'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('contact')
            ->where('reason', 'project')
            ->has('faq', 1)
        );
});

it('pre-selects the reason from the query string, ignoring unknown values', function (string $query, string $reason) {
    $this->get(route('contact', ['reason' => $query]))
        ->assertInertia(fn (Assert $page) => $page->where('reason', $reason));
})->with([
    'hiring' => ['hiring', 'hiring'],
    'unknown' => ['spam', 'project'],
]);

it('saves the message, emails both sides and flashes a success toast', function () {
    $this->post(route('contact.store'), contactForm())
        ->assertRedirect()
        ->assertInertiaFlash('toast.type', 'success');

    expect(ContactMessage::sole())
        ->name->toBe('Priya Sharma')
        ->reason->toBe('project')
        ->company->toBe('Acme Rentals');

    Mail::assertSent(NewContactMessage::class, fn (NewContactMessage $mail) => $mail->hasTo('owner@example.com')
        && $mail->hasTo('owner@example.org')
        && $mail->hasReplyTo('priya@example.com'));
    Mail::assertSent(ContactReceived::class, fn (ContactReceived $mail) => $mail->hasTo('priya@example.com'));
});

it('falls back to the profile email when no inboxes are configured', function () {
    config(['mail.contact_to' => []]);

    $this->post(route('contact.store'), contactForm())->assertRedirect();

    Mail::assertSent(NewContactMessage::class, fn (NewContactMessage $mail) => $mail->hasTo('test@example.com'));
});

it('rejects invalid submissions', function (array $overrides, string $field) {
    $this->post(route('contact.store'), contactForm($overrides))->assertSessionHasErrors($field);

    expect(ContactMessage::count())->toBe(0);
    Mail::assertNothingSent();
})->with([
    'missing name' => [['name' => ''], 'name'],
    'invalid email' => [['email' => 'not-an-email'], 'email'],
    'unknown reason' => [['reason' => 'spam'], 'reason'],
    'message too short' => [['message' => 'Hi'], 'message'],
    'message too long' => [['message' => str_repeat('a', 2001)], 'message'],
]);

it('quietly drops bot submissions that fill the honeypot', function () {
    $this->post(route('contact.store'), contactForm(['website' => 'https://spam.example']))
        ->assertRedirect()
        ->assertInertiaFlash('toast.type', 'success');

    expect(ContactMessage::count())->toBe(0);
    Mail::assertNothingSent();
});

it('limits each visitor to 5 messages an hour', function () {
    foreach (range(1, 5) as $attempt) {
        $this->post(route('contact.store'), contactForm())->assertRedirect();
    }

    $this->post(route('contact.store'), contactForm())->assertTooManyRequests();
});

it('still saves the message and shows success when sending mail fails', function () {
    Mail::shouldReceive('to')->andThrow(new RuntimeException('SMTP is down'));

    $this->post(route('contact.store'), contactForm())
        ->assertRedirect()
        ->assertInertiaFlash('toast.type', 'success');

    expect(ContactMessage::count())->toBe(1);
});

it('renders both emails with the sender and their message', function () {
    $message = ContactMessage::factory()->create([
        'name' => 'Priya Sharma',
        'email' => 'priya@example.com',
        'reason' => 'hiring',
        'message' => 'We are hiring a Laravel developer.',
    ]);

    (new NewContactMessage($message))
        ->assertSeeInHtml('New message from Priya Sharma')
        ->assertSeeInHtml('We are hiring a Laravel developer.')
        ->assertSeeInHtml('mailto:priya@example.com', false)
        ->assertSeeInHtml('Hiring for a role')
        ->assertHasSubject('New enquiry from Priya Sharma: Hiring');

    (new ContactReceived($message))
        ->assertSeeInHtml('Thanks for reaching out, Priya')
        ->assertSeeInHtml('We are hiring a Laravel developer.')
        ->assertHasSubject('Thanks for reaching out, Priya');
});
