type PortraitProps = {
    name: string;
};

/**
 * Cut-out portrait standing in a teal arch. The photo is a sibling of the
 * arch (not inside it), so the head can rise above the arch's top edge.
 */
export function Portrait({ name }: PortraitProps) {
    return (
        <div className="relative aspect-[1036/1518] w-full [transform-style:preserve-3d]">
            <div
                data-hero="arch"
                data-animate
                className="absolute inset-x-0 top-[27%] bottom-0 rounded-t-full border border-b-0 border-brand/20 bg-arch"
            />
            <img
                data-hero="photo"
                data-animate
                src="/img/portrait-800.webp"
                srcSet="/img/portrait-480.webp 480w, /img/portrait-800.webp 800w, /img/portrait-1036.webp 1036w"
                sizes="(min-width: 1024px) 420px, 80vw"
                width={1036}
                height={1518}
                alt={`${name}, full stack developer in Kolkata`}
                fetchPriority="high"
                decoding="async"
                className="absolute inset-0 h-full w-full origin-bottom object-contain object-bottom"
            />
        </div>
    );
}
