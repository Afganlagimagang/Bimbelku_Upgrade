<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('website_testimonials', function (Blueprint $table) {
            $table->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('website_testimonials', fn (Blueprint $table) => $table->dropConstrainedForeignId('verified_by'));
    }
};
