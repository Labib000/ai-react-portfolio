<?php

namespace App\Http\Requests;

use App\Ai\BriefPlanner;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class BriefRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'type' => ['required', Rule::in(array_keys(BriefPlanner::TYPES))],
            'idea' => ['required', 'string', 'min:40', 'max:1000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'idea.min' => 'Tell me a little more about your idea (at least 40 characters).',
        ];
    }
}
