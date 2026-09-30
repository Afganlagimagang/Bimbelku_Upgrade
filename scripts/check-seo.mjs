import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const checks = [
  ["index.html", /<html lang="id">/, "dokumen memakai bahasa Indonesia"],
  ["index.html", /<title>Bimbel Privat SD, SMP & SMA di Yogyakarta \| BimbelKu<\/title>/, "judul awal menyebut layanan utama"],
  ["index.html", /name="description"/, "meta description awal tersedia"],
  ["src/components/SeoHead.tsx", /rel = "canonical"/, "canonical URL dikelola per halaman"],
  ["src/components/SeoHead.tsx", /application\/ld\+json/, "structured data JSON-LD tersedia"],
  ["src/components/RouteSeoManager.tsx", /noindex,nofollow,noarchive/, "halaman akun tidak diindeks"],
  ["src/pages/Index.tsx", /EducationalOrganization/, "homepage memiliki schema organisasi"],
  ["src/pages/ProgramCatalogGrouped.tsx", /"@type": "ItemList"/, "katalog memiliki schema daftar program"],
  ["src/pages/ProgramDetail.tsx", /"@type": "Course"/, "profil mapel memiliki schema course"],
  ["public/robots.txt", /Disallow: \/admin\//, "robots memblokir area admin"],
  ["scripts/generate-sitemap.mjs", /Sitemap: \$\{siteUrl\}\/sitemap\.xml/, "generator menyambungkan sitemap ke robots"],
];

const failures = [];
for (const [path, pattern, label] of checks) {
  if (!pattern.test(read(path))) failures.push(`${path}: ${label}`);
}

if (failures.length) {
  console.error("SEO contract gagal:\n- " + failures.join("\n- "));
  process.exit(1);
}

console.log(`SEO contract OK (${checks.length} pemeriksaan).`);
