<?php

namespace App\Http\Requests;

use App\Content\ContentRepository;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class AskRequest extends FormRequest
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
            'messages' => ['required', 'array', 'list', 'min:1', 'max:'.config('ai.chat.history')],
            'messages.*.role' => ['required', Rule::in(['user', 'assistant'])],
            // Earlier answers come back as history, so only questions get the tight limit (see after()).
            'messages.*.content' => ['required', 'string', 'max:4000'],
            // Set on case study pages: answers stay about that one project.
            'project' => ['nullable', 'string', Rule::in(app(ContentRepository::class)->projects()->pluck('slug')->all())],
        ];
    }

    /**
     * @return array<int, callable(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $messages = $this->input('messages');

                if (! is_array($messages)) {
                    return;
                }

                if (data_get(end($messages), 'role') !== 'user') {
                    $validator->errors()->add('messages', 'The last message must be a question.');
                }

                foreach ($messages as $index => $message) {
                    if (data_get($message, 'role') === 'user' && mb_strlen((string) data_get($message, 'content')) > 500) {
                        $validator->errors()->add("messages.{$index}.content", 'Questions may not be longer than 500 characters.');
                    }
                }
            },
        ];
    }

    /**
     * The conversation, oldest first, ending with the visitor's question.
     *
     * @return list<array{role: 'user'|'assistant', content: string}>
     */
    public function conversation(): array
    {
        /** @var list<array{role: 'user'|'assistant', content: string}> $messages */
        $messages = array_map(
            fn (array $message): array => ['role' => $message['role'], 'content' => trim($message['content'])],
            $this->validated('messages'),
        );

        return $messages;
    }
}
