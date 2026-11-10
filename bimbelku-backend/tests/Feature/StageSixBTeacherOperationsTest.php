<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\BookingParticipant;
use App\Models\BookingRequest;
use App\Models\Order;
use App\Models\TeacherAvailability;
use App\Models\TeacherProfile;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class StageSixBTeacherOperationsTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_paid_chat_attachment_is_idempotent_and_gets_a_read_receipt(): void
    {
        Storage::fake('local');
        [$student, $teacher, $booking] = $this->makeBooking();
        $clientToken = 'f5bf860e-98f8-4f82-9b7c-5121d8b1f6e2';

        Sanctum::actingAs($student);
        $this->post("/api/bookings/{$booking->id}/messages", [
            'body' => 'Berikut latihan yang ingin dibahas.',
            'attachment' => UploadedFile::fake()->create('latihan.pdf', 40, 'application/pdf'),
            'client_token' => $clientToken,
        ])->assertCreated();
        $this->post("/api/bookings/{$booking->id}/messages", [
            'body' => 'Berikut latihan yang ingin dibahas.',
            'attachment' => UploadedFile::fake()->create('latihan.pdf', 40, 'application/pdf'),
            'client_token' => $clientToken,
        ])->assertOk();
        $this->assertDatabaseCount('classroom_messages', 1);

        Sanctum::actingAs($teacher);
        $this->getJson('/api/conversations')
            ->assertOk()
            ->assertJsonPath('data.0.unread_count', 1);
        $this->getJson("/api/bookings/{$booking->id}/learning-session")
            ->assertOk();
        $this->assertDatabaseHas('classroom_message_reads', [
            'user_id' => $teacher->id,
        ]);
    }

    public function test_schedule_changes_only_after_the_other_party_approves(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-08-01 08:00:00', 'Asia/Jakarta'));
        [$student, $teacher, $booking] = $this->makeBooking(
            Carbon::parse('2026-08-02 10:00:00', 'Asia/Jakarta'),
            Carbon::parse('2026-08-02 11:00:00', 'Asia/Jakarta')
        );
        TeacherAvailability::create([
            'user_id' => $teacher->id,
            'day' => 'Senin',
            'is_active' => true,
            'start_time' => '08:00:00',
            'end_time' => '20:00:00',
        ]);

        Sanctum::actingAs($student);
        $changeId = $this->postJson("/api/bookings/{$booking->id}/schedule-changes", [
            'proposed_start_at' => '2026-08-03 14:00:00',
            'reason' => 'Ada kegiatan sekolah wajib pada jadwal lama dan waktunya tidak dapat dipindahkan.',
        ])->assertCreated()->json('data.id');

        $this->assertDatabaseHas('bookings', [
            'id' => $booking->id,
            'start_at' => '2026-08-02 10:00:00',
        ]);

        Sanctum::actingAs($teacher);
        $this->postJson("/api/bookings/{$booking->id}/schedule-changes/{$changeId}/respond", [
            'decision' => 'approved',
        ])->assertOk();
        $this->assertDatabaseHas('schedule_change_requests', [
            'id' => $changeId,
            'status' => 'approved',
        ]);
        $this->assertDatabaseHas('bookings', [
            'id' => $booking->id,
            'start_at' => '2026-08-03 14:00:00',
            'end_at' => '2026-08-03 15:00:00',
        ]);
    }

    public function test_teacher_payout_request_is_sent_automatically_and_reserves_only_requested_amount(): void
    {
        config()->set('xendit.enabled', true);
        config()->set('xendit.secret_key', 'xnd_development_test');
        config()->set('xendit.webhook_token', 'callback-test');
        config()->set('xendit.base_url', 'https://api.xendit.test');
        Http::fake(['https://api.xendit.test/v3/payouts' => Http::response([
            'payout_id' => 'po-stage6b-1', 'status' => 'ACCEPTED',
        ])]);

        [$student, $teacher, $booking] = $this->makeBooking();
        $teacher->update(['address' => 'Yogyakarta']);
        $booking->update([
            'status' => 'completed', 'completed_at' => now(), 'gross_amount' => 100000,
            'teacher_net_amount' => 80000, 'payout_status' => 'ready',
        ]);
        TeacherProfile::create([
            'user_id' => $teacher->id, 'bank_name' => 'Bank Central Asia (BCA)',
            'payout_channel_code' => 'BCA', 'account_number' => '1234567890',
            'account_name' => $teacher->name, 'bank_details_version' => 1,
        ]);

        Sanctum::actingAs($teacher);
        $this->getJson('/api/teacher/salary')
            ->assertOk()->assertJsonPath('balances.available', 80000);

        $this->postJson('/api/teacher/payout-requests', ['amount' => 30000], [
            'Idempotency-Key' => 'stage6b-payout-request-0001',
        ])->assertStatus(202)
            ->assertJsonPath('data.requested_amount', 30000)
            ->assertJsonPath('data.transfer_amount', 30000);

        $this->assertDatabaseHas('teacher_payout_requests', [
            'teacher_id' => $teacher->id, 'requested_amount' => 30000,
            'net_amount' => 30000, 'status' => 'processing',
        ]);
        $this->assertDatabaseHas('bookings', [
            'id' => $booking->id, 'teacher_reserved_amount' => 30000,
            'payout_status' => 'ready',
        ]);
        $this->getJson('/api/teacher/salary')
            ->assertOk()->assertJsonPath('balances.available', 50000)
            ->assertJsonPath('balances.requested', 30000);
    }

    public function test_payout_failure_webhook_does_not_release_another_pending_withdrawal(): void
    {
        config(['xendit.enabled' => true, 'xendit.secret_key' => 'test', 'xendit.webhook_token' => 'test', 'xendit.base_url' => 'https://api.xendit.test']);
        Http::fake(['*/v3/payouts' => Http::sequence()
            ->push(['payout_id' => 'po-first', 'status' => 'ACCEPTED'])
            ->push(['payout_id' => 'po-second', 'status' => 'ACCEPTED'])]);
        [$student, $teacher, $booking] = $this->makeBooking();
        $teacher->update(['address' => 'Yogyakarta']);
        $booking->update(['status' => 'completed', 'completed_at' => now(), 'gross_amount' => 100000, 'teacher_net_amount' => 80000, 'payout_status' => 'ready']);
        TeacherProfile::create(['user_id' => $teacher->id, 'bank_name' => 'BCA', 'payout_channel_code' => 'BCA', 'account_number' => '1234567890', 'account_name' => $teacher->name]);
        $service = app(\App\Services\TeacherPayoutService::class);
        $first = $service->request($teacher, 30000)['payout'];
        $service->request($teacher, 20000);
        $webhooks = app(\App\Services\XenditWebhookService::class);
        $data = ['payout_id' => 'po-first', 'status' => 'FAILED'];
        $webhooks->handle('v3_payout.failed', 'first-failure', $data, $data);
        $webhooks->handle('v3_payout.failed', 'duplicate-failure-new-event', $data, $data);
        $this->assertSame(20000.0, (float) $booking->fresh()->teacher_reserved_amount);
        $this->assertSame(60000.0, $service->availableAmount($teacher->id));
        $this->assertSame('failed', $first->fresh()->status);
    }

    public function test_tutor_can_fill_bank_and_address_then_withdraw_in_one_request(): void
    {
        [$teacher, $booking] = $this->readyDirectPayout();
        $teacher->update(['address' => null, 'password' => \Illuminate\Support\Facades\Hash::make('TeacherPass123!')]);
        $teacher->teacherProfile()->update(['location' => 'Yogyakarta', 'payout_hold_until' => now()->addDay()]);
        Sanctum::actingAs($teacher);
        Http::fake(['https://api.xendit.test/v3/payouts' => Http::response(['payout_id' => 'po-direct', 'status' => 'ACCEPTED'])]);
        $payload = ['amount' => 30000, 'payout_channel_code' => 'BCA', 'account_number' => '0012345678',
            'account_name' => 'Nama Lengkap Pemilik Rekening', 'current_password' => 'TeacherPass123!',
            'address' => 'Jalan Melati No 10, Yogyakarta'];
        $this->postJson('/api/teacher/payout-requests', $payload, ['Idempotency-Key' => 'direct-payout-0001'])
            ->assertStatus(202);
        $this->postJson('/api/teacher/payout-requests', $payload, ['Idempotency-Key' => 'direct-payout-0001'])
            ->assertStatus(202);
        Http::assertSentCount(1);
        Http::assertSent(fn ($request) => $request->url() === 'https://api.xendit.test/v3/payouts'
            && $request['recipient']['account_details']['account_number'] === '0012345678'
            && $request['recipient']['account_details']['account_holder_name'] === 'Nama Lengkap Pemilik Rekening'
            && $request['recipient']['address']['street_line_1'] === 'Jalan Melati No 10, Yogyakarta');
        $this->assertSame('Jalan Melati No 10, Yogyakarta', $teacher->fresh()->address);
        $this->assertNull($teacher->teacherProfile()->firstOrFail()->payout_hold_until);
        $this->assertSame(30000.0, (float) $booking->fresh()->teacher_reserved_amount);
        $this->assertDatabaseCount('payouts', 1);
        $payload = ['id' => 'direct-payout-success-0001', 'event' => 'v3_payout.succeeded',
            'data' => ['payout_id' => 'po-direct', 'status' => 'SUCCEEDED']];
        $this->postJson('/api/webhooks/xendit', $payload, ['x-callback-token' => 'test'])->assertOk();
        $this->postJson('/api/webhooks/xendit', $payload, ['x-callback-token' => 'test'])->assertOk();
        $this->assertDatabaseHas('payouts', ['gateway_payout_id' => 'po-direct', 'status' => 'completed']);
        $this->assertSame(30000.0, (float) $booking->fresh()->teacher_paid_amount);
        $this->assertSame(0.0, (float) $booking->fresh()->teacher_reserved_amount);
    }

    public function test_missing_address_is_reported_on_the_payout_form_without_creating_transfer(): void
    {
        [$teacher, $booking] = $this->readyDirectPayout();
        $teacher->update(['address' => null]);
        Http::fake();
        Sanctum::actingAs($teacher);
        $this->postJson('/api/teacher/payout-requests', [
            'amount' => 30000, 'payout_channel_code' => 'BCA', 'account_number' => '0012345678',
            'account_name' => 'Nama Pemilik Rekening', 'current_password' => 'password', 'address' => '',
        ], ['Idempotency-Key' => 'missing-address-payout-0001'])
            ->assertUnprocessable()->assertJsonValidationErrors('address')
            ->assertJsonPath('errors.address.0', 'Isi alamat lengkap pada formulir pencairan.');
        $this->assertDatabaseCount('payouts', 0);
        $this->assertSame(0.0, (float) $booking->fresh()->teacher_reserved_amount);
        Http::assertNothingSent();
    }

    public function test_single_step_payout_uses_saved_profile_address_without_requesting_it_again(): void
    {
        [$teacher] = $this->readyDirectPayout();
        $teacher->update(['address' => 'Jalan Profil No 5, Yogyakarta',
            'password' => \Illuminate\Support\Facades\Hash::make('TeacherPass123!')]);
        Sanctum::actingAs($teacher);
        Http::fake(['https://api.xendit.test/v3/payouts' => Http::response(['payout_id' => 'po-profile-address', 'status' => 'ACCEPTED'])]);
        $this->postJson('/api/teacher/payout-requests', [
            'amount' => 30000, 'payout_channel_code' => 'BCA', 'account_number' => '0012345678',
            'account_name' => 'Nama Pemilik Rekening', 'current_password' => 'TeacherPass123!',
        ], ['Idempotency-Key' => 'saved-profile-address-0001'])->assertStatus(202);
        Http::assertSent(fn ($request) => $request['recipient']['address']['street_line_1'] === 'Jalan Profil No 5, Yogyakarta');
        $this->assertSame('Jalan Profil No 5, Yogyakarta', $teacher->fresh()->address);
    }

    public function test_single_step_payout_requires_password_before_changing_destination(): void
    {
        [$teacher, $booking] = $this->readyDirectPayout();
        Http::fake();
        Sanctum::actingAs($teacher);
        $this->postJson('/api/teacher/payout-requests', [
            'amount' => 30000, 'payout_channel_code' => 'BCA', 'account_number' => '9988776655',
            'account_name' => 'Nama Pemilik Baru', 'current_password' => 'WrongPassword!',
            'address' => 'Jalan Baru No 12, Yogyakarta',
        ], ['Idempotency-Key' => 'wrong-password-payout-0001'])
            ->assertUnprocessable()->assertJsonValidationErrors('current_password');
        $this->assertSame('0012345678', $teacher->teacherProfile()->firstOrFail()->account_number);
        $this->assertSame('Yogyakarta', $teacher->fresh()->address);
        $this->assertDatabaseCount('payouts', 0);
        $this->assertSame(0.0, (float) $booking->fresh()->teacher_reserved_amount);
        Http::assertNothingSent();
    }

    public function test_teacher_can_read_and_update_the_private_address_used_for_payout(): void
    {
        [$teacher] = $this->readyDirectPayout();
        Sanctum::actingAs($teacher);
        $this->getJson('/api/teacher/profile')->assertOk()->assertJsonPath('user.address', 'Yogyakarta');
        $this->postJson('/api/teacher/profile', [
            'whatsapp_number' => '081234567890', 'location' => 'Yogyakarta',
            'address' => 'Jalan Profil No 5, Yogyakarta',
        ])->assertOk();
        $this->getJson('/api/teacher/profile')->assertOk()->assertJsonPath('user.address', 'Jalan Profil No 5, Yogyakarta');
        $this->assertArrayNotHasKey('address', $teacher->fresh()->toArray());
    }

    public function test_gateway_rejection_releases_the_reserved_withdrawal(): void
    {
        [$teacher, $booking] = $this->readyDirectPayout();
        Http::fake(['https://api.xendit.test/v3/payouts' => Http::response(['error_code' => 'INVALID_DESTINATION'], 422)]);
        Sanctum::actingAs($teacher);
        $this->postJson('/api/teacher/payout-requests', ['amount' => 30000], ['Idempotency-Key' => 'rejected-payout-0001'])
            ->assertStatus(422);
        $this->assertDatabaseHas('payouts', ['status' => 'failed']);
        $this->assertSame(0.0, (float) $booking->fresh()->teacher_reserved_amount);
        $this->assertSame(80000.0, app(\App\Services\TeacherPayoutService::class)->availableAmount($teacher->id));
    }

    public function test_ambiguous_gateway_response_keeps_funds_reserved_until_authenticated_webhook(): void
    {
        [$teacher, $booking] = $this->readyDirectPayout();
        Http::fake(['https://api.xendit.test/v3/payouts' => Http::response(['error_code' => 'SERVER_ERROR'], 500)]);
        Sanctum::actingAs($teacher);
        $this->postJson('/api/teacher/payout-requests', ['amount' => 30000], ['Idempotency-Key' => 'uncertain-payout-0001'])
            ->assertStatus(202)->assertJsonPath('data.status', 'processing');
        $this->postJson('/api/teacher/payout-requests', ['amount' => 30000], ['Idempotency-Key' => 'uncertain-payout-0001'])
            ->assertStatus(202);
        $this->assertDatabaseCount('payouts', 1);
        $this->assertDatabaseHas('payouts', ['status' => 'processing']);
        $this->assertSame(30000.0, (float) $booking->fresh()->teacher_reserved_amount);
        $this->assertSame(50000.0, app(\App\Services\TeacherPayoutService::class)->availableAmount($teacher->id));
        $payload = ['id' => 'uncertain-then-failed-0001', 'event' => 'v3_payout.failed',
            'data' => ['reference_id' => \App\Models\Payout::firstOrFail()->gateway_reference_id, 'status' => 'FAILED']];
        $this->postJson('/api/webhooks/xendit', $payload, ['x-callback-token' => 'test'])->assertOk();
        $this->assertSame(0.0, (float) $booking->fresh()->teacher_reserved_amount);
        $this->assertSame(80000.0, app(\App\Services\TeacherPayoutService::class)->availableAmount($teacher->id));
    }

    public function test_unconfigured_xendit_blocks_payout_before_reserving_funds(): void
    {
        [$teacher, $booking] = $this->readyDirectPayout();
        config(['xendit.enabled' => false]);
        Http::fake();
        Sanctum::actingAs($teacher);
        $this->postJson('/api/teacher/payout-requests', ['amount' => 30000], ['Idempotency-Key' => 'unconfigured-payout-0001'])
            ->assertStatus(422)->assertJsonPath('message', 'Layanan pencairan otomatis belum siap. Hubungi pengelola BimbelKu.');
        $this->assertDatabaseCount('payouts', 0);
        $this->assertSame(0.0, (float) $booking->fresh()->teacher_reserved_amount);
        Http::assertNothingSent();
    }

    public function test_withdrawal_cannot_exceed_available_balance(): void
    {
        [$teacher, $booking] = $this->readyDirectPayout();
        Http::fake();
        Sanctum::actingAs($teacher);
        $this->postJson('/api/teacher/payout-requests', ['amount' => 90000], ['Idempotency-Key' => 'excess-payout-0001'])
            ->assertStatus(422)->assertJsonPath('message', 'Nominal pencairan melebihi saldo tersedia.');
        $this->assertDatabaseCount('payouts', 0);
        $this->assertSame(0.0, (float) $booking->fresh()->teacher_reserved_amount);
        Http::assertNothingSent();
    }

    public function test_payout_readiness_depends_on_xendit_configuration_only(): void
    {
        [$teacher] = $this->readyDirectPayout();
        Http::fake();
        Sanctum::actingAs($teacher);
        $this->getJson('/api/teacher/salary')->assertOk()
            ->assertJsonPath('bank_name_validation_available', false)
            ->assertJsonPath('payout_available', true)->assertJsonPath('payout_unavailable_reason', null);
        config(['xendit.enabled' => false]);
        $this->getJson('/api/teacher/salary')->assertOk()
            ->assertJsonPath('payout_available', false)
            ->assertJsonPath('payout_unavailable_reason', 'Layanan pencairan belum siap. Hubungi admin BimbelKu.');
        Http::assertNothingSent();
    }

    private function readyDirectPayout(): array
    {
        config(['xendit.enabled' => true, 'xendit.secret_key' => 'test', 'xendit.webhook_token' => 'test',
            'xendit.base_url' => 'https://api.xendit.test']);
        Http::preventStrayRequests();
        [$student, $teacher, $booking] = $this->makeBooking();
        $teacher->update(['address' => 'Yogyakarta']);
        $booking->update(['status' => 'completed', 'completed_at' => now(), 'gross_amount' => 100000,
            'teacher_net_amount' => 80000, 'payout_status' => 'ready']);
        TeacherProfile::create(['user_id' => $teacher->id, 'bank_name' => 'BCA', 'payout_channel_code' => 'BCA',
            'account_number' => '0012345678', 'account_name' => 'Nama Lengkap Pemilik Rekening']);
        return [$teacher, $booking];
    }

    private function makeBooking(?Carbon $start = null, ?Carbon $end = null): array
    {
        $student = User::factory()->create(['role' => 'student', 'status' => 'active']);
        $teacher = User::factory()->create(['role' => 'teacher', 'status' => 'active']);
        $start ??= now()->addDay()->startOfHour();
        $end ??= $start->copy()->addHour();
        $bookingRequest = BookingRequest::create([
            'student_id' => $student->id,
            'matched_teacher_id' => $teacher->id,
            'subject_name' => 'Matematika',
            'education_level' => 'SMP',
            'grade' => 'Kelas 7',
            'learning_mode' => 'online',
            'class_type' => 'private',
            'scheduled_date' => $start->toDateString(),
            'start_time' => $start->format('H:i:s'),
            'end_time' => $end->format('H:i:s'),
            'duration_hours' => 1,
            'status' => 'confirmed',
            'hourly_rate' => 100000,
            'total_amount' => 100000,
        ]);
        $booking = Booking::create([
            'booking_request_id' => $bookingRequest->id,
            'student_id' => $student->id,
            'teacher_id' => $teacher->id,
            'start_at' => $start,
            'end_at' => $end,
            'duration_hours' => 1,
            'learning_mode' => 'online',
            'class_type' => 'private',
            'hourly_rate' => 100000,
            'total_amount' => 100000,
            'status' => 'confirmed',
            'commission_percent' => 20,
            'gross_amount' => 100000,
            'teacher_net_amount' => 80000,
            'payout_status' => 'locked',
        ]);
        $order = Order::create([
            'user_id' => $student->id,
            'booking_id' => $booking->id,
            'order_id' => 'INV-6B-'.$booking->id,
            'amount' => 100000,
            'status' => 'paid',
        ]);
        BookingParticipant::create([
            'booking_id' => $booking->id,
            'booking_request_id' => $bookingRequest->id,
            'student_id' => $student->id,
            'order_id' => $order->id,
            'amount' => 100000,
            'status' => 'paid',
        ]);
        $booking->update(['order_id' => $order->id]);
        $bookingRequest->update(['booking_id' => $booking->id]);

        return [$student, $teacher, $booking->fresh()];
    }
}
