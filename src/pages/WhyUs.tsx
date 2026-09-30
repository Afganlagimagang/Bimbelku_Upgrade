import { useEffect, useState } from "react";
import { ArrowRight, BookOpenCheck, CalendarDays, CheckCircle2, MessageCircle, ShieldCheck, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import StudentPackageLink from "@/components/StudentPackageLink";
import { useWebsiteContent } from "@/components/WebsiteContentProvider";
import { getCached } from "@/lib/http";
import { defaultWebsiteContent } from "@/lib/websiteContent";
import { usePublicSectionMotion } from "@/hooks/usePublicSectionMotion";

type PublicTutor = {
  id: number;
  name: string;
  title?: string | null;
  degree?: string | null;
  credentials?: string | null;
  photo_url?: string | null;
  subjects?: string[];
};

const learningOptions = [
  {
    title: "Privat tatap muka",
    cue: "Jika anak lebih nyaman ditemani langsung",
    description: "Tutor datang ke alamat belajar yang kamu isi. Kamu memilih pelajaran dan jadwal; sistem memeriksa apakah ada tutor yang cocok dan dapat menjangkau lokasi itu.",
    note: "Alamat dalam area layanan belum menjamin tutor tersedia pada jam pilihanmu.",
    to: "/cara-belajar/privat-tatap-muka",
  },
  {
    title: "Privat online",
    cue: "Jika belajar dari rumah lebih mudah",
    description: "Murid dan tutor bertemu lewat ruang kelas online. Pelajaran, jumlah pertemuan, dan jadwal tetap kamu susun sendiri, tanpa pemeriksaan radius perjalanan.",
    note: "Perangkat, internet, dan tempat yang tenang tetap perlu disiapkan.",
    to: "/cara-belajar/privat-online",
  },
  {
    title: "Kelas Bersama",
    cue: "Jika jadwal kelas yang tersedia sudah cocok",
    description: "Kamu bergabung ke kelas online dengan materi, waktu, biaya, dan kuota yang sudah ditentukan. Pesertanya dapat berasal dari beberapa akun.",
    note: "Kelas berjalan setelah jumlah peserta terverifikasi memenuhi minimum.",
    to: "/cara-belajar/kelas-bersama",
  },
];

const journey = [
  { title: "Mulai dari kesulitan yang nyata", text: "Keluarga dapat menjelaskan pelajaran atau program yang dituju, jenjang anak, dan bagian materi yang terasa sulit. Informasi ini membantu membedakan kebutuhan mengejar satu Bab dari persiapan ujian yang mencakup beberapa mapel." },
  { title: "Buat rencana yang mungkin dijalankan", text: "Untuk privat, jumlah pertemuan, durasi, hari, dan jam dipilih sebelum membayar. Ringkasan memperlihatkan rencana serta biaya akhirnya, sehingga keluarga dapat mengubahnya sebelum mengirim pesanan." },
  { title: "Pencarian tutor dimulai setelah pembayaran", text: "Sistem baru menawarkan pesanan kepada tutor yang memenuhi bidang ajar, jenjang, cara belajar, dan jadwal setelah pembayaran terverifikasi. Khusus tatap muka, jarak dari titik belajar ikut diperiksa; memilih jadwal belum berarti tutor sudah tersedia." },
  { title: "Perjalanan belajar tetap bisa diikuti", text: "Ketika tutor menerima dan kelas terbentuk, jadwalnya terlihat di Kelas Saya. Setelah sesi berlangsung, kehadiran dan catatan materi memberi keluarga titik awal untuk membicarakan bagian yang sudah dipahami dan yang masih perlu latihan." },
];

export default function WhyUs() {
  const motionRef = usePublicSectionMotion();
  const { settings: savedSettings, trust_items, testimonials } = useWebsiteContent();
  const settings = {
    ...savedSettings,
    office_address: savedSettings.office_address === defaultWebsiteContent.settings.office_address ? null : savedSettings.office_address,
    contact_email: savedSettings.contact_email === defaultWebsiteContent.settings.contact_email ? null : savedSettings.contact_email,
    whatsapp_hours: savedSettings.whatsapp_enabled ? savedSettings.whatsapp_hours : null,
  };
  const [tutors, setTutors] = useState<PublicTutor[]>([]);

  useEffect(() => {
    let active = true;
    void getCached<PublicTutor[]>("/public-tutors", { maxAgeMs: 30_000 })
      .then((response) => {
        if (active && Array.isArray(response.data)) setTutors(response.data.slice(0, 3));
      })
      .catch(() => { /* Kegagalan memuat profil tidak diganti dengan tutor fiktif. */ });
    return () => { active = false; };
  }, []);

  const facts = trust_items.filter((item) => item.is_visible && item.source_type === "system" && item.resolved_value).slice(0, 3);
  const stories = testimonials.filter((item) => item.is_visible && item.is_verified && item.rating_id && item.consent_at && item.quote).slice(0, 2);
  const whatsappDigits = settings.whatsapp_number?.replace(/\D/g, "").replace(/^0/, "62") || "";
  const whatsappUrl = settings.whatsapp_enabled && whatsappDigits
    ? `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(settings.whatsapp_default_message || "Halo BimbelKu, saya ingin bertanya tentang belajar di BimbelKu.")}`
    : null;

  return <div className="public-site min-h-screen bg-[#FFFBF7] text-[#14213D]">
    <Navbar />
    <main ref={motionRef}>
      <section className="relative overflow-hidden bg-[#14213D] text-white">
        <div aria-hidden="true" className="pointer-events-none absolute -right-28 -top-36 h-96 w-96 rounded-full border-[34px] border-orange-300/10" />
        <div className="relative mx-auto grid max-w-[1160px] gap-12 px-5 pb-20 pt-14 sm:px-8 sm:pt-20 lg:grid-cols-[1.25fr_.75fr] lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[.18em] text-orange-300">Tentang BimbelKu</p>
            <h1 className="mt-5 max-w-4xl text-4xl font-extrabold leading-[1.13] tracking-tight sm:text-5xl lg:text-6xl">Belajar tidak harus dimulai dari jawaban. Kadang, anak perlu didengar dulu.</h1>
            <p className="mt-7 max-w-2xl text-base leading-8 text-slate-200 sm:text-lg">Ada anak yang tersendat di satu Bab, ada yang perlu menyiapkan ujian, dan ada yang hanya butuh orang lain menjelaskan dengan cara berbeda. BimbelKu membantu keluarga menyampaikan kebutuhan itu, mencari tutor yang sesuai, lalu mengikuti kelas dan perkembangannya dalam satu tempat.</p>
            <div className="mt-8 flex flex-wrap gap-3"><Link to="/program" className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-orange-500 px-5 text-sm font-extrabold text-[#14213D]">Lihat pelajaran <ArrowRight size={17} /></Link><a href="#cerita-bimbelku" className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-white/25 px-5 text-sm font-extrabold text-white">Kenali cara kami bekerja <ArrowRight size={17} /></a></div>
          </div>
          <aside className="border-l-2 border-orange-400 pl-6 sm:pl-8">
            <p className="text-xs font-black uppercase tracking-[.16em] text-orange-300">Dalam satu kalimat</p>
            <p className="mt-3 text-2xl font-extrabold leading-snug sm:text-3xl">BimbelKu adalah tempat menyusun les, bertemu tutor, dan melihat perjalanan belajar—bukan sekadar daftar nama guru.</p>
            <p className="mt-5 text-sm leading-7 text-slate-300">Lesnya bisa privat online, privat tatap muka, atau Kelas Bersama yang jadwalnya sudah tersedia. Pilihan dan ketersediaan selalu mengikuti data aktif di sistem.</p>
          </aside>
        </div>
      </section>

      {facts.length > 0 && <section aria-label="Data BimbelKu dari sistem" className="border-b border-stone-200 bg-white px-5 py-8 sm:px-8"><div className="mx-auto grid max-w-[1160px] gap-6 sm:grid-cols-3">{facts.map((item) => <div key={item.id} className="border-l-2 border-teal-700 pl-4"><p className="text-2xl font-extrabold text-[#14213D]">{item.resolved_value}</p><p className="mt-1 text-sm font-bold text-slate-700">{item.title}</p><p className="mt-2 text-xs text-slate-500">Data sistem{item.source_updated_at ? ` · diperbarui ${new Date(item.source_updated_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}` : " aktif"}</p></div>)}</div></section>}

      <section id="cerita-bimbelku" className="scroll-mt-24 px-5 py-20 sm:px-8 sm:py-24"><div className="mx-auto grid max-w-[1160px] gap-12 lg:grid-cols-[.75fr_1.25fr]"><div><p className="text-xs font-black uppercase tracking-[.18em] text-teal-800">Mengapa cara ini penting</p><h2 className="mt-4 text-3xl font-extrabold leading-tight sm:text-4xl">Sebelum mencari guru, kita perlu tahu bagian mana yang ingin dipelajari.</h2></div><div className="space-y-5 text-base leading-8 text-slate-700 sm:text-lg"><p>“Butuh les Matematika” terdengar jelas, tetapi masih menyisakan banyak pertanyaan. Apakah murid belum paham pecahan, sedang menyiapkan ujian, atau kesulitan mengikuti kecepatan kelas di sekolah? Apakah ia lebih nyaman belajar sendiri, bersama teman, atau lewat layar?</p><p>Karena itu, BimbelKu meminta kebutuhan, jenjang, materi, jumlah pertemuan, dan waktu belajar dijelaskan di awal. Bukan untuk membuat pemesanan terasa panjang, melainkan agar tutor yang menerima kelas mengetahui apa yang diharapkan keluarga. Untuk tatap muka, alamat dan titik lokasi membantu memeriksa apakah perjalanan tutor masuk akal.</p><p className="border-l-2 border-orange-500 pl-5 font-semibold text-[#14213D]">Kami tidak menganggap semua anak harus mengikuti satu cara belajar. Yang dicari adalah pilihan yang bisa dijalankan dengan konsisten oleh murid dan tutor.</p></div></div></section>

      <section className="bg-[#EEF5F2] px-5 py-20 sm:px-8 sm:py-24"><div className="mx-auto max-w-[1160px]"><div className="grid gap-7 lg:grid-cols-[.9fr_1.1fr] lg:items-end"><div><p className="text-xs font-black uppercase tracking-[.18em] text-teal-800">Kebutuhan tiap anak berbeda</p><h2 className="mt-4 text-3xl font-extrabold sm:text-4xl">Satu layanan, beberapa jalan untuk belajar.</h2></div><p className="max-w-xl leading-7 text-slate-700">Tiga pilihan di bawah tidak saling menggantikan. Pertanyaannya bukan mana yang paling ramai, melainkan mana yang paling cocok dengan waktu, tempat, dan cara belajar anak.</p></div><div className="mt-10 grid gap-4 lg:grid-cols-3">{learningOptions.map((option, index) => <article key={option.title} className={`flex h-full flex-col rounded-[1.75rem] p-6 sm:p-7 ${index === 1 ? "bg-[#14213D] text-white" : "border border-teal-100 bg-white"}`}><p className={`text-xs font-black uppercase tracking-[.13em] ${index === 1 ? "text-orange-300" : "text-teal-800"}`}>{option.cue}</p><h3 className="mt-5 text-2xl font-extrabold">{option.title}</h3><p className={`mt-4 flex-1 leading-7 ${index === 1 ? "text-slate-200" : "text-slate-700"}`}>{option.description}</p><p className={`mt-5 border-t pt-4 text-sm leading-6 ${index === 1 ? "border-white/20 text-slate-300" : "border-stone-200 text-slate-600"}`}>{option.note}</p><Link to={option.to} className={`mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-extrabold ${index === 1 ? "text-orange-200" : "text-teal-900"}`}>Pahami pilihan ini <ArrowRight size={16} /></Link></article>)}</div></div></section>

      <section className="px-5 py-20 sm:px-8 sm:py-24"><div className="mx-auto grid max-w-[1160px] gap-10 lg:grid-cols-[.8fr_1.2fr]"><div className="lg:sticky lg:top-28 lg:self-start"><p className="text-xs font-black uppercase tracking-[.18em] text-orange-700">Dari kebutuhan ke kelas pertama</p><h2 className="mt-4 text-3xl font-extrabold sm:text-4xl">Apa yang terjadi setelah keluarga memutuskan belajar?</h2><p className="mt-5 leading-7 text-slate-700">Privat dapat mulai disusun tanpa login. Email yang sama saat masuk atau mendaftar akan menghubungkan pesanan ke akun murid untuk melanjutkan pembayaran dan memantau proses.</p><StudentPackageLink to="/student/packages/new" className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl bg-orange-600 px-5 text-sm font-extrabold text-white">Susun kebutuhan belajar <ArrowRight size={17} /></StudentPackageLink></div><div className="border-t border-stone-300">{journey.map((step) => <article key={step.title} className="grid gap-4 border-b border-stone-300 py-7 sm:grid-cols-[8rem_1fr]"><span aria-hidden="true" className="mt-2 h-1 w-20 rounded-full bg-orange-500" /><div><h3 className="text-xl font-extrabold">{step.title}</h3><p className="mt-3 max-w-2xl leading-7 text-slate-700">{step.text}</p></div></article>)}</div></div></section>

      <section className="bg-[#14213D] px-5 py-20 text-white sm:px-8 sm:py-24"><div className="mx-auto max-w-[1160px]"><div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-center"><div><p className="text-xs font-black uppercase tracking-[.18em] text-orange-300">Orang di balik sesi belajar</p><h2 className="mt-4 text-3xl font-extrabold sm:text-4xl">Tutor tidak muncul hanya karena namanya ada di daftar.</h2><p className="mt-6 leading-8 text-slate-200">Calon tutor mengisi identitas dan bidang ajarnya. Tim BimbelKu memeriksa data serta hasil seleksi sebelum akun mengajar diaktifkan. Saat ada pesanan privat, sistem memeriksa kecocokan pelajaran, jenjang, jadwal, cara belajar, dan jangkauan untuk tatap muka. Tutor tetap harus menerima penawaran itu.</p><p className="mt-5 leading-8 text-slate-200">Sebagian tutor setuju menampilkan profilnya untuk umum. Foto atau nama yang tidak memiliki izin publik tidak kami tampilkan di sini. Profil publik membantu kamu mengenal bidang ajar; tutor untuk pesananmu tetap ditentukan oleh proses pencocokan yang sedang berjalan.</p><div className="mt-7 flex flex-wrap gap-3"><Link to="/seleksi-tutor" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 text-sm font-extrabold text-[#14213D]">Bagaimana tutor diseleksi <ArrowRight size={16} /></Link><Link to="/tutor" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/30 px-4 text-sm font-extrabold text-white">Kenali tutor publik <ArrowRight size={16} /></Link></div></div><div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-2">{tutors.length ? tutors.map((tutor) => <article key={tutor.id} className="overflow-hidden rounded-2xl bg-white text-[#14213D]"><div className="aspect-[4/3] overflow-hidden bg-[#E9F2F0]">{tutor.photo_url ? <img src={tutor.photo_url} alt={`Foto ${tutor.name}`} loading="lazy" decoding="async" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center"><UserRound className="text-teal-700" size={42} /></div>}</div><div className="p-4"><h3 className="font-extrabold">{tutor.name}</h3><p className="mt-1 text-sm font-semibold text-teal-800">{tutor.title || tutor.degree || "Tutor BimbelKu"}</p><p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-600">{tutor.credentials || tutor.subjects?.join(" · ") || "Bidang ajar dapat dilihat pada profil tutor."}</p></div></article>) : <div className="col-span-full rounded-[1.75rem] border border-white/20 bg-white/10 p-8"><ShieldCheck className="text-orange-300" size={32} /><p className="mt-5 text-xl font-extrabold">Profil publik belum tersedia di sini.</p><p className="mt-3 leading-7 text-slate-300">Hanya tutor yang sudah memberikan persetujuan dan lolos pemeriksaan yang bisa ditampilkan. Kamu tetap dapat membaca proses seleksinya sambil menunggu profil tersedia.</p></div>}</div></div></div></section>

      <section className="bg-[#FFF3E6] px-5 py-20 sm:px-8 sm:py-24"><div className="mx-auto grid max-w-[1160px] gap-10 lg:grid-cols-[1fr_1fr] lg:items-center"><div><p className="text-xs font-black uppercase tracking-[.18em] text-orange-800">Hal yang perlu diketahui sebelum membayar</p><h2 className="mt-4 text-3xl font-extrabold sm:text-4xl">Pembayaran bukan janji bahwa tutor sudah ditemukan.</h2><p className="mt-6 leading-8 text-slate-700">Harga akhir privat ditampilkan pada ringkasan pesanan. Setelah pembayaran terverifikasi, pencarian tutor dimulai. Kadang tutor yang cocok segera menerima. Kadang jadwal perlu diubah atau pencarian dilanjutkan. Untuk paket dengan beberapa mapel, status setiap mapel terlihat terpisah.</p><p className="mt-5 leading-8 text-slate-700">Jika tutor belum ditemukan, murid melihat tindakan yang tersedia di Proses Pesanan: mencari lagi, mengubah jadwal, atau membatalkan sesuai status. Jika pembatalan menyebabkan pengembalian dana, tujuan dan perkembangannya dapat dipantau di Riwayat Transaksi.</p></div><aside className="rounded-[2rem] bg-white p-6 shadow-lg shadow-orange-950/5 sm:p-8"><p className="text-xs font-black uppercase tracking-[.16em] text-teal-800">Yang berubah pada setiap tahap</p><div className="mt-5 space-y-5">{[["Pesanan tersimpan", "Kebutuhan dan harga tercatat; tutor belum dicari."], ["Pembayaran diterima", "Pencarian tutor privat dimulai."], ["Tutor menerima", "Jadwal kelas dan detail pertemuan dapat dilihat."], ["Kelas berjalan", "Sesi serta perkembangan materi dicatat."]].map(([title, text]) => <div key={title} className="border-b border-stone-200 pb-4 last:border-0 last:pb-0"><h3 className="font-extrabold">{title}</h3><p className="mt-1 text-sm leading-6 text-slate-600">{text}</p></div>)}</div><Link to="/cara-belajar/pembayaran-dan-refund" className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-extrabold text-teal-900 underline decoration-teal-500 underline-offset-4">Baca alur pembayaran dan refund <ArrowRight size={16} /></Link></aside></div></section>

      <section className="px-5 py-20 sm:px-8 sm:py-24"><div className="mx-auto grid max-w-[1160px] gap-12 lg:grid-cols-[.95fr_1.05fr]"><div><p className="text-xs font-black uppercase tracking-[.18em] text-teal-800">Belajar tidak berhenti di tombol bayar</p><h2 className="mt-4 text-3xl font-extrabold sm:text-4xl">Orang tua dan murid perlu tahu apa yang terjadi di kelas.</h2><p className="mt-6 leading-8 text-slate-700">Ketika kelas sudah terbentuk, jadwalnya ada di Kelas Saya. Setiap pertemuan mempunyai status, sehingga murid tidak perlu menebak apakah sesi berikutnya sudah dekat, sedang berlangsung, atau telah selesai. Catatan materi dan perkembangan membantu menentukan pelajaran mana yang perlu diulang.</p><p className="mt-5 leading-8 text-slate-700">Catatan itu bukan janji nilai ujian langsung naik. Ia adalah jejak yang bisa dipakai murid, orang tua, dan tutor untuk melanjutkan belajar dengan lebih sadar. Untuk Kelas Bersama, jadwal dan Bab sudah ditentukan sebelum bergabung; kelas baru dikonfirmasi jika syarat pesertanya terpenuhi.</p></div><div className="grid gap-4 self-start"><div className="rounded-[1.5rem] border border-teal-200 bg-[#EEF6F2] p-6"><CalendarDays className="text-teal-800" size={25} /><h3 className="mt-4 text-lg font-extrabold">Jadwal terlihat</h3><p className="mt-2 leading-7 text-slate-700">Murid dapat kembali ke daftar kelas untuk memeriksa pertemuan yang akan datang.</p></div><div className="rounded-[1.5rem] border border-orange-200 bg-[#FFF4E8] p-6"><BookOpenCheck className="text-orange-700" size={25} /><h3 className="mt-4 text-lg font-extrabold">Materi punya riwayat</h3><p className="mt-2 leading-7 text-slate-700">Catatan per sesi menjelaskan apa yang dibahas dan bagian yang masih perlu latihan.</p></div><div className="rounded-[1.5rem] border border-stone-200 bg-white p-6"><MessageCircle className="text-[#14213D]" size={25} /><h3 className="mt-4 text-lg font-extrabold">Bantuan punya jalur</h3><p className="mt-2 leading-7 text-slate-700">Jika status pesanan, kelas, atau pembayaran membingungkan, murid dapat membaca bantuan lalu menghubungi kanal resmi.</p></div></div></div></section>

      {stories.length > 0 && <section className="bg-[#EEF5F2] px-5 py-16 sm:px-8 sm:py-20"><div className="mx-auto max-w-[1160px]"><p className="text-xs font-black uppercase tracking-[.18em] text-teal-800">Cerita yang benar-benar tercatat</p><h2 className="mt-4 text-3xl font-extrabold sm:text-4xl">Suara murid dan keluarga, bukan contoh buatan.</h2><p className="mt-4 max-w-3xl leading-7 text-slate-700">Kutipan di bawah hanya tampil jika ulasannya terhubung dengan penilaian yang tercatat, sudah diverifikasi, dan pemiliknya mengizinkan publikasi.</p><div className="mt-8 grid gap-4 md:grid-cols-2">{stories.map((story) => <blockquote key={story.id} className="rounded-[1.75rem] bg-white p-6 sm:p-8"><p className="text-lg font-semibold leading-8">“{story.quote}”</p><footer className="mt-6 border-t border-stone-200 pt-4 text-sm font-bold text-slate-700">{story.display_name}{story.program_name ? ` · ${story.program_name}` : ""}</footer></blockquote>)}</div><Link to="/testimonials" className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-extrabold text-teal-900">Lihat cerita lainnya <ArrowRight size={16} /></Link></div></section>}

      <section className="px-5 py-20 sm:px-8 sm:py-24"><div className="mx-auto max-w-[1160px]"><p className="text-xs font-black uppercase tracking-[.18em] text-orange-700">Terbuka soal batas layanan</p><h2 className="mt-4 max-w-3xl text-3xl font-extrabold sm:text-4xl">Kepercayaan juga berarti berani mengatakan “belum tentu”.</h2><div className="mt-9 grid gap-8 lg:grid-cols-3">{[
        ["Tutor yang cocok belum tentu ada di semua jam", "Bidang ajar, kesediaan tutor, jadwal, dan lokasi tatap muka tetap menentukan hasil pencarian. Memilih jadwal tidak langsung memesan seseorang."],
        ["Kelas Bersama belum tentu mencapai kuota", "Kursi yang ditahan belum sama dengan peserta yang pembayarannya terverifikasi. Jika minimum tidak tercapai, kelas dibatalkan dan pembayaran yang diterima masuk alur pengembalian."],
        ["Perkembangan belajar bukan angka yang bisa dijanjikan", "Kami bisa menunjukkan rencana, sesi, dan catatan yang tersedia. Hasil belajar tetap dipengaruhi latihan murid, kehadiran, materi, serta kerja sama dengan tutor."],
      ].map(([title, text]) => <article key={title} className="border-t-2 border-orange-500 pt-5"><CheckCircle2 className="text-teal-700" size={23} /><h3 className="mt-4 text-xl font-extrabold">{title}</h3><p className="mt-3 leading-7 text-slate-700">{text}</p></article>)}</div></div></section>

      <section className="bg-[#14213D] px-5 py-16 text-white sm:px-8 sm:py-20"><div className="mx-auto grid max-w-[1160px] gap-10 lg:grid-cols-[1.2fr_.8fr]"><div><p className="text-xs font-black uppercase tracking-[.18em] text-orange-300">Kenali dan hubungi kami</p><h2 className="mt-4 text-3xl font-extrabold sm:text-4xl">Sebelum memilih les, kenali jalurnya dulu.</h2><p className="mt-5 max-w-2xl leading-8 text-slate-200">Lihat katalog untuk memeriksa pelajaran yang aktif. Baca area layanan jika ingin tutor datang. Kenali profil tutor yang sudah memberi izin tampil. Jika masih ragu tentang kebutuhan anak, sampaikan pertanyaan lewat kanal resmi yang tersedia.</p><div className="mt-7 flex flex-wrap gap-3"><Link to="/program" className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-orange-500 px-5 text-sm font-extrabold text-[#14213D]">Jelajahi program <ArrowRight size={17} /></Link>{whatsappUrl && <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-white/30 px-5 text-sm font-extrabold">Tanya lewat WhatsApp <ArrowRight size={17} /></a>}</div></div><div className="space-y-4 border-l border-white/20 pl-6 text-sm sm:pl-8">{settings.office_address && <div><p className="font-extrabold text-orange-200">Alamat yang tercatat</p><p className="mt-1 leading-7 text-slate-300">{settings.office_address}</p></div>}{settings.contact_email && <div><p className="font-extrabold text-orange-200">Email kontak</p><a href={`mailto:${settings.contact_email}`} className="mt-1 block break-all leading-7 text-slate-300 underline underline-offset-4">{settings.contact_email}</a></div>}{settings.whatsapp_hours && <div><p className="font-extrabold text-orange-200">Jam layanan WhatsApp</p><p className="mt-1 leading-7 text-slate-300">{settings.whatsapp_hours}</p></div>}<div><p className="font-extrabold text-orange-200">Wilayah belajar</p><p className="mt-1 leading-7 text-slate-300">Ketersediaan tatap muka bergantung pada alamat dan tutor. Kelas online tidak memakai radius perjalanan.</p><Link to="/area-layanan" className="mt-2 inline-flex items-center gap-2 font-extrabold text-white underline underline-offset-4">Periksa area layanan <ArrowRight size={15} /></Link></div></div></div></section>
    </main>
    <Footer />
  </div>;
}
