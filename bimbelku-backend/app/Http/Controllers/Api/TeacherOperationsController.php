<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\ClassroomMessage;
use App\Models\Notification;
use App\Models\Rating;
use App\Models\ScheduleChangeResponse;
use App\Models\TeacherOffer;
use App\Models\TeacherPayoutRequest;
use App\Models\TeacherProfile;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TeacherOperationsController extends Controller
{
    public function dashboard(Request $request)
    {
        $teacherId = (int) $request->user()->id;
        $profile = TeacherProfile::query()->where('user_id', $teacherId)->first();
        $activeStatuses = [
            'confirmed',
            'in_progress',
            'awaiting_student_approval',
            'disputed',
            'absence_review',
            'admin_review_required',
        ];
        $classes = Booking::query()
            ->where('teacher_id', $teacherId)
            ->whereIn('status', [...$activeStatuses, 'completed'])
            ->with(['bookingRequest:id,subject_name,chapter', 'participants:id,booking_id,student_id,status'])
            ->latest('start_at')
            ->limit(100)
            ->get();
        $nextSession = $classes
            ->whereIn('status', ['confirmed', 'in_progress'])
            ->filter(fn ($booking) => $booking->end_at->isFuture())
            ->sortBy('start_at')
            ->first();

        $pendingOffers = TeacherOffer::query()
            ->where('teacher_id', $teacherId)
            ->where('status', 'pending')
            ->where('expires_at', '>', now())
            ->count();
        $unreadMessages = ClassroomMessage::query()
            ->where('sender_id', '!=', $teacherId)
            ->whereHas('booking', fn ($query) => $query->where('teacher_id', $teacherId))
            ->whereDoesntHave('reads', fn ($query) => $query->where('user_id', $teacherId))
            ->count();
        $scheduleAnswers = ScheduleChangeResponse::query()
            ->where('user_id', $teacherId)
            ->where('decision', 'pending')
            ->whereHas('request', fn ($query) => $query->where('status', 'pending'))
            ->count();

        $balance = Booking::query()
            ->where('teacher_id', $teacherId)
            ->where('status', 'completed')
            ->selectRaw("COALESCE(SUM(CASE WHEN payout_status = 'ready' THEN teacher_net_amount ELSE 0 END), 0) AS available")
            ->selectRaw("COALESCE(SUM(CASE WHEN payout_status = 'requested' THEN teacher_net_amount ELSE 0 END), 0) AS requested")
            ->selectRaw("COALESCE(SUM(CASE WHEN payout_status = 'locked' THEN teacher_net_amount ELSE 0 END), 0) AS held")
            ->first();
        $rating = Rating::query()
            ->where('teacher_id', $teacherId)
            ->selectRaw('COUNT(*) AS rating_count, COALESCE(AVG(rating), 0) AS rating_average')
            ->first();

        return response()->json([
            'teacher' => [
                'name' => $request->user()->name,
                'is_accepting_requests' => (bool) ($profile?->is_accepting_requests ?? false),
                'suspended_until' => $profile?->suspended_until,
            ],
            'priorities' => [
                'pending_offers' => $pendingOffers,
                'unread_messages' => $unreadMessages,
                'unread_notifications' => Notification::query()
                    ->where('user_id', $teacherId)
                    ->where('is_read', false)
                    ->count(),
                'schedule_responses' => $scheduleAnswers,
            ],
            'classes' => [
                'active' => $classes->whereIn('status', $activeStatuses)->count(),
                'in_progress' => $classes->where('status', 'in_progress')->count(),
                'awaiting_student' => $classes->where('status', 'awaiting_student_approval')->count(),
                'student_count' => $classes->flatMap->participants->pluck('student_id')->unique()->count(),
                'next' => $nextSession ? [
                    'id' => $nextSession->id,
                    'subject' => $nextSession->bookingRequest?->subject_name ?? 'Bimbingan',
                    'chapter' => $nextSession->bookingRequest?->chapter,
                    'start_at' => $nextSession->start_at,
                    'end_at' => $nextSession->end_at,
                    'learning_mode' => $nextSession->learning_mode,
                    'status' => $nextSession->status,
                ] : null,
            ],
            'earnings' => [
                'held' => round((float) ($balance?->held ?? 0)),
                'available' => round((float) ($balance?->available ?? 0)),
                'requested' => round((float) ($balance?->requested ?? 0)),
            ],
            'rating' => [
                'average' => round((float) ($rating?->rating_average ?? 0), 1),
                'count' => (int) ($rating?->rating_count ?? 0),
            ],
        ]);
    }

    public function performance(Request $request)
    {
        $teacherId = (int) $request->user()->id;
        $profile = TeacherProfile::query()->where('user_id', $teacherId)->firstOrFail();
        $ratings = Rating::query()
            ->where('teacher_id', $teacherId)
            ->with(['student:id,name', 'booking.bookingRequest:id,subject_name'])
            ->latest()
            ->limit(100)
            ->get()
            ->map(fn (Rating $rating) => [
                'id' => $rating->id,
                'booking_id' => $rating->booking_id,
                'student_name' => $rating->student?->name ?? 'Murid BimbelKu',
                'subject' => $rating->booking?->bookingRequest?->subject_name,
                'rating' => (int) $rating->rating,
                'review' => $rating->review,
                'created_at' => $rating->created_at,
            ]);

        return response()->json([
            'suspended_until' => $profile->suspended_until,
            'rating' => [
                'average' => round((float) $ratings->avg('rating'), 1),
                'count' => $ratings->count(),
                'distribution' => collect([5, 4, 3, 2, 1])->mapWithKeys(
                    fn ($star) => [(string) $star => $ratings->where('rating', $star)->count()]
                ),
            ],
            'ratings' => $ratings,
        ]);
    }
    public function payoutRequests(Request $request)
    {
        return response()->json(TeacherPayoutRequest::query()
            ->where('teacher_id', $request->user()->id)
            ->latest('requested_at')
            ->limit(100)
            ->get()
            ->map(fn (TeacherPayoutRequest $item) => [
                'id' => $item->id,
                'booking_ids' => $item->booking_ids,
                'gross_amount' => (float) $item->gross_amount,
                'commission_amount' => (float) $item->commission_amount,
                'net_amount' => (float) $item->net_amount,
                'bank_name' => $item->bank_name,
                'account_number_masked' => $this->maskAccount($item->getRawOriginal('account_number')),
                'account_name' => $item->account_name,
                'status' => $item->status,
                'review_notes' => $item->review_notes,
                'requested_at' => $item->requested_at,
                'processed_at' => $item->processed_at,
            ]));
    }

    public function requestPayout(Request $request)
    {
        $validated = $request->validate([
            'booking_ids' => ['nullable', 'array', 'min:1', 'max:200'],
            'booking_ids.*' => ['integer', 'distinct', 'exists:bookings,id'],
        ]);
        $teacher = $request->user()->load('teacherProfile');
        $profile = $teacher->teacherProfile;
        if (!$profile || blank($profile->bank_name) || blank($profile->account_number) || blank($profile->account_name)) {
            return response()->json(['message' => 'Lengkapi rekening pencairan sebelum mengajukan saldo.'], 422);
        }
        if ($profile->payout_hold_until?->isFuture()) {
            return response()->json([
                'message' => 'Pencairan ditahan sampai '.$profile->payout_hold_until->translatedFormat('d M Y, H:i').' WIB.',
            ], 422);
        }

        $record = DB::transaction(function () use ($validated, $teacher) {
            $lockedProfile = TeacherProfile::query()
                ->where('user_id', $teacher->id)
                ->lockForUpdate()
                ->firstOrFail();
            if ($lockedProfile->payout_hold_until?->isFuture()) {
                abort(422, 'Pencairan masih ditahan setelah perubahan rekening.');
            }
            $bookings = Booking::query()
                ->where('teacher_id', $teacher->id)
                ->where('status', 'completed')
                ->where('payout_status', 'ready')
                ->when(!empty($validated['booking_ids']), fn ($query) => $query->whereIn('id', $validated['booking_ids']))
                ->lockForUpdate()
                ->get();
            if ($bookings->isEmpty()) {
                abort(422, 'Belum ada saldo tersedia yang dapat diajukan.');
            }
            if (!empty($validated['booking_ids']) && $bookings->count() !== count($validated['booking_ids'])) {
                abort(422, 'Sebagian sesi sudah diajukan atau belum siap dicairkan.');
            }

            $gross = (float) $bookings->sum('gross_amount');
            $net = (float) $bookings->sum('teacher_net_amount');
            $record = TeacherPayoutRequest::create([
                'teacher_id' => $teacher->id,
                'booking_ids' => $bookings->pluck('id')->sort()->values()->all(),
                'gross_amount' => $gross,
                'commission_amount' => max(0, $gross - $net),
                'net_amount' => $net,
                'bank_name' => $lockedProfile->bank_name,
                'account_number' => $lockedProfile->account_number,
                'account_name' => $lockedProfile->account_name,
                'bank_details_version' => (int) $lockedProfile->bank_details_version,
                'status' => 'pending',
                'requested_at' => now(),
            ]);
            $bookings->each->update([
                'payout_status' => 'requested',
                'payout_request_id' => $record->id,
            ]);

            Notification::updateOrCreate(
                ['unique_key' => "teacher-payout-request:{$record->id}:{$teacher->id}"],
                [
                    'user_id' => $teacher->id,
                    'title' => 'Pencairan diajukan',
                    'message' => 'Saldo Rp'.number_format($net, 0, ',', '.').' menunggu pemeriksaan admin.',
                    'type' => 'info',
                    'target_url' => '/guru/gaji',
                    'is_read' => false,
                ]
            );
            User::query()->where('role', 'admin')->where('status', 'active')->pluck('id')
                ->each(fn ($adminId) => Notification::updateOrCreate(
                    ['unique_key' => "teacher-payout-request:{$record->id}:{$adminId}"],
                    [
                        'user_id' => $adminId,
                        'title' => 'Pengajuan pencairan tutor',
                        'message' => "{$teacher->name} mengajukan Rp".number_format($net, 0, ',', '.').'.',
                        'type' => 'warning',
                        'target_url' => '/admin/finance',
                        'is_read' => false,
                    ]
                ));

            return $record;
        }, 3);

        return response()->json([
            'message' => 'Pencairan berhasil diajukan. Saldo dipindahkan ke status menunggu admin.',
            'data' => $record,
        ], 201);
    }

    private function maskAccount(?string $value): string
    {
        $digits = preg_replace('/\D+/', '', (string) $value) ?? '';
        return $digits === '' ? '-' : str_repeat('•', max(0, strlen($digits) - 4)).substr($digits, -4);
    }
}
