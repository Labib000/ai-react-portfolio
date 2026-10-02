import { toolMasks, toolSvgs } from '@/lib/tool-icons';
import { cn } from '@/lib/utils';

type ToolIconProps = {
    /** File name in resources/images/tools, without the extension. */
    icon: string | null;
    name: string;
    className?: string;
};

/**
 * A tool logo painted in the current text colour: inline SVG when there is
 * one, a PNG mask otherwise, and the name's first letter as a last resort.
 */
export function ToolIcon({ icon, name, className }: ToolIconProps) {
    const svg = icon ? toolSvgs[icon] : undefined;

    if (svg) {
        return (
            <span
                aria-hidden
                className={cn('tool-icon', className)}
                dangerouslySetInnerHTML={{ __html: svg }}
            />
        );
    }

    const mask = icon ? toolMasks[icon] : undefined;

    if (mask) {
        return (
            <span
                aria-hidden
                className={cn('bg-current', className)}
                style={{
                    maskImage: `url(${mask})`,
                    WebkitMaskImage: `url(${mask})`,
                    maskSize: 'contain',
                    maskRepeat: 'no-repeat',
                    maskPosition: 'center',
                }}
            />
        );
    }

    return (
        <span
            aria-hidden
            className={cn(
                'grid place-items-center rounded-md bg-current/15 text-xs font-bold',
                className,
            )}
        >
            {name[0]}
        </span>
    );
}
