import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BookOpenCheck, Loader2, RefreshCw, Search } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import PublicWhatsappButton from "@/components/PublicWhatsappButton";
import StudentPackageLink from "@/components/StudentPackageLink";
import { getCached } from "@/lib/http";
import {
  type CatalogSubject,
  type PublicProgramCategory,
  isProgramInCategory,
  packagePath,
  programPath,
  programSummary,
  publicProgramCategories,
  supportedLevels,
} from "@/lib/publicPrograms";
import { useWebsiteContent } from "@/components/WebsiteContentProvider";

const validLevels = ["Semua", "SD", "SMP", "SMA"] as const;

export default function ProgramCatalog() {
  const { settings } = useWebsiteContent();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedLevel = searchParams.get("level") || "Semua";
  const requestedCategory = searchParams.get("category") || "all";
  const [subjects, setSubjects] = useState<CatalogSubject[]>([]);
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [level, setLevel] = useState<(typeof validLevels)[number]>(
    validLevels.includes(requestedLevel as (typeof validLevels)[number]) ? requestedLevel as (typeof validLevels)[number] : "Semua",
  );
  const [category, setCategory] = useState<PublicProgramCategory>(
    publicProgramCategories.some((item) => item.key === requestedCategory) ? requestedCategory as PublicProgramCategory : "all",
  );
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = (force = false) => {
    setLoading(true);
    setFailed(false);
    void getCached<{ subject_options?: CatalogSubject[] }>("/learning-catalog", {
      params: { compact: 1 },
      maxAgeMs: 5 * 60_000,
      force,
    }).then((response) => {
      const values = (response.data.subject_options || [])
        .filter((item) => Number.isInteger(item.id) && item.id > 0 && item.name?.trim())
        .sort((left, right) => left.name.localeCompare(right.name, "id-ID"));
      setSubjects(values);
    }).catch(() => setFailed(true)).finally(() => setLoading(false));
  };

  useEffect(() => {
    document.title = `Semua Program | ${settings.brand_name}`;
  }, [settings.brand_name]);

  useEffect(() => load(), []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (level !== "Semua") params.set("level", level);
    if (category !== "all") params.set("category", category);
    if (query.trim()) params.set("q", query.trim());
    setSearchParams(params, { replace: true });
  }, [category, level, query, setSearchParams]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("id-ID");
    return subjects.filter((subject) => {
      const matchesLevel = level === "Semua" || supportedLevels(subject).includes(level);
      const matchesQuery = !normalized || `${subject.name} ${subject.group_name || ""}`.toLocaleLowerCase("id-ID").includes(normalized);
      return matchesLevel && matchesQuery && isProgramInCategory(subject, category);
    });
  }, [category, level, query, subjects]);

  return (
    <div className="public-site min-h-screen bg-[#FFFBF7]">
      <Navbar />
      <main>
        <section className="border-b border-stone-200 bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
            <nav aria-label="Breadcrumb" className="text-sm font-bold text-slate-500"><Link to="/" className="hover:text-orange-700">Beranda</Link><span aria-hidden="true"> / </span><span className="text-[#14213D]">Semua Program</span></nav>
            <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_.8fr] lg:items-end">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-wider text-orange-700">Katalog BimbelKu</p>
                <h1 className="mt-3 max-w-3xl text-4xl font-extrabold tracking-tight text-[#14213D] sm:text-5xl">Cari program yang sesuai dengan jenjang dan kebutuhan belajar.</h1>
                <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600">Seluruh pilihan di halaman ini berasal dari mata pelajaran yang aktif di sistem. Buka detailnya dahulu atau langsung bawa pilihanmu ke penyusunan paket.</p>
              </div>
              <label className="flex min-h-14 items-center gap-3 rounded-2xl border border-stone-300 bg-[#FFFBF7] px-4 focus-within:border-orange-500 focus-within:ring-4 focus-within:ring-orange-100">
                <Search size={20} className="shrink-0 text-slate-400" aria-hidden="true" />
                <span className="sr-only">Cari program</span>
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari Matematika, Fisika, Bahasa..." className="h-12 min-w-0 flex-1 bg-transparent text-base font-semibold text-[#14213D] outline-none placeholder:text-slate-400" />
              </label>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
            <div className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex flex-wrap gap-2" role="group" aria-label="Filter jenjang">
                {validLevels.map((item) => <button key={item} type="button" aria-pressed={level === item} onClick={() => setLevel(item)} className={`min-h-10 rounded-xl px-4 text-sm font-extrabold transition ${level === item ? "bg-[#14213D] text-white" : "border border-stone-200 text-slate-600 hover:border-orange-300"}`}>{item}</button>)}
              </div>
              <div className="mt-4 flex gap-2 overflow-x-auto border-t border-stone-100 pt-4" role="group" aria-label="Filter kategori">
                {publicProgramCategories.map((item) => <button key={item.key} type="button" aria-pressed={category === item.key} onClick={() => setCategory(item.key)} className={`shrink-0 rounded-full border px-4 py-2.5 text-sm font-extrabold transition ${category === item.key ? "border-[#147D7E] bg-[#147D7E] text-white" : "border-stone-200 bg-stone-50 text-slate-600 hover:border-teal-300"}`}>{item.label}</button>)}
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between gap-4"><h2 className="text-2xl font-extrabold text-[#14213D]">Program tersedia</h2><p className="text-sm font-bold text-slate-500">{filtered.length} program</p></div>

            {loading ? (
              <div className="mt-6 grid min-h-64 place-items-center rounded-3xl border border-stone-200 bg-white"><span className="inline-flex items-center gap-2 text-sm font-bold text-slate-500"><Loader2 className="animate-spin" size={18} />Memuat katalog...</span></div>
            ) : failed ? (
              <div className="mt-6 grid min-h-64 place-items-center rounded-3xl border border-stone-200 bg-white px-6 text-center"><div><p className="font-extrabold text-[#14213D]">Katalog belum dapat dimuat.</p><button type="button" onClick={() => load(true)} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#C2410C] px-4 text-sm font-bold text-white"><RefreshCw size={17} />Coba lagi</button></div></div>
            ) : filtered.length === 0 ? (
              <div className="mt-6 grid min-h-64 place-items-center rounded-3xl border border-stone-200 bg-white px-6 text-center"><div><BookOpenCheck size={36} className="mx-auto text-orange-600" /><p className="mt-4 font-extrabold text-[#14213D]">Belum ada program yang cocok.</p><p className="mt-2 text-sm text-slate-500">Ubah jenjang, kategori, atau kata pencarian.</p></div></div>
            ) : (
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((subject) => {
                  const levels = supportedLevels(subject);
                  const selectedLevel = level === "Semua" ? levels[0] : level;
                  return (
                    <article key={subject.id} className="flex min-h-64 flex-col rounded-3xl border border-stone-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-orange-300 hover:shadow-md">
                      <div className="flex items-start justify-between gap-4"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-50 text-orange-700"><BookOpenCheck size={23} /></span><span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-bold text-slate-600">{levels.join(" · ")}</span></div>
                      <h3 className="mt-5 text-xl font-extrabold text-[#14213D]">{subject.name}</h3>
                      <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{programSummary(subject)}</p>
                      <div className="mt-5 flex flex-wrap items-center gap-3">
                        <Link to={programPath(subject, selectedLevel)} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#14213D] px-4 text-sm font-extrabold text-white">Lihat detail <ArrowRight size={15} /></Link>
                        <StudentPackageLink to={packagePath(subject, selectedLevel)} className="text-sm font-extrabold text-orange-700 hover:text-orange-900">Susun paket</StudentPackageLink>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
      <PublicWhatsappButton />
    </div>
  );
}
