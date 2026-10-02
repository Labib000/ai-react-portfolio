<?php

namespace App\Http\Requests;

use App\Content\ContentRepository;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Arr;
use Illuminate\Validation\Rule;

/**
 * A question for the AI Lab business assistant: the conversation plus
 * either a sample business or text the visitor pasted.
 */
class LabChatRequest extends AskRequest
{
    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            ...Arr::except(parent::rules(), 'project'),
            'messages' => ['required', 'array', 'list', 'min:1', 'max:'.config('ai.lab.history')],
            'sample' => ['required_without:knowledge', 'nullable', 'string', Rule::in(app(ContentRepository::class)->labSamples()->pluck('slug')->all())],
            'knowledge' => ['required_without:sample', 'nullable', 'string', 'min:50', 'max:'.config('ai.lab.knowledge_max')],
            'business' => ['nullable', 'string', 'max:80'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'knowledge.min' => 'Paste a little more about the business (at least 50 characters).',
            'knowledge.max' => 'Keep the business text under :max characters.',
        ];
    }
}
