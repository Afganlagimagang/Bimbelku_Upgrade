<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class RetireDemoAccounts extends Command
{
    protected $signature = 'local:retire-demo-accounts {--apply : Nonaktifkan akun yang dikenali} {--backup= : Path backup SQL sebelum perubahan}';

    protected $description = 'Merapikan akun fixture lokal sebelum salinan database dipindahkan ke hosting, tanpa menghapus riwayat keuangan';

    private const EMAILS = [
        'budi@guru.com', 'murid@bimbelku.com',
        'demo.gateway@bimbelku.local', 'demo.student@bimbelku.local',
        'demo.student2@bimbelku.local', 'demo.tutor@bimbelku.local', 'demo.admin@bimbelku.local',
        'demo.replacement.student@bimbelku.local', 'demo.replacement.old@bimbelku.local',
        'demo.replacement.new@bimbelku.local', 'demo.replacement.admin@bimbelku.local',
        'qa.browser.murid.20261003@bimbelku.test', 'qa.browser.admin.20261003@bimbelku.test',
    ];

    public function handle(): int
    {
        if (! app()->environment(['local', 'testing'])) {
            $this->error('Pembersihan ini hanya untuk database local/testing sebelum ekspor.');
            return self::FAILURE;
        }
        $accounts = User::query()->whereIn('email', self::EMAILS)->orderBy('id')->get();
        $this->table(['ID', 'Email fixture', 'Role'], $accounts->map(fn ($u) => [$u->id, $u->email, $u->role]));
        if (! $this->option('apply')) {
            $this->info($accounts->count().' akun dikenali. Belum ada perubahan database.');
            return self::SUCCESS;
        }
        $backup = (string) $this->option('backup');
        if (! is_file($backup) || pathinfo($backup, PATHINFO_EXTENSION) !== 'sql' || filesize($backup) < 1000) {
            $this->error('Backup SQL diperlukan sebelum --apply. Isi --backup dengan path backup yang sudah dibuat.');
            return self::FAILURE;
        }
        DB::transaction(function () use ($accounts) {
            foreach ($accounts as $account) {
                $user = User::query()->lockForUpdate()->find($account->id);
                if (! $user || ! in_array($user->email, self::EMAILS, true)) continue;
                $user->forceFill(['status' => 'banned', 'password' => Hash::make(Str::random(64)), 'remember_token' => null])->save();
                $user->tokens()->delete();
                if (Schema::hasTable('sessions')) DB::table('sessions')->where('user_id', $user->id)->delete();
                $user->teacherProfile()->update(['is_accepting_requests' => false, 'public_profile_enabled' => false]);
                $user->delete();
            }
        });
        $this->info($accounts->count().' akun fixture dinonaktifkan dan dihapus lunak; histori transaksi dipertahankan.');
        return self::SUCCESS;
    }
}
