import { usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

/**
 * Returns the id of whichever of the given sections is crossing the middle
 * of the viewport, or null when none is.
 */
export function useScrollSpy(sectionIds: string[]): string | null {
    const { url } = usePage();
    const [activeId, setActiveId] = useState<string | null>(null);
    const idList = sectionIds.join(',');

    useEffect(() => {
        const sections = idList
            .split(',')
            .map((id) => document.getElementById(id))
            .filter((section): section is HTMLElement => section !== null);

        if (sections.length === 0) {
            setActiveId(null);

            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveId(entry.target.id);
                    } else {
                        setActiveId((current) =>
                            current === entry.target.id ? null : current,
                        );
                    }
                });
            },
            { rootMargin: '-45% 0px -50% 0px' },
        );

        sections.forEach((section) => observer.observe(section));

        return () => observer.disconnect();
    }, [idList, url]);

    return activeId;
}
