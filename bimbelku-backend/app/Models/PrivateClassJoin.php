<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PrivateClassJoin extends Model
{
    protected $guarded = ['id'];

    protected $casts = ['decided_at' => 'datetime'];

    public function package()
    {
        return $this->belongsTo(LearningPackage::class, 'learning_package_id');
    }

    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }
}
