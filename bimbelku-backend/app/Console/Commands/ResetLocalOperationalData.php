<?php

namespace App\Console\Commands;

use App\Services\LocalOperationalResetService;
use Illuminate\Console\Command;
use RuntimeException;

class ResetLocalOperationalData extends Command
{
    protected $signature = 'local:reset-operational-data {--apply : Hapus akun selain admin utama dan semua histori operasional lokal} {--backup= : Backup SQL sebelum reset}';

    protected $description = 'Menyiapkan salinan database lokal untuk hosting, dengan mempertahankan admin utama dan konfigurasi website';

    public function handle(LocalOperationalResetService $reset): int
    {
        if (! app()->environment(['local', 'testing'])) {
            $this->error('Perintah reset lokal tidak boleh dijalankan pada produksi.');
            return self::FAILURE;
        }
        try {
            $this->info('Admin yang dipertahankan: '.$reset->primaryAdmin()->email);
            if (! $this->option('apply')) {
                $this->info('Preview saja. Belum ada akun atau riwayat yang dihapus.');
                return self::SUCCESS;
            }
            $result = $reset->reset((string) $this->option('backup'));
            $this->info('Reset selesai. Akun selain admin utama dihapus fisik; histori operasional kosong.');
            $this->line(json_encode($result, JSON_UNESCAPED_SLASHES));
            return self::SUCCESS;
        } catch (RuntimeException $exception) {
            $this->error($exception->getMessage());
            return self::FAILURE;
        }
    }
}
