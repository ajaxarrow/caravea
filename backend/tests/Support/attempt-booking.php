<?php

/*
 * Worker for ConcurrentBookingTest. Boots the app, waits for a shared start
 * instant, tries one booking through BookingScheduler and prints the outcome.
 *
 * Usage: php tests/Support/attempt-booking.php <bayId> <startsAt> <endsAt> <goAtMicrotime>
 */

use App\Exceptions\BookingOverlapException;
use App\Services\BookingScheduler;
use Carbon\CarbonImmutable;
use Illuminate\Contracts\Console\Kernel;

require __DIR__.'/../../vendor/autoload.php';

$app = require __DIR__.'/../../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

[, $bayId, $startsAt, $endsAt, $goAt] = $argv;

$scheduler = $app->make(BookingScheduler::class);

while (microtime(true) < (float) $goAt) {
    usleep(100);
}

try {
    $scheduler->create([
        'service_bay_id' => (int) $bayId,
        'customer_name' => 'Racer '.getmypid(),
        'customer_email' => 'racer'.getmypid().'@example.com',
        'rego' => 'RACE'.(getmypid() % 1000),
        'starts_at' => CarbonImmutable::parse($startsAt),
        'ends_at' => CarbonImmutable::parse($endsAt),
    ]);
    echo 'created';
} catch (BookingOverlapException) {
    echo 'conflict';
} catch (Throwable $e) {
    echo 'error: '.$e::class.': '.$e->getMessage();
}
