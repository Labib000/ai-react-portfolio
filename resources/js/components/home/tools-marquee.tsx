import { faPause } from '@fortawesome/free-solid-svg-icons/faPause';
import { faPlay } from '@fortawesome/free-solid-svg-icons/faPlay';
import { useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { ToolIcon } from '@/components/home/tool-icon';
import { SplitHeading } from '@/components/motion/split-heading';
import { Icon } from '@/components/ui/icon';
import { gsap, MOTION_OK, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { brandColours } from '@/lib/tool-icons';
import { cn } from '@/lib/utils';
import type { Tool, ToolRow } from '@/types/content';

type ToolsMarqueeProps = {
    rows: ToolRow[];
};

/** Rough pill width used to decide how many copies fill a wide screen. */
const ESTIMATED_PILL_WIDTH = 150;
const MIN_HALF_WIDTH = 2600;

/**
 * Two rows of tool logos drifting in opposite directions. Scrolling the page
 * speeds them up (and reverses them when scrolling up), hovering a row eases
 * it to a stop, and the pause button stops both. With reduced motion the rows
 * are plain wrapped lists, styled entirely in CSS.
 *
 * Everything runs in one GSAP ticker callback: it moves each track with a
 * transform and eases the speed toward its target, so there are no competing
 * tweens and nothing is re-measured per frame.
 */
export function ToolsMarquee({ rows }: ToolsMarqueeProps) {
    const section = useRef<HTMLElement>(null);
    const playback = useRef({ value: 1 });
    const isPausedRef = useRef(false);
    const [isPaused, setIsPaused] = useState(false);

    const togglePause = () => {
        const next = !isPausedRef.current;
        isPausedRef.current = next;
        setIsPaused(next);
        gsap.to(playback.current, {
            value: next ? 0 : 1,
            duration: 0.6,
            ease: 'power2.out',
            overwrite: true,
        });
    };

    useGSAP(
        () => {
            const mm = gsap.matchMedia();

            mm.add(MOTION_OK, () => {
                const q = gsap.utils.selector(section);
                let isVisible = false;
                let pixelsPerSecond = 60;
                // Scroll boost: set from scroll velocity, eased and decayed per frame.
                let boostTarget = 0;
                let boost = 0;

                const marquees = q('[data-marquee-row]').map((row, index) => {
                    const track =
                        row.querySelector<HTMLElement>('[data-track]')!;

                    return {
                        row,
                        track,
                        direction: index % 2 === 0 ? -1 : 1,
                        position: 0,
                        halfWidth: 0,
                        hover: { value: 1 },
                        setX: gsap.quickSetter(track, 'x', 'px'),
                    };
                });

                const measure = () => {
                    pixelsPerSecond = window.innerWidth < 768 ? 40 : 60;
                    marquees.forEach((marquee) => {
                        marquee.halfWidth = marquee.track.scrollWidth / 2;
                    });
                };

                measure();

                // Row 2 starts half a loop in, so both rows look full at once.
                marquees.forEach((marquee) => {
                    if (marquee.direction === 1) {
                        marquee.position = -marquee.halfWidth / 2;
                        marquee.setX(marquee.position);
                    }
                });

                const tick = (_time: number, deltaMs: number) => {
                    if (!isVisible) {
                        return;
                    }

                    const delta = Math.min(deltaMs, 50);
                    boost +=
                        (boostTarget - boost) * (1 - Math.exp(-delta / 120));
                    boostTarget *= Math.exp(-delta / 260);

                    const step =
                        ((pixelsPerSecond * delta) / 1000) *
                        playback.current.value *
                        (1 + boost);

                    marquees.forEach((marquee) => {
                        marquee.position = gsap.utils.wrap(
                            -marquee.halfWidth,
                            0,
                            marquee.position +
                                marquee.direction * step * marquee.hover.value,
                        );
                        marquee.setX(marquee.position);
                    });
                };

                gsap.ticker.add(tick);
                window.addEventListener('resize', measure);

                // Mouse only: hovering a row eases it to a stop.
                const hoverCleanups = window.matchMedia('(pointer: fine)')
                    .matches
                    ? marquees.map((marquee) => {
                          const slow = () =>
                              gsap.to(marquee.hover, {
                                  value: 0,
                                  duration: 0.6,
                                  ease: 'power2.out',
                                  overwrite: true,
                              });
                          const resume = () =>
                              gsap.to(marquee.hover, {
                                  value: 1,
                                  duration: 0.8,
                                  ease: 'power2.inOut',
                                  overwrite: true,
                              });

                          marquee.row.addEventListener('pointerenter', slow);
                          marquee.row.addEventListener('pointerleave', resume);

                          return () => {
                              marquee.row.removeEventListener(
                                  'pointerenter',
                                  slow,
                              );
                              marquee.row.removeEventListener(
                                  'pointerleave',
                                  resume,
                              );
                          };
                      })
                    : [];

                // Scrolling down speeds the rows up; scrolling up reverses them.
                ScrollTrigger.create({
                    trigger: section.current,
                    start: 'top bottom',
                    end: 'bottom top',
                    onToggle: (self) => {
                        isVisible = self.isActive;
                    },
                    onUpdate: (self) => {
                        boostTarget = gsap.utils.clamp(
                            -4,
                            4,
                            self.getVelocity() / 350,
                        );
                    },
                });

                // Entrance: the rows glide in from opposite sides, once.
                marquees.forEach((marquee) => {
                    gsap.fromTo(
                        marquee.row,
                        { autoAlpha: 0, x: marquee.direction * -80 },
                        {
                            autoAlpha: 1,
                            x: 0,
                            duration: 1.2,
                            ease: 'expo.out',
                            scrollTrigger: {
                                trigger: section.current,
                                start: 'top 80%',
                                once: true,
                            },
                        },
                    );
                });

                return () => {
                    gsap.ticker.remove(tick);
                    window.removeEventListener('resize', measure);
                    hoverCleanups.forEach((cleanup) => cleanup());
                };
            });

            return () => mm.revert();
        },
        { scope: section },
    );

    return (
        <section
            ref={section}
            id="tools"
            aria-labelledby="tools-heading"
            className="overflow-hidden py-20 sm:py-28"
        >
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
                <div className="flex flex-col items-center gap-4 text-center md:flex-row md:justify-between md:text-left">
                    <SplitHeading
                        as="h2"
                        id="tools-heading"
                        className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl"
                    >
                        Tools I work with
                    </SplitHeading>

                    <button
                        type="button"
                        onClick={togglePause}
                        aria-pressed={isPaused}
                        aria-label={
                            isPaused
                                ? 'Play tool carousel'
                                : 'Pause tool carousel'
                        }
                        className="grid size-10 shrink-0 place-items-center rounded-full border text-muted-foreground transition-colors hover:border-brand hover:text-brand motion-reduce:hidden"
                    >
                        <Icon
                            icon={isPaused ? faPlay : faPause}
                            className="size-3.5"
                        />
                    </button>
                </div>

                <p className="mx-auto mt-4 max-w-2xl text-center text-pretty text-muted-foreground sm:text-lg md:mx-0 md:text-left">
                    Laravel and React every day, MySQL and Redis underneath, AI
                    tools when a feature needs them, and design tools to plan
                    the screens first.
                </p>
            </div>

            <div className="relative mt-10 sm:mt-12">
                <div className="flex flex-col gap-3 md:gap-4">
                    {rows.map((row) => (
                        <MarqueeRow key={row.row} row={row} />
                    ))}
                </div>

                {/* Static edge fades: painted once, unlike a mask over moving content. */}
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-linear-to-r from-background to-transparent motion-reduce:hidden sm:w-28"
                />
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-linear-to-l from-background to-transparent motion-reduce:hidden sm:w-28"
                />
            </div>
        </section>
    );
}

function MarqueeRow({ row }: { row: ToolRow }) {
    const copies = Math.max(
        2,
        Math.ceil(MIN_HALF_WIDTH / (row.tools.length * ESTIMATED_PILL_WIDTH)),
    );

    return (
        <div data-marquee-row data-animate className="py-1.5">
            {/* Two identical halves; the track slides by one half, then wraps. */}
            <div
                data-track
                className="flex w-max will-change-transform motion-reduce:w-auto"
            >
                {[0, 1].map((half) => (
                    <ul
                        key={half}
                        aria-label={half === 0 ? row.label : undefined}
                        aria-hidden={half === 1 ? true : undefined}
                        className={cn(
                            'flex shrink-0 gap-3 pr-3 md:gap-4 md:pr-4',
                            'motion-reduce:w-full motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:gap-2.5 motion-reduce:px-4',
                            half === 1 && 'motion-reduce:hidden',
                        )}
                    >
                        {Array.from({ length: copies }, (_, copy) =>
                            row.tools.map((tool) => (
                                <ToolPill
                                    key={`${copy}-${tool.name}`}
                                    tool={tool}
                                    isRepeat={copy > 0}
                                />
                            )),
                        )}
                    </ul>
                ))}
            </div>
        </div>
    );
}

function ToolPill({ tool, isRepeat }: { tool: Tool; isRepeat: boolean }) {
    const colours = brandColours(tool.brand);

    return (
        <li
            aria-hidden={isRepeat ? true : undefined}
            style={
                {
                    '--tool-light': colours.onLight,
                    '--tool-dark': colours.onDark,
                } as CSSProperties
            }
            className={cn(
                'group/tool flex h-11 shrink-0 items-center gap-2.5 rounded-2xl border bg-card/60 px-4 text-muted-foreground transition-[color,border-color,background-color,translate] duration-300 md:h-14 md:gap-3 md:px-5',
                'hover:-translate-y-1 hover:border-current/35 hover:bg-card hover:text-(--tool-light) dark:hover:text-(--tool-dark)',
                isRepeat && 'motion-reduce:hidden',
            )}
        >
            <ToolIcon
                icon={tool.icon}
                name={tool.name}
                className="size-5 shrink-0 transition-transform duration-300 group-hover/tool:scale-110 md:size-6"
            />
            <span className="text-sm font-medium whitespace-nowrap text-foreground/80 transition-colors group-hover/tool:text-foreground md:text-[0.9375rem]">
                {tool.name}
            </span>
        </li>
    );
}
