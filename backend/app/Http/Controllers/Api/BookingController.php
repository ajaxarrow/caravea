<?php

namespace App\Http\Controllers\Api;

use App\Enums\BookingStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Bookings\IndexBookingsRequest;
use App\Http\Requests\Bookings\StoreBookingRequest;
use App\Http\Requests\Bookings\UpdateBookingRequest;
use App\Http\Resources\BookingResource;
use App\Models\Booking;
use App\Services\BookingScheduler;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class BookingController extends Controller
{
    public function __construct(private readonly BookingScheduler $scheduler) {}

    public function index(IndexBookingsRequest $request): AnonymousResourceCollection
    {
        $bookings = Booking::query()
            ->with('serviceBay')
            ->when($request->status(), fn ($query, BookingStatus $status) => $query->where('status', $status))
            ->orderByDesc('starts_at')
            ->orderByDesc('id')
            ->paginate($request->perPage())
            ->withQueryString();

        return BookingResource::collection($bookings)->additional([
            'meta' => ['status_counts' => $this->statusCounts()],
        ]);
    }

    public function store(StoreBookingRequest $request): JsonResponse
    {
        $booking = $this->scheduler->create($request->bookingAttributes());

        return BookingResource::make($booking->load('serviceBay'))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function show(Booking $booking): BookingResource
    {
        return BookingResource::make($booking->load('serviceBay'));
    }

    public function update(UpdateBookingRequest $request, Booking $booking): BookingResource
    {
        $booking = $this->scheduler->update($booking, $request->bookingAttributes());

        return BookingResource::make($booking->load('serviceBay'));
    }

    public function destroy(Booking $booking): Response
    {
        $booking->delete();

        return response()->noContent();
    }

    /**
     * Totals for the status filter tabs, in a single grouped query.
     *
     * @return array<string, int>
     */
    private function statusCounts(): array
    {
        $counts = Booking::query()
            ->toBase()
            ->select('status')
            ->selectRaw('count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $byStatus = collect(BookingStatus::values())
            ->mapWithKeys(fn (string $status) => [$status => (int) ($counts[$status] ?? 0)]);

        return ['all' => $byStatus->sum(), ...$byStatus->all()];
    }
}
