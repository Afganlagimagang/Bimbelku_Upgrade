<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class LoginPortalSeparationTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_must_use_admin_login_portal(): void
    {
        User::factory()->create(['email' => 'admin@example.test', 'password' => Hash::make('password'), 'role' => 'admin', 'status' => 'active']);

        $this->postJson('/api/login', [
            'email' => 'admin@example.test',
            'password' => 'password',
            'login_portal' => 'user',
        ])->assertForbidden()->assertJsonPath('error_code', 'admin_portal_required');
    }

    public function test_regular_user_cannot_use_admin_login_portal(): void
    {
        User::factory()->create(['email' => 'student@example.test', 'password' => Hash::make('password'), 'role' => 'student', 'status' => 'active']);

        $this->postJson('/api/login', [
            'email' => 'student@example.test',
            'password' => 'password',
            'login_portal' => 'admin',
        ])->assertForbidden()->assertJsonPath('message', 'Halaman ini khusus untuk akun administrator.');
    }
}
