<?php

namespace Database\Seeders;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\ServiceBay;
use Carbon\CarbonImmutable;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Four bays and a few weeks of realistic, non-overlapping bookings.
     */
    public function run(): void
    {
        $bays = collect(['Bay 1 · General service', 'Bay 2 · General service', 'Bay 3 · Chassis & axles', 'Bay 4 · Gas & electrical'])
            ->map(fn (string $name) => ServiceBay::create(['name' => $name]));

        $tz = config('workshop.timezone');
        $firstDay = CarbonImmutable::now($tz)->subDays(5)->startOfDay();

        foreach ($bays as $bay) {
            for ($day = 0; $day < 21; $day++) {
                $date = $firstDay->addDays($day);

                if ($date->isWeekend() || fake()->boolean(25)) {
                    continue;
                }

                // Jobs are laid end to end from 8am, so they never overlap.
                $cursor = $date->setTime(8, 0);
                $jobs = fake()->numberBetween(1, 3);

                for ($i = 0; $i < $jobs; $i++) {
                    $start = $cursor->addMinutes(fake()->randomElement([0, 30, 60]));
                    $end = $start->addHours(fake()->randomElement([1, 2, 3]));

                    Booking::factory()->for($bay)->create([
                        'starts_at' => $start->utc(),
                        'ends_at' => $end->utc(),
                        'status' => $this->statusFor($start),
                    ]);

                    $cursor = $end;
                }
            }
        }
    }

    private function statusFor(CarbonImmutable $start): BookingStatus
    {
        if (fake()->boolean(12)) {
            return BookingStatus::Cancelled;
        }

        return $start->isPast() || fake()->boolean(55)
            ? BookingStatus::Confirmed
            : BookingStatus::Pending;
    }
}
