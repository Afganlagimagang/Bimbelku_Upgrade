import { useState, type ComponentType } from "react";
import { BookOpenCheck, CalendarDays, CheckCircle2, CreditCard, Fingerprint, Radar, ShieldCheck } from "lucide-react";

import Reveal from "@/components/Reveal";
import { useWebsiteContent } from "@/components/WebsiteContentProvider";

type ProofKey = "verification" | "payment" | "matching" | "progress";
type IconType = ComponentType<{ size?: number; className?: string }>;

const proofs: Array<{ key: ProofKey; label: string; icon: IconType; title: string; copy: string }> = [
  { key: "verification", label: "Verifikasi tutor", icon: Fingerprint, title: "Dokumen masuk ke pemeriksaan admin", copy: "Status verifikasi menjadi syarat tutor aktif. Dokumen identitas tidak dibuka ke publik." },
  { key: "payment", label: "Ringkasan biaya", icon: CreditCard, title: "Nominal diperiksa sebelum membayar", copy: "Paket, jumlah sesi, dan komponen biaya muncul sebelum transaksi dikirim untuk verifikasi." },
  { key: "matching", label: "Status matching", icon: Radar, title: "Pencarian tutor punya status yang terbaca", copy: "Murid dapat melihat kapan pencarian berjalan, tutor ditemukan, atau keputusan lanjutan dibutuhkan." },
  { key: "progress", label: "Laporan belajar", icon: BookOpenCheck, title: "Materi tersusun per Bab dan sesi", copy: "Progress tidak disamakan dengan jumlah pertemuan. Bab selesai dan laporan sesi memiliki catatan sendiri." },
];

