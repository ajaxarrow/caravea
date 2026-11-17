<?php

namespace Database\Factories;

use App\Models\ServiceBay;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ServiceBay>
 */
class ServiceBayFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => 'Bay '.fake()->unique()->numberBetween(1, 99),
        ];
    }
}
