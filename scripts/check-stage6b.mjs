import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const expect = (condition, message) => {
  if (!condition) throw new Error(`Kontrak Tahap 6B gagal: ${message}`);
};

const app = read("src/App.tsx");
const mobile = read("src/components/MobileBottomNav.tsx");
const layout = read("src/components/TeacherLayout.tsx");
const dashboard = read("src/pages/teacher/TeacherDashboard.tsx");
const account = read("src/pages/teacher/TeacherAccount.tsx");
const messages = read("src/components/MarketplaceMessages.tsx");
const notifications = read("src/components/NotificationCenter.tsx");
const classes = read("src/pages/teacher/ManageClasses.tsx");
const hub = read("src/components/LearningSessionHub.tsx");
const salary = read("src/pages/teacher/TeacherSalary.tsx");
const performance = read("src/pages/teacher/TeacherPerformance.tsx");
const routes = read("bimbelku-backend/routes/api.php");
const learning = read("bimbelku-backend/app/Http/Controllers/Api/LearningSessionController.php");
const schedule = read("bimbelku-backend/app/Http/Controllers/Api/ScheduleChangeController.php");
const operations = read("bimbelku-backend/app/Http/Controllers/Api/TeacherOperationsController.php");
const payoutService = read("bimbelku-backend/app/Services/TeacherPayoutService.php");
const completion = read("bimbelku-backend/app/Http/Controllers/Api/SessionWorkflowController.php");
const migration = read("bimbelku-backend/database/migrations/2026_08_01_000300_build_stage_six_b_teacher_operations.php");
const featureTest = read("bimbelku-backend/tests/Feature/StageSixBTeacherOperationsTest.php");

for (const label of ["Beranda", "Permintaan", "Kelas", "Pesan", "Saya"]) {
  expect(mobile.includes(`label: "${label}"`), `navigasi HP tutor memuat ${label}`);
}
expect(mobile.includes("grid-cols-5") && mobile.includes('to: "/guru/pesan"') && mobile.includes('to: "/guru/saya"'), "navigasi HP tutor memakai lima pintu utama");
for (const path of ["/guru/pesan", "/guru/saya", "/guru/performa", "/guru/notifikasi"]) {
  expect(app.includes(`path="${path}"`), `rute ${path} tersedia`);
}
expect(layout.includes('to="/guru/pesan"') && layout.includes('to="/guru/performa"') && layout.includes('to="/guru/notifikasi"'), "sidebar tutor memuat pesan, performa, dan notifikasi");
expect(layout.includes("notif.target_url") && layout.includes("navigate(notif.target_url)"), "notifikasi membuka pekerjaan tujuan");
expect(layout.includes("calc(100vw-1.5rem)") && layout.includes("left-3 right-3"), "dropdown notifikasi tetap berada dalam viewport HP");

expect(dashboard.includes("/teacher/dashboard-v2") && dashboard.includes("Perlu dikerjakan"), "dashboard tutor disusun berdasarkan prioritas kerja");
for (const item of ["pending_offers", "unread_messages", "schedule_responses", "unread_notifications"]) {
  expect(dashboard.includes(item), `dashboard memuat prioritas ${item}`);
}
for (const item of ["Profil tutor", "Jadwal tersedia", "Pendapatan & pencairan", "Rating & ulasan", "Notifikasi"]) {
  expect(account.includes(item), `halaman Saya memuat ${item}`);
}

expect(messages.includes('md:grid-cols-[21rem_minmax(0,1fr)]') && messages.includes("closeMobileConversation"), "chat memakai daftar-panel desktop dan satu panel pada HP");
expect(messages.includes("client_token") && messages.includes("Coba kirim ulang"), "chat mencegah pesan ganda dan menyediakan kirim ulang");
expect(messages.includes("attachment") && messages.includes("is_read") && messages.includes("CheckCheck"), "chat mendukung lampiran privat dan status baca");
expect(notifications.includes("/notifications/read-all") && notifications.includes("target_url"), "pusat notifikasi mendukung baca semua dan tautan tindakan");

expect(hub.includes("Saya Siap Mengajar") && hub.includes("Saya Sudah Hadir") && hub.includes("presence-confirm"), "Session Flow V2 memakai konfirmasi kehadiran satu-tap");
expect(hub.includes("schedule-changes") && hub.includes("Setujui") && hub.includes("Tolak"), "perubahan jadwal membutuhkan persetujuan pihak terdampak");
expect(hub.includes("chapter_updates") || classes.includes("Isi Hasil Belajar"), "hasil belajar memakai progres Bab pada flow final");
expect(!classes.includes("CameraCapture") && classes.includes("Isi Hasil Belajar"), "bukti kamera Session V1 sudah dipensiunkan dan diganti Hasil Belajar V2");
expect(completion.includes("student_confirmed_at") && completion.includes("studentApprove") && completion.includes("studentDispute"), "Session Flow V2 menjaga konfirmasi murid dan keputusan akhir sesi");

for (const balance of ["held", "available", "requested", "paid"]) {
  expect(salary.includes(`balances.${balance}`), `dompet memisahkan saldo ${balance}`);
}
expect(salary.includes("/teacher/payout-requests") && salary.includes("requested_amount") && salary.includes("tax_amount"), "tutor memilih nominal pencairan dan melihat potongan pajak");
expect(performance.includes("rating.distribution") && performance.includes("ratings"), "halaman performa memuat rating dan ulasan terverifikasi");

for (const table of ["classroom_message_reads", "participant_attendances", "schedule_change_requests", "schedule_change_responses", "teacher_payout_requests"]) {
  expect(migration.includes(`'${table}'`), `migrasi membuat ${table}`);
}
expect(routes.includes("LearningSessionController::class, 'conversations'") && routes.includes("TeacherOperationsController::class, 'dashboard'"), "API percakapan dan dashboard tutor tersedia");
expect(routes.includes("studentConfirmPresence") && routes.includes("ScheduleChangeController::class, 'respond'"), "API konfirmasi kehadiran V2 dan persetujuan jadwal tersedia");
expect(learning.includes("whereDoesntHave('reads'") && learning.includes("client_token"), "backend menghitung pesan belum dibaca dan idempotensi kirim");
expect(schedule.includes("teacherHasConflict") && schedule.includes("Jadwal baru bertabrakan"), "backend memeriksa bentrok tutor dan peserta");
expect(operations.includes("requestPayout") && operations.includes("$payouts->request"), "controller mengirim pengajuan melalui layanan payout otomatis");
expect(payoutService.includes("teacher_reserved_amount") && payoutService.includes("lockForUpdate") && payoutService.includes("MINIMUM_AMOUNT = 10000"), "layanan payout mencadangkan saldo atomik dan menerapkan minimum pencairan");
for (const scenario of ["test_paid_chat_attachment_is_idempotent_and_gets_a_read_receipt", "test_schedule_changes_only_after_the_other_party_approves", "test_teacher_payout_request_is_sent_automatically_and_reserves_only_requested_amount"]) {
  expect(featureTest.includes(scenario), `pengujian backend memuat ${scenario}`);
}

console.log("Kontrak Tahap 6B lulus (guru, pesan, pelaksanaan kelas, jadwal, performa, notifikasi, dan pencairan).");
