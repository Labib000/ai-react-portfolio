import { Link } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import { home } from '@/routes';

type LogoProps = {
    name: string;
    className?: string;
};

export function Logo({ name, className }: LogoProps) {
    return (
        <Link
            href={home()}
            className={cn(
                'group inline-flex items-center gap-2.5 rounded-lg',
                className,
            )}
        >
            {/* Decorative: the link is named by the text beside it. */}
            <img
                src="/img/logo-72.webp"
                srcSet="/img/logo-72.webp 2x, /img/logo-108.webp 3x"
                width={44}
                height={36}
                alt=""
                className="h-9 w-auto drop-shadow-[0_0_10px_var(--glow)] transition-transform duration-500 ease-out group-hover:scale-105 group-hover:-rotate-3"
            />
            <span className="text-base font-semibold tracking-tight max-[379px]:sr-only">
                {name}
            </span>
        </Link>
    );
}
