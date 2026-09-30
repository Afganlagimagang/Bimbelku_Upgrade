import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => readFileSync(path.join(root, relative), "utf8");
const failures = [];
const expect = (condition, message) => { if (!condition) failures.push(message); };

const tracked = execFileSync("git", ["ls-files"], { cwd: root, encoding: "utf8" }).split(/\r?\n/);
const forbiddenTracked = tracked.filter((file) =>
  /(^|\/)(?:\.env(?:\..+)?|auth\.json)$|\.(?:sql|sqlite|pem|key|p12|pfx|log)$/i.test(file)
  && !/\.env(?:\.production)?\.example$/i.test(file),
);
expect(forbiddenTracked.length === 0, `File rahasia/backup terlacak Git: ${forbiddenTracked.join(", ")}`);

const sourceFiles = tracked.filter((file) => file.startsWith("src/") && /\.(?:ts|tsx|js|jsx)$/.test(file) && existsSync(path.join(root, file)));
for (const file of sourceFiles) {
  const source = read(file);
  expect(!/dangerouslySetInnerHTML|\binnerHTML\s*=|document\.write\s*\(|\beval\s*\(|new\s+Function\s*\(/.test(source), `${file} memakai API DOM berisiko XSS.`);
}

const headers = read("bimbelku-backend/app/Http/Middleware/ApplySecurityHeaders.php");
for (const header of ["Content-Security-Policy", "X-Content-Type-Options", "X-Frame-Options", "Cross-Origin-Opener-Policy", "Strict-Transport-Security"]) {
  expect(headers.includes(header), `Header ${header} belum diterapkan pada API.`);
}

const routes = read("bimbelku-backend/routes/api.php");
expect(routes.includes("throttle:public-read"), "Endpoint publik belum memakai rate limiter umum.");
expect(routes.includes("throttle:public-media"), "Endpoint media belum memakai rate limiter.");

const media = read("bimbelku-backend/app/Http/Controllers/Api/PublicMediaController.php");
expect(media.includes("PATHINFO_EXTENSION") && media.includes("image/webp"), "Media publik belum memakai allowlist ekstensi dan MIME.");
expect(!media.includes("text/html") && !media.includes("image/svg+xml"), "Media aktif berisiko menyajikan HTML/SVG dari upload.");

const vite = read("vite.config.ts");
expect(vite.includes('host: "127.0.0.1"'), "Server development terbuka ke jaringan secara default.");
expect(vite.includes("browserSecurityHeaders"), "Header browser untuk preview belum aktif.");
expect(existsSync(path.join(root, "public/.htaccess")), "Hardening Apache frontend belum tersedia.");
expect(existsSync(path.join(root, "bimbelku-backend/storage/app/public/.htaccess")), "Folder upload publik belum memblokir script.");
expect(existsSync(path.join(root, "bimbelku-backend/.env.production.example")), "Template environment production aman belum tersedia.");

if (failures.length) {
  console.error("Baseline keamanan gagal:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log(`Baseline keamanan lulus: ${sourceFiles.length} file source dan konfigurasi deployment diperiksa.`);
