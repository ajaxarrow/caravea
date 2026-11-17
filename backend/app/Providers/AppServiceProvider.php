<?php

namespace App\Providers;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // Lazy loading (N+1), silently discarded attributes and missing
        // attributes throw outside production instead of slipping through.
        Model::shouldBeStrict(! $this->app->isProduction());
    }
}
