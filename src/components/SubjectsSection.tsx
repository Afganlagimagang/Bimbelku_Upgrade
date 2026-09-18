import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Atom, BookOpenText, Calculator, ChartNoAxesCombined, ChevronDown, Dna, FlaskConical, Languages, Loader2, Map, Microscope, RefreshCw, Search, Shapes, type LucideIcon } from "lucide-react";

import { Link } from "react-router-dom";

import Reveal from "@/components/Reveal";
import StudentPackageLink from "@/components/StudentPackageLink";
import { useWebsiteContent } from "@/components/WebsiteContentProvider";
import { programPath } from "@/lib/publicPrograms";
import { getCached } from "@/lib/http";

type LandingSubject = { id: number; name: string; group_name?: string; education_levels?: string[] };
type SubjectVisual = { icon: LucideIcon; subtitle: string; iconClass: string };

const subjectVisuals: Record<string, SubjectVisual> = {
  Matematika: { icon: Calculator, subtitle: "Konsep, latihan, dan pemecahan masalah", iconClass: "bg-indigo-50 text-indigo-700" },
  "Bahasa Inggris": { icon: Languages, subtitle: "Tata bahasa, kosakata, dan komunikasi", iconClass: "bg-sky-50 text-sky-700" },
  Fisika: { icon: Atom, subtitle: "Konsep, rumus, gaya, dan energi", iconClass: "bg-orange-50 text-orange-700" },
  Kimia: { icon: FlaskConical, subtitle: "Materi, perhitungan, dan reaksi kimia", iconClass: "bg-fuchsia-50 text-fuchsia-700" },
  Biologi: { icon: Dna, subtitle: "Makhluk hidup, tubuh, dan lingkungan", iconClass: "bg-emerald-50 text-emerald-700" },
  "Bahasa Indonesia": { icon: BookOpenText, subtitle: "Pemahaman teks, bahasa, dan literasi", iconClass: "bg-rose-50 text-rose-700" },
  Ekonomi: { icon: ChartNoAxesCombined, subtitle: "Konsep ekonomi dan analisis", iconClass: "bg-cyan-50 text-cyan-700" },
  Akuntansi: { icon: Shapes, subtitle: "Pencatatan dan laporan keuangan", iconClass: "bg-slate-100 text-slate-700" },
  IPA: { icon: Microscope, subtitle: "Sains terpadu dan latihan konsep", iconClass: "bg-teal-50 text-teal-700" },
  IPAS: { icon: Microscope, subtitle: "Sains dan sosial untuk jenjang dasar", iconClass: "bg-teal-50 text-teal-700" },
  IPS: { icon: Map, subtitle: "Masyarakat, ruang, dan ekonomi", iconClass: "bg-amber-50 text-amber-700" },
};

const fallbackVisual: SubjectVisual = { icon: BookOpenText, subtitle: "Belajar sesuai materi yang dibutuhkan", iconClass: "bg-orange-50 text-orange-700" };
const levels = ["SD", "SMP", "SMA"];
const categories = [
  { key: "all", label: "Semua kategori" },
  { key: "favorite", label: "Paling dicari" },
  { key: "science", label: "Sains" },
  { key: "language", label: "Bahasa" },
  { key: "social", label: "Sosial & bisnis" },
  { key: "creative", label: "Seni & teknologi" },
] as const;

type CategoryKey = (typeof categories)[number]["key"];

const favoriteSubjects = new Set(["Matematika", "Bahasa Indonesia", "Bahasa Inggris", "Fisika", "Kimia", "Biologi"]);

const inCategory = (subject: LandingSubject, category: CategoryKey) => {
  if (category === "all") return true;
  if (category === "favorite") return favoriteSubjects.has(subject.name);
  const value = `${subject.name} ${subject.group_name || ""}`.toLocaleLowerCase("id-ID");
  if (category === "science") return /(ipa|sains|fisika|kimia|biologi|matematika)/.test(value);
  if (category === "language") return /(bahasa|inggris|jepang|mandarin|arab|literasi)/.test(value);
  if (category === "social") return /(ips|sosial|ekonomi|akuntansi|bisnis|geografi|sejarah|sosiologi)/.test(value);
  return /(seni|musik|teknologi|informatika|prakarya|keterampilan)/.test(value);
};

