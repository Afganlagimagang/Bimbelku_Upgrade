import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

// Stable public routes get route-specific metadata in the initial response.
// Their React content still loads normally, so there is no duplicate static
// page to paint and replace during hydration.
const routes = {
  "/program": {
    title: "Program Bimbel dan Les Privat SD–SMA | BimbelKu",
    description: "Jelajahi program bimbel dan les privat SD, SMP, serta SMA. Buka profil mapel, materi, jenjang, tutor, dan pilihan belajar yang tersedia.",
  },
  "/tutor": {
    title: "Tutor Bimbel Terverifikasi Berdasarkan Bidang | BimbelKu",
    description: "Kenali tutor BimbelKu yang telah melalui pemeriksaan, memberikan izin tampil, dan disetujui admin, dikelompokkan berdasarkan bidang mapel.",
  },
  "/area-layanan": {
    title: "Area Layanan Belajar Online dan Tatap Muka | BimbelKu",
    description: "Pahami perbedaan cakupan les online dan tatap muka BimbelKu. Ketersediaan tutor tatap muka ditentukan oleh alamat, mapel, jadwal, serta jangkauan tutor.",
  },
  "/seleksi-tutor": {
    title: "Bagaimana Tutor BimbelKu Diseleksi | BimbelKu",
    description: "Lihat proses pendaftaran, pemeriksaan dokumen, tes melalui WhatsApp, persetujuan admin, dan cara tutor dicocokkan dengan kebutuhan belajar di BimbelKu.",
  },
  "/testimonials": {
    title: "Cerita dan Ulasan Siswa BimbelKu",
    description: "Baca cerita belajar dan ulasan siswa yang dipublikasikan setelah persetujuan serta pemeriksaan admin BimbelKu.",
  },
  "/why-us": {
    title: "Apa Itu BimbelKu? Cara Belajar, Tutor, dan Pemesanan",
    description: "Kenali BimbelKu lewat jawaban sederhana: siapa yang belajar, pilihan privat atau kelas bersama, cara memilih pelajaran, biaya, tutor, dan jadwal kelas.",
  },
  "/privacy": {
    title: "Kebijakan Privasi | BimbelKu",
    description: "Kebijakan pengelolaan dan perlindungan data pengguna BimbelKu.",
  },
  "/terms": {
    title: "Syarat dan Ketentuan | BimbelKu",
    description: "Syarat penggunaan layanan, pemesanan, pembayaran, kelas, dan akun BimbelKu.",
  },
};

const escape = (value) => String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
const siteUrl = (process.env.VITE_SITE_URL || "https://bimbelcerdas.com").replace(/\/+$/, "");
const template = readFileSync(new URL("../dist/index.html", import.meta.url), "utf8");

for (const [path, { title, description }] of Object.entries(routes)) {
  const canonical = `${siteUrl}${path}`;
  const html = template
    .replace(/<title>[^<]*<\/title>/, `<title>${escape(title)}</title>`)
    .replace(/<meta name="description" content="[^"]*"\s*\/>/, `<meta name="description" content="${escape(description)}" />`)
    .replace(/<meta property="og:title" content="[^"]*"\s*\/>/, `<meta property="og:title" content="${escape(title)}" />`)
    .replace(/<meta property="og:description" content="[^"]*"\s*\/>/, `<meta property="og:description" content="${escape(description)}" />`)
    .replace(/<meta name="twitter:title" content="[^"]*"\s*\/>/, `<meta name="twitter:title" content="${escape(title)}" />`)
    .replace(/<meta name="twitter:description" content="[^"]*"\s*\/>/, `<meta name="twitter:description" content="${escape(description)}" />`)
    .replace("</head>", `<link rel="canonical" href="${escape(canonical)}" /><meta property="og:url" content="${escape(canonical)}" /></head>`);
  if (html === template || !html.includes(`<title>${escape(title)}</title>`)) throw new Error(`Metadata awal ${path} gagal dibuat.`);
  const directory = new URL(`../dist${path}/`, import.meta.url);
  mkdirSync(directory, { recursive: true });
  writeFileSync(new URL("index.html", directory), html, "utf8");
}

// A program slug can represent several levels through ?level=. Keep the
// initial title level-neutral and let the client set the exact canonical URL
// after it knows which level is active. An incorrect static canonical would
// conflict with those level-specific URLs.
const sitemap = readFileSync(new URL("../public/sitemap.xml", import.meta.url), "utf8");
const slugs = [...new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)]
  .map((match) => new URL(match[1].replaceAll("&amp;", "&")).pathname.match(/^\/program\/([a-z0-9-]+)$/)?.[1])
  .filter(Boolean))];
for (const slug of slugs) {
  const name = slug.split("-").map((word) => /^(sd|smp|sma|tka|utbk|ipa|ips|cpns|snbt)$/i.test(word)
    ? word.toUpperCase() : word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  const title = `Les ${name} | BimbelKu`;
  const description = `Pelajari pilihan les ${name} di BimbelKu. Periksa jenjang, materi, jadwal, mode belajar, dan rincian biaya sebelum memesan.`;
  const html = template
    .replace(/<title>[^<]*<\/title>/, `<title>${escape(title)}</title>`)
    .replace(/<meta name="description" content="[^"]*"\s*\/>/, `<meta name="description" content="${escape(description)}" />`)
    .replace(/<meta property="og:title" content="[^"]*"\s*\/>/, `<meta property="og:title" content="${escape(title)}" />`)
    .replace(/<meta property="og:description" content="[^"]*"\s*\/>/, `<meta property="og:description" content="${escape(description)}" />`)
    .replace(/<meta name="twitter:title" content="[^"]*"\s*\/>/, `<meta name="twitter:title" content="${escape(title)}" />`)
    .replace(/<meta name="twitter:description" content="[^"]*"\s*\/>/, `<meta name="twitter:description" content="${escape(description)}" />`);
  const directory = new URL(`../dist/program/${slug}/`, import.meta.url);
  mkdirSync(directory, { recursive: true });
  writeFileSync(new URL("index.html", directory), html, "utf8");
}

console.log(`Metadata HTML awal: ${Object.keys(routes).length} rute publik dan ${slugs.length} profil mapel.`);
