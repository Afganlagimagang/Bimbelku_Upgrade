<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('refunds', function (Blueprint $table) {
            $table->timestamp('gateway_submitted_at')->nullable()->after('gateway_failure_code');
            $table->timestamp('last_reconciled_at')->nullable()->after('gateway_processed_at');
        });
    }

    public function down(): void
    {
        Schema::table('refunds', fn (Blueprint $table) => $table->dropColumn([
            'gateway_submitted_at', 'last_reconciled_at',
        ]));
    }
};
