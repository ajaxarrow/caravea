<?php

namespace App\Services;

use App\Exceptions\BookingOverlapException;
use App\Models\Booking;
use Illuminate\Support\Facades\DB;

/**
 * The single write path for bookings. Controllers (and later jobs, imports,
 * etc.) go through here so the overlap rule can't be bypassed.
 *
 * Why the check lives here and not in the Form Request: validation runs
 * before the write, outside any lock. Two requests for the same slot would
 * both pass it and both insert. The check has to happen inside the same
 * transaction as the write, after taking a lock that the other request
 * also needs.
 */
class BookingScheduler
{
    /**
     * @param  array<string, mixed>  $attributes
     *
     * @throws BookingOverlapException
     */
    public function create(array $attributes): Booking
    {
        return DB::transaction(function () use ($attributes) {
            $booking = new Booking($attributes);

            $this->ensureSlotIsFree($booking);
            $booking->save();

            return $booking;
        });
    }

    /**
     * @param  array<string, mixed>  $attributes
     *
     * @throws BookingOverlapException
     */
    public function update(Booking $booking, array $attributes): Booking
    {
        return DB::transaction(function () use ($booking, $attributes) {
            $booking->fill($attributes);

            // Editing notes or contact details doesn't touch the slot.
            if ($booking->isDirty(['service_bay_id', 'starts_at', 'ends_at', 'status'])) {
                $this->ensureSlotIsFree($booking);
            }

            $booking->save();

            return $booking;
        });
    }

    private function ensureSlotIsFree(Booking $booking): void
    {
        if (! $booking->status->occupiesBay()) {
            return;
        }

        $this->lockBay($booking->service_bay_id);

        $conflict = Booking::query()
            ->with('serviceBay')
            ->where('service_bay_id', $booking->service_bay_id)
            ->occupyingBay()
            ->overlapping($booking->starts_at, $booking->ends_at)
            ->when($booking->exists, fn ($query) => $query->whereKeyNot($booking->getKey()))
            ->orderBy('starts_at')
            ->first();

        if ($conflict) {
            throw new BookingOverlapException($conflict);
        }
    }

    /**
     * Serialise booking writes per bay until this transaction ends.
     *
     * This must be the first statement in the transaction, before any read.
     * It is an UPDATE rather than SELECT ... FOR UPDATE because an UPDATE
     * takes a real write lock on every engine we care about:
     *  - MySQL / Postgres: an exclusive lock on this bay's row only. Other
     *    bays aren't blocked. The overlap query that follows starts after the
     *    lock is granted, so it sees bookings committed by whoever held it.
     *  - SQLite: the database write lock (lockForUpdate() compiles to nothing
     *    there). With busy_timeout set, concurrent writers wait their turn
     *    instead of failing with "database is locked".
     */
    private function lockBay(int $serviceBayId): void
    {
        DB::table('service_bays')->where('id', $serviceBayId)->increment('lock_version');
    }
}
