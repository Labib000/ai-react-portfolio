{{--
    Shared email layout. Tables and inline styles only, so it renders the
    same in Gmail, Outlook and Apple Mail.
--}}
@props(['links' => [], 'title' => null, 'preheader' => ''])
@php
    $font = "'Poppins', 'Segoe UI', Arial, Helvetica, sans-serif";
    $siteUrl = rtrim(config('app.url'), '/');
@endphp
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="x-apple-disable-message-reformatting">
    <meta name="color-scheme" content="light">
    <meta name="supported-color-schemes" content="light">
    <title>{{ $title ?? config('app.name') }}</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap" rel="stylesheet">
    <style>
        @media only screen and (max-width: 620px) {
            .card { width: 100% !important; border-radius: 0 !important; }
            .pad { padding-left: 24px !important; padding-right: 24px !important; }
            .stack { display: block !important; width: 100% !important; }
        }
        a { color: #0f6b66; }
    </style>
</head>
<body style="margin:0; padding:0; background-color:#eef3f2; font-family:{{ $font }};">
    {{-- Inbox preview text; hidden in the email itself. --}}
    <div style="display:none; max-height:0; overflow:hidden; opacity:0; mso-hide:all;">
        {{ $preheader }}&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#eef3f2;">
        <tr>
            <td align="center" style="padding:32px 12px;">
                <table role="presentation" class="card" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:600px; background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 12px 32px rgba(11,23,25,0.08);">
                    {{-- Header band --}}
                    <tr>
                        <td class="pad" style="background-color:#0b1719; background-image:linear-gradient(135deg,#0b1719 0%,#0f3f3c 55%,#0f6b66 100%); padding:28px 40px;">
                            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td style="width:44px; height:44px; background-color:#5ec4b6; border-radius:12px; text-align:center; vertical-align:middle; font-family:{{ $font }}; font-size:17px; font-weight:600; color:#0b1719;">LA</td>
                                    <td style="padding-left:14px; font-family:{{ $font }};">
                                        <div style="font-size:16px; font-weight:600; color:#e6f0ef; line-height:1.3;">Labib Alam</div>
                                        <div style="font-size:13px; color:#5ec4b6; line-height:1.4;">Full Stack Developer</div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    {{-- Body --}}
                    <tr>
                        <td class="pad" style="padding:36px 40px 12px; font-family:{{ $font }}; color:#13222a; font-size:15px; line-height:1.65;">
                            {{ $slot }}
                        </td>
                    </tr>

                    {{-- Footer --}}
                    <tr>
                        <td class="pad" style="padding:24px 40px 32px; font-family:{{ $font }};">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #e3ebea;">
                                <tr>
                                    <td style="padding-top:20px; font-size:13px; line-height:1.7; color:#5b6b70;">
                                        @if (! empty($links['email']))
                                            <a href="mailto:{{ $links['email'] }}" style="color:#0f6b66; text-decoration:none;">{{ $links['email'] }}</a><br>
                                        @endif
                                        @if (! empty($links['phone']))
                                            <a href="tel:{{ preg_replace('/[^+\d]/', '', $links['phone']) }}" style="color:#5b6b70; text-decoration:none;">{{ $links['phone'] }}</a>
                                        @endif
                                        @if (! empty($links['whatsapp']))
                                            &nbsp;&middot;&nbsp;<a href="https://wa.me/{{ $links['whatsapp'] }}" style="color:#1f9d55; text-decoration:none;">WhatsApp</a>
                                        @endif
                                        <br>
                                        <a href="{{ $siteUrl }}" style="color:#5b6b70; text-decoration:none;">{{ preg_replace('#^https?://#', '', $siteUrl) }}</a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>

                <p style="margin:16px 0 0; font-family:{{ $font }}; font-size:12px; color:#8a9a9e;">
                    Sent from the contact form on {{ preg_replace('#^https?://#', '', $siteUrl) }}
                </p>
            </td>
        </tr>
    </table>
</body>
</html>
