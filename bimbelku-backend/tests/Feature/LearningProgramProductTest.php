<?php

namespace Tests\Feature;

use App\Models\CurriculumSubject;
use App\Models\BookingRequest;
use App\Models\GuestPackageOrder;
use App\Models\LearningPackage;
use App\Models\Order;
use App\Models\PackagePlan;
use App\Models\TeacherAvailability;
use App\Models\TeacherOffer;
use App\Models\TeacherProfile;
use App\Models\TeacherSubject;
use App\Models\User;
use Carbon\Carbon;
use Database\Seeders\CurriculumCatalogSeeder;
use Database\Seeders\StageFiveExperienceSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class LearningProgramProductTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_student_chooses_program_subjects_and_sessions_without_chapters_in_one_order(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-09-19 09:00:00', 'Asia/Jakarta'));
        $this->seed(CurriculumCatalogSeeder::class);
        $this->seed(StageFiveExperienceSeeder::class);
        $plan = PackagePlan::query()->where('session_count', 12)->firstOrFail();
        $shortPlan = PackagePlan::query()->where('session_count', 8)->firstOrFail();
        $singlePlan = PackagePlan::query()->where('session_count', 4)->firstOrFail();
        $subjects = CurriculumSubject::query()->whereIn('name', ['Matematika', 'Bahasa Indonesia', 'Bahasa Inggris'])->get();
        $this->assertCount(3, $subjects);
        $categoryId = DB::table('curriculum_subject_groups')->where('name', 'Persiapan Tes')->value('id');
        $admin = User::factory()->create(['role' => 'admin', 'status' => 'active']);
        Sanctum::actingAs($admin);
        $programId = $this->postJson('/api/admin/learning-programs', [
            'name' => 'Persiapan TKA', 'description' => 'Tiga mapel dalam satu pesanan.',
            'catalog_category_id' => $categoryId,
            'education_level' => 'SMA', 'grade' => 'Kelas 12', 'is_active' => true,
            'sort_order' => 10, 'subject_ids' => $subjects->pluck('id')->all(),
        ])->assertCreated()->json('data.id');
        $this->postJson('/api/admin/learning-programs', [
            'name' => 'Persiapan TKA', 'catalog_category_id' => $categoryId,
            'education_level' => 'SMA', 'grade' => 'Kelas 12', 'is_active' => false,
            'sort_order' => 11, 'subject_ids' => $subjects->pluck('id')->all(),
        ])->assertUnprocessable()->assertJsonPath('errors.slug.0', 'Nama program ini sudah digunakan. Pilih nama program lain.');
        $this->getJson('/api/learning-programs')->assertOk()->assertJsonCount(1)->assertJsonPath('0.id', $programId);
        $this->assertContains('Persiapan Tes', collect($this->getJson('/api/program-groups')->assertOk()->json())->pluck('name')->all());

        $this->assertNull($this->getJson('/api/learning-programs')->json('0.package_plan_id'));
        $lines = collect(['Matematika', 'Bahasa Indonesia', 'Bahasa Inggris'])->map(function ($name, $index) use ($subjects) {
            $subject = $subjects->firstWhere('name', $name);
            $weekday = [1, 3, 5][$index];
            $first = Carbon::parse('2026-09-21 18:00:00', 'Asia/Jakarta')->addDays($index * 2);
            return [
                'curriculum_subject_id' => $subject->id,
                'weekdays' => [$weekday],
                'schedules' => collect(range(0, 3))->map(fn ($week) => $first->copy()->addWeeks($week)->format('Y-m-d H:i:s'))->all(),
            ];
        })->all();
        $payload = [
            'name' => 'Pemesan TKA', 'email' => 'tka@example.test', 'phone' => '081234567890',
            'learning_program_id' => $programId, 'package_plan_id' => $plan->id,
            'education_level' => 'SMA', 'grade' => 'Kelas 12', 'learning_mode' => 'online',
            'duration_hours' => 1, 'subjects' => $lines,
        ];
        $shortCode = $this->postJson('/api/guest/packages', [
            ...$payload, 'email' => 'short-tka@example.test', 'package_plan_id' => $shortPlan->id,
            'subjects' => array_slice($lines, 0, 2),
        ])->assertCreated()->json('code');
        $this->assertCount(2, GuestPackageOrder::query()->where('code', $shortCode)->firstOrFail()->payload['subjects']);
        $singleCode = $this->postJson('/api/guest/packages', [
            ...$payload, 'email' => 'single-tka@example.test', 'package_plan_id' => $singlePlan->id,
            'subjects' => array_slice($lines, 0, 1),
        ])->assertCreated()->json('code');
        $this->assertCount(1, GuestPackageOrder::query()->where('code', $singleCode)->firstOrFail()->payload['subjects']);
        $this->postJson('/api/guest/packages', [...$payload, 'learning_program_id' => null])
            ->assertStatus(422)->assertJsonValidationErrors('subjects');
        $code = $this->postJson('/api/guest/packages', $payload)->assertCreated()->json('code');
        $this->assertSame($programId, GuestPackageOrder::query()->where('code', $code)->firstOrFail()->payload['learning_program_id']);

        // Pemesanan dari akun murid harus menerima program tanpa Bab, termasuk
        // ketika browser lama masih mengirim curriculum_chapter_ids sebagai [].
        auth()->forgetGuards();
        $directStudent = User::factory()->create(['role' => 'student', 'status' => 'active', 'email_verified_at' => now()]);
        Sanctum::actingAs($directStudent);
        $directSubjects = array_map(fn (array $line) => [...$line, 'curriculum_chapter_ids' => []], $lines);
        $directPackageId = $this->postJson('/api/student/packages', [
            ...$payload, 'subjects' => $directSubjects,
        ], ['Idempotency-Key' => 'tka-direct-program-no-chapters'])->assertCreated()->json('data.id');
        $this->assertSame($programId, (int) LearningPackage::query()->findOrFail($directPackageId)->learning_program_id);
        $this->assertSame(3, LearningPackage::query()->findOrFail($directPackageId)->subjects()->count());
        auth()->forgetGuards();
        Sanctum::actingAs(User::factory()->create(['role' => 'student', 'status' => 'active', 'email_verified_at' => now()]));
        $this->postJson('/api/student/packages', [
            ...$payload, 'learning_program_id' => null, 'subjects' => $directSubjects,
        ], ['Idempotency-Key' => 'tka-direct-without-program-rejected'])
            ->assertUnprocessable()->assertJsonPath('errors.subjects.0', 'Pilih sedikitnya satu bab untuk Matematika.');

        auth()->forgetGuards();
        $student = User::factory()->create(['role' => 'student', 'status' => 'active', 'email' => 'tka@example.test', 'email_verified_at' => now()]);
        Sanctum::actingAs($student);
        $packageId = $this->postJson("/api/guest/packages/{$code}/claim")->assertOk()->json('data.id');
        $package = LearningPackage::query()->findOrFail($packageId);
        $this->assertSame($programId, (int) $package->learning_program_id);
        $this->assertSame(3, $package->subjects()->count());
        $this->assertSame(12, $package->subjects()->sum('allocated_sessions'));
        $this->assertSame(1, Order::query()->where('learning_package_id', $packageId)->count());

        // Satu tutor yang mampu mengajar semuanya tetap hanya boleh mengambil satu mapel.
        $teacher = User::factory()->create(['role' => 'teacher', 'status' => 'active', 'email_verified_at' => now()]);
        $profile = TeacherProfile::query()->create([
            'user_id' => $teacher->id, 'expertise' => 'TKA', 'teaching_method' => 'Online',
            'verified_at' => now(), 'is_accepting_requests' => true,
        ]);
        foreach ($subjects as $subject) {
            TeacherSubject::query()->create([
                'teacher_profile_id' => $profile->id, 'curriculum_subject_id' => $subject->id,
                'name' => $subject->name, 'levels' => ['SMA'], 'is_active' => true,
                'is_online' => true, 'is_offline' => false, 'is_private_active' => true,
            ]);
        }
        foreach (['Senin', 'Rabu', 'Jumat'] as $day) {
            TeacherAvailability::query()->create([
                'user_id' => $teacher->id, 'day' => $day,
                'slots' => [['start_time' => '08:00', 'end_time' => '23:00']], 'is_active' => true,
            ]);
        }
        foreach ($subjects as $subject) {
            $specialist = User::factory()->create(['role' => 'teacher', 'status' => 'active', 'email_verified_at' => now()]);
            $specialistProfile = TeacherProfile::query()->create([
                'user_id' => $specialist->id, 'expertise' => $subject->name,
                'teaching_method' => 'Online', 'verified_at' => now(), 'is_accepting_requests' => true,
            ]);
            TeacherSubject::query()->create([
                'teacher_profile_id' => $specialistProfile->id, 'curriculum_subject_id' => $subject->id,
                'name' => $subject->name, 'levels' => ['SMA'], 'is_active' => true,
                'is_online' => true, 'is_offline' => false, 'is_private_active' => true,
            ]);
            TeacherAvailability::query()->create([
                'user_id' => $specialist->id,
                'day' => ['Matematika' => 'Senin', 'Bahasa Indonesia' => 'Rabu', 'Bahasa Inggris' => 'Jumat'][$subject->name],
                'slots' => [['start_time' => '08:00', 'end_time' => '23:00']], 'is_active' => true,
            ]);
        }

        config()->set('xendit.enabled', true);
        config()->set('xendit.secret_key', 'xnd_development_tka_test');
        config()->set('xendit.webhook_token', 'tka-webhook-token');
        config()->set('xendit.base_url', 'https://api.xendit.test');
        $order = Order::query()->where('learning_package_id', $packageId)->firstOrFail();
        $sessionId = "ps-tka-{$order->id}";
        Http::fake(['https://api.xendit.test/sessions' => Http::response([
            'payment_session_id' => $sessionId,
            'payment_link_url' => "https://checkout-staging.xendit.test/{$sessionId}",
            'status' => 'ACTIVE',
            'expires_at' => now()->addHour()->toIso8601String(),
        ])]);
        $this->postJson("/api/orders/{$order->id}/xendit-session", [], [
            'Idempotency-Key' => 'tka-one-checkout',
        ])->assertOk()->assertJsonPath('data.session_id', $sessionId);
        $this->postJson('/api/webhooks/xendit', [
            'id' => 'evt-tka-paid', 'event' => 'payment_session.completed',
            'data' => [
                'payment_session_id' => $sessionId,
                'reference_id' => $order->fresh()->gateway_reference_id,
                'status' => 'COMPLETED', 'amount' => (int) $order->amount,
                'payment_id' => 'py-tka-paid', 'payment_request_id' => 'pr-tka-paid',
            ],
        ], ['x-callback-token' => 'tka-webhook-token'])->assertOk();
        $this->assertSame('paid', $order->fresh()->status);
        $this->assertSame(3, BookingRequest::query()->whereIn('package_subject_id', $package->subjects()->pluck('id'))->count());
        $this->assertSame(1, Order::query()->where('learning_package_id', $packageId)->count());
        foreach ($package->subjects()->get() as $packageSubject) {
            $offer = TeacherOffer::query()->where('status', 'pending')
                ->whereHas('bookingRequest', fn ($requests) => $requests->where('package_subject_id', $packageSubject->id))
                ->firstOrFail();
            Sanctum::actingAs(User::query()->findOrFail($offer->teacher_id));
            $this->postJson("/api/teacher/offers/{$offer->id}/accept")->assertOk();
        }
        $assignedIds = $package->subjects()->pluck('assigned_teacher_id');
        $this->assertSame(3, $assignedIds->unique()->count());
        $this->assertSame('active', $package->fresh()->status);
        $this->assertLessThanOrEqual(1, $package->subjects()->where('assigned_teacher_id', $teacher->id)->count());
        $this->assertSame(0, TeacherOffer::query()->where('teacher_id', $teacher->id)->where('status', 'pending')->count());
    }
}
