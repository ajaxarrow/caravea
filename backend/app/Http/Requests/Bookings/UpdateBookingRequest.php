<?php

namespace App\Http\Requests\Bookings;

use App\Enums\BookingStatus;
use App\Models\Booking;
use Illuminate\Validation\Rule;

/**
 * Supports partial updates (PATCH), e.g. `{"status": "cancelled"}`.
 */
class UpdateBookingRequest extends BookingRequest
{
    protected function prepareForValidation(): void
    {
        parent::prepareForValidation();

        // When only one end of the range changes, compare it against the
        // stored other end so "ends after starts" still holds.
        /** @var Booking $booking */
        $booking = $this->route('booking');

        if ($this->has('starts_at') && ! $this->has('ends_at')) {
            $this->merge(['ends_at' => $booking->ends_at->utc()->format(self::DATE_FORMAT)]);
        }

        if ($this->has('ends_at') && ! $this->has('starts_at')) {
            $this->merge(['starts_at' => $booking->starts_at->utc()->format(self::DATE_FORMAT)]);
        }
    }

    public function rules(): array
    {
        // No "must be in the future" rule here: staff need to edit or cancel
        // bookings that have already started.
        return [
            'customer_name' => ['sometimes', 'required', 'string', 'max:120'],
            'customer_email' => ['sometimes', 'required', 'string', 'email', 'max:255'],
            'rego' => ['sometimes', 'required', 'string', 'regex:/^[A-Z0-9]{2,9}$/'],
            'service_bay' => ['sometimes', 'required', 'integer', Rule::exists('service_bays', 'id')],
            'starts_at' => ['sometimes', 'required', 'date_format:'.self::DATE_FORMAT],
            'ends_at' => ['sometimes', 'required', 'date_format:'.self::DATE_FORMAT, 'after:starts_at'],
            'status' => ['sometimes', 'required', Rule::enum(BookingStatus::class)],
            'notes' => ['sometimes', 'nullable', 'string', 'max:2000'],
        ];
    }
}
