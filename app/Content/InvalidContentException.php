<?php

namespace App\Content;

use RuntimeException;
use Throwable;

class InvalidContentException extends RuntimeException
{
    public static function in(string $path, Throwable $previous): self
    {
        return new self(
            sprintf('Invalid content in [%s]: %s', $path, $previous->getMessage()),
            previous: $previous,
        );
    }
}
