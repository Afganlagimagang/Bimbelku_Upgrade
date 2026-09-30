import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BadgeCheck, BookOpenCheck, GraduationCap, Loader2, Search, ShieldCheck, Star, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import StudentPackageLink from "@/components/StudentPackageLink";
import { getCached } from "@/lib/http";
import { usePublicSectionMotion } from "@/hooks/usePublicSectionMotion";

type Tutor = {
  id: number;
  name: string;
  degree?: string | null;
  title?: string | null;
  credentials?: string | null;
  experience?: string | null;
  bio?: string | null;
  photo_url?: string | null;
  subjects: string[];
  groups: string[];
  rating_average?: number | null;
  rating_count: number;
};

export default function TutorCatalog() {
  const motionRef = usePublicSectionMotion();
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [query, setQuery] = useState("");
  const [groupFilter, setGroupFilter] = useState("Semua bidang");
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = async (force = false) => {
    setLoading(true); setFailed(false);
    try {
      const response = await getCached<Tutor[]>("/public-tutors", { maxAgeMs: 30_000, force });
      setTutors(Array.isArray(response.data) ? response.data : []);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);
  const groups = useMemo(() => ["Semua bidang", ...Array.from(new Set(tutors.flatMap((tutor) => tutor.groups?.length ? tutor.groups : ["Bidang lainnya"]))).sort((a, b) => a.localeCompare(b, "id-ID"))], [tutors]);
  const filtered = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase("id-ID");
    return tutors.filter((tutor) => (groupFilter === "Semua bidang" || tutor.groups?.includes(groupFilter))
      && (!keyword || [tutor.name, tutor.title, tutor.credentials, tutor.experience, ...tutor.subjects, ...(tutor.groups || [])].filter(Boolean).join(" ").toLocaleLowerCase("id-ID").includes(keyword)));
  }, [query, groupFilter, tutors]);

  const grouped = useMemo(() => {
    if (groupFilter !== "Semua bidang") return [{ name: groupFilter, tutors: filtered }];
    const map = new Map<string, Tutor[]>();
    filtered.forEach((tutor) => {
      (tutor.groups?.length ? tutor.groups : ["Bidang lainnya"]).forEach((category) => {
        map.set(category, [...(map.get(category) || []), tutor]);
      });
    });
    return [...map.entries()].sort(([left], [right]) => left.localeCompare(right, "id-ID")).map(([name, items]) => ({ name, tutors: items }));
  }, [filtered, groupFilter]);

  return <div className="public-site min-h-screen bg-[#FFFBF7]"><Navbar /><main ref={motionRef}>
    <section className="relative overflow-hidden bg-[#14213D] py-16 text-white sm:py-20"><div className="absolute -right-20 -top-20 h-72 w-72 rounded-full border-[32px] border-orange-400/10" /><div className="mx-auto max-w-[1200px] px-5 sm:px-8"><nav className="text-sm font-bold text-slate-300"><Link to="/">Beranda</Link><span> / Tutor</span></nav><div className="mt-8 grid gap-8 lg:grid-cols-[1fr_350px] lg:items-end"><div><p className="text-xs font-black uppercase tracking-[.18em] text-orange-300">Tutor BimbelKu</p><h1 className="mt-3 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">Kenali tutor berdasarkan bidang yang mereka ajarkan.</h1><p className="mt-5 max-w-2xl text-base leading-8 text-slate-300">Halaman hanya menampilkan tutor terverifikasi yang sudah memberikan persetujuan publik. Nomor kontak, alamat, jadwal pribadi, dan dokumen verifikasi tidak ditampilkan.</p></div><label className="flex min-h-14 items-center gap-3 rounded-2xl bg-white px-4 text-slate-900"><Search size={19} className="text-slate-400" /><span className="sr-only">Cari tutor atau mapel</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari tutor, mapel, atau kredensial" className="h-12 min-w-0 flex-1 bg-transparent text-sm font-bold outline-none" /></label></div></div></section>
    <section className="py-12 sm:py-16"><div className="mx-auto max-w-[1200px] px-5 sm:px-8">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter kelompok mapel tutor">{groups.map((item) => <button key={item} type="button" aria-pressed={groupFilter === item} onClick={() => setGroupFilter(item)} className={`min-h-11 rounded-full px-4 py-2 text-sm font-black ${groupFilter === item ? "bg-[#147D7E] text-white" : "border border-stone-200 bg-white text-slate-600"}`}>{item}</button>)}</div>
      <div className="mt-6 flex items-center justify-between gap-4"><p className="text-sm font-bold text-slate-500">{filtered.length} tutor publik ditemukan</p><p className="hidden items-center gap-2 text-xs font-bold text-emerald-700 sm:flex"><ShieldCheck size={16} />Persetujuan publik terverifikasi</p></div>
      {loading ? <div className="mt-8 grid min-h-64 place-items-center rounded-3xl bg-white"><Loader2 className="animate-spin text-orange-600" /></div> : failed ? <div className="mt-8 rounded-3xl bg-white p-10 text-center"><p className="font-black">Data tutor belum dapat dimuat.</p><button onClick={() => void load(true)} className="mt-3 font-bold text-orange-700">Coba lagi</button></div> : grouped.length ? <div className="mt-8 space-y-12">{grouped.map((group) => <section key={group.name} id={`tutor-${group.name.toLocaleLowerCase("id-ID").replace(/[^a-z0-9]+/g, "-")}`} className="scroll-mt-28"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-orange-100 text-orange-800"><BookOpenCheck size={20} /></span><div><p className="text-xs font-black uppercase tracking-wider text-orange-700">Kelompok mapel · {group.tutors.length} tutor</p><h2 className="text-2xl font-black text-[#14213D]">{group.name}</h2></div></div><div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{group.tutors.slice(0, expandedGroups.includes(group.name) ? undefined : 12).map((tutor) => <TutorCard key={tutor.id} tutor={tutor} />)}</div>{group.tutors.length > 12 && <button type="button" onClick={() => setExpandedGroups((current) => current.includes(group.name) ? current.filter((name) => name !== group.name) : [...current, group.name])} className="mt-5 min-h-11 rounded-xl border border-teal-200 bg-white px-5 text-sm font-black text-teal-800">{expandedGroups.includes(group.name) ? "Tampilkan lebih sedikit" : `Lihat semua ${group.tutors.length} tutor ${group.name}`}</button>}</section>)}</div> : <div className="mt-8 rounded-3xl border border-dashed border-stone-300 bg-white p-10 text-center"><UserRound className="mx-auto text-slate-300" size={42} /><h2 className="mt-4 text-xl font-black text-slate-900">Belum ada profil publik pada kategori ini</h2><p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">Tutor tidak otomatis dipublikasikan setelah lolos seleksi. Profil baru tampil setelah izin tutor, verifikasi, dan persetujuan admin lengkap.</p></div>}
    </div></section>
    <section className="bg-[#F7F1E8] py-14"><div className="mx-auto flex max-w-[1100px] flex-col gap-5 px-5 sm:px-8 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-xs font-black uppercase tracking-wider text-teal-700">Tidak memilih secara acak</p><h2 className="mt-2 text-3xl font-black text-[#14213D]">Tutor tetap dicocokkan dengan mapel, jadwal, mode, dan kesiapan.</h2><p className="mt-3 max-w-2xl leading-7 text-slate-600">Katalog membantu mengenal kualitas tutor. Tutor untuk pesanan ditentukan melalui penawaran berurutan kepada kandidat yang memenuhi syarat.</p></div><StudentPackageLink to="/student/packages/new" className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#C2410C] px-6 text-sm font-black text-white">Susun kebutuhan belajar <ArrowRight size={17} /></StudentPackageLink></div></section>
  </main><Footer /></div>;
}

function TutorCard({ tutor }: { tutor: Tutor }) {
  return <article className="group overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"><div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-teal-100 to-orange-100">{tutor.photo_url ? <img src={tutor.photo_url} alt={tutor.name} loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <div className="grid h-full place-items-center"><UserRound size={58} className="text-teal-700/50" /></div>}<span className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-1.5 text-xs font-black text-emerald-700 shadow"><BadgeCheck size={14} />Terverifikasi</span></div><div className="p-5"><div className="flex items-start justify-between gap-3"><div><h3 className="text-xl font-black text-[#14213D]">{tutor.name}</h3>{tutor.degree && <p className="mt-1 text-sm font-bold text-teal-800">{tutor.degree}</p>}<p className="mt-1 text-sm font-bold text-orange-700">{tutor.title || "Tutor BimbelKu"}</p></div>{tutor.rating_average && <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-black text-amber-800"><Star size={13} fill="currentColor" />{tutor.rating_average} <span className="font-semibold text-amber-600">({tutor.rating_count})</span></span>}</div><p className="mt-4 flex items-start gap-2 text-sm font-bold leading-6 text-slate-700"><GraduationCap className="mt-0.5 shrink-0 text-teal-700" size={18} />{tutor.credentials || tutor.experience || "Bidang ajar tercantum di bawah."}</p><div className="mt-4 flex flex-wrap gap-2">{tutor.subjects.map((item) => <span key={item} className="rounded-full bg-stone-100 px-3 py-1 text-xs font-bold text-slate-600">{item}</span>)}</div></div></article>;
}
