<?php

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\ServiceBay;
use Illuminate\Support\Facades\DB;

use function Pest\Laravel\deleteJson;
use function Pest\Laravel\getJson;
use function Pest\Laravel\patchJson;
use function Pest\Laravel\postJson;
use function Pest\Laravel\putJson;

describe('index', function () {
    it('lists bookings newest appointment first, paginated', function () {
        $bay = ServiceBay::factory()->create();
        $early = Booking::factory()->for($bay)->between('2030-03-10 01:00', '2030-03-10 02:00')->create();
        $late = Booking::factory()->for($bay)->between('2030-03-12 01:00', '2030-03-12 02:00')->create();
        Booking::factory()->count(10)->for($bay)->between('2030-03-01 01:00', '2030-03-01 02:00')->create();

        getJson('/api/bookings?per_page=5')
            ->assertOk()
            ->assertJsonCount(5, 'data')
            ->assertJsonPath('data.0.id', $late->id)
            ->assertJsonPath('data.1.id', $early->id)
            ->assertJsonPath('meta.current_page', 1)
            ->assertJsonPath('meta.last_page', 3)
            ->assertJsonPath('meta.total', 12);
    });

    it('defaults to 10 per page and serves later pages', function () {
        Booking::factory()->count(13)->create();

        getJson('/api/bookings?page=2')
            ->assertOk()
            ->assertJsonCount(3, 'data')
            ->assertJsonPath('meta.per_page', 10)
            ->assertJsonPath('meta.current_page', 2);
    });

    it('filters by status and keeps the filter in pagination links', function () {
        Booking::factory()->count(3)->status(BookingStatus::Confirmed)->create();
        Booking::factory()->count(2)->status(BookingStatus::Pending)->create();
        Booking::factory()->status(BookingStatus::Cancelled)->create();

        $response = getJson('/api/bookings?status=confirmed&per_page=2')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('meta.total', 3);

        expect(collect($response->json('data'))->pluck('status')->unique()->all())->toBe(['confirmed'])
            ->and($response->json('links.next'))->toContain('status=confirmed');
    });

    it('returns status counts for the filter tabs regardless of the active filter', function () {
        Booking::factory()->count(3)->status(BookingStatus::Confirmed)->create();
        Booking::factory()->count(2)->status(BookingStatus::Pending)->create();
        Booking::factory()->status(BookingStatus::Cancelled)->create();

        getJson('/api/bookings?status=pending')
            ->assertOk()
            ->assertJsonPath('meta.status_counts', [
                'all' => 6,
                'pending' => 2,
                'confirmed' => 3,
                'cancelled' => 1,
            ]);
    });

    it('rejects invalid query parameters', function (string $query, string $field) {
        getJson("/api/bookings?{$query}")
            ->assertUnprocessable()
            ->assertJsonValidationErrors($field);
    })->with([
        'unknown status' => ['status=finished', 'status'],
        'page zero' => ['page=0', 'page'],
        'per_page too big' => ['per_page=500', 'per_page'],
    ]);

    it('loads the list in a fixed number of queries (no N+1)', function () {
        $bays = ServiceBay::factory()->count(4)->create();
        foreach ($bays as $bay) {
            Booking::factory()->count(5)->for($bay)->create();
        }

        DB::enableQueryLog();
        getJson('/api/bookings?per_page=20')->assertOk()->assertJsonCount(20, 'data');

        // count + page of bookings + eager-loaded bays + status counts
        expect(DB::getQueryLog())->toHaveCount(4);
    });
});

describe('show', function () {
    it('returns a booking in UTC with its bay', function () {
        $bay = ServiceBay::factory()->create(['name' => 'Bay 2']);
        $booking = Booking::factory()->for($bay)->between('2030-03-04 22:00', '2030-03-05 00:00')->create([
            'rego' => 'XYZ789',
            'status' => BookingStatus::Confirmed,
        ]);

        getJson("/api/bookings/{$booking->id}")
            ->assertOk()
            ->assertJson(['data' => [
                'id' => $booking->id,
                'rego' => 'XYZ789',
                'service_bay' => ['id' => $bay->id, 'name' => 'Bay 2'],
                'starts_at' => '2030-03-04T22:00:00Z',
                'ends_at' => '2030-03-05T00:00:00Z',
                'status' => 'confirmed',
            ]]);
    });

    it('returns a JSON 404 for a booking that does not exist', function (string $id) {
        getJson("/api/bookings/{$id}")
            ->assertNotFound()
            ->assertJsonStructure(['message']);
    })->with([
        'unknown uuid' => ['0194f3a2-7c1e-7b2a-9c4d-1a2b3c4d5e6f'],
        'not a uuid' => ['not-a-uuid'],
        'old-style integer id' => ['1'],
    ]);
});

