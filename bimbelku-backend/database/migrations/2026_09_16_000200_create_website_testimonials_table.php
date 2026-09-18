<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('website_testimonials', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rating_id')->nullable()->constrained()->nullOnDelete();
            $table->string('display_name', 100);
            $table->string('audience_role', 120)->nullable();
            $table->text('quote');
            $table->string('program_name', 150)->nullable();
            $table->string('outcome', 180)->nullable();
            $table->string('institution', 150)->nullable();
            $table->string('major', 150)->nullable();
            $table->unsignedSmallInteger('achievement_year')->nullable();
            $table->string('photo_path')->nullable();
            $table->string('proof_path')->nullable();
            $table->timestamp('consent_at')->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->boolean('is_featured')->default(false);
            $table->boolean('is_visible')->default(false);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['is_visible', 'is_featured', 'sort_order'], 'website_testimonials_public_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('website_testimonials');
    }
};
