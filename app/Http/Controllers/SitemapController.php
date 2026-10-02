<?php

namespace App\Http\Controllers;

use App\Content\ContentRepository;
use App\Content\Data\Project;
use Illuminate\Http\Response;

/**
 * sitemap.xml for search engines: every public page and case study on the
 * live domain, each with the date its content last changed.
 */
class SitemapController extends Controller
{
    public function __invoke(ContentRepository $content): Response
    {
        $base = rtrim($content->profile()->website ?? config('app.url'), '/');
        $siteChanged = $content->modifiedAt();

        $pages = [
            ['path' => '/', 'modified' => $siteChanged, 'priority' => '1.0'],
            ['path' => '/services', 'modified' => $siteChanged, 'priority' => '0.9'],
            ['path' => '/work', 'modified' => $siteChanged, 'priority' => '0.8'],
            ...$content->projects()->map(fn (Project $project): array => [
                'path' => "/work/{$project->slug}",
                'modified' => $content->modifiedAt("projects/{$project->slug}.md"),
                'priority' => '0.7',
            ])->all(),
            ['path' => '/ai-lab', 'modified' => $siteChanged, 'priority' => '0.7'],
            ['path' => '/resume', 'modified' => $siteChanged, 'priority' => '0.6'],
            ['path' => '/contact', 'modified' => $siteChanged, 'priority' => '0.6'],
        ];

        $urls = array_map(fn (array $page): string => sprintf(
            "  <url>\n    <loc>%s</loc>\n    <lastmod>%s</lastmod>\n    <priority>%s</priority>\n  </url>",
            htmlspecialchars($base.$page['path'], ENT_XML1),
            $page['modified']->toDateString(),
            $page['priority'],
        ), $pages);

        $xml = '<?xml version="1.0" encoding="UTF-8"?>'."\n"
            .'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'."\n"
            .implode("\n", $urls)."\n"
            .'</urlset>'."\n";

        return response($xml, 200, ['Content-Type' => 'application/xml; charset=UTF-8']);
    }
}
