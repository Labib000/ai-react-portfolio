<?php

namespace App\Http\Controllers;

use App\Ai\AnswerStream;
use App\Ai\KnowledgePack;
use App\Http\Requests\AskRequest;
use Generator;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * "Ask about my work": streams an answer grounded in the content files as
 * server-sent events (see AnswerStream).
 */
class AskController extends Controller
{
    public function __invoke(AskRequest $request, AnswerStream $answers, KnowledgePack $knowledge): StreamedResponse
    {
        $conversation = $request->conversation();
        $project = $request->validated('project');

        $system = $project
            ? str_replace(
                ['{{project}}', '{{profile}}'],
                [(string) $knowledge->project($project), $knowledge->summary()],
                File::get(resource_path('prompts/ask-about-project.md')),
            )
            : str_replace('{{knowledge}}', $knowledge->text(), File::get(resource_path('prompts/ask-about-me.md')));

        // Only opening questions are cached: they're the starter chips, and
        // their answer doesn't depend on earlier turns. The key includes the
        // whole prompt, so editing the prompt or the content starts fresh.
        $cacheKey = count($conversation) === 1
            ? 'ask:'.hash('xxh128', ($project ?? '').'|'.Str::lower(Str::squish($conversation[0]['content'])).'|'.hash('xxh128', $system))
            : null;

        return response()->eventStream(fn (): Generator => $answers->stream($system, $conversation, config('ai.chat'), $cacheKey));
    }
}
