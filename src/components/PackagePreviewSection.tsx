import { ArrowRight, BookOpenCheck, CalendarDays, Clock3, Layers3, MapPin } from "lucide-react";
import Reveal from "@/components/Reveal";
import LandingAmbientOrbit from "@/components/LandingAmbientOrbit";
import StudentPackageLink from "@/components/StudentPackageLink";
import { useWebsiteContent } from "@/components/WebsiteContentProvider";

const choices = [
  { icon: Layers3, number: "01", title: "Jumlah sesi", text: "Pilih ritme yang tersedia tanpa harus memahami semua nama paket." },
  { icon: Clock3, number: "02", title: "Durasi belajar", text: "Tentukan lama setiap pertemuan sesuai kebutuhan materi." },
  { icon: BookOpenCheck, number: "03", title: "Mapel dan Bab", text: "Alokasikan sesi pada materi yang benar-benar ingin dipelajari." },
  { icon: CalendarDays, number: "04", title: "Jadwal dan mode", text: "Pilih waktu, online atau tatap muka, lalu periksa totalnya." },
];

export default function PackagePreviewSection() {
  const { section } = useWebsiteContent();
  const cms = section("pricing");
  return <section className="relative overflow-hidden bg-[#FFFBF7] py-20 sm:py-24">
    <LandingAmbientOrbit variant="focus" color="#C2410C" style={{ width: 244, height: 244, top: 12, right: 16, opacity: 0.86 }} />
    <div className="relative mx-auto max-w-[1200px] px-5 sm:px-8">
      <Reveal width="100%"><div className="grid gap-6 lg:grid-cols-2 lg:items-end"><div><p className="text-xs font-extrabold uppercase tracking-wider text-orange-700">{cms?.eyebrow || "Paket belajar fleksibel"}</p><h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[#14213D] sm:text-4xl">{cms?.title || "Tidak perlu membandingkan daftar paket yang panjang."}</h2></div><p className="text-base leading-8 text-slate-600">{cms?.description || "Paket aktif dapat bertambah. Karena itu landing page menjelaskan cara menyusun pilihan, sedangkan daftar dan harga aktual selalu dibaca langsung dari formulir."}</p></div></Reveal>
      <div className="mt-10 grid gap-5 lg:grid-cols-[1fr_360px]">
        <ol className="grid grid-cols-2 gap-3 sm:gap-4">{choices.map((item) => { const Icon = item.icon; return <li key={item.number} className="rounded-[1.35rem] border border-stone-200 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6"><div className="flex items-center justify-between"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-orange-100 text-orange-700 sm:h-11 sm:w-11"><Icon size={20} /></span><span className="text-sm font-extrabold text-stone-300">{item.number}</span></div><h3 className="mt-4 text-base font-extrabold text-[#14213D] sm:mt-5 sm:text-lg">{item.title}</h3><p className="mt-2 text-xs leading-5 text-slate-600 sm:text-sm sm:leading-6">{item.text}</p></li>; })}</ol>
        <aside className="flex flex-col rounded-3xl bg-[#14213D] p-7 text-white shadow-xl"><p className="text-xs font-extrabold uppercase tracking-wider text-orange-300">Harga dihitung di formulir</p><h3 className="mt-4 text-3xl font-extrabold">Mulai dari kebutuhan, bukan nama paket.</h3><p className="mt-4 text-sm leading-7 text-slate-300">Total mengikuti paket aktif, jumlah peserta, durasi, mapel, mode, dan pilihan lain yang kamu isi. Tidak ada harga contoh yang menyamar sebagai harga final.</p><div className="mt-7 rounded-2xl border border-white/10 bg-white/10 p-4"><p className="flex gap-3 text-sm font-bold leading-6 text-slate-200"><MapPin size={18} className="mt-1 shrink-0 text-orange-300" />Untuk tatap muka, area dan titik lokasi juga diperiksa sebelum matching.</p></div><StudentPackageLink to="/student/packages/new" className="mt-7 inline-flex min-h-[3.25rem] w-full shrink-0 items-center justify-center gap-2 rounded-2xl bg-orange-600 px-5 py-3 text-center text-sm font-extrabold leading-5 text-white hover:bg-orange-500">Susun pilihan belajar <ArrowRight size={17} /></StudentPackageLink></aside>
      </div>
    </div>
  </section>;
}
