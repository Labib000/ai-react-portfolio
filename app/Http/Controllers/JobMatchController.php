<?php

namespace App\Http\Controllers;

use App\Ai\AiUnavailableException;
use App\Ai\JobMatcher;
use App\Http\Requests\JobMatchRequest;
use Illuminate\Http\JsonResponse;

/**
 * Scores a pasted job description against Labib's background for the
 * resume page. See JobMatcher for how tiers and the fit score are decided.
 */
class JobMatchController extends Controller
{
    public function __invoke(JobMatchRequest $request, JobMatcher $matcher): JsonResponse
    {
        try {
            return response()->json($matcher->match(trim($request->validated('description'))));
        } catch (AiUnavailableException $exception) {
            report($exception);

            return response()->json([
                'message' => 'The matcher is unavailable right now. Please try again later, or email me the job description.',
            ], 503);
        }
    }
}
