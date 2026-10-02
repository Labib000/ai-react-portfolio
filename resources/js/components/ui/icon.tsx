import { cn } from '@/lib/utils';

/** The shape of a Font Awesome icon export, e.g. `faBars`. */
export type FontAwesomeIconData = {
    icon: [number, number, string[], string, string | string[]];
};

type IconProps = {
    icon: FontAwesomeIconData;
    className?: string;
};

/**
 * Draws a Font Awesome icon straight from its SVG path data. This skips the
 * Font Awesome runtime (~58 KB) that a handful of static icons don't need.
 * Icons are decorative; label the surrounding button or link instead.
 */
export function Icon({ icon, className }: IconProps) {
    const [width, height, , , path] = icon.icon;
    const paths = Array.isArray(path) ? path : [path];

    return (
        <svg
            aria-hidden
            focusable="false"
            viewBox={`0 0 ${width} ${height}`}
            className={cn('inline-block size-4 shrink-0 fill-current', className)}
        >
            {paths.map((d) => (
                <path key={d} d={d} />
            ))}
        </svg>
    );
}
