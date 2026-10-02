<?php

namespace App\Mail;

use App\Content\ContentRepository;
use App\Models\ContactMessage;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Confirms to the sender that their message arrived, with a copy of it.
 */
class ContactReceived extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public ContactMessage $contact) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Thanks for reaching out, {$this->contact->firstName()}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'mail.contact-received',
            with: ['links' => app(ContentRepository::class)->profile()->links],
        );
    }
}
