import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpenCheck, CalendarRange, CheckCircle2, CreditCard, GraduationCap, Laptop2, Loader2, MessageCircle, Radar, RefreshCw, ShieldCheck } from "lucide-react";
import { Link, useParams, useSearchParams } from "react-router-dom";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import PublicWhatsappButton from "@/components/PublicWhatsappButton";
import StudentPackageLink from "@/components/StudentPackageLink";
import { useWebsiteContent } from "@/components/WebsiteContentProvider";
import { getCached } from "@/lib/http";
import { type CatalogSubject, packagePath, programPath, programSlug, programSummary, supportedLevels } from "@/lib/publicPrograms";
import { whatsappHref } from "@/lib/websiteContent";

type CurriculumChapter = {
  id: number;
  subject_id: number;
  subject_name: string;
  education_level: string;
  grade: string;
  title: string;
  sort_order: number;
};

type PackagePlan = {
  id: number;
  name: string;
  session_count: number;
  validity_days: number;
  maximum_subjects: number;
};

export default function ProgramDetail() {
  const { slug = "" } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { settings } = useWebsiteContent();
  const [subjects, setSubjects] = useState<CatalogSubject[]>([]);
  const [plans, setPlans] = useState<PackagePlan[]>([]);
  const [chapters, setChapters] = useState<CurriculumChapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [chapterLoading, setChapterLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const program = useMemo(() => subjects.find((subject) => programSlug(subject.name) === slug), [slug, subjects]);
  const levels = program ? supportedLevels(program) : [];
  const requestedLevel = searchParams.get("level") || "";
  const selectedLevel = levels.includes(requestedLevel) ? requestedLevel : levels[0] || "";

  const load = (force = false) => {
    setLoading(true);
    setFailed(false);
    void Promise.all([
      getCached<{ subject_options?: CatalogSubject[] }>("/learning-catalog", { params: { compact: 1 }, maxAgeMs: 5 * 60_000, force }),
      getCached<PackagePlan[]>("/package-plans", { maxAgeMs: 5 * 60_000, force }),
    ]).then(([catalogResponse, plansResponse]) => {
      setSubjects((catalogResponse.data.subject_options || []).filter((item) => Number.isInteger(item.id) && item.id > 0 && item.name?.trim()));
      setPlans(Array.isArray(plansResponse.data) ? plansResponse.data.slice(0, 4) : []);
    }).catch(() => setFailed(true)).finally(() => setLoading(false));
  };

  useEffect(() => load(), []);

  useEffect(() => {
    if (!program || !selectedLevel) return;
    setChapterLoading(true);
    void getCached<{ chapters?: CurriculumChapter[] }>("/learning-catalog", {
      params: { curriculum_subject_id: program.id, subject_name: program.name, education_level: selectedLevel },
      maxAgeMs: 5 * 60_000,
    }).then((response) => setChapters(response.data.chapters || []))
      .catch(() => setChapters([]))
      .finally(() => setChapterLoading(false));
  }, [program, selectedLevel]);

  useEffect(() => {
    document.title = program ? `Les ${program.name} ${selectedLevel} | ${settings.brand_name}` : `Program | ${settings.brand_name}`;
  }, [program, selectedLevel, settings.brand_name]);

  const related = useMemo(() => {
    if (!program) return [];
    return subjects.filter((subject) => subject.id !== program.id && supportedLevels(subject).includes(selectedLevel)).slice(0, 3);
  }, [program, selectedLevel, subjects]);

  const chooseLevel = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("level", value);
    setSearchParams(params, { replace: true });
  };

  if (loading) {
    return <div className="public-site min-h-screen bg-[#FFFBF7]"><Navbar /><main className="grid min-h-80 place-items-center"><span className="inline-flex items-center gap-2 text-sm font-bold text-slate-500"><Loader2 className="animate-spin" size={18} />Memuat detail program...</span></main><Footer /></div>;
  }

  if (failed) {
    return <div className="public-site min-h-screen bg-[#FFFBF7]"><Navbar /><main className="grid min-h-80 place-items-center px-5 text-center"><div><p className="text-xl font-extrabold text-[#14213D]">Detail program belum dapat dimuat.</p><button type="button" onClick={() => load(true)} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#C2410C] px-5 text-sm font-bold text-white"><RefreshCw size={17} />Coba lagi</button></div></main><Footer /></div>;
  }

  if (!program) {
    return <div className="public-site min-h-screen bg-[#FFFBF7]"><Navbar /><main className="mx-auto grid min-h-80 max-w-2xl place-items-center px-5 text-center"><div><BookOpenCheck size={42} className="mx-auto text-orange-600" /><h1 className="mt-5 text-3xl font-extrabold text-[#14213D]">Program tidak ditemukan</h1><p className="mt-3 leading-7 text-slate-600">Program mungkin sudah tidak aktif atau alamatnya berubah.</p><Link to="/program" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#14213D] px-5 text-sm font-extrabold text-white"><ArrowLeft size={17} />Kembali ke katalog</Link></div></main><Footer /></div>;
  }

  const builderUrl = packagePath(program, selectedLevel);
  const consultationMessage = `Halo ${settings.brand_name}, saya ingin berkonsultasi mengenai Les ${program.name} ${selectedLevel} di Yogyakarta.`;
  const consultationUrl = settings.whatsapp_enabled ? whatsappHref(settings.whatsapp_number, consultationMessage) : null;

  return (
    <div className="public-site min-h-screen bg-white">
      <Navbar />
      <main>
        <section className="bg-[#F7F1E8] py-16 sm:py-20">
          <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
            <nav aria-label="Breadcrumb" className="text-sm font-bold text-slate-500"><Link to="/" className="hover:text-orange-700">Beranda</Link><span aria-hidden="true"> / </span><Link to="/program" className="hover:text-orange-700">Program</Link><span aria-hidden="true"> / </span><span className="text-[#14213D]">{program.name}</span></nav>
            <div className="mt-9 grid gap-10 lg:grid-cols-2 lg:items-center">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-wider text-orange-700">Program {selectedLevel}</p>
                <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-[#14213D] sm:text-5xl">Les {program.name} untuk {selectedLevel}</h1>
                <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">{programSummary(program)} Materi, jadwal, mode belajar, dan harga final dipilih di dalam penyusunan paket.</p>
                <div className="mt-7 flex flex-wrap gap-2" role="group" aria-label="Pilih jenjang program">
                  {levels.map((level) => <button key={level} type="button" onClick={() => chooseLevel(level)} aria-pressed={selectedLevel === level} className={`min-h-10 rounded-xl px-4 text-sm font-extrabold ${selectedLevel === level ? "bg-[#14213D] text-white" : "border border-stone-300 bg-white text-slate-700"}`}>{level}</button>)}
                </div>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <StudentPackageLink to={builderUrl} className="inline-flex min-h-13 items-center justify-center gap-2 rounded-2xl bg-[#C2410C] px-6 py-3 text-sm font-extrabold text-white hover:bg-[#9A3412]">Susun Paket <ArrowRight size={18} /></StudentPackageLink>
                  {consultationUrl && <a href={consultationUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-13 items-center justify-center gap-2 rounded-2xl border border-stone-300 bg-white px-6 py-3 text-sm font-extrabold text-[#14213D] hover:border-orange-300"><MessageCircle size={18} />Konsultasi WhatsApp</a>}
                </div>
              </div>
              <aside className="rounded-3xl bg-[#14213D] p-6 text-white shadow-xl sm:p-8">
                <p className="text-xs font-extrabold uppercase tracking-wider text-orange-300">Sebelum memesan</p>
                <ul className="mt-5 space-y-4 text-sm leading-6 text-slate-200">
                  <li className="flex gap-3"><CheckCircle2 size={19} className="mt-0.5 shrink-0 text-emerald-300" />Harga final terlihat sebelum pembayaran.</li>
                  <li className="flex gap-3"><CreditCard size={19} className="mt-0.5 shrink-0 text-orange-300" />Pembayaran diverifikasi sebelum matching dimulai.</li>
                  <li className="flex gap-3"><Radar size={19} className="mt-0.5 shrink-0 text-teal-300" />Jika tutor belum ditemukan, tersedia opsi ubah jadwal, beralih online, memperluas pencarian, atau refund sesuai ketentuan.</li>
                </ul>
              </aside>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-20">
          <div className="mx-auto grid max-w-[1200px] gap-10 px-5 sm:px-8 lg:grid-cols-2">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-teal-700">Yang dapat dibantu</p>
              <h2 className="mt-3 text-3xl font-extrabold text-[#14213D]">Belajar dari kebutuhan yang spesifik.</h2>
              <div className="mt-7 grid gap-3">
                {[
                  "Menguatkan konsep yang belum dipahami di kelas.",
                  "Membahas latihan dan kesalahan langkah secara terarah.",
                  "Menyiapkan ulangan, asesmen, atau target materi tertentu.",
                ].map((item) => <p key={item} className="flex gap-3 rounded-2xl border border-stone-200 bg-[#FFFBF7] p-4 text-sm font-semibold leading-6 text-slate-700"><ShieldCheck size={19} className="mt-0.5 shrink-0 text-teal-700" />{item}</p>)}
              </div>
              <div className="mt-8 rounded-2xl border border-orange-200 bg-orange-50 p-5">
                <p className="font-extrabold text-orange-950">Mode belajar</p>
                <div className="mt-3 flex flex-wrap gap-2"><span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm font-bold text-slate-700"><Laptop2 size={17} />Online</span><span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm font-bold text-slate-700"><GraduationCap size={17} />Tatap muka di area Yogyakarta</span></div>
                <p className="mt-3 text-xs leading-5 text-orange-900">Ketersediaan aktual mengikuti mapel, alamat, jadwal, dan tutor pada saat matching.</p>
              </div>
            </div>

            <div>
              <div className="flex items-end justify-between gap-4"><div><p className="text-xs font-extrabold uppercase tracking-wider text-orange-700">Contoh materi</p><h2 className="mt-3 text-3xl font-extrabold text-[#14213D]">Bab aktif di sistem</h2></div>{chapterLoading && <Loader2 className="animate-spin text-orange-600" size={20} />}</div>
              {chapters.length ? (
                <div className="mt-7 grid gap-3 sm:grid-cols-2">
                  {chapters.slice(0, 12).map((chapter) => <article key={chapter.id} className="rounded-2xl border border-stone-200 p-4"><p className="text-xs font-bold text-orange-700">{chapter.grade}</p><h3 className="mt-2 font-extrabold leading-6 text-[#14213D]">{chapter.title}</h3></article>)}
                </div>
              ) : !chapterLoading && <div className="mt-7 rounded-2xl border border-stone-200 bg-stone-50 p-6 text-sm leading-7 text-slate-600">Daftar Bab belum dipublikasikan untuk jenjang ini. Pilihan materi yang aktif tetap akan muncul saat menyusun paket.</div>}
            </div>
          </div>
        </section>

        <section className="bg-[#FFFBF7] py-16 sm:py-20">
          <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
            <div className="max-w-3xl"><p className="text-xs font-extrabold uppercase tracking-wider text-orange-700">Pilihan paket</p><h2 className="mt-3 text-3xl font-extrabold text-[#14213D]">Pilih ritme; harga dihitung dari pilihan nyata.</h2><p className="mt-4 leading-7 text-slate-600">Harga tidak dipukul rata. Total mengikuti jenjang, mata pelajaran, durasi, mode, dan jumlah sesi, lalu ditampilkan sebelum pembayaran.</p></div>
            {plans.length ? (
              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {plans.map((plan) => <article key={plan.id} className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm"><CalendarRange size={22} className="text-orange-700" /><h3 className="mt-4 font-extrabold text-[#14213D]">{plan.name}</h3><p className="mt-2 text-2xl font-extrabold text-[#14213D]">{plan.session_count} sesi</p><p className="mt-2 text-sm leading-6 text-slate-500">Masa aktif {plan.validity_days} hari · maks. {plan.maximum_subjects} mapel</p></article>)}
              </div>
            ) : <div className="mt-8 rounded-2xl border border-stone-200 bg-white p-6 text-sm leading-7 text-slate-600">Paket aktif belum tersedia untuk ditampilkan. Hubungi admin melalui WhatsApp atau periksa kembali saat paket sudah diaktifkan.</div>}
          </div>
        </section>

        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-[1100px] px-5 sm:px-8">
            <div className="text-center"><p className="text-xs font-extrabold uppercase tracking-wider text-teal-700">Alur transparan</p><h2 className="mt-3 text-3xl font-extrabold text-[#14213D]">Dari pilihan program sampai mulai belajar.</h2></div>
            <ol className="mt-9 grid gap-4 md:grid-cols-4">
              {[["01", "Susun paket", "Pilih Bab, jadwal, mode, dan jumlah sesi."], ["02", "Periksa & bayar", "Cek harga final dan ketentuan sebelum transfer."], ["03", "Matching tutor", "Pencarian dimulai setelah pembayaran terverifikasi."], ["04", "Mulai belajar", "Jadwal dan progress tersimpan di akun."]].map(([number, title, text]) => <li key={number} className="rounded-3xl border border-stone-200 p-5"><span className="text-sm font-extrabold text-orange-700">{number}</span><h3 className="mt-3 font-extrabold text-[#14213D]">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{text}</p></li>)}
            </ol>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"><StudentPackageLink to={builderUrl} className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-[#C2410C] px-6 text-sm font-extrabold text-white">Susun Paket {program.name}<ArrowRight size={17} /></StudentPackageLink><Link to="/#tutor" className="inline-flex min-h-12 items-center px-5 text-sm font-extrabold text-[#14213D]">Lihat galeri tutor</Link></div>
          </div>
        </section>

        {related.length > 0 && <section className="border-t border-stone-200 bg-[#FFFBF7] py-16"><div className="mx-auto max-w-[1200px] px-5 sm:px-8"><h2 className="text-2xl font-extrabold text-[#14213D]">Program lain untuk {selectedLevel}</h2><div className="mt-6 grid gap-3 sm:grid-cols-3">{related.map((subject) => <Link key={subject.id} to={programPath(subject, selectedLevel)} className="rounded-2xl border border-stone-200 bg-white p-5 font-extrabold text-[#14213D] hover:border-orange-300">{subject.name}<ArrowRight size={16} className="mt-3 text-orange-700" /></Link>)}</div></div></section>}
      </main>
      <Footer />
      <PublicWhatsappButton />
    </div>
  );
}
