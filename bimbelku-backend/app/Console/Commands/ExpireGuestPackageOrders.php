<?php

namespace App\Console\Commands;

use App\Models\GuestPackageOrder;
use Illuminate\Console\Command;

class ExpireGuestPackageOrders extends Command
{
    protected $signature = 'guest-packages:expire';

    protected $description = 'Menandai draf pesanan tamu yang melewati masa aktif sebagai kedaluwarsa';

    public function handle(): int
    {
        $expired = GuestPackageOrder::query()
            ->where('status', 'pending')
            ->where('expires_at', '<=', now())
            ->update(['status' => 'expired']);

        $this->info("{$expired} draf pesanan tamu ditandai kedaluwarsa.");

        return self::SUCCESS;
    }
}
