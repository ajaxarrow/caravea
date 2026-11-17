<?php

namespace App\Models;

use App\Enums\BookingStatus;
use Carbon\CarbonInterface;
use Database\Factories\BookingFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property string $id UUIDv7
 * @property int $service_bay_id
 * @property string $customer_name
 * @property string $customer_email
 * @property string $rego
 * @property CarbonInterface $starts_at
 * @property CarbonInterface $ends_at
 * @property BookingStatus $status
 * @property string|null $notes
 */
#[Fillable([
    'service_bay_id',
    'customer_name',
    'customer_email',
    'rego',
    'starts_at',
    'ends_at',
    'status',
    'notes',
])]
class Booking extends Model
{
    /** @use HasFactory<BookingFactory> */
    use HasFactory, HasUuids;

    protected $attributes = [
        'status' => 'pending',
    ];

    protected function casts(): array
    {
        return [
            'starts_at' => 'immutable_datetime',
            'ends_at' => 'immutable_datetime',
            'status' => BookingStatus::class,
        ];
    }

    /**
     * @return BelongsTo<ServiceBay, $this>
     */
    public function serviceBay(): BelongsTo
    {
        return $this->belongsTo(ServiceBay::class);
    }

    /**
     * Bookings that hold their bay (anything not cancelled).
     *
     * @param  Builder<self>  $query
     */
    #[Scope]
    protected function occupyingBay(Builder $query): void
    {
        $query->where('status', '!=', BookingStatus::Cancelled->value);
    }

    /**
     * Bookings whose time range intersects [$start, $end).
     *
     * Ranges are half-open, so a booking ending at 10:00 does not clash
     * with one starting at 10:00 — back-to-back jobs are allowed.
     *
     * @param  Builder<self>  $query
     */
    #[Scope]
    protected function overlapping(Builder $query, CarbonInterface $start, CarbonInterface $end): void
    {
        $query->where('starts_at', '<', $end)->where('ends_at', '>', $start);
    }
}
