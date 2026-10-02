<?php

namespace App\Http\Controllers;

use App\Ai\AnswerStream;
use App\Content\ContentRepository;
use App\Content\Data\LabSample;
use App\Content\Data\Project;
use App\Http\Requests\LabChatRequest;
use App\Http\Responses\PageMeta;
use Generator;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * The AI Lab: a business assistant that answers only from one business's
 * information, either a made-up sample or text the visitor pastes.
 */
class LabController extends Controller
{
    public function show(ContentRepository $content): Response
    {
        $projects = $content->projects()->keyBy('slug');

        return Inertia::render('ai-lab', [
            'meta' => (new PageMeta(
                title: 'AI Chatbot Demo for Businesses: Try It Live',
                shareTitle: 'AI Lab: an AI chatbot that answers from your business, not from guesses',
                description: 'Try a live AI chatbot for your business: pick a sample or paste your own FAQ, and it answers only from that text and cites its source. Built by Labib Alam.',
                path: '/ai-lab',
                keywords: [
                    'AI chatbot for business',
                    'AI chatbot developer',
                    'WhatsApp AI chatbot',
                    'custom AI assistant',
                    'AI customer support bot',
                    'Gen AI developer India',
                ],
            ))->toArray(),
            'samples' => $content->labSamples()->map(fn (LabSample $sample): array => [
                ...$sample->toArray(),
                'related' => $this->relatedProject($projects->get((string) $sample->related)),
            ])->all(),
            'knowledgeMax' => config('ai.lab.knowledge_max'),
        ]);
    }

    /**
     * Streams an answer as server-sent events (see AnswerStream). Answers
     * end with a [source: "..."] line the page uses to highlight the text
     * the answer came from.
     */
    public function chat(LabChatRequest $request, ContentRepository $content, AnswerStream $answers): StreamedResponse
    {
        $conversation = $request->conversation();
        $sample = $content->labSamples()->first(fn (LabSample $sample): bool => $sample->slug === $request->validated('sample'));

        $business = $sample instanceof LabSample
            ? $sample->name
            : (Str::squish((string) $request->validated('business')) ?: 'this business');
        $knowledge = $sample instanceof LabSample
            ? $sample->knowledge
            : trim((string) $request->validated('knowledge'));

        $system = str_replace(
            ['{{business}}', '{{knowledge}}'],
            [$business, $knowledge],
            File::get(resource_path('prompts/business-assistant.md')),
        );

        // Only opening questions about a sample are cached. Pasted text is
        // never stored.
        $cacheKey = $sample && count($conversation) === 1
            ? 'lab:'.hash('xxh128', $sample->slug.'|'.Str::lower(Str::squish($conversation[0]['content'])).'|'.hash('xxh128', $system))
            : null;

        return response()->eventStream(fn (): Generator => $answers->stream($system, $conversation, config('ai.lab'), $cacheKey));
    }

    /**
     * @return array{slug: string, title: string}|null
     */
    private function relatedProject(?Project $project): ?array
    {
        return $project ? ['slug' => $project->slug, 'title' => $project->title] : null;
    }
}
