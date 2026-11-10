<?php

namespace Tests\Feature;

use App\Models\CurriculumSubject;
use App\Models\LearningTimeSlot;
use App\Models\TeacherAvailability;
use App\Models\TeacherProfile;
use App\Models\User;
use Carbon\Carbon;
use Database\Seeders\CurriculumCatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GuestScheduleRecommendationTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_guest_can_find_online_times_for_all_sessions_without_creating_an_account(): void
    {
        $payload = $this->schedule();
        $before = User::count();
        $response = $this->postJson('/api/guest/schedule-recommendations', $payload)
            ->assertOk()->assertJsonPath('mode', 'preserve_days')->assertJsonPath('weekdays', [2, 4]);
        $items = collect($response->json('recommendations'));
        $this->assertTrue($items->contains(fn ($item) => $item['candidate_count'] > 0));
        foreach ($items as $item) {
            $this->assertCount(4, $item['schedules']);
            foreach ($item['schedules'] as $date) $this->assertContains(Carbon::parse($date)->dayOfWeekIso, [2, 4]);
            $this->assertArrayNotHasKey('teacher_id', $item);
        }
        $this->assertStringNotContainsString('private-tutor@example.test', $response->getContent());
        $this->assertSame($before, User::count());
        $this->assertDatabaseCount('booking_requests', 0);
        $this->assertDatabaseCount('learning_packages', 0);
        $this->postJson('/api/student/schedule-recommendations', $payload)->assertUnauthorized();
    }

    public function test_offline_guest_uses_their_consented_location_for_matching(): void
    {
        $payload = [...$this->schedule(), 'learning_mode' => 'offline',
            'latitude' => -6.2001, 'longitude' => 106.8001, 'location_consent' => true];
        $nearby = $this->postJson('/api/guest/schedule-recommendations', $payload)->assertOk();
        $this->assertTrue(collect($nearby->json('recommendations'))->contains(fn ($item) => $item['candidate_count'] > 0));
        $far = $this->postJson('/api/guest/schedule-recommendations', [...$payload, 'latitude' => -7.8, 'longitude' => 110.3])->assertOk();
        $this->assertTrue(collect($far->json('recommendations'))->every(fn ($item) => $item['candidate_count'] === 0));
    }

    public function test_offline_guest_must_supply_valid_coordinates_and_consent(): void
    {
        $payload = [...$this->schedule(), 'learning_mode' => 'offline'];
        $this->postJson('/api/guest/schedule-recommendations', $payload)->assertUnprocessable()
            ->assertJsonValidationErrors(['latitude', 'longitude', 'location_consent']);
        $this->postJson('/api/guest/schedule-recommendations', [...$payload, 'latitude' => -91, 'longitude' => 181, 'location_consent' => false])
            ->assertUnprocessable()->assertJsonValidationErrors(['latitude', 'longitude', 'location_consent']);
    }

    public function test_guest_recommendations_have_their_own_rate_limit(): void
    {
        for ($i = 0; $i < 20; $i++) {
            $this->postJson('/api/guest/schedule-recommendations', [])->assertUnprocessable();
        }
        $this->postJson('/api/guest/schedule-recommendations', [])->assertStatus(429);
        $this->getJson('/api/learning-time-slots')->assertOk();
    }

    private function schedule(): array
    {
        Carbon::setTestNow(Carbon::parse('2026-08-24 08:00:00', 'Asia/Jakarta'));
        $this->seed(CurriculumCatalogSeeder::class);
        $subject = CurriculumSubject::where('normalized_name', 'matematika')->firstOrFail();
        $teacher = User::factory()->create(['role' => 'teacher', 'status' => 'active', 'email' => 'private-tutor@example.test']);
        $profile = TeacherProfile::create(['user_id' => $teacher->id, 'verified_at' => now()->subDay(),
            'is_accepting_requests' => true, 'latitude' => -6.2, 'longitude' => 106.8, 'max_travel_km' => 10]);
        $profile->subjects()->create(['name' => 'Matematika', 'curriculum_subject_id' => $subject->id,
            'levels' => ['SMP'], 'is_active' => true, 'is_online' => true, 'is_offline' => true, 'is_private_active' => true]);
        foreach (['Selasa', 'Kamis'] as $day) TeacherAvailability::create([
            'user_id' => $teacher->id, 'day' => $day, 'start_time' => '15:00:00', 'end_time' => '20:00:00', 'is_active' => true,
        ]);
        foreach ([16, 17, 18] as $hour) LearningTimeSlot::updateOrCreate(['start_time' => sprintf('%02d:00:00', $hour)], [
            'label' => sprintf('%02d.00 WIB', $hour), 'sort_order' => $hour, 'is_active' => true,
        ]);
        return ['curriculum_subject_id' => $subject->id, 'education_level' => 'SMP', 'grade' => 'Kelas 7',
            'learning_mode' => 'online', 'duration_hours' => 1, 'schedule_start_date' => '2026-09-01',
            'weekdays' => [2, 4], 'session_count' => 4, 'current_time' => '18:00'];
    }
}
