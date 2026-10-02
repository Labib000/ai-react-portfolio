<?php

namespace App\Content\Data;

final readonly class FaqItem
{
    public function __construct(
        public string $question,
        public string $answer,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public static function fromArray(array $data): self
    {
        return new self(
            question: $data['question'],
            answer: $data['answer'],
        );
    }

    /**
     * @return array{question: string, answer: string}
     */
    public function toArray(): array
    {
        return [
            'question' => $this->question,
            'answer' => $this->answer,
        ];
    }
}
