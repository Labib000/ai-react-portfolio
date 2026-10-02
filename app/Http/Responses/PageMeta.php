<?php

namespace App\Http\Responses;

/**
 * A page's search and share tags: title, description, keywords, canonical
 * path, preview image and robots. Controllers pass it as the "meta" prop.
 * The root template renders it into the HTML the server sends (so crawlers
 * and link previews see it without JavaScript), and the React SeoHead keeps
 * the same tags current as visitors move between pages.
 */
final readonly class PageMeta
{
    /**
     * @param  list<string>  $keywords
     */
    public function __construct(
        public string $title,
        public string $description,
        public string $path,
        public ?string $shareTitle = null,
        public array $keywords = [],
        public string $image = '/og.png',
        public string $type = 'website',
        public bool $noindex = false,
    ) {}

    /**
     * @return array{title: string, shareTitle: string, description: string, path: string, keywords: list<string>, image: string, type: string, noindex: bool}
     */
    public function toArray(): array
    {
        return [
            'title' => $this->title,
            'shareTitle' => $this->shareTitle ?? $this->title,
            'description' => $this->description,
            'path' => $this->path,
            'keywords' => $this->keywords,
            'image' => $this->image,
            'type' => $this->type,
            'noindex' => $this->noindex,
        ];
    }
}
