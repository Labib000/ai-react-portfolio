import { faGithub } from '@fortawesome/free-brands-svg-icons/faGithub';
import { faLinkedinIn } from '@fortawesome/free-brands-svg-icons/faLinkedinIn';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons/faWhatsapp';
import { faEnvelope } from '@fortawesome/free-solid-svg-icons/faEnvelope';
import { faPhone } from '@fortawesome/free-solid-svg-icons/faPhone';
import { Icon } from '@/components/ui/icon';
import type { FontAwesomeIconData } from '@/components/ui/icon';
import { cn } from '@/lib/utils';
import type { Profile } from '@/types/content';

type SocialLinksProps = {
    links: Profile['links'];
    className?: string;
};

const channels: {
    key: keyof Profile['links'];
    label: string;
    icon: FontAwesomeIconData;
    toHref: (value: string) => string;
}[] = [
    {
        key: 'github',
        label: 'GitHub',
        icon: faGithub,
        toHref: (value) => value,
    },
    {
        key: 'linkedin',
        label: 'LinkedIn',
        icon: faLinkedinIn,
        toHref: (value) => value,
    },
    {
        key: 'email',
        label: 'Email',
        icon: faEnvelope,
        toHref: (value) => `mailto:${value}`,
    },
    {
        key: 'whatsapp',
        label: 'Message on WhatsApp',
        icon: faWhatsapp,
        toHref: (value) => `https://wa.me/${value}`,
    },
    {
        key: 'phone',
        label: 'Call',
        icon: faPhone,
        toHref: (value) => `tel:${value.replace(/[^+\d]/g, '')}`,
    },
];

/** Renders nothing until at least one link is set in content/profile.php. */
export function SocialLinks({ links, className }: SocialLinksProps) {
    const available = channels.filter((channel) => links[channel.key]);

    if (available.length === 0) {
        return null;
    }

    return (
        <ul className={cn('flex items-center gap-2', className)}>
            {available.map((channel) => (
                <li key={channel.key}>
                    <a
                        href={channel.toHref(links[channel.key] as string)}
                        target={
                            channel.key === 'email' || channel.key === 'phone'
                                ? undefined
                                : '_blank'
                        }
                        rel="noreferrer"
                        aria-label={channel.label}
                        className="grid size-10 place-items-center rounded-full border text-muted-foreground transition-colors hover:border-brand hover:text-brand"
                    >
                        <Icon icon={channel.icon} className="size-4" />
                    </a>
                </li>
            ))}
        </ul>
    );
}
