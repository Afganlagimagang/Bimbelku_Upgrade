<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('curriculum_subject_groups', function (Blueprint $table) {
            $table->id();
            $table->string('name', 80);
            $table->string('normalized_name', 80)->unique();
            $table->timestamps();
        });

        $initialGroups = [
            'Agama', 'Bahasa', 'Bahasa Pilihan', 'Bisnis', 'IPA/Pilihan',
            'IPS/Pilihan', 'Keagamaan', 'Keterampilan', 'Layanan Inklusif',
            'Lokal', 'Musik', 'Persiapan Tes', 'Pilihan', 'Pilihan SMA',
            'Prakarya', 'Seni', 'Teknologi', 'Wajib', 'Wajib/Pilihan',
        ];
        $existingGroups = DB::table('curriculum_subjects')->distinct()->pluck('group_name')->all();
        $groups = [];
        foreach (array_merge($initialGroups, $existingGroups) as $name) {
            $name = trim((string) $name);
            if ($name === '') {
                continue;
            }
            $groups[Str::lower($name)] ??= $name;
        }

        $now = now();
        DB::table('curriculum_subject_groups')->insert(array_map(
            fn (string $name) => [
                'name' => $name,
                'normalized_name' => Str::lower($name),
                'created_at' => $now,
                'updated_at' => $now,
            ],
            array_values($groups)
        ));
    }

    public function down(): void
    {
        Schema::dropIfExists('curriculum_subject_groups');
    }
};
