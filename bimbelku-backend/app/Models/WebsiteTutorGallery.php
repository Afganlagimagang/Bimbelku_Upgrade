<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class WebsiteTutorGallery extends Model
{
    use SoftDeletes;

    protected $table = 'website_tutor_gallery';

    protected $guarded = ['id'];

    protected $casts = [
        'is_visible' => 'boolean',
        'sort_order' => 'integer',
    ];

    public function teacherProfile()
    {
        return $this->belongsTo(TeacherProfile::class);
    }
}
