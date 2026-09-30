<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('teacher_profiles', function (Blueprint $table) {
            $table->string('public_display_name', 100)->nullable()->after('public_directory_approved_at');
            $table->string('public_degree', 120)->nullable()->after('public_display_name');
        });
    }

    public function down(): void
    {
        Schema::table('teacher_profiles', function (Blueprint $table) {
            $table->dropColumn(['public_display_name', 'public_degree']);
        });
    }
};
