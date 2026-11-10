<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DeploymentCleanupTest extends TestCase
{
    use RefreshDatabase;

    public function test_preview_does_not_modify_demo_accounts(): void
    {
        $demo = User::factory()->create(['email' => 'demo.student@bimbelku.local', 'role' => 'student', 'status' => 'active']);
        $this->artisan('local:retire-demo-accounts')->assertSuccessful();
        $this->assertSame('active', $demo->fresh()->status);
        $this->assertNull($demo->fresh()->deleted_at);
    }

    public function test_cleanup_requires_backup_and_cannot_run_on_production(): void
    {
        $this->artisan('local:retire-demo-accounts', ['--apply' => true])->assertFailed();
        app()->instance('env', 'production');
        $this->artisan('local:retire-demo-accounts')->assertFailed();
    }

    public function test_cleanup_revokes_only_known_fixture_accounts_and_preserves_personal_accounts(): void
    {
        $demo = User::factory()->create(['email' => 'demo.student@bimbelku.local', 'role' => 'student', 'status' => 'active']);
        $personal = User::factory()->create(['email' => 'personal@example.com', 'role' => 'teacher', 'status' => 'active']);
        $demo->createToken('old-session');
        $temporary = tempnam(sys_get_temp_dir(), 'bku-cleanup-');
        $backup = $temporary.'.sql';
        rename($temporary, $backup);
        file_put_contents($backup, str_repeat('-- synthetic backup for isolated test only\n', 50));
        try {
            $this->artisan('local:retire-demo-accounts', ['--apply' => true, '--backup' => $backup])->assertSuccessful();
            $this->assertSoftDeleted('users', ['id' => $demo->id, 'status' => 'banned']);
            $this->assertSame(0, $demo->tokens()->count());
            $this->assertSame('active', $personal->fresh()->status);
            $this->assertNull($personal->fresh()->deleted_at);
        } finally {
            unlink($backup);
        }
    }
}
