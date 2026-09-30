<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DemoJourneyTimeCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_refuses_to_advance_an_unpaid_order(): void
    {
        $student = User::factory()->create(['role' => 'student', 'status' => 'active']);
        $order = Order::create([
            'user_id' => $student->id,
            'order_id' => 'ORD-DEMO-UNPAID',
            'amount' => 50000,
            'status' => 'pending',
        ]);
        $order->forceFill(['payment_provider' => 'xendit'])->save();

        $this->artisan('demo:journey-time', [
            'order' => $order->order_id, 'stage' => 'start',
        ])->assertFailed();
        $this->assertSame('pending', $order->fresh()->status);
    }

    public function test_it_refuses_to_advance_a_paid_order_without_a_class_or_package(): void
    {
        $student = User::factory()->create(['role' => 'student', 'status' => 'active']);
        $order = Order::create([
            'user_id' => $student->id,
            'order_id' => 'ORD-DEMO-CONNECTIVITY',
            'amount' => 15000,
            'status' => 'paid',
        ]);
        $order->forceFill(['payment_provider' => 'xendit'])->save();

        $this->artisan('demo:journey-time', [
            'order' => $order->order_id, 'stage' => 'start',
        ])->assertFailed();
    }
}
