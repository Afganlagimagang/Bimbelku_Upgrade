<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('teacher_appeals');
        Schema::dropIfExists('teacher_point_ledgers');

        if (Schema::hasTable('teacher_profiles') && Schema::hasColumn('teacher_profiles', 'points')) {
            Schema::table('teacher_profiles', function (Blueprint $table) {
                $table->dropColumn('points');
            });
        }

        if (Schema::hasTable('settings')) {
            DB::table('settings')->whereIn('key', [
                'teacher_appeal_window_days',
                'teacher_offer_wave_size',
            ])->delete();
        }
    }

    public function down(): void
    {
        // Sistem poin dan bandingnya sengaja dipensiunkan dan tidak dihidupkan lagi saat rollback.
    }
};
