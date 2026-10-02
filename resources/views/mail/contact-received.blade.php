@php
    $font = "'Poppins', 'Segoe UI', Arial, Helvetica, sans-serif";
    $siteUrl = rtrim(config('app.url'), '/');
@endphp
<x-mail-layout :links="$links" :title="'Thanks, '.$contact->firstName()" preheader="Your message arrived. I'll reply within 24 hours.">
    <div style="width:52px; height:52px; border-radius:999px; background-color:#e3f5f2; text-align:center; line-height:52px; font-size:24px; color:#0f6b66;">&#10003;</div>

    <h1 style="margin:20px 0 8px; font-family:{{ $font }}; font-size:24px; line-height:1.3; font-weight:600; color:#0b1719;">
        Thanks for reaching out, {{ $contact->firstName() }}
    </h1>
    <p style="margin:0 0 8px;">
        Your message arrived safely. I read every message myself and will reply
        within <strong style="color:#0f6b66;">24 hours</strong>.
    </p>
    <p style="margin:0 0 24px; color:#5b6b70;">
        @if ($contact->reason === 'hiring')
            If it helps, feel free to reply with the job description or any details about the role.
        @else
            If you have a brief, designs or examples of what you like, feel free to reply with them.
        @endif
    </p>

    <p style="margin:0 0 10px; font-size:13px; font-weight:600; color:#0b1719;">Your message</p>
    <div style="padding:18px 20px; background-color:#f5f9f8; border-left:3px solid #5ec4b6; border-radius:0 12px 12px 0; font-size:15px; line-height:1.7; color:#13222a; white-space:pre-line;">{{ $contact->message }}</div>

    <p style="margin:28px 0 12px; font-size:13px; font-weight:600; color:#0b1719;">In the meantime</p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 8px;">
        <tr>
            <td style="border-radius:999px; background-color:#0f6b66;">
                <a href="{{ $siteUrl }}/#work" style="display:inline-block; padding:12px 22px; font-family:{{ $font }}; font-size:14px; font-weight:600; color:#ffffff; text-decoration:none; border-radius:999px;">See my work</a>
            </td>
            @if (! empty($links['whatsapp']))
                <td style="width:10px;"></td>
                <td style="border-radius:999px; background-color:#e8f8ee;">
                    <a href="https://wa.me/{{ $links['whatsapp'] }}" style="display:inline-block; padding:12px 22px; font-family:{{ $font }}; font-size:14px; font-weight:600; color:#1f7a45; text-decoration:none; border-radius:999px;">WhatsApp me</a>
                </td>
            @endif
        </tr>
    </table>

    <p style="margin:24px 0 0;">
        Talk soon,<br>
        <strong style="color:#0b1719;">Labib Alam</strong><br>
        <span style="color:#5b6b70; font-size:13px;">Full Stack Developer &middot; Laravel, React, MERN, Gen AI</span>
    </p>
</x-mail-layout>
