<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Program extends Model
{
    protected $guarded = ['id'];

    protected $casts = [
        'is_active' => 'boolean',
        'allow_multi_mapel' => 'boolean',
        'sort_order' => 'integer',
    ];

    public function subjects(): BelongsToMany
    {
        return $this->belongsToMany(CurriculumSubject::class, 'program_curriculum_subject');
    }
}