export default function FeaturesSection() {
  const { section } = useWebsiteContent();
  const cms = section("proof");
  const [active, setActive] = useState<ProofKey>("verification");
  const proof = proofs.find((item) => item.key === active) || proofs[0];

  return (
    <section className="overflow-hidden bg-white py-20 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
        <Reveal width="100%">
          <div className="grid items-end gap-6 lg:grid-cols-[1fr_.75fr]">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-teal-700">{cms?.eyebrow || "Bukti di dalam produk"}</p>
              <h2 className="mt-4 max-w-3xl text-balance text-3xl font-extrabold tracking-tight text-[#14213D] sm:text-4xl">{cms?.title || "Yang dijanjikan di depan, terlihat lagi di dashboard."}</h2>
            </div>
            <p className="text-base leading-8 text-slate-600">{cms?.description || "Lihat bagaimana verifikasi, matching, jadwal, dan laporan bekerja di sistem BimbelKu."}</p>
          </div>
        </Reveal>

        <div className="mt-10 grid overflow-hidden rounded-[32px] border border-slate-800 bg-[#101A31] shadow-[0_28px_70px_rgba(20,33,61,.16)] lg:grid-cols-[.42fr_.58fr]">
          <div className="border-b border-white/10 p-4 lg:border-b-0 lg:border-r lg:p-6" role="tablist" aria-label="Bukti sistem">
            {proofs.map((item, index) => {
              const Icon = item.icon;
              const selected = item.key === active;
              return <button key={item.key} type="button" role="tab" aria-selected={selected} onClick={() => setActive(item.key)} className={`flex w-full items-center gap-3 rounded-2xl px-4 py-4 text-left transition ${selected ? "bg-white text-[#14213D]" : "text-slate-300 hover:bg-white/[.07] hover:text-white"}`}><span className={`grid h-10 w-10 place-items-center rounded-xl ${selected ? "bg-orange-100 text-orange-700" : "bg-white/[.08] text-orange-300"}`}><Icon size={19} /></span><span><span className="block text-[10px] font-extrabold uppercase tracking-[.14em] opacity-55">Bukti 0{index + 1}</span><span className="mt-0.5 block text-sm font-extrabold">{item.label}</span></span></button>;
            })}
          </div>

          <div className="relative min-h-[450px] overflow-hidden bg-[#16243F] p-5 sm:p-8 lg:p-10">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full border border-orange-300/15" aria-hidden="true" />
            <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full border border-dashed border-orange-300/25" aria-hidden="true" />
            <Reveal key={proof.key} width="100%">
              <div className="relative">
                <p className="text-xs font-extrabold uppercase tracking-[.16em] text-orange-300">Contoh tampilan sistem</p>
                <h3 className="mt-3 max-w-xl text-2xl font-extrabold text-white sm:text-3xl">{proof.title}</h3>
                <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300">{proof.copy}</p>
                <ProofPanel type={proof.key} />
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProofPanel({ type }: { type: ProofKey }) {
  if (type === "verification") return (
    <div className="mt-8 rounded-3xl bg-white p-5 text-[#14213D] shadow-xl sm:p-6">
      <div className="flex items-center justify-between gap-4"><div><p className="text-xs font-bold text-slate-400">Status profil tutor</p><p className="mt-1 text-lg font-extrabold">Pemeriksaan selesai</p></div><span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-100 text-emerald-700"><ShieldCheck size={23} /></span></div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">{["Identitas diperiksa", "Kualifikasi diperiksa", "Status akun aktif"].map((item) => <p key={item} className="flex items-center gap-2 rounded-xl bg-stone-50 p-3 text-xs font-bold text-slate-600"><CheckCircle2 size={15} className="text-emerald-600" />{item}</p>)}</div>
    </div>
  );
  if (type === "payment") return (
    <div className="mt-8 rounded-3xl bg-white p-5 text-[#14213D] shadow-xl sm:p-6">
      <div className="flex items-center justify-between gap-3 border-b border-stone-100 pb-4"><p className="font-extrabold">Ringkasan pesanan</p><span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-extrabold text-amber-800">Belum dibayar</span></div>
      <dl className="mt-4 space-y-3 text-sm"><div className="flex justify-between"><dt className="text-slate-500">Paket</dt><dd className="font-bold">4 sesi · 1 mapel</dd></div><div className="flex justify-between"><dt className="text-slate-500">Mode</dt><dd className="font-bold">Online</dd></div><div className="flex justify-between border-t border-stone-100 pt-3"><dt className="font-extrabold">Total</dt><dd className="font-extrabold text-orange-700">Terlihat sebelum lanjut</dd></div></dl>
    </div>
  );
  if (type === "matching") return (
    <div className="mt-8 rounded-3xl bg-white p-5 text-[#14213D] shadow-xl sm:p-6">
      <div className="flex gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-teal-100 text-teal-800"><Radar size={23} /></span><div><p className="text-xs font-bold text-slate-400">Pencarian tutor</p><p className="mt-1 text-lg font-extrabold">Mencocokkan jadwal</p><p className="mt-1 text-xs text-slate-500">Matematika · Selasa & Kamis · Online</p></div></div>
      <div className="mt-5 h-2 overflow-hidden rounded-full bg-stone-100"><div className="proof-loading-bar h-full w-2/3 rounded-full bg-gradient-to-r from-teal-600 to-orange-500" /></div>
      <p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs font-bold leading-5 text-amber-950">Bila tutor belum ditemukan, akun akan menampilkan pilihan tindakan berikutnya.</p>
    </div>
  );
  return (
    <div className="mt-8 rounded-3xl bg-white p-5 text-[#14213D] shadow-xl sm:p-6">
      <div className="flex items-center justify-between"><div><p className="text-xs font-bold text-slate-400">Bab aktif</p><p className="mt-1 text-lg font-extrabold">Persamaan linear</p></div><span className="text-2xl font-extrabold text-orange-700">67%</span></div>
      <div className="mt-5 h-2 overflow-hidden rounded-full bg-stone-100"><div className="h-full w-2/3 rounded-full bg-gradient-to-r from-orange-600 to-amber-400" /></div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2"><p className="flex items-center gap-2 rounded-xl bg-stone-50 p-3 text-xs font-bold text-slate-600"><CalendarDays size={16} className="text-teal-700" />Sesi berikutnya terjadwal</p><p className="flex items-center gap-2 rounded-xl bg-stone-50 p-3 text-xs font-bold text-slate-600"><BookOpenCheck size={16} className="text-orange-700" />Laporan sesi tersedia</p></div>
    </div>
  );
}
