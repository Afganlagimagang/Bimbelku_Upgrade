<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->decimal('teacher_paid_amount', 15, 2)->default(0)->after('teacher_net_amount');
            $table->decimal('teacher_reserved_amount', 15, 2)->default(0)->after('teacher_paid_amount');
        });

        Schema::table('teacher_payout_requests', function (Blueprint $table) {
            $table->decimal('requested_amount', 15, 2)->nullable()->after('commission_amount');
            $table->decimal('tax_amount', 15, 2)->default(0)->after('requested_amount');
            $table->json('allocation_breakdown')->nullable()->after('booking_ids');
        });

        Schema::table('payouts', function (Blueprint $table) {
            $table->decimal('requested_amount', 15, 2)->nullable()->after('commission_amount');
            $table->decimal('tax_amount', 15, 2)->default(0)->after('requested_amount');
            $table->json('allocation_breakdown')->nullable()->after('booking_ids');
        });

        DB::table('bookings')->where('payout_status', 'paid')->update([
            'teacher_paid_amount' => DB::raw('teacher_net_amount'),
        ]);
        DB::table('bookings')->where('payout_status', 'requested')->update([
            'teacher_reserved_amount' => DB::raw('teacher_net_amount'),
        ]);

        DB::table('settings')->updateOrInsert(
            ['key' => 'teacher_withholding_tax_percent'],
            ['value' => '0', 'created_at' => now(), 'updated_at' => now()]
        );
    }

    public function down(): void
    {
        Schema::table('payouts', fn (Blueprint $table) => $table->dropColumn([
            'requested_amount', 'tax_amount', 'allocation_breakdown',
        ]));
        Schema::table('teacher_payout_requests', fn (Blueprint $table) => $table->dropColumn([
            'requested_amount', 'tax_amount', 'allocation_breakdown',
        ]));
        Schema::table('bookings', fn (Blueprint $table) => $table->dropColumn([
            'teacher_paid_amount', 'teacher_reserved_amount',
        ]));
        DB::table('settings')->where('key', 'teacher_withholding_tax_percent')->delete();
    }
};
