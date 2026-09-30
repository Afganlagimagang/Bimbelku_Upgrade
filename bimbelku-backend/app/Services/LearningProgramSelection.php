<?php

namespace App\Services;

use App\Models\LearningProgram;
use App\Models\PackagePlan;
use Illuminate\Validation\ValidationException;

class LearningProgramSelection
{
    public function validate(int $id, int $planId, string $level, string $grade, array $subjects): LearningProgram
    {
        $program = LearningProgram::query()->where('is_active', true)->with('subjects')->findOrFail($id);
        $chosen = collect($subjects)->pluck('curriculum_subject_id')->map(fn ($value) => (int) $value)->sort()->values()->all();
        $required = $program->subjects->pluck('id')->map(fn ($value) => (int) $value)->sort()->values()->all();
        $plan = PackagePlan::query()->where('is_active', true)->findOrFail($planId);
        if ($program->education_level !== $level || ($program->grade && $program->grade !== $grade)
            || !$chosen || count($chosen) > $plan->maximum_subjects
            || count($chosen) > $plan->session_count
            || count($chosen) !== count(array_unique($chosen))
            || array_diff($chosen, $required)) {
            throw ValidationException::withMessages([
                'learning_program_id' => 'Pilih satu atau beberapa mapel dari program sesuai jenjang dan kapasitas paket sesi.',
            ]);
        }

        return $program;
    }
}
