<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as SocialiteUser;
use Tests\TestCase;

class GoogleAuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_google_callback_creates_incomplete_student_and_code_can_only_be_exchanged_once(): void
    {
        config()->set('services.google.client_id', 'test-client');
        config()->set('services.google.client_secret', 'test-secret');

        $state = 'state-for-google-authentication-test';
        Cache::put('google_oauth_state:'.hash('sha256', $state), ['redirect' => '/student/dashboard'], now()->addMinutes(10));
        Socialite::fake('google', SocialiteUser::fake([
            'id' => 'google-student-123',
            'name' => 'Murid Google',
            'email' => 'murid.google@example.test',
            'verified_email' => true,
        ]));

        $callback = $this->get('/api/auth/google/callback?state='.$state);
        $callback->assertRedirect();
        parse_str((string) parse_url($callback->headers->get('Location'), PHP_URL_QUERY), $query);

        $exchange = $this->postJson('/api/auth/google/exchange', ['code' => $query['code'] ?? '']);
        $exchange->assertOk()
            ->assertJsonPath('user.role', 'student')
            ->assertJsonPath('user.status', 'pending')
            ->assertJsonPath('requires_profile_completion', true)
            ->assertJsonPath('redirect', '/student/dashboard');

        $this->postJson('/api/auth/google/exchange', ['code' => $query['code'] ?? ''])->assertUnprocessable();
        $this->assertDatabaseHas('users', [
            'email' => 'murid.google@example.test',
            'google_id' => 'google-student-123',
            'role' => 'student',
            'status' => 'pending',
        ]);
    }

    public function test_google_student_must_complete_required_profile_before_activation(): void
    {
        $user = User::factory()->create([
            'role' => 'student',
            'status' => 'pending',
            'google_onboarding_required_at' => now(),
        ]);
        $token = $user->createToken('test-google-auth')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/auth/google/complete-profile', [
                'phone' => '081234567890',
                'date_of_birth' => '2000-01-01',
                'school_name' => 'Sekolah Contoh',
                'grade' => 'SMA',
                'terms_accepted' => true,
                'privacy_accepted' => true,
            ]);

        $response->assertOk()->assertJsonPath('user.status', 'active');
        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'status' => 'active',
            'phone' => '081234567890',
            'google_onboarding_required_at' => null,
        ]);
    }

    public function test_google_login_refuses_existing_teacher_email(): void
    {
        config()->set('services.google.client_id', 'test-client');
        config()->set('services.google.client_secret', 'test-secret');
        User::factory()->create(['email' => 'tutor@example.test', 'role' => 'teacher']);

        $state = 'state-for-teacher-conflict-test';
        Cache::put('google_oauth_state:'.hash('sha256', $state), ['redirect' => null], now()->addMinutes(10));
        Socialite::fake('google', SocialiteUser::fake([
            'id' => 'google-teacher-123',
            'email' => 'tutor@example.test',
            'verified_email' => true,
        ]));

        $response = $this->get('/api/auth/google/callback?state='.$state);
        $response->assertRedirect();
        $this->assertStringContainsString('google_error=', $response->headers->get('Location'));
        $this->assertDatabaseMissing('users', ['email' => 'tutor@example.test', 'google_id' => 'google-teacher-123']);
    }
}
