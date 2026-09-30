<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('gateway_session_id', 120)->nullable()->unique()->after('payment_provider');
            $table->string('gateway_payment_id', 120)->nullable()->index()->after('gateway_session_id');
            $table->string('gateway_reference_id', 120)->nullable()->unique()->after('gateway_payment_id');
            $table->text('gateway_checkout_url')->nullable()->after('gateway_reference_id');
            $table->string('gateway_status', 40)->nullable()->index()->after('gateway_checkout_url');
            $table->timestamp('gateway_expires_at')->nullable()->after('gateway_status');
            $table->timestamp('gateway_paid_at')->nullable()->after('gateway_expires_at');
        });

        Schema::create('payment_gateway_events', function (Blueprint $table) {
            $table->id();
            $table->string('provider', 40)->default('xendit');
            $table->string('event_id', 160)->unique();
            $table->string('event_type', 100)->index();
            $table->foreignId('order_id')->nullable()->constrained()->nullOnDelete();
            $table->string('status', 30)->default('received')->index();
            $table->json('payload');
            $table->text('error')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_gateway_events');
        Schema::table('orders', function (Blueprint $table) {
            $table->dropUnique(['gateway_session_id']);
            $table->dropIndex(['gateway_payment_id']);
            $table->dropUnique(['gateway_reference_id']);
            $table->dropIndex(['gateway_status']);
            $table->dropColumn([
                'gateway_session_id', 'gateway_payment_id', 'gateway_reference_id',
                'gateway_checkout_url', 'gateway_status', 'gateway_expires_at', 'gateway_paid_at',
            ]);
        });
    }
};
