import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CalendarRange, CheckCircle2, Layers3, Loader2, ReceiptText, Sparkles } from "lucide-react";

import Reveal from "@/components/Reveal";
import StudentPackageLink from "@/components/StudentPackageLink";
import { useWebsiteContent } from "@/components/WebsiteContentProvider";
import { getCached } from "@/lib/http";

type PackagePlan = {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  session_count: number;
  validity_days: number;
  maximum_subjects: number;
  sort_order: number;
};

const safePreviewPlans: PackagePlan[] = [
  { id: -1, name: "Coba Belajar", slug: "coba-belajar", description: "Mulai dengan ritme yang ringan.", session_count: 1, validity_days: 7, maximum_subjects: 1, sort_order: 10 },
  { id: -2, name: "Bulanan Dasar", slug: "bulanan-dasar", description: "Fokus rutin untuk satu mata pelajaran.", session_count: 4, validity_days: 30, maximum_subjects: 1, sort_order: 20 },
  { id: -3, name: "Bulanan Reguler", slug: "bulanan-reguler", description: "Ritme belajar lebih intensif.", session_count: 8, validity_days: 30, maximum_subjects: 2, sort_order: 30 },
  { id: -4, name: "Bulanan Intensif", slug: "bulanan-intensif", description: "Untuk target belajar yang lebih padat.", session_count: 12, validity_days: 30, maximum_subjects: 3, sort_order: 40 },
];

export default function PackagePreviewSection() {
  const { section } = useWebsiteContent();
  const cms = section("pricing");
  const [plans, setPlans] = useState<PackagePlan[]>(safePreviewPlans);
  const [activeId, setActiveId] = useState<number>(safePreviewPlans[1].id);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    void getCached<PackagePlan[]>("/package-plans", { maxAgeMs: 60_000, force: true })
      .then((response) => {
        if (!mounted || !Array.isArray(response.data) || response.data.length === 0) return;
        const values = response.data.slice(0, 6);
        setPlans(values);
        setActiveId(values[Math.min(1, values.length - 1)].id);
      })
      .catch(() => undefined)
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  const active = useMemo(() => plans.find((plan) => plan.id === activeId) || plans[0], [activeId, plans]);
  if (!active) return null;

  return (
    <section className="bg-white py-20 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
        <Reveal width="100%">
          <div className="grid items-end gap-6 lg:grid-cols-[1fr_.7fr]">
            <div><p className="text-xs font-extrabold uppercase tracking-[.18em] text-orange-700">{cms?.eyebrow || "Paket belajar"}</p><h2 className="mt-4 max-w-3xl text-balance text-3xl font-extrabold tracking-tight text-[#14213D] sm:text-4xl">{cms?.title || "Pilih ritme belajar, lalu lihat harga finalnya."}</h2></div>
            <p className="text-base leading-8 text-slate-600">{cms?.description || "Jumlah sesi dan masa aktif berasal dari paket yang benar-benar tersedia di sistem."}</p>
          </div>
        </Reveal>

        <div className="mt-10 grid gap-5 lg:grid-cols-[.44fr_.56fr]">
          <div className="grid gap-3" role="tablist" aria-label="Pilih paket belajar">
            {plans.map((plan, index) => {
              const selected = plan.id === active.id;
              return (
                <button key={plan.id} type="button" role="tab" aria-selected={selected} onClick={() => setActiveId(plan.id)} className={`group flex items-center justify-between gap-4 rounded-3xl border p-5 text-left transition ${selected ? "border-orange-400 bg-orange-50 shadow-md" : "border-stone-200 bg-white hover:-translate-y-0.5 hover:border-orange-200"}`}>
                  <span className="flex items-center gap-4"><span className={`grid h-11 w-11 place-items-center rounded-2xl text-sm font-extrabold ${selected ? "bg-orange-600 text-white" : "bg-stone-100 text-slate-500"}`}>0{index + 1}</span><span><span className="block font-extrabold text-[#14213D]">{plan.name}</span><span className="mt-1 block text-xs font-semibold text-slate-500">{plan.session_count} sesi · {plan.validity_days} hari</span></span></span>
                  {selected && <CheckCircle2 size={20} className="shrink-0 text-orange-700" />}
                </button>
              );
            })}
            {loading && <p className="flex items-center gap-2 px-3 text-xs font-bold text-slate-400"><Loader2 size={14} className="animate-spin motion-reduce:animate-none" />Menyelaraskan paket dari sistem...</p>}
          </div>

          <Reveal key={active.id} direction="left" width="100%">
            <div className="relative h-full min-h-[430px] overflow-hidden rounded-[34px] bg-[#14213D] p-7 text-white shadow-[0_26px_65px_rgba(20,33,61,.18)] sm:p-10">
              <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border border-orange-300/20" aria-hidden="true" />
              <div className="absolute -right-9 -top-9 h-40 w-40 rounded-full border border-dashed border-orange-300/30" aria-hidden="true" />
              <div className="relative flex h-full flex-col">
                <div className="flex items-start justify-between gap-4">
                  <div><p className="text-xs font-extrabold uppercase tracking-[.16em] text-orange-300">Paket dipilih</p><h3 className="mt-3 text-3xl font-extrabold">{active.name}</h3><p className="mt-3 max-w-lg text-sm leading-7 text-slate-300">{active.description || "Paket belajar yang dapat disesuaikan dengan kebutuhanmu."}</p></div>
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/10 text-orange-300"><Sparkles size={21} /></span>
                </div>
                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  <Metric icon={Layers3} value={`${active.session_count} sesi`} label="Jumlah pertemuan" />
                  <Metric icon={CalendarRange} value={`${active.validity_days} hari`} label="Masa aktif" />
                  <Metric icon={ReceiptText} value={active.maximum_subjects === 1 ? "1 mapel" : `${active.maximum_subjects} mapel`} label="Batas mata pelajaran" />
                </div>
                <div className="mt-auto pt-8">
                  <div className="rounded-2xl border border-white/10 bg-white/[.07] p-4 text-xs font-bold leading-6 text-slate-200">Harga belum ditebak di landing page. Total final baru dihitung setelah mata pelajaran, mode, durasi, dan kebutuhanmu dipilih.</div>
                  <StudentPackageLink to={`/student/packages/new?package_plan_id=${active.id > 0 ? active.id : ""}`} className="mt-4 inline-flex h-14 w-full shrink-0 items-center justify-center gap-2 rounded-2xl bg-orange-600 px-5 text-sm font-extrabold text-white transition hover:bg-orange-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#14213D]">Susun paket ini <ArrowRight size={17} /></StudentPackageLink>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function Metric({ icon: Icon, value, label }: { icon: typeof Layers3; value: string; label: string }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[.07] p-4"><Icon size={18} className="text-orange-300" /><p className="mt-4 text-lg font-extrabold">{value}</p><p className="mt-1 text-[11px] font-semibold text-slate-400">{label}</p></div>;
}
