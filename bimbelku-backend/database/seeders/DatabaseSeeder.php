<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Production foundation only. Demo accounts are never created here,
        // including when an old local .env still contains SEED_DEMO_USERS=true.
        $this->call(CurriculumCatalogSeeder::class);
        $this->call(SubjectPageContentSeeder::class);
        $this->call(StageFiveExperienceSeeder::class);
        $this->call(AdminSeeder::class);
    }
}
