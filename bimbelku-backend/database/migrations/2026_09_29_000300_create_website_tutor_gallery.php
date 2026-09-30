<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('website_tutor_gallery', function (Blueprint $table) {
            $table->id();
            $table->foreignId('teacher_profile_id')->nullable()->constrained('teacher_profiles')->cascadeOnDelete();
            $table->string('display_name', 100);
            $table->string('degree', 120);
            $table->string('description', 180)->nullable();
            $table->string('photo_path', 255)->nullable();
            $table->string('consent_source', 255);
            $table->boolean('is_visible')->default(false);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
            $table->softDeletes();
            $table->index(['is_visible', 'sort_order', 'id'], 'website_tutor_gallery_public_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('website_tutor_gallery');
    }
};
