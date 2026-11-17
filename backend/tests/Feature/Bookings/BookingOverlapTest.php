<?php

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\ServiceBay;

use function Pest\Laravel\patchJson;
use function Pest\Laravel\postJson;
use function Pest\Laravel\putJson;

/*
 * The existing booking in every test: Bay A, Wed 6 March 2030,
 * 9:00–11:00 in Melbourne (22:00–00:00 UTC). Request times below are
 * Melbourne wall-clock, as the form sends them.
 */
beforeEach(function () {
    $this->bay = ServiceBay::factory()->create(['name' => 'Bay A']);
    $this->existing = Booking::factory()
        ->for($this->bay)
        ->between('2030-03-05 22:00', '2030-03-06 00:00')
        ->status(BookingStatus::Confirmed)
        ->create();
});

function slot(string $from, string $to, array $extra = []): array
{
    return bookingPayload([
        'service_bay' => test()->bay->id,
        'starts_at' => "2030-03-06T{$from}",
        'ends_at' => "2030-03-06T{$to}",
        ...$extra,
    ]);
}

describe('creating', function () {
    it('rejects a booking that overlaps an existing one in the same bay', function (string $from, string $to) {
        postJson('/api/bookings', slot($from, $to))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('service_bay');

        expect(Booking::count())->toBe(1);
    })->with([
        'identical times' => ['09:00', '11:00'],
        'starts during it' => ['10:00', '12:00'],
        'ends during it' => ['08:00', '10:00'],
        'surrounds it' => ['08:00', '12:00'],
        'sits inside it' => ['09:30', '10:30'],
        'one minute of overlap' => ['10:59', '12:00'],
    ]);

    it('allows back-to-back bookings (ranges are half-open)', function (string $from, string $to) {
        postJson('/api/bookings', slot($from, $to))->assertCreated();
    })->with([
        'ends exactly when it starts' => ['07:00', '09:00'],
        'starts exactly when it ends' => ['11:00', '13:00'],
    ]);

    it('allows the same time in a different bay', function () {
        $otherBay = ServiceBay::factory()->create();

        postJson('/api/bookings', slot('09:00', '11:00', ['service_bay' => $otherBay->id]))->assertCreated();
    });

    it('ignores cancelled bookings', function () {
        $this->existing->update(['status' => BookingStatus::Cancelled]);

        postJson('/api/bookings', slot('09:00', '11:00'))->assertCreated();
    });

    it('treats pending bookings as holding the bay', function () {
        $this->existing->update(['status' => BookingStatus::Pending]);

        postJson('/api/bookings', slot('10:00', '12:00'))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('service_bay');
    });

    it('explains the clash in workshop time', function () {
        postJson('/api/bookings', slot('10:00', '12:00'))
            ->assertUnprocessable()
            ->assertJsonPath(
                'errors.service_bay.0',
                'Bay A is already booked 9:00am – 11:00am on Wed 6 Mar. Choose another bay or time.',
            );
    });
});

describe('updating', function () {
    beforeEach(function () {
        // Same bay, later that morning: 11:00–12:00 Melbourne.
        $this->other = Booking::factory()
            ->for($this->bay)
            ->between('2030-03-06 00:00', '2030-03-06 01:00')
            ->create();
    });

    it('rejects moving a booking into an occupied slot', function () {
        patchJson("/api/bookings/{$this->other->id}", [
            'starts_at' => '2030-03-06T10:30',
            'ends_at' => '2030-03-06T12:00',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('service_bay');

        expect($this->other->fresh()->starts_at->toIso8601ZuluString())->toBe('2030-03-06T00:00:00Z');
    });

    it('rejects extending a booking into the next one', function () {
        patchJson("/api/bookings/{$this->existing->id}", ['ends_at' => '2030-03-06T11:30'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('service_bay');
    });

    it('rejects moving a booking to a bay that is busy at that time', function () {
        $otherBay = ServiceBay::factory()->create();
        $elsewhere = Booking::factory()->for($otherBay)->between('2030-03-05 22:00', '2030-03-06 00:00')->create();

        patchJson("/api/bookings/{$elsewhere->id}", ['service_bay' => $this->bay->id])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('service_bay');
    });

    it('does not treat a booking as clashing with itself', function () {
        putJson("/api/bookings/{$this->existing->id}", slot('09:00', '10:30', ['status' => 'confirmed']))
            ->assertOk()
            ->assertJsonPath('data.ends_at', '2030-03-05T23:30:00Z');
    });

    it('frees the slot when a booking is cancelled', function () {
        patchJson("/api/bookings/{$this->existing->id}", ['status' => 'cancelled'])->assertOk();

        postJson('/api/bookings', slot('09:00', '11:00'))->assertCreated();
    });

    it('rejects re-opening a cancelled booking whose slot has since been taken', function () {
        $this->existing->update(['status' => BookingStatus::Cancelled]);
        Booking::factory()->for($this->bay)->between('2030-03-05 22:00', '2030-03-06 00:00')->create();

        patchJson("/api/bookings/{$this->existing->id}", ['status' => 'pending'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('service_bay');
    });

    it('lets a booking be cancelled even if it overlaps something', function () {
        // e.g. data that predates the rule — cancelling must always work.
        $clash = Booking::factory()->for($this->bay)->between('2030-03-05 23:00', '2030-03-06 00:30')->create();

        patchJson("/api/bookings/{$clash->id}", ['status' => 'cancelled'])->assertOk();
    });

    it('does not re-check the slot when only details change', function () {
        $clash = Booking::factory()->for($this->bay)->between('2030-03-05 23:00', '2030-03-06 00:30')->create();

        patchJson("/api/bookings/{$clash->id}", ['notes' => 'Bring spare key'])->assertOk();
    });
});
