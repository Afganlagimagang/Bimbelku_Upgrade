import { ArrowRight, BadgeCheck, BookOpenCheck, CalendarDays, FileCheck2, LockKeyhole, MapPin, MessageCircle, ShieldCheck, UserRoundCheck } from "lucide-react";
import { Link } from "react-router-dom";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import SeoHead from "@/components/SeoHead";
import StudentPackageLink from "@/components/StudentPackageLink";
import { usePublicSectionMotion } from "@/hooks/usePublicSectionMotion";

const checks = [
  { title: "Kandidat menceritakan bidang ajarnya", body: "Pendaftaran dimulai dari profil, mapel, jenjang, metode belajar, wilayah, dan data pendukung. Kartu identitas, foto wajah langsung, serta bukti kualifikasi masuk ke ruang pemeriksaan admin; dokumen ini tidak otomatis menjadi materi publik.", icon: FileCheck2 },
  { title: "Data dan kualifikasi diperiksa", body: "Admin membandingkan identitas, latar pendidikan, dan pilihan bidang ajar dengan berkas yang masuk. Bila ada bagian yang belum sesuai, pendaftaran tidak langsung berubah menjadi akun tutor aktif. Perubahan penting setelah disetujui pun dapat memerlukan pemeriksaan ulang.", icon: ShieldCheck },
  { title: "Ada percakapan dan tes sebelum keputusan", body: "Setelah data lengkap, kandidat diarahkan ke WhatsApp untuk tahap seleksi. Admin mencatat jadwal serta ringkasan hasil tes, lalu menilai kesiapan mengajar; mengirim form saja belum berarti lulus.", icon: MessageCircle },
  { title: "Disetujui bukan berarti pasti mendapat kelas", body: "Admin menetapkan keputusan akhir. Tutor yang aktif mengatur waktu tersedia dan mapel yang benar-benar siap diajar. Saat pesanan datang, kecocokan jadwal dan kebutuhan murid tetap diperiksa, kemudian tutor masih harus menerima penawarannya.", icon: BadgeCheck },
];

const criteria = [
  { title: "Bidang dan jenjang", text: "Mapel serta tingkat belajar pada pesanan harus sesuai dengan kompetensi yang aktif di profil tutor.", icon: BookOpenCheck },
  { title: "Waktu yang tersedia", text: "Hari dan jam yang dipilih murid dibandingkan dengan ketersediaan tutor dan kelas lain yang sudah diterima.", icon: CalendarDays },
  { title: "Mode dan lokasi", text: "Kelas online tidak memakai radius perjalanan. Untuk tatap muka, jangkauan lokasi ikut diperiksa.", icon: MapPin },
];

