import type { Profile } from '@/types/content';

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            site: Pick<Profile, 'name' | 'role' | 'location' | 'links'> & {
                /** Absolute site URL, without a trailing slash. */
                url: string;
            };
            [key: string]: unknown;
        };
    }
}

export {};
