<?php

namespace App\Providers;

use App\Ai\Contracts\AiProvider;
use App\Ai\Providers\GroqProvider;
use App\Content\ContentRepository;
use App\Http\Responses\ErrorPage;
use Carbon\CarbonImmutable;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;
use Inertia\ExceptionResponse;
use Inertia\Inertia;
use InvalidArgumentException;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(ContentRepository::class, fn (): ContentRepository => new ContentRepository(base_path('content')));

        $this->app->bind(AiProvider::class, function (): AiProvider {
            $provider = config('ai.provider');
            $config = config("ai.providers.{$provider}");

            return match ($provider) {
                'groq' => new GroqProvider(
                    key: $config['key'],
                    model: $config['model'],
                    url: $config['url'],
                    options: $config['options'] ?? [],
                ),
                default => throw new InvalidArgumentException("Unknown AI provider [{$provider}]."),
            };
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        $this->configureRateLimits();

        Inertia::handleExceptionsUsing(fn (ExceptionResponse $response): ?ExceptionResponse => app(ErrorPage::class)($response));
    }

    /**
     * Per-IP limits for the AI endpoints, which spend the provider's free quota.
     */
    protected function configureRateLimits(): void
    {
        RateLimiter::for('brief', fn (Request $request): Limit => Limit::perHour(config('ai.brief.per_hour'))->by($request->ip()));
        RateLimiter::for('job-match', fn (Request $request): Limit => Limit::perHour(config('ai.job_match.per_hour'))->by($request->ip()));
        RateLimiter::for('contact', fn (Request $request): Limit => Limit::perHour(5)->by($request->ip()));
        RateLimiter::for('ask', fn (Request $request): Limit => Limit::perHour(config('ai.chat.per_hour'))->by($request->ip()));
        RateLimiter::for('lab', fn (Request $request): Limit => Limit::perHour(config('ai.lab.per_hour'))->by($request->ip()));
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}
