<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('notifications')->where('is_read', false)
            ->where(fn ($query) => $query->whereNull('target_url')->orWhere('target_url', ''))
            ->update(['is_read' => true]);

        DB::table('refunds')->select('id')->where(fn ($query) => $query
            ->where('status', 'paid')
            ->orWhere('source_type', 'teacher_replacement')
            ->orWhere('reason', 'Tutor tidak ditemukan'))
            ->orderBy('id')->chunkById(500, function ($refunds) {
                foreach ($refunds as $refund) {
                    DB::table('notifications')->where('unique_key', 'like', "refund-action:{$refund->id}:%")
                        ->update(['is_read' => true]);
                }
            });

        DB::table('payouts')->select('id')->whereIn('status', ['completed', 'failed'])
            ->orderBy('id')->chunkById(500, function ($payouts) {
                foreach ($payouts as $payout) {
                    DB::table('notifications')->where('unique_key', "payout-processing:{$payout->id}")
                        ->update(['is_read' => true]);
                }
            });
    }

    public function down(): void
    {
        // Read state is user data; it cannot be reconstructed safely.
    }
};
