/**
 * Tool logos from resources/images/tools, bundled at build time so they work
 * with SSR and need no network requests. SVGs are single-colour
 * (fill="currentColor"); PNGs are alpha masks painted with the text colour.
 */
const svgFiles = import.meta.glob<string>('../../images/tools/*.svg', {
    query: '?raw',
    import: 'default',
    eager: true,
});

const maskFiles = import.meta.glob<string>('../../images/tools/*.png', {
    query: '?url',
    import: 'default',
    eager: true,
});

const byFileName = (files: Record<string, string>): Record<string, string> =>
    Object.fromEntries(
        Object.entries(files).map(([path, value]) => [
            path
                .split('/')
                .pop()!
                .replace(/\.\w+$/, ''),
            value,
        ]),
    );

export const toolSvgs = byFileName(svgFiles);
export const toolMasks = byFileName(maskFiles);

/**
 * Hover colours that stay readable: near-black brands (GitHub, Express,
 * OpenAI) use the text colour in dark mode, and very light brands
 * (JavaScript yellow) are deepened in light mode.
 */
export function brandColours(hex: string): { onDark: string; onLight: string } {
    const luminance = relativeLuminance(hex);

    return {
        onDark: luminance < 0.06 ? 'var(--foreground)' : hex,
        onLight:
            luminance > 0.5 ? `color-mix(in oklch, ${hex} 65%, black)` : hex,
    };
}

function relativeLuminance(hex: string): number {
    const [red, green, blue] = [1, 3, 5].map((start) => {
        const channel = parseInt(hex.slice(start, start + 2), 16) / 255;

        return channel <= 0.03928
            ? channel / 12.92
            : ((channel + 0.055) / 1.055) ** 2.4;
    });

    return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}
