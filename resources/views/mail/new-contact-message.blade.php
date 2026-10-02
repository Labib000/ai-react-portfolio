@php
    $font = "'Poppins', 'Segoe UI', Arial, Helvetica, sans-serif";
    $isHiring = $contact->reason === 'hiring';
@endphp
<x-mail-layout :links="$links" :title="'New enquiry from '.$contact->name" :preheader="$contact->reasonLabel().': '.\Illuminate\Support\Str::limit($contact->message, 90)">
    <span style="display:inline-block; padding:5px 12px; border-radius:999px; font-size:12px; font-weight:600; letter-spacing:0.2px; background-color:{{ $isHiring ? '#e7f1ff' : '#e3f5f2' }}; color:{{ $isHiring ? '#2458a6' : '#0f6b66' }};">
        {{ $contact->reasonLabel() }}
    </span>

    <h1 style="margin:16px 0 6px; font-family:{{ $font }}; font-size:24px; line-height:1.3; font-weight:600; color:#0b1719;">
        New message from {{ $contact->name }}
    </h1>
    <p style="margin:0 0 24px; color:#5b6b70;">
        Someone reached out through your portfolio. Hit reply to answer them directly.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e3ebea; border-radius:12px; border-collapse:separate;">
        @foreach (array_filter([
            'Name' => e($contact->name),
            'Email' => '<a href="mailto:'.e($contact->email).'" style="color:#0f6b66; text-decoration:none;">'.e($contact->email).'</a>',
            'Company' => $contact->company ? e($contact->company) : null,
            'Sent' => e($contact->created_at?->timezone('Asia/Kolkata')->format('j M Y, g:i A').' IST'),
        ]) as $label => $value)
            <tr>
                <td class="stack" style="padding:12px 16px; width:110px; font-size:13px; color:#8a9a9e; {{ $loop->last ? '' : 'border-bottom:1px solid #eef3f2;' }}">{{ $label }}</td>
                <td class="stack" style="padding:12px 16px; font-size:14px; font-weight:500; color:#13222a; {{ $loop->last ? '' : 'border-bottom:1px solid #eef3f2;' }}">{!! $value !!}</td>
            </tr>
        @endforeach
    </table>

    <p style="margin:28px 0 10px; font-size:13px; font-weight:600; color:#0b1719; text-transform:none;">Their message</p>
    <div style="padding:18px 20px; background-color:#f5f9f8; border-left:3px solid #5ec4b6; border-radius:0 12px 12px 0; font-size:15px; line-height:1.7; color:#13222a; white-space:pre-line;">{{ $contact->message }}</div>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 8px;">
        <tr>
            <td style="border-radius:999px; background-color:#0f6b66;">
                <a href="mailto:{{ $contact->email }}?subject={{ rawurlencode('Re: your message to Labib Alam') }}" style="display:inline-block; padding:13px 26px; font-family:{{ $font }}; font-size:14px; font-weight:600; color:#ffffff; text-decoration:none; border-radius:999px;">
                    Reply to {{ $contact->firstName() }}
                </a>
            </td>
        </tr>
    </table>
</x-mail-layout>
