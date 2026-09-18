import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const expect = (condition, message) => {
  if (!condition) throw new Error(`Kontrak Tahap 6D gagal: ${message}`);
};

const app = read("src/App.tsx");
const register = read("src/pages/Register.tsx");
const help = read("src/pages/common/HelpCenter.tsx");
const auth = read("bimbelku-backend/app/Http/Controllers/Api/AuthController.php");
const adminController = read("bimbelku-backend/app/Http/Controllers/Api/AdminController.php");
const teacherVerification = read("src/pages/admin/TeacherVerification.tsx");
const matching = read("bimbelku-backend/app/Services/TeacherMatchingService.php");
const readme = read("README.md");

expect(app.includes("<WebsiteContentProvider><Register /></WebsiteContentProvider>"), "halaman daftar memakai konfigurasi website yang dikelola admin");
expect(register.includes("teacherWhatsappUrl") && register.includes("seleksi dan tes"), "pendaftaran tutor menjelaskan seleksi melalui WhatsApp");
expect(register.includes('searchParams.get("role") === "teacher"'), "tautan pendaftaran tutor dapat langsung membuka konteks tutor");
expect(help.includes("Hanya calon yang lolos dan disetujui admin"), "pusat bantuan menjelaskan gerbang aktivasi tutor");
expect(auth.includes("seleksi dan tes melalui WhatsApp"), "pesan backend konsisten dengan alur seleksi tutor");
expect(adminController.includes("screening_passed") && adminController.includes("hasil tes WhatsApp wajib dicatat"), "backend menolak aktivasi tutor tanpa bukti seleksi");
expect(teacherVerification.includes("screeningPassed") && teacherVerification.includes("Hubungi kandidat melalui WhatsApp"), "admin dapat menjalankan dan mencatat seleksi tutor");
expect(matching.includes("matching_last_offered_at") && !matching.includes("crc32"), "matching memakai antrean kesempatan, bukan pengacakan");
expect(!readme.includes("Sistem poin tutor 0–200") && !readme.includes("maksimal tiga penawaran aktif"), "dokumentasi tidak memuat konsep matching lama");

console.log("Kontrak Tahap 6D lulus (onboarding tutor via WhatsApp, antrean matching adil, dan dokumentasi final sinkron).");
