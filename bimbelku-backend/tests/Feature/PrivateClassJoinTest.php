<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\BookingParticipant;
use App\Models\BookingRequest;
use App\Models\LearningPackage;
use App\Models\Order;
use App\Models\PackagePlan;
use App\Models\PackageSession;
use App\Models\PackageSubject;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PrivateClassJoinTest extends TestCase
{
    use RefreshDatabase;

    private function packageFor(User $owner, int $participantCount = 2): LearningPackage
    {
        $plan = PackagePlan::create([
            'name' => 'Privat bersama', 'slug' => 'privat-bersama-test',
            'session_count' => 1, 'validity_days' => 30, 'maximum_subjects' => 1,
        ]);

        return LearningPackage::create([
            'student_id' => $owner->id,
            'package_plan_id' => $plan->id,
            'package_code' => 'BKU-TEST-CLASS',
            'education_level' => 'SMA',
            'learning_mode' => 'online',
            'status' => 'active',
            'participant_count' => $participantCount,
            'purchaser_participates' => true,
            'total_sessions' => 1,
            'subtotal_amount' => 100000,
            'total_amount' => 100000,
        ]);
    }

    private function bookingFor(LearningPackage $package, User $teacher): Booking
    {
        $owner = $package->student;
        $subject = PackageSubject::create([
            'learning_package_id' => $package->id,
            'subject_name' => 'Matematika',
            'allocated_sessions' => 1,
            'unit_price' => 100000,
            'subtotal_amount' => 100000,
            'status' => 'active',
        ]);
        $start = now()->addDay();
        $request = BookingRequest::create([
            'student_id' => $owner->id,
            'subject_name' => 'Matematika',
            'education_level' => 'SMA',
            'learning_mode' => 'online',
            'class_type' => 'private',
            'scheduled_date' => $start->toDateString(),
            'start_time' => $start->format('H:i:s'),
            'end_time' => $start->copy()->addHour()->format('H:i:s'),
            'duration_hours' => 1,
        ]);
        $order = Order::create([
            'user_id' => $owner->id,
            'learning_package_id' => $package->id,
            'amount' => 100000,
            'status' => 'paid',
        ]);
        $booking = Booking::create([
            'booking_request_id' => $request->id,
            'student_id' => $owner->id,
            'teacher_id' => $teacher->id,
            'order_id' => $order->id,
            'start_at' => $start,
            'end_at' => $start->copy()->addHour(),
            'duration_hours' => 1,
            'learning_mode' => 'online',
            'class_type' => 'private',
            'hourly_rate' => 80000,
            'total_amount' => 80000,
            'status' => 'confirmed',
        ]);
        BookingParticipant::create([
            'booking_id' => $booking->id,
            'booking_request_id' => $request->id,
            'student_id' => $owner->id,
            'order_id' => $order->id,
            'amount' => 80000,
            'status' => 'paid',
        ]);
        PackageSession::create([
            'package_subject_id' => $subject->id,
            'booking_id' => $booking->id,
            'sequence' => 1,
            'scheduled_start_at' => $start,
            'scheduled_end_at' => $start->copy()->addHour(),
            'status' => 'scheduled',
        ]);

        return $booking;
    }

    public function test_join_needs_owner_approval_and_only_owner_can_confirm_session(): void
    {
        $owner = User::factory()->create(['role' => 'student', 'status' => 'active']);
        $guest = User::factory()->create(['role' => 'student', 'status' => 'active']);
        $teacher = User::factory()->create(['role' => 'teacher', 'status' => 'active']);
        $package = $this->packageFor($owner);
        $booking = $this->bookingFor($package, $teacher);

        Sanctum::actingAs($owner);
        $code = $this->postJson("/api/student/packages/{$package->id}/class-code")
            ->assertOk()->json('code');
        $this->assertSame(12, strlen($code));

        Sanctum::actingAs($guest);
        $this->postJson('/api/student/class-joins', ['code' => $code])
            ->assertOk()->assertJsonPath('status', 'pending');
        $this->getJson('/api/student/classes')->assertOk()->assertJsonCount(0);
        $joinId = $this->getJson('/api/student/class-joins')->assertOk()->json('0.id');
        $this->postJson("/api/student/packages/{$package->id}/class-joins/{$joinId}/decision", ['decision' => 'approve'])
            ->assertForbidden();

        Sanctum::actingAs($owner);
        $this->postJson("/api/student/packages/{$package->id}/class-joins/{$joinId}/decision", ['decision' => 'approve'])
            ->assertOk();

        Sanctum::actingAs($guest);
        $this->getJson('/api/student/classes')->assertOk()->assertJsonCount(1)
            ->assertJsonPath('0.id', $booking->id)
            ->assertJsonPath('0.viewer_only', true)
            ->assertJsonPath('0.can_approve', false)
            ->assertJsonPath('0.workspace.can_open', false);
        $this->postJson("/api/student/bookings/{$booking->id}/presence-confirm")
            ->assertStatus(403);
        $this->postJson("/api/student/bookings/{$booking->id}/approve")
            ->assertNotFound();
    }

    public function test_code_is_not_available_before_package_is_active_and_capacity_is_enforced(): void
    {
        $owner = User::factory()->create(['role' => 'student', 'status' => 'active']);
        $first = User::factory()->create(['role' => 'student', 'status' => 'active']);
        $second = User::factory()->create(['role' => 'student', 'status' => 'active']);
        $package = $this->packageFor($owner);
        $package->update(['status' => 'matching']);
        Sanctum::actingAs($owner);
        $this->postJson("/api/student/packages/{$package->id}/class-code")->assertUnprocessable();
        $package->update(['status' => 'active']);
        $code = $this->postJson("/api/student/packages/{$package->id}/class-code")->assertOk()->json('code');
        Sanctum::actingAs($first);
        $this->postJson('/api/student/class-joins', ['code' => $code])->assertOk();
        $joinId = $this->getJson('/api/student/class-joins')->json('0.id');
        Sanctum::actingAs($owner);
        $this->postJson("/api/student/packages/{$package->id}/class-joins/{$joinId}/decision", ['decision' => 'approve'])->assertOk();
        Sanctum::actingAs($second);
        $this->postJson('/api/student/class-joins', ['code' => $code])->assertUnprocessable();
    }
}
