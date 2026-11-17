<?php

namespace App\Exceptions;

use App\Models\Booking;
use Illuminate\Http\JsonResponse;
use RuntimeException;

/**
 * A booking would share its service bay with another non-cancelled booking.
 *
 * Thrown from the domain layer (so jobs and imports get it too) and rendered
 * as a normal 422 validation error on `service_bay`, which is the field the
 * user changes to resolve it.
 */
class BookingOverlapException extends RuntimeException
{
    public function __construct(public readonly Booking $conflict)
    {
        $tz = config('workshop.timezone');
        $start = $conflict->starts_at->setTimezone($tz);
        $end = $conflict->ends_at->setTimezone($tz);

        parent::__construct(sprintf(
            '%s is already booked %s – %s on %s. Choose another bay or time.',
            $conflict->serviceBay->name,
            $start->format('g:ia'),
            $end->format('g:ia'),
            $start->format('D j M'),
        ));
    }

    /**
     * Expected business outcome, not an error worth logging.
     */
    public function report(): void {}

    public function render(): JsonResponse
    {
        return response()->json([
            'message' => $this->getMessage(),
            'errors' => ['service_bay' => [$this->getMessage()]],
        ], 422);
    }
}
