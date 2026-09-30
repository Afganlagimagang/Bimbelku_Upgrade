<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->string('attention_key', 100)->nullable()->index()->after('unique_key');
            $table->string('entity_type', 80)->nullable()->after('attention_key');
            $table->unsignedBigInteger('entity_id')->nullable()->after('entity_type');
            $table->timestamp('read_at')->nullable()->after('is_read');
            $table->timestamp('invalidated_at')->nullable()->index()->after('read_at');
        });

        // Badge lama tidak memiliki identitas peristiwa yang cukup untuk dibuktikan
        // masih baru. Notifikasi tetap tersimpan, hanya status perhatian yang ditutup.
        DB::table('notifications')->where('is_read', false)->update([
            'is_read' => true,
            'read_at' => now(),
        ]);
        DB::table('notifications')->where('is_read', true)->whereNull('read_at')->update([
            'read_at' => DB::raw('updated_at'),
        ]);
    }

    public function down(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->dropIndex(['attention_key']);
            $table->dropIndex(['invalidated_at']);
            $table->dropColumn(['attention_key', 'entity_type', 'entity_id', 'read_at', 'invalidated_at']);
        });
    }
};
