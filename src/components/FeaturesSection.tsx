import { ArrowRight, Check, Minus } from "lucide-react";
import Reveal from "@/components/Reveal";
import LandingAmbientOrbit from "@/components/LandingAmbientOrbit";
import StudentPackageLink from "@/components/StudentPackageLink";
import { useWebsiteContent } from "@/components/WebsiteContentProvider";

const comparisons = [
  ["Jumlah peserta", "1–8 peserta dalam satu pesanan", "Mengikuti kapasitas kelas"],
  ["Materi", "Mapel, Bab, dan target dipilih", "Mengikuti materi kelas"],
  ["Ritme", "Dapat fokus pada kebutuhan peserta", "Mengikuti ritme kelompok"],
  ["Jadwal", "Hari dan jam diajukan sejak awal", "Biasanya sudah ditetapkan"],
  ["Tempat", "Online atau tatap muka sesuai area", "Mengikuti lokasi kelas"],
  ["Tutor", "Matching setelah pembayaran terverifikasi", "Biasanya ditentukan penyelenggara"],
];

export default function FeaturesSection() {
  const { section } = useWebsiteContent();
  const cms = section("proof");
  const eyebrow = !cms?.eyebrow || cms.eyebrow === "Bukti di dalam produk" ? "Bandingkan cara belajarnya" : cms.eyebrow;
  const title = !cms?.title || cms.title === "Yang dijanjikan di depan, terlihat lagi di dashboard." ? "Pilih pola belajar yang cocok—lihat bedanya secara cepat." : cms.title;
  const description = !cms?.description || cms.description.includes("verifikasi, matching, jadwal") ? "Bukan untuk menyatakan satu metode selalu lebih baik. Bagian ini membantu orang tua melihat kapan privat lebih relevan dan kapan kelas besar sudah cukup." : cms.description;

  return <section className="relative overflow-hidden py-20 text-white sm:py-24" style={{ backgroundColor: "#071A2D" }}>
    <LandingAmbientOrbit variant="spark" color="#F6B94A" style={{ width: 250, height: 250, top: 10, right: 16, opacity: 0.72 }} />
    <div className="relative mx-auto max-w-[1200px] px-5 sm:px-8">
      <Reveal width="100%"><div className="grid gap-6 lg:grid-cols-2"><div><p className="text-xs font-extrabold uppercase tracking-wider text-orange-300">{eyebrow}</p><h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h2></div><p className="text-base leading-8 text-slate-300">{description}</p></div></Reveal>
      <div className="-mx-5 mt-8 overflow-x-auto px-5 pb-8 pt-2 [scrollbar-color:#F59E0B_#16334A] [scrollbar-gutter:stable] [scrollbar-width:thin] sm:-mx-8 sm:px-8 md:mx-0 md:mt-10 md:px-0">
        <div className="flex w-[760px] snap-x snap-mandatory items-stretch overflow-visible rounded-3xl border border-white/10 bg-[#0D2940] p-3 shadow-2xl sm:p-5 md:w-full md:p-6">
          <div className="w-[150px] shrink-0 snap-start md:w-1/4">
            <div className="flex min-h-20 items-center px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 sm:px-5 sm:text-xs">Yang dibandingkan</div>
            {comparisons.map(([label]) => <div key={label} className="flex min-h-20 items-center border-t border-white/10 px-3 text-xs font-extrabold text-white sm:px-5 sm:text-sm"><span className="mr-2 h-2 w-2 shrink-0 rounded-full bg-orange-400 sm:mr-3" />{label}</div>)}
          </div>

          <article
            className="group relative z-10 -my-2 w-[315px] shrink-0 snap-start overflow-hidden rounded-3xl bg-[#E8F1F2] text-[#164E63] shadow-2xl transition-transform duration-300 md:w-5/12"
            onMouseEnter={(event) => {
              if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) event.currentTarget.style.transform = "scale(1.025)";
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.transform = "";
            }}
          >
            <div className="flex min-h-20 items-center gap-3 bg-[#147D7E] px-5 text-white sm:px-6">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-orange-400 text-[#14213D]"><Check size={18} strokeWidth={3} /></span>
              <h3 className="text-base font-extrabold">BimbelKu privat</h3>
            </div>
            {comparisons.map(([, privateValue]) => <div key={privateValue} className="flex min-h-20 items-center gap-3 border-t border-teal-900/10 px-5 sm:px-6"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-orange-400 text-[#14213D]"><Check size={13} strokeWidth={3} /></span><p className="text-sm font-bold leading-6">{privateValue}</p></div>)}
          </article>

          <article className="w-[295px] shrink-0 snap-start overflow-hidden rounded-r-3xl border border-l-0 border-white/10 bg-[#071A2D] md:w-1/3">
            <div className="flex min-h-20 items-center gap-3 px-5 sm:px-6">
              <span className="grid h-9 w-9 place-items-center rounded-full border border-white/15 text-slate-400"><Minus size={18} /></span>
              <h3 className="text-base font-extrabold text-slate-200">Kelas besar umumnya</h3>
            </div>
            {comparisons.map(([, , classValue]) => <div key={classValue} className="flex min-h-20 items-center gap-3 border-t border-white/10 px-5 text-sm leading-6 text-slate-300 sm:px-6"><Minus size={16} className="shrink-0 text-slate-500" /><p>{classValue}</p></div>)}
          </article>
        </div>
      </div>
      <p className="mt-1 text-center text-xs font-bold text-slate-400 md:hidden">Geser tabel ke samping untuk membandingkan semua pilihan.</p>
      <div className="mt-7 flex flex-col gap-5 rounded-3xl border border-orange-300/20 bg-orange-300/10 p-5 sm:flex-row sm:items-center sm:justify-between"><p className="max-w-3xl text-sm leading-6 text-slate-200">Detail BimbelKu mengikuti pilihan yang benar-benar muncul di formulir. Kapasitas, area, harga, dan ketersediaan tutor tidak dipalsukan untuk kebutuhan promosi.</p><StudentPackageLink to="/student/packages/new" className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-2xl bg-orange-600 px-6 text-sm font-extrabold text-white">Cek pilihanmu <ArrowRight size={17} /></StudentPackageLink></div>
    </div>
  </section>;
}