export default function SubjectsSection() {
  const { section } = useWebsiteContent();
  const programs = section("programs");
  const [subjects, setSubjects] = useState<LandingSubject[]>([]);
  const [level, setLevel] = useState("SD");
  const [category, setCategory] = useState<CategoryKey>("all");
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const mounted = useRef(true);

  const loadSubjects = useCallback((force = false) => {
    setLoading(true);
    setFailed(false);
    void getCached<{ landing_subjects?: LandingSubject[] }>("/learning-catalog", { params: { compact: 1 }, maxAgeMs: 5 * 60_000, force })
      .then((response) => {
        if (!mounted.current) return;
        setSubjects((response.data.landing_subjects || []).filter((item) => Number.isInteger(item.id) && item.id > 0 && item.name?.trim()).slice(0, 24));
      })
      .catch(() => mounted.current && setFailed(true))
      .finally(() => mounted.current && setLoading(false));
  }, []);

  useEffect(() => {
    mounted.current = true;
    loadSubjects();
    const receiveSearch = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail;
      if (typeof detail === "string") {
        setQuery(detail);
        setShowAll(false);
      }
    };
    window.addEventListener("bimbelku:program-search", receiveSearch);
    return () => {
      mounted.current = false;
      window.removeEventListener("bimbelku:program-search", receiveSearch);
    };
  }, [loadSubjects]);

  const filteredSubjects = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("id-ID");
    return subjects.filter((item) => {
      const supportsLevel = !item.education_levels?.length || item.education_levels.includes(level);
      return supportsLevel && inCategory(item, category) && (!normalized || item.name.toLocaleLowerCase("id-ID").includes(normalized));
    });
  }, [category, level, query, subjects]);
  const visibleSubjects = showAll ? filteredSubjects : filteredSubjects.slice(0, 12);

  return (
    <section className="bg-[#FFFBF7] py-20 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
        <div className="grid items-end gap-8 lg:grid-cols-[1fr_.8fr]">
          <Reveal>
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-orange-700">{programs?.eyebrow || "Program unggulan"}</p>
            <h2 className="mt-3 max-w-2xl text-balance text-3xl font-extrabold tracking-tight text-[#14213D] sm:text-4xl">{programs?.title || "Program yang paling dibutuhkan siswa."}</h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">{programs?.description || "Cari mata pelajaran berdasarkan jenjang, lalu lanjutkan kebutuhanmu ke penyusunan paket."}</p>
          </Reveal>
          <Reveal width="100%" delay={0.08}>
            <label className="block">
              <span className="sr-only">Cari mata pelajaran</span>
              <span className="flex min-h-14 items-center gap-3 rounded-2xl border border-stone-300 bg-white px-4 shadow-sm focus-within:border-orange-500 focus-within:ring-4 focus-within:ring-orange-100">
                <Search className="shrink-0 text-slate-400" size={20} aria-hidden="true" />
                <input value={query} onChange={(event) => { setQuery(event.target.value); setShowAll(false); }} placeholder={programs?.content?.search_placeholder || "Cari Matematika, Bahasa Inggris, Fisika..."} className="h-12 min-w-0 flex-1 bg-transparent text-base font-semibold text-[#14213D] outline-none placeholder:text-slate-400" />
              </span>
            </label>
          </Reveal>
        </div>

        <div className="mt-9 rounded-3xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-extrabold uppercase tracking-[.15em] text-slate-500">Kategori program</p>
            <p className="text-xs font-bold text-slate-500">{filteredSubjects.length} pilihan sesuai filter</p>
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Pilih kategori program">
            {categories.map((item) => <button key={item.key} type="button" onClick={() => { setCategory(item.key); setShowAll(false); }} aria-pressed={category === item.key} className={`shrink-0 rounded-full border px-4 py-2.5 text-sm font-extrabold transition ${category === item.key ? "border-[#147D7E] bg-[#147D7E] text-white" : "border-stone-200 bg-stone-50 text-slate-600 hover:border-teal-300"}`}>{item.label}</button>)}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-stone-100 pt-4" role="group" aria-label="Pilih jenjang">
            <span className="mr-2 text-xs font-extrabold text-slate-500">Jenjang</span>
            {levels.map((item) => <button key={item} type="button" onClick={() => { setLevel(item); setShowAll(false); }} aria-pressed={level === item} className={`min-h-10 rounded-xl px-4 text-sm font-extrabold transition ${level === item ? "bg-[#14213D] text-white" : "border border-stone-300 bg-white text-slate-700 hover:border-orange-300"}`}>{item}</button>)}
          </div>
        </div>

        <div className="mt-7">
          {loading ? (
            <div className="grid min-h-56 place-items-center rounded-3xl border border-stone-200 bg-white"><span className="inline-flex items-center gap-2 text-sm font-bold text-slate-500"><Loader2 className="animate-spin" size={18} />Memuat program...</span></div>
          ) : failed ? (
            <div className="grid min-h-56 place-items-center rounded-3xl border border-stone-200 bg-white px-6 text-center"><div><p className="font-extrabold text-[#14213D]">Daftar program belum dapat dimuat.</p><button type="button" onClick={() => loadSubjects(true)} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#C2410C] px-4 text-sm font-bold text-white"><RefreshCw size={17} />Coba lagi</button></div></div>
          ) : filteredSubjects.length === 0 ? (
            <div className="grid min-h-56 place-items-center rounded-3xl border border-stone-200 bg-white px-6 text-center"><div><p className="font-extrabold text-[#14213D]">Program yang dicari belum tersedia untuk {level}.</p><p className="mt-2 text-sm text-slate-500">Coba kata lain atau pilih jenjang berbeda.</p></div></div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {visibleSubjects.map((subject, index) => {
                const visual = subjectVisuals[subject.name] || fallbackVisual;
                const Icon = visual.icon;
                const detailHref = programPath(subject, level);
                const href = `/student/packages/new?subject_name=${encodeURIComponent(subject.name)}&education_level=${encodeURIComponent(level)}`;
                return (
                  <Reveal key={subject.id} delay={index * 0.055} width="100%" className={`h-full min-w-0 ${index === 0 ? "lg:col-span-2" : ""}`}>
                    <article className="group flex h-full min-h-[190px] min-w-0 overflow-hidden flex-col rounded-3xl border border-stone-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-orange-300 hover:shadow-lg">
                      <div className="flex items-start justify-between gap-4"><span className={`grid h-12 w-12 place-items-center rounded-2xl ${visual.iconClass}`}><Icon size={23} aria-hidden="true" /></span><span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-bold text-slate-600">{level}</span></div>
                      <h3 className="mt-5 text-lg font-extrabold text-[#14213D]">{subject.name}</h3>
                      <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{visual.subtitle}</p>
                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        <Link to={detailHref} className="inline-flex items-center gap-2 text-sm font-extrabold text-[#14213D]">Lihat detail <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></Link>
                        <StudentPackageLink to={href} className="text-sm font-extrabold text-orange-700 hover:text-orange-900">Susun paket</StudentPackageLink>
                      </div>
                    </article>
                  </Reveal>
                );
              })}
            </div>
          )}
        </div>

        {!loading && !failed && filteredSubjects.length > 12 && (
          <div className="mt-8 flex justify-center">
            <Link to={`/program?level=${encodeURIComponent(level)}&category=${encodeURIComponent(category)}`} className="inline-flex min-h-12 items-center gap-2 rounded-2xl border border-[#14213D] bg-white px-6 text-sm font-extrabold text-[#14213D] transition hover:bg-[#14213D] hover:text-white">
              Lihat lebih banyak <ArrowRight size={17} />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
