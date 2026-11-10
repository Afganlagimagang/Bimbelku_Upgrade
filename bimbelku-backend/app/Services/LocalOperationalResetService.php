<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use RuntimeException;

class LocalOperationalResetService
{
    private const KEEP = [
        'curriculum_chapters', 'curriculum_subject_groups', 'curriculum_subjects', 'dynamic_banners',
        'hourly_rates', 'learning_program_subject', 'learning_programs', 'learning_time_slots', 'locations',
        'migrations', 'package_plans', 'payment_settings', 'program_curriculum_subject', 'programs',
        'promotions', 'settings', 'social_medias', 'subject_page_contents', 'tutorial_steps', 'tutorials',
        'website_sections', 'website_settings', 'website_trust_items',
    ];

    public const CLEAR = [
        'admin_audit_logs', 'archived_support_ticket_replies', 'archived_support_tickets',
        'booking_disputes', 'booking_participants', 'booking_requests', 'bookings', 'cache', 'cache_locks',
        'cheap_class_enrollments', 'cheap_class_sessions', 'cheap_class_templates', 'cheap_classes',
        'class_sessions', 'class_students', 'classroom_conversation_reads', 'classroom_conversation_states',
        'classroom_message_reads', 'classroom_messages', 'classrooms', 'customer_wallet_transactions',
        'customer_wallets', 'failed_jobs', 'finance_authorizations', 'financial_audit_logs',
        'financial_journals', 'financial_ledger_entries', 'guest_package_orders', 'idempotency_records',
        'job_batches', 'jobs', 'learning_packages', 'learning_progress_reports', 'location_teacher',
        'location_user', 'matching_operation_logs', 'notes', 'notifications', 'orders', 'package_chapters',
        'package_renewals', 'package_session_chapter_logs', 'package_sessions', 'package_subjects',
        'participant_attendances', 'password_reset_tokens', 'payment_gateway_events', 'payment_submissions',
        'payout_approvals', 'payouts', 'personal_access_tokens', 'private_class_joins', 'promotion_claims',
        'ratings', 'refunds', 'schedule_change_requests', 'schedule_change_responses', 'session_attendances',
        'session_reports', 'sessions', 'teacher_availabilities', 'teacher_availability_exceptions',
        'teacher_offers', 'teacher_payout_requests', 'teacher_profiles', 'teacher_replacement_requests',
        'teacher_replacement_sessions', 'teacher_subjects', 'verification_codes',
    ];

    public function primaryAdmin(): User
    {
        $admins = User::query()->where('role', 'admin')->where('status', 'active')->get()
            ->filter(fn (User $user) => $user->isPrimaryAdmin());
        if ($admins->count() !== 1) throw new RuntimeException('Admin utama tidak dapat diidentifikasi secara tunggal.');
        return $admins->first();
    }

    public function reset(string $backup): array
    {
        if (! app()->environment(['local', 'testing'])) throw new RuntimeException('Reset hanya diizinkan pada database local/testing.');
        if (! is_file($backup) || pathinfo($backup, PATHINFO_EXTENSION) !== 'sql' || filesize($backup) < 1000) {
            throw new RuntimeException('Backup SQL harus tersedia sebelum reset.');
        }
        $admin = $this->primaryAdmin();
        $connection = DB::connection();
        if (! in_array($connection->getDriverName(), ['mysql', 'mariadb', 'sqlite'], true)) {
            throw new RuntimeException('Driver database belum didukung untuk reset lokal.');
        }
        // Laravel/MySQL can list tables across every accessible schema when no
        // schema is supplied. Always inventory only this application's database.
        $schema = $connection->getDriverName() === 'sqlite' ? 'main' : $connection->getDatabaseName();
        $tables = array_column(Schema::getTables($schema), 'name');
        $unknown = array_diff($tables, array_merge(self::KEEP, self::CLEAR, ['users', 'website_testimonials', 'website_tutor_gallery']));
        if ($unknown) throw new RuntimeException('Ada tabel yang perlu ditinjau sebelum reset: '.implode(', ', $unknown));
        $before = [];
        foreach (array_intersect(self::KEEP, $tables) as $table) $before[$table] = DB::table($table)->count();

        // Raw DELETE is intentional for the explicitly authorized reset of local
        // testing history, including normally immutable financial audit records.
        // No TRUNCATE/DDL: the entire reset can roll back on a validation failure.
        return Schema::withoutForeignKeyConstraints(function () use ($tables, $admin, $before) {
            return DB::transaction(function () use ($tables, $admin, $before) {
                $removed = [];
                foreach (array_intersect(self::CLEAR, $tables) as $table) $removed[$table] = DB::table($table)->delete();
                if (in_array('website_testimonials', $tables)) {
                    DB::table('website_testimonials')->whereNotNull('rating_id')->delete();
                    DB::table('website_testimonials')->where('verified_by', '!=', $admin->id)->update(['verified_by' => null]);
                }
                if (in_array('website_tutor_gallery', $tables)) {
                    DB::table('website_tutor_gallery')->whereNotNull('teacher_profile_id')->delete();
                }
                $removed['users'] = DB::table('users')->where('id', '!=', $admin->id)->delete();
                DB::table('users')->where('id', $admin->id)->update(['admin_permissions_updated_by' => null, 'remember_token' => null]);
                $remaining = DB::table('users')->first();
                if (DB::table('users')->count() !== 1 || ! $remaining || $remaining->id != $admin->id
                    || $remaining->password !== $admin->getRawOriginal('password')) {
                    throw new RuntimeException('Validasi admin utama gagal; reset dibatalkan.');
                }
                foreach ($before as $table => $count) {
                    if (DB::table($table)->count() !== $count) throw new RuntimeException('Data konfigurasi berubah: '.$table);
                }
                foreach (array_intersect(self::CLEAR, $tables) as $table) {
                    if (DB::table($table)->exists()) throw new RuntimeException('Tabel operasional belum kosong: '.$table);
                }
                return ['admin_email' => $admin->email, 'removed_rows' => $removed, 'preserved_tables' => count($before)];
            });
        });
    }
}
