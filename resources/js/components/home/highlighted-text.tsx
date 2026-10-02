type HighlightedTextProps = {
    /** Text from content files; words wrapped in [square brackets] are highlighted. */
    text: string;
    highlightClassName?: string;
};

export function HighlightedText({
    text,
    highlightClassName = 'text-shine',
}: HighlightedTextProps) {
    // split() with a capture group keeps the bracketed parts at odd indexes.
    const parts = text.split(/\[([^\]]+)\]/);

    return (
        <>
            {parts.map((part, index) =>
                index % 2 === 1 ? (
                    <span key={index} className={highlightClassName}>
                        {part}
                    </span>
                ) : (
                    part
                ),
            )}
        </>
    );
}

/** The same text with the brackets removed, for titles and meta tags. */
export function plainText(text: string): string {
    return text.replace(/\[([^\]]+)\]/g, '$1');
}
