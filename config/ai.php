<?php

return [

    /*
    |--------------------------------------------------------------------------
    | AI provider
    |--------------------------------------------------------------------------
    |
    | Which entry in "providers" the AI features use. Every provider speaks
    | the same App\Ai\Contracts\AiProvider interface, so switching is a
    | config change.
    |
    */

    'provider' => env('AI_PROVIDER', 'groq'),

    'providers' => [
        'groq' => [
            'key' => env('GROQ_API_KEY'),
            'model' => env('GROQ_MODEL', 'openai/gpt-oss-120b'),
            'url' => 'https://api.groq.com/openai/v1/chat/completions',
            // Extra request fields. gpt-oss models reason before answering;
            // keep that short and out of the streamed text.
            'options' => [
                'reasoning_effort' => 'low',
                'include_reasoning' => false,
            ],
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | "Ask about my work" chat
    |--------------------------------------------------------------------------
    |
    | max_tokens includes the model's hidden reasoning, so it is higher than
    | the visible answer needs. cache_ttl is in seconds.
    |
    */

    'chat' => [
        'max_tokens' => 1024,
        'temperature' => 0.3,
        'history' => 6,
        'per_hour' => 20,
        'cache_ttl' => 60 * 60 * 24 * 7,
    ],

    /*
    |--------------------------------------------------------------------------
    | Job description matcher (résumé page)
    |--------------------------------------------------------------------------
    */

    'brief' => [
        'max_tokens' => 2048,
        'per_hour' => 5,
        'cache_ttl' => 60 * 60 * 24 * 7,
    ],

    'job_match' => [
        'max_tokens' => 2048,
        'per_hour' => 5,
        'cache_ttl' => 60 * 60 * 24 * 7,
    ],

    /*
    |--------------------------------------------------------------------------
    | AI Lab business assistant
    |--------------------------------------------------------------------------
    |
    | Visitors chat with an assistant grounded in a sample business or text
    | they paste. Only first questions about the samples are cached; pasted
    | text is never stored.
    |
    */

    'lab' => [
        'max_tokens' => 1024,
        'temperature' => 0.2,
        'history' => 6,
        'knowledge_max' => 3000,
        'per_hour' => 30,
        'cache_ttl' => 60 * 60 * 24 * 7,
    ],

];
