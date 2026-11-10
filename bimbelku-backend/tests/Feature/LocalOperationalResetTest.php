<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\User;
use App\Services\LocalOperationalResetService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use RuntimeException;
use Tests\TestCase;

class LocalOperationalResetTest extends TestCase
{
    use RefreshDatabase;

    public function test_reset_keeps_only_primary_admin_credentials_and_catalog(): void
    {
        config(['bimbelku.primary_admin_email' => 'primary@example.test']);
        $primary = User::factory()->create(['email' => 'primary@example.test', 'role' => 'admin', 'status' => 'active']);
        $password = $primary->getRawOriginal('password');
        $student = User::factory()->create(['role' => 'student', 'status' => 'active']);
        $secondary = User::factory()->create(['role' => 'admin', 'status' => 'active']);
        $secondary->delete();
        Order::create(['user_id' => $student->id, 'order_id' => 'RESET-TEST-01', 'amount' => 10000, 'status' => 'pending']);
        $primary->createToken('old-admin-session');
        $student->createToken('old-student-session');
        DB::table('settings')->insert(['key' => 'reset_test_setting', 'value' => 'keep-me']);
        $temporary = tempnam(sys_get_temp_dir(), 'bku-reset-');
        $backup = $temporary.'.sql';
        rename($temporary, $backup);
        file_put_contents($backup, str_repeat('-- isolated reset test backup\n', 100));
        try {
            $result = app(LocalOperationalResetService::class)->reset($backup);
            $this->assertSame('primary@example.test', $result['admin_email']);
            $this->assertDatabaseCount('users', 1);
            $this->assertSame($password, $primary->fresh()->getRawOriginal('password'));
            $this->assertDatabaseHas('settings', ['key' => 'reset_test_setting', 'value' => 'keep-me']);
            $this->assertDatabaseCount('orders', 0);
            $this->assertDatabaseCount('personal_access_tokens', 0);
            foreach (LocalOperationalResetService::CLEAR as $table) {
                if (Schema::hasTable($table)) $this->assertDatabaseCount($table, 0);
            }
        } finally {
            unlink($backup);
        }
    }

    public function test_reset_requires_a_backup_and_refuses_production(): void
    {
        $this->expectException(RuntimeException::class);
        app(LocalOperationalResetService::class)->reset('missing-backup.sql');
    }

    public function test_command_refuses_production_even_with_apply(): void
    {
        app()->instance('env', 'production');
        $this->artisan('local:reset-operational-data', ['--apply' => true])->assertFailed();
    }
}