describe('store', function () {
    it('identifies bookings by a time-ordered UUID, not a guessable number', function () {
        $first = postJson('/api/bookings', bookingPayload())->assertCreated()->json('data.id');
        $second = postJson('/api/bookings', bookingPayload(['starts_at' => '2030-03-07T09:00', 'ends_at' => '2030-03-07T10:00']))
            ->assertCreated()
            ->json('data.id');

        expect($first)->toBeString()->toBeUuid()
            ->and($second)->toBeUuid()
            ->and(strcmp($first, $second))->toBeLessThan(0); // UUIDv7 sorts by creation time

        getJson("/api/bookings/{$first}")->assertOk()->assertJsonPath('data.id', $first);
    });

    it('creates a pending booking, normalising rego and converting workshop time to UTC', function () {
        $payload = bookingPayload();

        $response = postJson('/api/bookings', $payload)
            ->assertCreated()
            ->assertJsonPath('data.rego', 'ABC123')
            ->assertJsonPath('data.status', 'pending')
            // 9am Melbourne (UTC+11) is 10pm UTC the day before.
            ->assertJsonPath('data.starts_at', '2030-03-04T22:00:00Z')
            ->assertJsonPath('data.ends_at', '2030-03-05T00:00:00Z')
            ->assertJsonPath('data.service_bay.id', $payload['service_bay']);

        $this->assertDatabaseHas('bookings', [
            'id' => $response->json('data.id'),
            'customer_email' => 'jane@example.com',
            'rego' => 'ABC123',
            'service_bay_id' => $payload['service_bay'],
            'starts_at' => '2030-03-04 22:00:00',
            'status' => 'pending',
        ]);
    });

    it('honours an explicit UTC offset instead of the workshop timezone', function () {
        postJson('/api/bookings', bookingPayload([
            'starts_at' => '2030-03-05T09:00:00+00:00',
            'ends_at' => '2030-03-05T10:30:00+00:00',
        ]))
            ->assertCreated()
            ->assertJsonPath('data.starts_at', '2030-03-05T09:00:00Z')
            ->assertJsonPath('data.ends_at', '2030-03-05T10:30:00Z');
    });

    it('accepts a confirmed status and empty notes', function () {
        postJson('/api/bookings', bookingPayload(['status' => 'confirmed', 'notes' => '']))
            ->assertCreated()
            ->assertJsonPath('data.status', 'confirmed')
            ->assertJsonPath('data.notes', null);
    });
});

describe('update', function () {
    it('replaces a booking', function () {
        $booking = Booking::factory()->create();
        $newBay = ServiceBay::factory()->create();

        putJson("/api/bookings/{$booking->id}", bookingPayload([
            'service_bay' => $newBay->id,
            'customer_name' => 'Sam Driver',
            'status' => 'confirmed',
        ]))
            ->assertOk()
            ->assertJsonPath('data.customer_name', 'Sam Driver')
            ->assertJsonPath('data.service_bay.id', $newBay->id)
            ->assertJsonPath('data.status', 'confirmed');

        expect($booking->fresh())
            ->service_bay_id->toBe($newBay->id)
            ->status->toBe(BookingStatus::Confirmed);
    });

    it('supports partial updates such as cancelling', function () {
        $booking = Booking::factory()->create(['customer_name' => 'Unchanged']);

        patchJson("/api/bookings/{$booking->id}", ['status' => 'cancelled'])
            ->assertOk()
            ->assertJsonPath('data.status', 'cancelled')
            ->assertJsonPath('data.customer_name', 'Unchanged');
    });

    it('lets staff edit a booking that has already started', function () {
        $booking = Booking::factory()->between('2030-03-03 22:00', '2030-03-04 02:00')->create();

        patchJson("/api/bookings/{$booking->id}", ['notes' => 'Customer running late'])
            ->assertOk()
            ->assertJsonPath('data.notes', 'Customer running late');
    });

    it('returns 404 when updating a missing booking', function () {
        patchJson('/api/bookings/0194f3a2-7c1e-7b2a-9c4d-1a2b3c4d5e6f', ['status' => 'confirmed'])->assertNotFound();
    });
});

describe('destroy', function () {
    it('deletes a booking', function () {
        $booking = Booking::factory()->create();

        deleteJson("/api/bookings/{$booking->id}")->assertNoContent();

        $this->assertModelMissing($booking);
        getJson("/api/bookings/{$booking->id}")->assertNotFound();
    });
});

it('exposes the workshop timezone and service bays', function () {
    $bays = ServiceBay::factory()->count(2)->create();

    getJson('/api/workshop')
        ->assertOk()
        ->assertJsonPath('data.timezone', 'Australia/Melbourne')
        ->assertJsonPath('data.service_bays.0.id', $bays[0]->id)
        ->assertJsonCount(2, 'data.service_bays');
});
