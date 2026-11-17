<?php

use App\Models\Booking;

use function Pest\Laravel\patchJson;
use function Pest\Laravel\postJson;

describe('creating', function () {
    it('rejects invalid input on the right field', function (array $overrides, string $field) {
        postJson('/api/bookings', bookingPayload($overrides))
            ->assertUnprocessable()
            ->assertJsonValidationErrors($field);

        expect(Booking::count())->toBe(0);
    })->with([
        'missing customer name' => [['customer_name' => null], 'customer_name'],
        'customer name too long' => [['customer_name' => str_repeat('a', 121)], 'customer_name'],
        'missing email' => [['customer_email' => ''], 'customer_email'],
        'malformed email' => [['customer_email' => 'not-an-email'], 'customer_email'],
        'missing rego' => [['rego' => null], 'rego'],
        'rego too short' => [['rego' => 'A'], 'rego'],
        'rego too long' => [['rego' => '1234567890'], 'rego'],
        'rego with symbols' => [['rego' => 'AB$12'], 'rego'],
        'missing service bay' => [['service_bay' => null], 'service_bay'],
        'unknown service bay' => [['service_bay' => 999], 'service_bay'],
        'non-numeric service bay' => [['service_bay' => 'bay-one'], 'service_bay'],
        'missing start' => [['starts_at' => null], 'starts_at'],
        'natural-language start' => [['starts_at' => 'tomorrow'], 'starts_at'],
        'impossible date (would roll over)' => [['starts_at' => '2031-02-31T09:00', 'ends_at' => '2031-03-10T09:00'], 'starts_at'],
        'impossible hour' => [['starts_at' => '2030-03-05T25:00'], 'starts_at'],
        // 9am Melbourne on the 4th is 10pm UTC on the 3rd: already past.
        'start in the past (workshop time)' => [['starts_at' => '2030-03-04T09:00', 'ends_at' => '2030-03-04T10:00'], 'starts_at'],
        'missing end' => [['ends_at' => null], 'ends_at'],
        'end before start' => [['ends_at' => '2030-03-05T08:00'], 'ends_at'],
        'end equal to start' => [['ends_at' => '2030-03-05T09:00'], 'ends_at'],
        'created as cancelled' => [['status' => 'cancelled'], 'status'],
        'unknown status' => [['status' => 'done'], 'status'],
        'notes too long' => [['notes' => str_repeat('a', 2001)], 'notes'],
    ]);

    it('returns friendly messages', function () {
        postJson('/api/bookings', bookingPayload(['rego' => '!', 'ends_at' => '2030-03-05T08:00']))
            ->assertUnprocessable()
            ->assertJsonPath('errors.rego.0', 'Enter a registration of 2–9 letters or numbers.')
            ->assertJsonPath('errors.ends_at.0', 'The end time must be after the start time.');
    });
});

describe('updating', function () {
    beforeEach(function () {
        $this->booking = Booking::factory()->between('2030-03-05 22:00', '2030-03-06 00:00')->create();
    });

    it('checks a changed end time against the stored start time', function () {
        // 8am Melbourne on the 6th = 21:00 UTC on the 5th, before the stored start.
        patchJson("/api/bookings/{$this->booking->id}", ['ends_at' => '2030-03-06T08:00'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('ends_at');
    });

    it('checks a changed start time against the stored end time', function () {
        patchJson("/api/bookings/{$this->booking->id}", ['starts_at' => '2030-03-06T12:00'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('ends_at');
    });

    it('rejects blanking a required field', function (string $field) {
        patchJson("/api/bookings/{$this->booking->id}", [$field => ''])
            ->assertUnprocessable()
            ->assertJsonValidationErrors($field);
    })->with(['customer_name', 'customer_email', 'rego', 'service_bay', 'status']);
});