export default function TutorSelection() {
  const motionRef = usePublicSectionMotion();
  return (
    <div className="public-site min-h-screen bg-[#FFFBF7] text-[#14213D]">
      <SeoHead
        title="Bagaimana Tutor BimbelKu Diseleksi | BimbelKu"
        description="Lihat proses pendaftaran, pemeriksaan dokumen, tes melalui WhatsApp, persetujuan admin, dan cara tutor dicocokkan dengan kebutuhan belajar di BimbelKu."
        canonicalPath="/seleksi-tutor"
      />
      <Navbar />
      <main ref={motionRef}>
        <section className="relative overflow-hidden bg-[#10243A] px-5 pb-16 pt-14 text-white sm:px-8 sm:pb-20 sm:pt-20">
          <div className="pointer-events-none absolute -right-24 -top-36 h-96 w-96 rounded-full border-[36px] border-[#F6B94A]/10" aria-hidden="true" />
          <div className="relative mx-auto grid max-w-[1200px] gap-10 lg:grid-cols-[1.15fr_.85fr] lg:items-end">
            <div>
              <nav aria-label="Breadcrumb" className="text-xs font-bold text-slate-300"><Link to="/" className="hover:text-white">Beranda</Link><span className="mx-2">/</span><Link to="/tutor" className="hover:text-white">Tutor</Link><span className="mx-2">/</span>Seleksi tutor</nav>
              <p className="mt-10 text-xs font-extrabold uppercase tracking-[.18em] text-[#F6B94A]">Di balik profil tutor</p>
              <h1 className="mt-4 max-w-[18ch] text-balance text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">Tutor yang terlihat di katalog melewati proses, bukan langsung dipasang.</h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-200">BimbelKu memisahkan tiga hal yang sering terdengar sama: seseorang mendaftar, seseorang disetujui untuk mengajar, dan seseorang cocok untuk pesanan tertentu. Halaman ini menjelaskan batas masing-masing.</p>
              <a href="#tahap-seleksi" className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#C2410C] px-5 text-sm font-extrabold text-white hover:bg-[#9A3412]">Lihat prosesnya <ArrowRight size={17} aria-hidden="true" /></a>
            </div>
            <aside className="rounded-3xl border border-white/15 bg-white/[.07] p-6 backdrop-blur-sm sm:p-8" aria-label="Ringkasan alur tutor">
              <p className="text-xs font-extrabold uppercase tracking-[.16em] text-[#F6B94A]">Batas yang penting</p>
              <ol className="mt-5 space-y-5 border-l border-white/20 pl-5 text-sm leading-6">
                <li><strong className="block text-white">Mendaftar</strong><span className="text-slate-300">Data dan dokumen diserahkan untuk diperiksa.</span></li>
                <li><strong className="block text-white">Disetujui</strong><span className="text-slate-300">Admin telah mencatat pemeriksaan dan hasil tes.</span></li>
                <li><strong className="block text-white">Menerima kelas</strong><span className="text-slate-300">Tutor sesuai kebutuhan pesanan dan menerima penawaran kelas.</span></li>
              </ol>
              <p className="mt-6 border-t border-white/15 pt-5 text-xs leading-6 text-slate-300">Tidak ada jaminan tutor tertentu akan tersedia pada setiap waktu atau lokasi.</p>
            </aside>
          </div>
        </section>

        <section id="tahap-seleksi" className="scroll-mt-24 px-5 py-20 sm:px-8 sm:py-24">
          <div className="mx-auto max-w-[1200px]">
            <div className="grid gap-7 lg:grid-cols-[.68fr_1.32fr] lg:gap-16">
              <div className="lg:sticky lg:top-28 lg:self-start"><p className="text-xs font-extrabold uppercase tracking-[.18em] text-[#A94316]">Sebelum akun aktif</p><h2 className="mt-3 text-3xl font-extrabold leading-tight sm:text-4xl">Apa yang sebenarnya diperiksa sebelum tutor mengajar?</h2><p className="mt-5 leading-8 text-slate-600">Proses ini dijalankan di sistem admin. Dokumen tidak berubah menjadi klaim publik, dan status pendaftaran bukan bukti tutor sudah siap mengajar.</p></div>
              <div className="border-t border-stone-200">
                {checks.map((item) => { const Icon = item.icon; return <article key={item.title} className="grid gap-5 border-b border-stone-200 py-8 sm:grid-cols-[3.5rem_1fr]"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-teal-50"><Icon className="text-[#C2410C]" size={23} aria-hidden="true" /></span><div><h3 className="text-xl font-extrabold">{item.title}</h3><p className="mt-3 text-base leading-8 text-slate-600">{item.body}</p></div></article>; })}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#E8F1EF] px-5 py-20 sm:px-8 sm:py-24">
          <div className="mx-auto max-w-[1200px]">
            <p className="text-xs font-extrabold uppercase tracking-[.18em] text-[#0E6667]">Setelah pesanan dibayar</p>
            <div className="mt-3 grid gap-7 lg:grid-cols-[.9fr_1.1fr] lg:gap-14"><h2 className="max-w-[17ch] text-3xl font-extrabold leading-tight sm:text-4xl">Tutor aktif belum tentu tepat untuk setiap murid.</h2><p className="max-w-2xl text-base leading-8 text-slate-700">Pencocokan dimulai setelah pembayaran terkonfirmasi. Sistem menyaring kandidat menurut kebutuhan belajar dan mengirim penawaran kepada tutor yang memenuhi syarat. Urutan penawaran bukan undian dan tidak otomatis mendahulukan rating tertinggi.</p></div>
            <div className="mt-10 grid gap-4 md:grid-cols-3">{criteria.map((item) => { const Icon = item.icon; return <article key={item.title} className="rounded-2xl border border-[#147D7E]/15 bg-white p-6"><Icon size={25} className="text-[#147D7E]" aria-hidden="true" /><h3 className="mt-5 text-lg font-extrabold">{item.title}</h3><p className="mt-3 text-sm leading-7 text-slate-600">{item.text}</p></article>; })}</div>
            <p className="mt-8 max-w-4xl border-l-4 border-[#C2410C] pl-5 text-sm font-semibold leading-7 text-slate-700">Jika belum ditemukan tutor yang cocok, status pencarian ditampilkan di akun. Murid dapat menindaklanjuti pilihan lanjut mencari atau proses pengembalian dana sesuai kebijakan yang berlaku untuk pesanannya.</p>
          </div>
        </section>

        <section className="px-5 py-20 sm:px-8 sm:py-24">
          <div className="mx-auto grid max-w-[1200px] gap-12 lg:grid-cols-2 lg:gap-20">
            <div><UserRoundCheck size={30} className="text-[#147D7E]" aria-hidden="true" /><h2 className="mt-4 text-3xl font-extrabold">Yang boleh dilihat publik</h2><p className="mt-4 leading-8 text-slate-600">Katalog tutor hanya memuat profil yang sudah memenuhi syarat tampil dan mendapat persetujuan publik. Nama, foto yang disetujui, bidang ajar, dan jejak pendidikan atau karier yang layak dipublikasikan membantu keluarga mengenal calon pendamping belajar.</p><Link to="/tutor" className="mt-6 inline-flex items-center gap-2 text-sm font-extrabold text-[#A94316]">Kenali tutor yang tampil <ArrowRight size={17} aria-hidden="true" /></Link></div>
            <div className="rounded-3xl bg-[#14213D] p-7 text-white sm:p-9"><LockKeyhole size={29} className="text-[#F6B94A]" aria-hidden="true" /><h2 className="mt-4 text-2xl font-extrabold">Yang tetap privat</h2><p className="mt-4 text-sm leading-7 text-slate-200">Kartu identitas, foto verifikasi langsung, berkas kualifikasi, alamat pribadi, nomor kontak, dan catatan seleksi tidak ditampilkan di katalog. Halaman publik juga tidak membuka jadwal lengkap atau dokumen yang dipakai admin untuk memutuskan kelayakan.</p><p className="mt-5 border-t border-white/15 pt-5 text-xs font-semibold leading-6 text-slate-300">Rating yang ditampilkan harus berasal dari penilaian murid nyata; profil tidak diberi angka atau prestasi buatan untuk terlihat lebih meyakinkan.</p></div>
          </div>
        </section>

        <section className="bg-[#F7F1E8] px-5 py-16 sm:px-8 sm:py-20"><div className="mx-auto grid max-w-[1200px] gap-8 lg:grid-cols-[1fr_auto] lg:items-center"><div><p className="text-xs font-extrabold uppercase tracking-[.18em] text-[#A94316]">Langkah selanjutnya</p><h2 className="mt-3 text-3xl font-extrabold">Kamu sedang mencari tutor atau ingin menjadi tutor?</h2><p className="mt-3 max-w-2xl leading-7 text-slate-600">Kebutuhan murid masuk melalui pemesanan; calon tutor memulai dari pendaftaran lengkap dan pemeriksaan. Dua jalur ini sengaja tidak dicampur.</p></div><div className="flex flex-wrap gap-3"><StudentPackageLink to="/student/packages/new" className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#C2410C] px-5 text-sm font-extrabold text-white">Cari bimbingan <ArrowRight size={17} /></StudentPackageLink><Link to="/jadi-tutor" className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-[#14213D]/25 bg-white px-5 text-sm font-extrabold">Daftar menjadi tutor</Link></div></div></section>
      </main>
      <Footer />
    </div>
  );
}
