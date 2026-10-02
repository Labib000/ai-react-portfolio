<?php

namespace App\Mail;

use App\Content\ContentRepository;
use App\Models\ContactMessage;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Tells Labib about a new contact form message. Replying goes straight to
 * the sender.
 */
class NewContactMessage extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public ContactMessage $contact) {}

    public function envelope(): Envelope
    {
        $reason = $this->contact->reason === 'hiring' ? 'Hiring' : 'Project';

        return new Envelope(
            replyTo: [new Address($this->contact->email, $this->contact->name)],
            subject: "New enquiry from {$this->contact->name}: {$reason}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'mail.new-contact-message',
            with: ['links' => app(ContentRepository::class)->profile()->links],
        );
    }
}
