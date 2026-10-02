<?php

namespace App\Http\Controllers;

use App\Content\ContentRepository;
use App\Content\Data\FaqItem;
use App\Http\Requests\ContactRequest;
use App\Http\Responses\PageMeta;
use App\Mail\ContactReceived;
use App\Mail\NewContactMessage;
use App\Models\ContactMessage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class ContactController extends Controller
{
    /**
     * The contact page, with a few FAQ answers. "?reason=hiring"
     * pre-selects the hiring option.
     */
    public function show(Request $request, ContentRepository $content): Response
    {
        return Inertia::render('contact', [
            'meta' => (new PageMeta(
                title: 'Hire a Full Stack & Gen AI Developer in Kolkata',
                shareTitle: 'Contact Labib Alam, full stack and Gen AI developer',
                description: 'Hire Labib Alam, a full stack and Gen AI developer in Kolkata, for a freelance project or a full time role. WhatsApp, email or the form. Replies in 24 hours.',
                path: '/contact',
                keywords: [
                    'hire full stack developer',
                    'hire Gen AI developer',
                    'freelance full stack developer India',
                    'AI chatbot developer for hire',
                    'freelance web developer Kolkata',
                ],
            ))->toArray(),
            'reason' => $request->query('reason') === 'hiring' ? 'hiring' : 'project',
            'faq' => $content->faq()->slice(1, 3)->map(fn (FaqItem $item) => $item->toArray())->values()->all(),
        ]);
    }

    /**
     * Saves a contact form message, emails it to every configured inbox and
     * sends the visitor a confirmation. Mail goes out right away (no queue
     * worker needed); if it fails, the message is still saved and the
     * visitor still sees success.
     */
    public function store(ContactRequest $request, ContentRepository $content): RedirectResponse
    {
        Inertia::flash('toast', ['type' => 'success', 'message' => "Thanks! I'll reply within 24 hours."]);

        // Bots get the same response, so they can't tell they were caught.
        if ($request->isFromBot()) {
            return back();
        }

        $message = ContactMessage::create([
            ...$request->safe()->only(['name', 'email', 'reason', 'company', 'message']),
            'ip' => $request->ip(),
        ]);

        $inboxes = config('mail.contact_to') ?: array_filter([$content->profile()->links['email'] ?? null]);

        try {
            if ($inboxes !== []) {
                Mail::to($inboxes)->send(new NewContactMessage($message));
            }

            Mail::to($message->email, $message->name)->send(new ContactReceived($message));
        } catch (Throwable $exception) {
            report($exception);
        }

        return back();
    }
}
