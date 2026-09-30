<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\PersistentLoginService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CheckpointFourQualityAuditTest extends TestCase
{
    use RefreshDatabase;

    public function test_api_responses_send_baseline_security_headers(): void
    {
        $this->getJson('/api/route-yang-tidak-ada')
            ->assertNotFound()
            ->assertHeader('X-Content-Type-Options', 'nosniff')
            ->assertHeader('X-Frame-Options', 'DENY')
            ->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
            ->assertHeader('Permissions-Policy', 'camera=(self), geolocation=(self), microphone=()')
            ->assertHeader('Cross-Origin-Opener-Policy', 'same-origin')
            ->assertHeader('X-Permitted-Cross-Domain-Policies', 'none')
            ->assertHeader('X-DNS-Prefetch-Control', 'off')
            ->assertHeader('Content-Security-Policy', "default-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'");
    }

    public function test_bearer_authenticated_responses_are_not_cacheable(): void
    {
        $student = User::factory()->create([
            'role' => 'student',
            'status' => 'active',
        ]);
        $token = $student->createToken('checkpoint-four')->plainTextToken;

        $this->withToken($token)
            ->getJson('/api/user')
            ->assertOk()
            ->assertHeader('Pragma', 'no-cache');

        $response = $this->withToken($token)->getJson('/api/user');
        $this->assertStringContainsString(
            'no-store',
            (string) $response->headers->get('Cache-Control')
        );
    }

    public function test_api_tokens_have_finite_per_token_lifetimes_without_shortening_remembered_sessions(): void
    {
        // A global Sanctum cap would expire remembered devices after 12 hours.
        $this->assertNull(config('sanctum.expiration'));

        $student = User::factory()->create(['role' => 'student', 'status' => 'active']);
        $sessions = app(PersistentLoginService::class);
        $standard = $sessions->issue($student, false);
        $remembered = $sessions->issue($student, true);

        $this->assertTrue($standard['expires_at']->between(now()->addHours(11), now()->addHours(13)));
        $this->assertTrue($remembered['expires_at']->between(now()->addDays(29), now()->addDays(31)));
        $this->assertNotNull($standard['token']->accessToken->expires_at);
        $this->assertNotNull($remembered['token']->accessToken->expires_at);
    }
}
