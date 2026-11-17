<?php

namespace Database\Factories;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\ServiceBay;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Note: the factory writes straight to the table and does not go through
 * BookingScheduler, so it will happily create overlapping bookings. That's
 * deliberate — tests use it to arrange existing state.
 *
 * @extends Factory<Booking>
 */
class BookingFactory extends Factory
{
    public function definition(): array
    {
        $start = CarbonImmutable::now()
            ->addDays(fake()->numberBetween(1, 30))
            ->setTime(fake()->numberBetween(7, 14), 0);

        return [
            'service_bay_id' => ServiceBay::factory(),
            'customer_name' => fake()->name(),
            'customer_email' => fake()->safeEmail(),
            'rego' => strtoupper(fake()->bothify('???###')),
            'starts_at' => $start,
            'ends_at' => $start->addHours(fake()->numberBetween(1, 3)),
            'status' => BookingStatus::Pending,
            'notes' => fake()->optional()->sentence(),
        ];
    }

    public function status(BookingStatus $status): static
    {
        return $this->state(['status' => $status]);
    }

    public function between(string $start, string $end): static
    {
        return $this->state([
            'starts_at' => CarbonImmutable::parse($start),
            'ends_at' => CarbonImmutable::parse($end),
        ]);
    }
}
