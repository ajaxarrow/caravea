<?php

namespace App\Http\Requests\Bookings;

use Carbon\CarbonImmutable;
use Carbon\Exceptions\InvalidFormatException;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Shared normalisation for create and update.
 *
 * Times arrive as the dealer's wall-clock time (e.g. "2026-11-20T09:00" from a
 * datetime-local input). Values carrying an explicit offset are honoured as-is.
 * Before validation everything is converted to a UTC ISO-8601 string, so the
 * `after:` rules compare real instants and the model always stores UTC.
 */
abstract class BookingRequest extends FormRequest
{
    public const DATE_FORMAT = 'Y-m-d\TH:i:sP';

    public function authorize(): bool
    {
        // This module has no auth yet. In the platform this is a policy check
        // against the current company — see README.
        return true;
    }

    protected function prepareForValidation(): void
    {
        $normalised = [];

        if (is_string($this->input('rego'))) {
            $normalised['rego'] = strtoupper(preg_replace('/[\s\-]+/', '', $this->input('rego')));
        }

        if (is_string($this->input('customer_email'))) {
            $normalised['customer_email'] = trim($this->input('customer_email'));
        }

        foreach (['starts_at', 'ends_at'] as $key) {
            if (is_string($this->input($key))) {
                $normalised[$key] = $this->toUtcIso($this->input($key));
            }
        }

        $this->merge($normalised);
    }

    public function attributes(): array
    {
        return [
            'customer_name' => 'customer name',
            'customer_email' => 'email',
            'rego' => 'registration',
            'service_bay' => 'service bay',
            'starts_at' => 'start time',
            'ends_at' => 'end time',
        ];
    }

    public function messages(): array
    {
        return [
            'rego.regex' => 'Enter a registration of 2–9 letters or numbers.',
            'service_bay.exists' => 'Choose one of the workshop\'s service bays.',
            'starts_at.date_format' => 'Enter a valid start date and time.',
            'ends_at.date_format' => 'Enter a valid end date and time.',
            'starts_at.after' => 'The start time must be in the future.',
            'ends_at.after' => 'The end time must be after the start time.',
        ];
    }

    /**
     * Validated input mapped onto Booking model attributes.
     *
     * @return array<string, mixed>
     */
    public function bookingAttributes(): array
    {
        $data = $this->validated();

        if (array_key_exists('service_bay', $data)) {
            $data['service_bay_id'] = (int) $data['service_bay'];
            unset($data['service_bay']);
        }

        foreach (['starts_at', 'ends_at'] as $key) {
            if (isset($data[$key])) {
                $data[$key] = CarbonImmutable::createFromFormat(self::DATE_FORMAT, $data[$key])->utc();
            }
        }

        return $data;
    }

    /**
     * Only ISO-8601-looking input is parsed. Anything else ("tomorrow", "")
     * is left untouched so the date_format rule rejects it.
     */
    protected function toUtcIso(string $value): string
    {
        if (! preg_match('/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/', $value)) {
            return $value;
        }

        try {
            $local = CarbonImmutable::parse($value, config('workshop.timezone'));
        } catch (InvalidFormatException) {
            return $value;
        }

        // Carbon silently rolls "31 Feb" over to March. If the parsed wall
        // time doesn't match what was sent, the input was not a real date.
        if ($local->format('Y-m-d H:i') !== substr(str_replace('T', ' ', $value), 0, 16)) {
            return $value;
        }

        return $local->utc()->format(self::DATE_FORMAT);
    }
}
