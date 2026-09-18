import { useState } from "react";
import { ArrowRight, BookOpenCheck, CreditCard, Radar, SlidersHorizontal, type LucideIcon } from "lucide-react";

import Reveal from "@/components/Reveal";
import StudentPackageLink from "@/components/StudentPackageLink";
import { useWebsiteContent } from "@/components/WebsiteContentProvider";

type Step = {
  icon: LucideIcon;
  title: string;
  short: string;
  description: string;
  detail: string[];
  accent: string;
};

const steps: Step[] = [
  {
    icon: SlidersHorizontal,
    title: "Susun kebutuhan",
    short: "Mapel, Bab, mode, dan jadwal",
    description: "Pilih kebutuhan belajar sedetail yang kamu tahu. Semua pilihan tetap dapat diperiksa sebelum lanjut.",
    detail: ["Pilih jenjang dan mata pelajaran", "Atur mode online atau tatap muka", "Tentukan hari dan jam yang memungkinkan"],
    accent: "bg-amber-100 text-amber-800",
  },
  {
    icon: CreditCard,
    title: "Lihat biaya & bayar",
    short: "Ringkasan muncul sebelum transaksi",
    description: "Harga final ditampilkan sebelum pembayaran. Matching tutor belum dimulai pada tahap ini.",
    detail: ["Jumlah sesi dan masa aktif terbaca", "Rincian biaya dapat diperiksa", "Pembayaran diverifikasi sistem/admin"],
    accent: "bg-orange-100 text-orange-800",
  },
  {
    icon: Radar,
    title: "Matching tutor",
    short: "Dimulai setelah pembayaran",
    description: "Sistem mencocokkan mapel, jadwal, mode belajar, dan jangkauan tutor yang sudah diverifikasi.",
    detail: ["Status pencarian terlihat di akun", "Tutor menerima penawaran sesuai kebutuhan", "Jika belum ditemukan, tersedia pilihan lanjut cari atau proses pengembalian sesuai kebijakan"],
    accent: "bg-teal-100 text-teal-800",
  },
  {
    icon: BookOpenCheck,
    title: "Belajar & pantau",
    short: "Materi dan laporan tercatat",
    description: "Sesi berjalan sesuai jadwal. Bab yang dipelajari dan laporan sesi dapat dilihat kembali.",
    detail: ["Jadwal kelas tersimpan", "Progress materi diperbarui per Bab", "Riwayat belajar tetap bisa ditinjau"],
    accent: "bg-sky-100 text-sky-800",
  },
];

export default function HowItWorksSection() {
  const { section } = useWebsiteContent();
  const cms = section("how_it_works");
  const [selected, setSelected] = useState(0);
  const step = steps[selected];
  const Icon = step.icon;

  return (
    <section className="bg-orange-50 py-20 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:gap-14">
          <Reveal direction="right" width="100%">
            <div className="lg:sticky lg:top-40">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-orange-700">{cms?.eyebrow || "Dari kebutuhan sampai kelas pertama"}</p>
              <h2 className="mt-4 text-balance text-3xl font-extrabold tracking-tight text-[#14213D] sm:text-4xl">{cms?.title || "Empat langkah yang jelas, tanpa kejutan di tengah."}</h2>
              <p className="mt-5 max-w-xl text-base leading-8 text-slate-600">{cms?.description || "Harga dan jadwal dipilih lebih dulu. Pencarian tutor dimulai setelah pembayaran terverifikasi."}</p>
              <StudentPackageLink to="/student/packages/new" className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-2xl bg-[#14213D] px-5 text-sm font-extrabold text-white transition hover:bg-slate-800">
                Susun kebutuhan <ArrowRight size={17} />
              </StudentPackageLink>
            </div>
          </Reveal>

          <div>
            <div className="grid gap-3 sm:grid-cols-2" role="tablist" aria-label="Tahapan memesan tutor">
              {steps.map((item, index) => {
                const StepIcon = item.icon;
                const active = selected === index;
                return (
                  <button key={item.title} type="button" role="tab" aria-selected={active} onClick={() => setSelected(index)} className={`group flex min-h-[112px] items-start gap-4 rounded-3xl border p-5 text-left transition ${active ? "border-[#14213D] bg-[#14213D] text-white shadow-[0_16px_35px_rgba(20,33,61,.16)]" : "border-stone-200 bg-white text-[#14213D] hover:-translate-y-0.5 hover:border-orange-300"}`}>
                    <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${active ? "bg-white/[.12] text-orange-300" : item.accent}`}><StepIcon size={20} /></span>
                    <span className="min-w-0">
                      <span className={`text-[10px] font-extrabold uppercase tracking-[.16em] ${active ? "text-orange-300" : "text-slate-400"}`}>Langkah 0{index + 1}</span>
                      <span className="mt-1 block text-base font-extrabold">{item.title}</span>
                      <span className={`mt-1 block text-xs leading-5 ${active ? "text-slate-300" : "text-slate-500"}`}>{item.short}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            <Reveal key={step.title} width="100%">
              <div role="tabpanel" className="mt-4 overflow-hidden rounded-[28px] border border-stone-200 bg-white shadow-sm">
                <div className="grid gap-7 p-6 sm:p-8 md:grid-cols-[auto_1fr]">
                  <span className={`grid h-16 w-16 place-items-center rounded-[22px] ${step.accent}`}><Icon size={28} /></span>
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="text-2xl font-extrabold text-[#14213D]">{step.title}</h3>
                      <span className="rounded-full bg-stone-100 px-3 py-1.5 text-xs font-extrabold text-slate-500">0{selected + 1} / 04</span>
                    </div>
                    <p className="mt-3 leading-7 text-slate-600">{step.description}</p>
                    <ul className="mt-6 grid gap-3 sm:grid-cols-3">
                      {step.detail.map((item) => <li key={item} className="rounded-2xl bg-stone-50 p-4 text-xs font-bold leading-5 text-slate-600"><span className="mb-2 block h-1.5 w-7 rounded-full bg-orange-500" />{item}</li>)}
                    </ul>
                  </div>
                </div>
                {selected === 2 && <div className="border-t border-amber-200 bg-amber-50 px-6 py-4 text-sm font-bold leading-6 text-amber-950 sm:px-8">Transparansi alur: pembayaran dilakukan sebelum matching. Jika tutor belum ditemukan, keputusan berikutnya tidak diambil diam-diam—pilihan yang tersedia ditampilkan kepada murid.</div>}
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
