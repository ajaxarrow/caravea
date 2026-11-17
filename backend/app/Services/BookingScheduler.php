<?php

namespace App\Services;

use App\Models\Booking;
use Illuminate\Support\Facades\DB;

/**
 * The single write path for bookings. Controllers (and later jobs, imports,
 * etc.) go through here so business rules can't be bypassed.
 */
class BookingScheduler
{
    /**
     * @param  array<string, mixed>  $attributes
     */
    public function create(array $attributes): Booking
    {
        return DB::transaction(fn () => Booking::create($attributes));
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function update(Booking $booking, array $attributes): Booking
    {
        return DB::transaction(function () use ($booking, $attributes) {
            $booking->fill($attributes)->save();

            return $booking;
        });
    }
}
