<?php

namespace App\Enums;

enum BookingStatus: string
{
    case Pending = 'pending';
    case Confirmed = 'confirmed';
    case Cancelled = 'cancelled';

    /**
     * Whether a booking in this status occupies its service bay.
     * Cancelled bookings free the slot for someone else.
     */
    public function occupiesBay(): bool
    {
        return $this !== self::Cancelled;
    }

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
