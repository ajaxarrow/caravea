<?php

namespace App\Http\Requests\Bookings;

use App\Enums\BookingStatus;
use Illuminate\Validation\Rule;

class StoreBookingRequest extends BookingRequest
{
    public function rules(): array
    {
        return [
            'customer_name' => ['required', 'string', 'max:120'],
            'customer_email' => ['required', 'string', 'email', 'max:255'],
            'rego' => ['required', 'string', 'regex:/^[A-Z0-9]{2,9}$/'],
            'service_bay' => ['required', 'integer', Rule::exists('service_bays', 'id')],
            'starts_at' => ['required', 'date_format:'.self::DATE_FORMAT, 'after:now'],
            'ends_at' => ['required', 'date_format:'.self::DATE_FORMAT, 'after:starts_at'],
            // A booking can't be born cancelled.
            'status' => ['sometimes', Rule::enum(BookingStatus::class)->except(BookingStatus::Cancelled)],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
