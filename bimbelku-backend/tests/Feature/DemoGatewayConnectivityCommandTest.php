<?php

namespace Tests\Feature;

use App\Models\Order;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class DemoGatewayConnectivityCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_connectivity_demo_uses_only_development_key_and_creates_a_test_session(): void
    {
        config()->set('xendit.enabled', true);
        config()->set('xendit.webhook_token', 'demo-token');
        config()->set('xendit.base_url', 'https://api.xendit.test');
        config()->set('xendit.secret_key', 'xnd_production_do_not_use');
        Http::preventStrayRequests();
        $this->artisan('demo:gateway-connectivity', ['stage' => 'start'])->assertFailed();
        $this->assertSame(0, Order::query()->count());
        Http::assertNothingSent();

        config()->set('xendit.secret_key', 'xnd_development_demo_only');
        Http::fake(['https://api.xendit.test/sessions' => Http::response([
            'payment_session_id' => 'ps-demo-command',
            'payment_link_url' => 'https://dev.xen.to/demo',
            'status' => 'ACTIVE',
            'expires_at' => now()->addHour()->toIso8601String(),
        ])]);
        $this->artisan('demo:gateway-connectivity', ['stage' => 'start'])->assertSuccessful();
        $order = Order::query()->firstOrFail();
        $this->assertSame('pending', $order->status);
        $this->assertSame('ps-demo-command', $order->gateway_session_id);
        $this->assertStringStartsWith('DEMO-XENDIT-', $order->order_id);
        Http::assertSentCount(1);
    }
}
