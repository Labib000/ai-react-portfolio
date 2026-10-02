<?php

namespace App\Http\Controllers;

use App\Ai\AiUnavailableException;
use App\Ai\BriefPlanner;
use App\Http\Requests\BriefRequest;
use Illuminate\Http\JsonResponse;

/**
 * Drafts a project brief from a client's idea for the /services page.
 */
class BriefController extends Controller
{
    public function __invoke(BriefRequest $request, BriefPlanner $planner): JsonResponse
    {
        try {
            return response()->json($planner->plan(
                $request->validated('type'),
                trim($request->validated('idea')),
            ));
        } catch (AiUnavailableException $exception) {
            report($exception);

            return response()->json([
                'message' => 'The planner is unavailable right now. Tell me about your idea on WhatsApp or by email instead.',
            ], 503);
        }
    }
}
