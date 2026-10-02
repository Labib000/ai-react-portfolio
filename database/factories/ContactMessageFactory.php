<?php

namespace Database\Factories;

use App\Models\ContactMessage;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ContactMessage>
 */
class ContactMessageFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->safeEmail(),
            'reason' => fake()->randomElement(['hiring', 'project']),
            'company' => fake()->optional()->company(),
            'message' => fake()->paragraph(),
            'ip' => fake()->ipv4(),
        ];
    }
}
