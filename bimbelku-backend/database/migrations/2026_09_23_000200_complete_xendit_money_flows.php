<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('gateway_payment_request_id', 120)->nullable()->index()->after('gateway_payment_id');
        });

        Schema::table('refunds', function (Blueprint $table) {
            $table->string('payment_provider', 40)->nullable()->index()->after('status');
            $table->string('gateway_refund_id', 120)->nullable()->unique()->after('payment_provider');
            $table->string('gateway_reference_id', 120)->nullable()->unique()->after('gateway_refund_id');
            $table->string('gateway_status', 40)->nullable()->index()->after('gateway_reference_id');
            $table->string('gateway_failure_code', 120)->nullable()->after('gateway_status');
            $table->timestamp('gateway_processed_at')->nullable()->after('gateway_failure_code');
        });

        Schema::table('payouts', function (Blueprint $table) {
            $table->string('proof_url')->nullable()->change();
            $table->string('payment_provider', 40)->nullable()->index()->after('status');
            $table->string('gateway_payout_id', 120)->nullable()->unique()->after('payment_provider');
            $table->string('gateway_reference_id', 120)->nullable()->unique()->after('gateway_payout_id');
            $table->string('gateway_status', 40)->nullable()->index()->after('gateway_reference_id');
            $table->string('gateway_failure_code', 120)->nullable()->after('gateway_status');
            $table->timestamp('gateway_processed_at')->nullable()->after('gateway_failure_code');
            $table->string('payout_channel_code', 40)->nullable()->after('account_name');
        });

        Schema::table('teacher_profiles', function (Blueprint $table) {
            $table->string('payout_channel_code', 40)->nullable()->after('bank_name');
        });

        Schema::table('teacher_payout_requests', function (Blueprint $table) {
            $table->string('payout_channel_code', 40)->nullable()->after('bank_name');
        });

        Schema::table('payment_gateway_events', function (Blueprint $table) {
            $table->foreignId('refund_id')->nullable()->after('order_id')->constrained()->nullOnDelete();
            $table->foreignId('payout_id')->nullable()->after('refund_id')->constrained()->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('payment_gateway_events', function (Blueprint $table) {
            $table->dropConstrainedForeignId('payout_id');
            $table->dropConstrainedForeignId('refund_id');
        });
        Schema::table('teacher_payout_requests', fn (Blueprint $table) => $table->dropColumn('payout_channel_code'));
        Schema::table('teacher_profiles', fn (Blueprint $table) => $table->dropColumn('payout_channel_code'));
        Schema::table('payouts', function (Blueprint $table) {
            $table->dropUnique(['gateway_payout_id']);
            $table->dropUnique(['gateway_reference_id']);
            $table->dropIndex(['payment_provider']);
            $table->dropIndex(['gateway_status']);
            $table->dropColumn(['payment_provider', 'gateway_payout_id', 'gateway_reference_id', 'gateway_status', 'gateway_failure_code', 'gateway_processed_at', 'payout_channel_code']);
            $table->string('proof_url')->nullable(false)->change();
        });
        Schema::table('refunds', function (Blueprint $table) {
            $table->dropUnique(['gateway_refund_id']);
            $table->dropUnique(['gateway_reference_id']);
            $table->dropIndex(['payment_provider']);
            $table->dropIndex(['gateway_status']);
            $table->dropColumn(['payment_provider', 'gateway_refund_id', 'gateway_reference_id', 'gateway_status', 'gateway_failure_code', 'gateway_processed_at']);
        });
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex(['gateway_payment_request_id']);
            $table->dropColumn('gateway_payment_request_id');
        });
    }
};
