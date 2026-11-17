<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bookings', function (Blueprint $table) {
            // UUIDv7: not guessable or enumerable from a URL, safe to generate
            // anywhere (imports, other services), and still time-ordered so
            // inserts stay index-friendly.
            $table->uuid('id')->primary();
            $table->foreignId('service_bay_id')->constrained()->restrictOnDelete();
            $table->string('customer_name', 120);
            $table->string('customer_email');
            $table->string('rego', 9);
            // Stored in UTC; the API converts from/to the workshop timezone.
            $table->dateTime('starts_at');
            $table->dateTime('ends_at');
            $table->string('status', 16)->default('pending');
            $table->text('notes')->nullable();
            $table->timestamps();

            // Overlap lookups: "bookings in bay X that intersect [start, end)".
            $table->index(['service_bay_id', 'starts_at', 'ends_at']);
            // List page: filter by status, newest appointment first.
            $table->index(['status', 'starts_at']);
            $table->index('starts_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};
