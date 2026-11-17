<?php

use App\Models\ServiceBay;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

pest()->extend(TestCase::class)
    ->use(RefreshDatabase::class)
    ->beforeEach(function () {
        // Tuesday 4 March 2030, 11:00 in Melbourne (AEDT, UTC+11).
        $this->travelTo('2030-03-04 00:00:00 UTC');
        config(['workshop.timezone' => 'Australia/Melbourne']);
    })
    ->in('Feature');

/**
 * A valid create payload. Times are Melbourne wall-clock, as a
 * datetime-local input would send them.
 *
 * @param  array<string, mixed>  $overrides
 * @return array<string, mixed>
 */
function bookingPayload(array $overrides = []): array
{
    return array_merge([
        'customer_name' => 'Jane Citizen',
        'customer_email' => 'jane@example.com',
        'rego' => 'abc 123',
        'service_bay' => array_key_exists('service_bay', $overrides)
            ? $overrides['service_bay']
            : ServiceBay::factory()->create()->id,
        'starts_at' => '2030-03-05T09:00',
        'ends_at' => '2030-03-05T11:00',
        'notes' => 'Annual service, check brakes.',
    ], $overrides);
}
