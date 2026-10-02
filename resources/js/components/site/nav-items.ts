import ContactController from '@/actions/App/Http/Controllers/ContactController';

export type NavItem = {
    label: string;
    href: string;
    /** id of the home page section the link scrolls to */
    section: string;
};

/** Where every "Hire me" button goes: the contact page, set for a project. */
export const HIRE_ME_HREF = ContactController.show.url({
    query: { reason: 'project' },
});

/** Links without a #hash are pages of their own; they stay active on sub-pages. */
export function isOnPage(item: NavItem, url: string): boolean {
    return !item.href.includes('#') && url.startsWith(item.href);
}

/**
 * Single source for the header, mobile menu and footer links. These point at
 * home page sections for now and become real pages as they are built.
 */
export const navItems: NavItem[] = [
    { label: 'Experience', href: '/#experience', section: 'experience' },
    { label: 'Work', href: '/work', section: 'work' },
    { label: 'Services', href: '/services', section: 'services' },
    { label: 'Resume', href: '/resume', section: 'resume' },
    { label: 'AI Lab', href: '/ai-lab', section: 'ai-lab' },
    { label: 'Contact', href: '/contact', section: 'contact' },
];
