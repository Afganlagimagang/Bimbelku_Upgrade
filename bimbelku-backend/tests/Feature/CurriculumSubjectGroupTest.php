<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CurriculumSubjectGroupTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_add_a_group_before_any_subject_uses_it(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'admin', 'status' => 'active']));

        $this->getJson('/api/admin/subject-groups')
            ->assertOk()
            ->assertJsonFragment(['name' => 'Wajib', 'subject_count' => 0]);

        $this->postJson('/api/admin/subject-groups', ['name' => 'Olahraga'])
            ->assertCreated()
            ->assertJsonPath('data.name', 'Olahraga')
            ->assertJsonPath('data.subject_count', 0);

        $this->getJson('/api/admin/subject-groups')
            ->assertOk()
            ->assertJsonFragment(['name' => 'Olahraga', 'subject_count' => 0]);

        $this->postJson('/api/admin/subjects', [
            'name' => 'Renang Dasar',
            'group_name' => 'Olahraga',
            'education_levels' => ['SD'],
            'grades' => ['Kelas 1'],
        ])->assertCreated();

        $this->getJson('/api/admin/subject-groups')
            ->assertOk()
            ->assertJsonFragment(['name' => 'Olahraga', 'subject_count' => 1]);

        $group = collect($this->getJson('/api/admin/subject-groups')->json())
            ->firstWhere('name', 'Olahraga');
        $groupId = (int) $group['id'];

        $this->postJson('/api/admin/subject-groups', ['name' => '  olahraga  '])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['name']);

        $this->deleteJson("/api/admin/subject-groups/{$groupId}")
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['group']);

        $this->putJson("/api/admin/subject-groups/{$groupId}", ['name' => 'Olahraga & Gerak'])
            ->assertOk()
            ->assertJsonPath('data.subject_count', 1);
        $this->assertDatabaseHas('curriculum_subjects', [
            'name' => 'Renang Dasar',
            'group_name' => 'Olahraga & Gerak',
        ]);

        $emptyGroupId = $this->postJson('/api/admin/subject-groups', ['name' => '  olahraga  '])
            ->assertCreated()
            ->json('data.id');

        $this->deleteJson('/api/admin/subject-groups/'.$emptyGroupId)->assertOk();
        $this->assertDatabaseMissing('curriculum_subject_groups', ['id' => $emptyGroupId]);
    }

    public function test_group_management_requires_login(): void
    {
        $this->getJson('/api/admin/subject-groups')->assertUnauthorized();
        $this->postJson('/api/admin/subject-groups', ['name' => 'Olahraga'])->assertUnauthorized();
    }
}
