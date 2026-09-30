import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";

const source = ts.createSourceFile("LearningSystemPage.tsx", readFileSync(new URL("../src/pages/LearningSystemPage.tsx", import.meta.url), "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const value = (node) => {
  if (ts.isAsExpression(node) || ts.isSatisfiesExpression(node)) return value(node.expression);
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isArrayLiteralExpression(node)) return node.elements.map(value);
  if (ts.isObjectLiteralExpression(node)) return Object.fromEntries(node.properties.filter(ts.isPropertyAssignment).map((item) => [item.name.text, value(item.initializer)]));
  return undefined;
};
const declaration = (name) => source.statements
  .filter(ts.isVariableStatement)
  .flatMap((statement) => [...statement.declarationList.declarations])
  .find((item) => item.name.getText(source) === name);
const pages = value(declaration("pages")?.initializer);
const guides = value(declaration("guides")?.initializer);
if (!pages || !guides) throw new Error("Konten Wawasan tidak dapat dibaca untuk prerender.");

const escape = (text) => String(text || "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
const siteUrl = (process.env.VITE_SITE_URL || "https://bimbelcerdas.com").replace(/\/+$/, "");
const template = readFileSync(new URL("../dist/index.html", import.meta.url), "utf8");
if (!template.includes('<div id="root"></div>')) throw new Error("Root HTML untuk prerender tidak ditemukan.");
const sectionTitles = {
  "panduan-memilih-program": ["Diagnosis kebutuhan belajar", "Urutan memilih program", "Contoh target yang terukur", "Batas cakupan program"],
  "cara-pemesanan": ["Data sebelum memesan", "Timeline transaksi", "Contoh pemeriksaan akhir", "Batas pemesanan"],
  "sistem-matching-tutor": ["Dasar kecocokan tutor", "Tahap penawaran tutor", "Contoh pencarian kandidat", "Batas sistem matching"],
  "pembayaran-dan-refund": ["Status dana", "Alur pembayaran dan refund", "Contoh pembagian dana", "Risiko dan penanganan"],
  "privat-tatap-muka": ["Kesiapan lokasi belajar", "Persiapan tatap muka", "Contoh penentuan area", "Keamanan dan batas layanan"],
  "privat-online": ["Kesiapan kelas online", "Alur satu sesi online", "Contoh kebutuhan peserta", "Batas layanan online"],
  "kelas-bersama": ["Pilih kelas yang cocok", "Kursi, biaya, dan pembayaran", "Konfirmasi dan pelaksanaan", "Pembatalan dan refund"],
};

const list = (items, ordered = false) => {
  const tag = ordered ? "ol" : "ul";
  return `<${tag}>${items.map((item) => `<li>${escape(item)}</li>`).join("")}</${tag}>`;
};

function guideSections(slug, guide, headings) {
  const actions = list(guide.actions, true);
  const routes = {
    "panduan-memilih-program": `<section><h2>${escape(headings[0])}</h2><h3>${escape(guide.question)}</h3><p>${escape(guide.suitable)}</p><dl><dt>Jenjang dan Bab</dt><dd>Catat kelas, topik yang belum dikuasai, serta target waktunya.</dd><dt>Format belajar</dt><dd>Tentukan online atau tatap muka berdasarkan kebutuhan nyata peserta.</dd><dt>Ukuran keberhasilan</dt><dd>Gunakan hasil latihan, pemahaman Bab, atau target ujian yang dapat diperiksa.</dd></dl></section><section><h2>${escape(headings[1])}</h2>${actions}</section><section><h2>${escape(headings[2])}</h2><blockquote>${escape(guide.example)}</blockquote></section><section><h2>${escape(headings[3])}</h2><p>${escape(guide.limit)}</p><p>${escape(guide.unsuitable)}</p></section>`,
    "cara-pemesanan": `<section><h2>${escape(headings[0])}</h2><p>${escape(guide.suitable)}</p>${list(["Identitas peserta dan email aktif", "Jenjang, mapel, serta Bab", "Jumlah sesi, durasi, hari, dan jam", "Metode belajar serta lokasi jika tatap muka"])}</section><section><h2>${escape(headings[1])}</h2>${actions}</section><section><h2>${escape(headings[2])}</h2><div role="note"><p>${escape(guide.example)}</p></div></section><section><h2>${escape(headings[3])}</h2><p>${escape(guide.limit)}</p><p>Pesanan tersimpan lebih dahulu; tutor baru dicari setelah pembayaran dikonfirmasi.</p></section>`,
    "sistem-matching-tutor": `<section><h2>${escape(headings[0])}</h2><p>${escape(guide.suitable)}</p>${list(["Mapel dan jenjang sesuai", "Metode serta area layanan sesuai", "Jadwal tidak bertabrakan", "Status tutor sudah lolos seleksi"])}</section><section><h2>${escape(headings[1])}</h2>${actions}</section><section><h2>${escape(headings[2])}</h2><p>${escape(guide.example)}</p><p>Penawaran berjalan berurutan pada kandidat yang memenuhi syarat, bukan undian acak dan bukan semata-mata rating tertinggi.</p></section><section><h2>${escape(headings[3])}</h2><p>${escape(guide.limit)}</p><p>${escape(guide.unsuitable)}</p></section>`,
    "pembayaran-dan-refund": `<section><h2>${escape(headings[0])}</h2><table><thead><tr><th>Status</th><th>Makna</th></tr></thead><tbody><tr><td>Menunggu pembayaran</td><td>Tagihan sudah tersedia tetapi dana belum dikonfirmasi.</td></tr><tr><td>Dibayar</td><td>Dana diterima dan proses matching dapat berjalan.</td></tr><tr><td>Refund diproses</td><td>Pengembalian sedang dikirim ke sumber pembayaran.</td></tr><tr><td>Refund selesai</td><td>Status akhir sudah diterima sistem.</td></tr></tbody></table></section><section><h2>${escape(headings[1])}</h2>${actions}</section><section><h2>${escape(headings[2])}</h2><p>${escape(guide.example)}</p></section><section><h2>${escape(headings[3])}</h2><p>${escape(guide.limit)}</p>${list(["Transaksi otomatis tidak menunggu persetujuan admin", "Kasus gagal atau sengketa masuk pemeriksaan", "Referensi transaksi dipakai agar proses tidak ganda"])}</section>`,
    "privat-tatap-muka": `<section><h2>${escape(headings[0])}</h2>${list(["Alamat dan titik peta dapat ditemukan", "Tempat belajar aman dan layak", "Waktu kedatangan disepakati", "Peserta berada dalam area layanan tutor"])}</section><section><h2>${escape(headings[1])}</h2>${actions}</section><section><h2>${escape(headings[2])}</h2><p>${escape(guide.example)}</p><p>Radius hanya berlaku untuk pertemuan tatap muka dan tidak pernah diterapkan pada kelas online.</p><h3>Apakah satu tutor mengajar semua mapel?</h3><p>Belum tentu. Paket multi-mapel dapat memakai tutor berbeda untuk setiap mapel; kecocokan bidang ajar, jadwal, dan jarak diperiksa terpisah.</p><h3>Bagaimana jika hanya sebagian mapel mendapat tutor?</h3><p>Status tiap mapel terlihat di Proses Pesanan. Paket lengkap belum mulai sampai semua tutor tersedia. Untuk mapel yang belum cocok, periksa pilihan Cari lagi, Ubah jadwal, atau pembatalan dan refund sesuai status.</p></section><section><h2>${escape(headings[3])}</h2><p>${escape(guide.limit)}</p><p>${escape(guide.unsuitable)}</p></section>`,
    "privat-online": `<section><h2>${escape(headings[0])}</h2><div><h3>Perangkat</h3><p>Kamera, mikrofon, dan layar cukup jelas.</p><h3>Koneksi</h3><p>Internet stabil serta tersedia rencana cadangan.</p><h3>Ruang belajar</h3><p>Peserta dapat mengikuti sesi tanpa gangguan.</p></div></section><section><h2>${escape(headings[1])}</h2>${actions}</section><section><h2>${escape(headings[2])}</h2><p>${escape(guide.example)}</p><p>Kelas online tidak meminta alamat, titik peta, atau radius perjalanan.</p></section><section><h2>${escape(headings[3])}</h2><p>${escape(guide.limit)}</p><p>${escape(guide.unsuitable)}</p></section>`,
    "kelas-bersama": `<section><h2>${escape(headings[0])}</h2><p>${escape(guide.suitable)}</p>${list(["Kelas Bersama adalah kelas online dengan jadwal dan materi yang ditetapkan; bukan privat bersama teman.", "Cocok untuk siswa yang nyaman belajar berkelompok dan dapat hadir pada seluruh sesi.", "Daftar kelas aktif tersedia setelah masuk akun murid; bila kosong, belum ada kelas yang dapat diikuti saat itu.", "Periksa mapel, jenjang, Bab, topik, serta tanggal setiap sesi sebelum bergabung."], true)}</section><section><h2>${escape(headings[1])}</h2>${list(["Kuota minimum dan maksimum tertera per kelas; kursi ditahan belum sama dengan peserta terverifikasi.", "Harga per peserta merupakan total seluruh sesi, bukan tagihan baru setiap pertemuan.", "Menekan Bergabung menahan kursi sementara setelah kuota, jadwal, dan kesiapan tutor diperiksa.", "Bayar dari tagihan yang sama sebelum tenggat; kursi dapat dilepas jika masa tahan berakhir."], true)}</section><section><h2>${escape(headings[2])}</h2>${list(["Kelas dikonfirmasi setelah minimum peserta terverifikasi terpenuhi dan tutor tersedia untuk seluruh sesi.", "Identitas tutor dan tautan pertemuan tersedia bagi peserta yang berhak setelah konfirmasi.", "Jadwal muncul di Kelas Saya; progress resmi mengikuti laporan sesi yang diverifikasi.", "Pembatalan kursi sendiri bergantung pada status pembayaran dan masa pendaftaran."], true)}</section><section><h2>${escape(headings[3])}</h2><p>Jika kelas batal karena minimum peserta tidak tercapai, pembayaran yang sudah diterima masuk proses refund. Statusnya dilihat di Riwayat Transaksi.</p><p>${escape(guide.limit)}</p><p>${escape(guide.unsuitable)}</p></section>`,
  };
  return routes[slug];
}

function writePage(path, title, description, body, schema, type = "article") {
  const canonical = `${siteUrl}${path}`;
  const html = template
    .replace(/<title>[^<]*<\/title>/, `<title>${escape(title)}</title>`)
    .replace(/<meta name="description" content="[^"]*"\s*\/>/, `<meta name="description" content="${escape(description)}" />`)
    .replace(/<meta property="og:title" content="[^"]*"\s*\/>/, `<meta property="og:title" content="${escape(title)}" />`)
    .replace(/<meta property="og:description" content="[^"]*"\s*\/>/, `<meta property="og:description" content="${escape(description)}" />`)
    .replace(/<meta property="og:type" content="[^"]*"\s*\/>/, `<meta property="og:type" content="${type}" />`)
    .replace(/<meta name="twitter:title" content="[^"]*"\s*\/>/, `<meta name="twitter:title" content="${escape(title)}" />`)
    .replace(/<meta name="twitter:description" content="[^"]*"\s*\/>/, `<meta name="twitter:description" content="${escape(description)}" />`)
    .replace("</head>", `<link rel="canonical" href="${canonical}" /><meta property="og:url" content="${canonical}" /><script type="application/ld+json">${JSON.stringify(schema).replace(/</g, "\\u003c")}</script></head>`)
    .replace('<div id="root"></div>', `<div id="root">${body}</div>`);
  const directory = new URL(`../dist${path}/`, import.meta.url);
  mkdirSync(directory, { recursive: true });
  writeFileSync(new URL("index.html", directory), html, "utf8");
}

for (const [slug, guide] of Object.entries(guides)) {
  const page = pages[slug];
  if (!page) throw new Error(`Panduan ${slug} tidak punya halaman.`);
  const headings = sectionTitles[slug];
  if (!headings) throw new Error(`Struktur prerender ${slug} belum tersedia.`);
  const path = `/cara-belajar/${slug}`;
  const canonical = `${siteUrl}${path}`;
  const body = `<main class="public-site mx-auto max-w-[1100px] px-5 py-16 sm:px-8">
    <nav aria-label="Breadcrumb"><a href="/">Beranda</a> / <a href="/cara-belajar">Cara Belajar</a> / ${escape(page.eyebrow)}</nav>
    <article data-guide-layout="${escape(slug)}"><header><p>${escape(page.eyebrow)}</p><h1>${escape(page.title)}</h1><p>${escape(page.intro)}</p></header>
      ${guideSections(slug, guide, headings)}
      <section><h2>Pertanyaan yang sering muncul</h2>${guide.faqs.map((faq) => `<h3>${escape(faq.question)}</h3><p>${escape(faq.answer)}</p>`).join("")}</section>
      <p>Penulis dan pemeriksa konten: Tim operasional BimbelKu. Sumber: alur pemesanan dan status sistem BimbelKu. Diperbarui ${slug === "kelas-bersama" ? "30" : "27"} September 2026.</p>
      <p><a href="${escape(guide.cta.to)}">${escape(guide.cta.label)}</a></p>
      <aside><h2>Bacaan terkait</h2>${guide.related.map((related) => `<a href="/cara-belajar/${escape(related)}">${escape(pages[related]?.eyebrow || related)}</a>`).join(" · ")}</aside>
    </article></main>`;
  const schema = { "@context": "https://schema.org", "@graph": [
    { "@type": "Article", headline: page.title, description: page.intro, inLanguage: "id-ID", dateModified: slug === "kelas-bersama" ? "2026-09-30" : "2026-09-27", author: { "@type": "Organization", name: "BimbelKu" }, publisher: { "@type": "Organization", name: "BimbelKu" }, mainEntityOfPage: canonical },
    { "@type": "FAQPage", mainEntity: guide.faqs.map((faq) => ({ "@type": "Question", name: faq.question, acceptedAnswer: { "@type": "Answer", text: faq.answer } })) },
  ] };
  const title = `${page.eyebrow} | BimbelKu`;
  writePage(path, title, page.intro, body, schema);
}

const overviewPath = "/cara-belajar";
const overviewDescription = "Pelajari pilihan layanan, cara pemesanan, pembayaran, refund, dan sistem matching tutor BimbelKu.";
const overviewBody = `<main class="public-site mx-auto max-w-[1100px] px-5 py-16 sm:px-8"><h1>Pahami layanan, pesanan, dan matching sebelum memutuskan.</h1><p>${escape(overviewDescription)}</p><nav aria-label="Panduan cara belajar"><ul>${Object.entries(pages).map(([slug, page]) => `<li><a href="${overviewPath}/${slug}">${escape(page.eyebrow)}</a><p>${escape(page.intro)}</p></li>`).join("")}</ul></nav></main>`;
const overviewSchema = { "@context": "https://schema.org", "@type": "CollectionPage", name: "Panduan Belajar dan Pemesanan", description: overviewDescription, inLanguage: "id-ID", url: `${siteUrl}${overviewPath}`, hasPart: Object.keys(pages).map((slug) => ({ "@type": "Article", url: `${siteUrl}${overviewPath}/${slug}` })) };
writePage(overviewPath, "Panduan Belajar dan Pemesanan | BimbelKu", overviewDescription, overviewBody, overviewSchema, "website");

console.log(`Prerender Wawasan: ${Object.keys(guides).length + 1} halaman.`);
