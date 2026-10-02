import { usePage } from '@inertiajs/react';
import { FloatingAssistant } from '@/components/site/floating-assistant';

type AssistantSetup = {
    label: string;
    subtitle: string;
    starters: string[];
    /** Case study slug: answers stay about that one project. */
    project?: string;
};

const GENERAL_SUBTITLE = 'Answers from my real work and services';

/**
 * Starter questions matched to why someone is on each page. Pages not
 * listed get the general setup.
 */
function setupFor(
    component: string,
    props: Record<string, unknown>,
): AssistantSetup | null {
    switch (component) {
        case 'home':
            return {
                label: 'Ask about my work',
                subtitle: 'Answers from my real work history',
                starters: [
                    'What has he built with Laravel?',
                    'Can he build an AI chatbot for my business?',
                    'Is he open to new roles?',
                ],
            };
        case 'work/index':
            return {
                label: 'Ask about my projects',
                subtitle: GENERAL_SUBTITLE,
                starters: [
                    'Which projects used React?',
                    'What has he built for businesses in Dubai?',
                    'What results did his projects get?',
                ],
            };
        case 'work/show': {
            const project = props.project as
                | { slug: string; title: string }
                | undefined;

            return project
                ? {
                      label: `Ask about ${project.title}`,
                      subtitle: 'Short overview answers from the case study',
                      starters: [
                          `What is ${project.title}?`,
                          'What did Labib build?',
                          'Which tech was used?',
                      ],
                      project: project.slug,
                  }
                : null;
        }
        case 'services':
            return {
                label: 'Ask if I can build your idea',
                subtitle: GENERAL_SUBTITLE,
                starters: [
                    'Can he build a booking system?',
                    'Can he add AI to my app?',
                    'How does he work with clients?',
                ],
            };
        case 'resume':
            return {
                label: "Ask about Labib's experience",
                subtitle: 'Answers from his real work history',
                starters: [
                    'Summarise his experience',
                    'What are his strongest skills?',
                    'What has he built with React?',
                ],
            };
        case 'contact':
            return {
                label: 'Ask before you message',
                subtitle: GENERAL_SUBTITLE,
                starters: [
                    'Is he available for a project?',
                    'What does he charge?',
                    'Can he work with clients abroad?',
                ],
            };
        case 'ai-lab':
            return {
                label: 'Ask about an AI assistant for you',
                subtitle: GENERAL_SUBTITLE,
                starters: [
                    'Can he build a WhatsApp chatbot for my business?',
                    'Can the bot answer from my own documents?',
                    'What has he built with Gen AI?',
                ],
            };
        case 'error':
            // During maintenance the assistant is down too.
            return props.status === 503
                ? null
                : {
                      label: 'Ask what you were looking for',
                      subtitle: GENERAL_SUBTITLE,
                      starters: [
                          'What has he built?',
                          'What services does he offer?',
                          'Is he open to new roles?',
                      ],
                  };
        default:
            return {
                label: 'Ask about my work',
                subtitle: GENERAL_SUBTITLE,
                starters: [
                    'What has he built?',
                    'What services does he offer?',
                    'Is he open to new roles?',
                ],
            };
    }
}

/**
 * The floating "Ask AI" assistant, on every page. It lives in the layout,
 * so a conversation carries on as the visitor moves between pages; it
 * starts fresh only when switching to or from a case study, whose answers
 * are scoped to that one project.
 */
export function PageAssistant() {
    const { component, props } = usePage();
    const setup = setupFor(component, props as Record<string, unknown>);

    if (!setup) {
        return null;
    }

    return (
        <div className="print:hidden">
            <FloatingAssistant
                key={setup.project ?? 'general'}
                label={setup.label}
                shortLabel="Ask AI"
                subtitle={setup.subtitle}
                starters={setup.starters}
                project={setup.project}
            />
        </div>
    );
}
