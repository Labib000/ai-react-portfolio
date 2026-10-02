import { faMoon } from '@fortawesome/free-solid-svg-icons/faMoon';
import { faSun } from '@fortawesome/free-solid-svg-icons/faSun';
import { Icon } from '@/components/ui/icon';
import { useAppearance } from '@/hooks/use-appearance';
import { cn } from '@/lib/utils';

export function ThemeToggle({ className }: { className?: string }) {
    const { resolvedAppearance, updateAppearance } = useAppearance();

    return (
        <button
            type="button"
            onClick={() =>
                updateAppearance(
                    resolvedAppearance === 'dark' ? 'light' : 'dark',
                )
            }
            aria-label="Toggle colour theme"
            className={cn(
                'grid size-10 place-items-center rounded-full border text-muted-foreground transition-colors hover:border-brand hover:text-brand',
                className,
            )}
        >
            {/* Both icons render and CSS picks one, so SSR and client markup match. */}
            <Icon icon={faSun} className="hidden size-4 dark:block" />
            <Icon icon={faMoon} className="size-4 dark:hidden" />
        </button>
    );
}
