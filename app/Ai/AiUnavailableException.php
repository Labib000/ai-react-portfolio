<?php

namespace App\Ai;

use RuntimeException;

/**
 * The AI provider can't answer right now: no key, an HTTP error, or a
 * broken stream. Callers show their fallback instead of failing the page.
 */
class AiUnavailableException extends RuntimeException {}
