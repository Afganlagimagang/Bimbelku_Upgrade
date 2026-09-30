import { useEffect, useRef, useState } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, ExternalLink, ImagePlus, Loader2, Search, UserRound, UserRoundX } from "lucide-react";
import { Link } from "react-router-dom";

import http, { clearApiCache, getApiError } from "@/lib/http";
import { notify } from "@/lib/notify";

type TutorCandidate = {
  id: number;
  name: string;
  public_display_name: string | null;
  public_degree: string | null;
  account_status: string;
  verified: boolean;
  consented: boolean;
  approved: boolean;
  title: string | null;
  credentials: string | null;
  photo_url: string | null;
  subjects: string[];
};

type PageResponse = {
  data: TutorCandidate[];
  current_page: number;
  last_page: number;
  total: number;
  groups: string[];
};

type StatusFilter = "all" | "visible" | "awaiting_review" | "not_visible" | "no_consent" | "not_verified";
const statusOptions: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Semua status" },
  { value: "visible", label: "Sedang tampil" },
  { value: "awaiting_review", label: "Siap ditinjau" },
  { value: "not_visible", label: "Belum tampil" },
  { value: "no_consent", label: "Belum memberi izin" },
  { value: "not_verified", label: "Belum terverifikasi" },
];

export default function PublicTutorManagement() {
  const [items, setItems] = useState<TutorCandidate[]>([]);
  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState<10 | 20>(20);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [group, setGroup] = useState("");
  const [groups, setGroups] = useState<string[]>([]);
  const [reloadKey, setReloadKey] = useState(0);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    http.get<PageResponse>("/admin/public-tutors", { params: { page, q: query, status, group, per_page: perPage } })
      .then(({ data }) => {
        if (!active) return;
        setItems(data.data || []);
        setLastPage(Math.max(1, data.last_page || 1));
        setTotal(data.total || 0);
        setGroups(data.groups || []);
        if (page > Math.max(1, data.last_page || 1)) setPage(Math.max(1, data.last_page || 1));
      })
      .catch((error) => { if (active) notify.error(getApiError(error, "Daftar tutor belum dapat dimuat.")); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page, query, status, group, perPage, reloadKey]);

  const setApproved = async (item: TutorCandidate) => {
    setSavingId(item.id);
    try {
      const { data } = await http.patch<{ message: string; approved: boolean }>(`/admin/public-tutors/${item.id}`, { approved: !item.approved });
      setItems((current) => current.map((candidate) => candidate.id === item.id ? { ...candidate, approved: data.approved } : candidate));
      clearApiCache("/public-tutors");
      setReloadKey((current) => current + 1);
      notify.success(data.message);
    } catch (error) {
      notify.error(getApiError(error, "Status publik tutor gagal diperbarui."));
    } finally {
      setSavingId(null);
    }
  };

  return <section className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-sm sm:p-8">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><p className="text-xs font-black uppercase tracking-[.16em] text-orange-700">Katalog publik</p><h2 className="mt-2 text-2xl font-black text-slate-900">Kenali Tutor</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Atur foto, nama tampil, dan gelar tutor per profil. Beranda menampilkan hingga 20 tutor yang sudah memberi izin, terverifikasi, dan disetujui. Data kontak dan dokumen tidak dipublikasikan.</p></div>
      <Link to="/tutor" target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-black text-slate-700">Lihat halaman publik <ExternalLink size={15} /></Link>
    </div>
    <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))]">
      <form onSubmit={(event) => { event.preventDefault(); setPage(1); setQuery(queryInput.trim()); }} className="flex min-w-0 gap-2"><label className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-200 px-3"><Search size={17} className="shrink-0 text-slate-400" /><span className="sr-only">Cari tutor</span><input value={queryInput} onChange={(event) => setQueryInput(event.target.value)} placeholder="Nama, mapel, atau kredensial" className="min-w-0 flex-1 bg-transparent text-sm outline-none" /></label><button type="submit" className="min-h-11 rounded-xl bg-[#14213D] px-4 text-sm font-black text-white">Cari</button></form>
      <label className="text-xs font-bold text-slate-600">Status<select value={status} onChange={(event) => { setStatus(event.target.value as StatusFilter); setPage(1); }} className="mt-1 block min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900">{statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
      <label className="text-xs font-bold text-slate-600">Kelompok mapel<select value={group} onChange={(event) => { setGroup(event.target.value); setPage(1); }} className="mt-1 block min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900"><option value="">Semua bidang</option>{groups.map((name) => <option key={name} value={name}>{name}</option>)}</select></label>
      <label className="text-xs font-bold text-slate-600">Tampil per halaman<select value={perPage} onChange={(event) => { setPerPage(Number(event.target.value) as 10 | 20); setPage(1); }} className="mt-1 block min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900"><option value={10}>10 tutor</option><option value={20}>20 tutor</option></select></label>
    </div>
    <p className="mt-5 text-xs font-bold text-slate-500">{total} tutor sesuai filter · menampilkan maksimal {perPage} per halaman · halaman {page} dari {lastPage}</p>
    {loading ? <div className="grid min-h-40 place-items-center"><Loader2 className="animate-spin text-indigo-600" /></div> : items.length ? <div className="mt-4 space-y-4">{items.map((item) => {
      const eligible = item.account_status === "active" && item.verified && item.consented;
      return <article key={item.id} className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start"><div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl bg-teal-100">{item.photo_url ? <img src={item.photo_url} alt={`Foto ${item.public_display_name || item.name}`} loading="lazy" decoding="async" className="h-full w-full object-cover" /> : <UserRound size={34} className="text-teal-700" />}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-black text-slate-900">{item.public_display_name || item.name}</h3><span className={`rounded-full px-2 py-1 text-[10px] font-black ${item.approved && eligible ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"}`}>{item.approved && eligible ? "Tampil publik" : "Belum tampil"}</span></div>{item.public_degree && <p className="mt-1 text-xs font-bold text-teal-800">{item.public_degree}</p>}<p className="mt-1 text-xs text-slate-600">{item.title || item.subjects.join(", ") || "Mapel belum tercatat"}</p><p className="mt-2 text-xs font-semibold text-slate-500">{!item.verified ? "Menunggu verifikasi · " : "Terverifikasi · "}{!item.consented ? "Izin tutor belum diberikan" : item.account_status !== "active" ? "Akun belum aktif" : "Izin tutor tercatat"}</p>{item.credentials && <p className="mt-1 line-clamp-2 text-xs text-slate-500">{item.credentials}</p>}</div><button type="button" disabled={savingId === item.id || (!eligible && !item.approved)} onClick={() => void setApproved(item)} className={`inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl px-4 text-sm font-black disabled:cursor-not-allowed disabled:opacity-50 ${item.approved ? "border border-slate-300 bg-white text-slate-700" : "bg-teal-700 text-white"}`}>{savingId === item.id ? <Loader2 size={16} className="animate-spin" /> : item.approved ? <UserRoundX size={16} /> : <CheckCircle2 size={16} />}{item.approved ? "Sembunyikan" : "Tampilkan"}</button></div>
        <TutorIdentityEditor item={item} onSaved={(identity) => setItems((current) => current.map((candidate) => candidate.id === item.id ? { ...candidate, ...identity } : candidate))} />
        <TutorPhotoEditor item={item} onSaved={(photoUrl) => setItems((current) => current.map((candidate) => candidate.id === item.id ? { ...candidate, photo_url: photoUrl } : candidate))} />
      </article>;
    })}</div> : <p className="mt-4 rounded-2xl bg-slate-50 p-6 text-sm text-slate-600">Tidak ada tutor yang cocok. Ubah status, kelompok mapel, atau kata pencarian.</p>}
    <div className="mt-5 flex items-center justify-between gap-3"><button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1} className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-slate-200 px-3 text-sm font-bold disabled:opacity-40"><ChevronLeft size={16} />Sebelumnya</button><span className="text-xs font-bold text-slate-500">{page} / {lastPage}</span><button type="button" onClick={() => setPage((current) => Math.min(lastPage, current + 1))} disabled={page >= lastPage} className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-slate-200 px-3 text-sm font-bold disabled:opacity-40">Berikutnya<ChevronRight size={16} /></button></div>
  </section>;
}

function TutorIdentityEditor({ item, onSaved }: { item: TutorCandidate; onSaved: (identity: Pick<TutorCandidate, "public_display_name" | "public_degree">) => void }) {
  const [name, setName] = useState(item.public_display_name || "");
  const [degree, setDegree] = useState(item.public_degree || "");
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(item.public_display_name || "");
    setDegree(item.public_degree || "");
    setConfirmed(false);
  }, [item.id, item.public_display_name, item.public_degree]);

  const save = async () => {
    if (!confirmed) return;
    setSaving(true);
    try {
      const { data } = await http.patch<{ message: string; public_display_name: string | null; public_degree: string | null }>(`/admin/public-tutors/${item.id}/identity`, {
        public_display_name: name.trim() || null,
        public_degree: degree.trim() || null,
        identity_confirmed: true,
      });
      onSaved({ public_display_name: data.public_display_name, public_degree: data.public_degree });
      clearApiCache("/public-tutors");
      setConfirmed(false);
      notify.success(data.message);
    } catch (error) {
      notify.error(getApiError(error, "Nama dan gelar tutor belum dapat disimpan."));
    } finally {
      setSaving(false);
    }
  };

  return <div className="mt-4 border-t border-slate-200 pt-4"><div className="grid gap-3 sm:grid-cols-2"><label className="text-xs font-black text-slate-700">Nama yang tampil di website<input value={name} onChange={(event) => { setName(event.target.value); setConfirmed(false); }} maxLength={100} placeholder={item.name} disabled={!item.consented} className="mt-2 block min-h-11 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-900 disabled:opacity-50" /><span className="mt-1 block font-medium text-slate-500">Kosongkan untuk memakai nama akun: {item.name}.</span></label><label className="text-xs font-black text-slate-700">Gelar / pendidikan terverifikasi<input value={degree} onChange={(event) => { setDegree(event.target.value); setConfirmed(false); }} maxLength={120} placeholder="Contoh: S.Pd. · Alumni UGM" disabled={!item.consented} className="mt-2 block min-h-11 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-900 disabled:opacity-50" /><span className="mt-1 block font-medium text-slate-500">Hanya tulis gelar atau asal pendidikan yang sudah diperiksa.</span></label></div><div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><label className="flex items-start gap-2 text-xs font-semibold leading-5 text-slate-700"><input type="checkbox" checked={confirmed} disabled={!item.consented} onChange={(event) => setConfirmed(event.target.checked)} className="mt-0.5 h-4 w-4 shrink-0" />Saya memastikan nama dan gelar ini sesuai data tutor yang terverifikasi dan diizinkan untuk publikasi.</label><button type="button" disabled={!item.consented || !confirmed || saving} onClick={() => void save()} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#14213D] px-4 text-xs font-black text-white disabled:opacity-50">{saving && <Loader2 size={15} className="animate-spin" />}Simpan nama & gelar</button></div></div>;
}

function TutorPhotoEditor({ item, onSaved }: { item: TutorCandidate; onSaved: (url: string) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!file) { setPreview(null); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const save = async () => {
    if (!file || !confirmed) return;
    const payload = new FormData();
    payload.append("photo", file);
    payload.append("photo_consent_confirmed", "1");
    setSaving(true);
    try {
      const { data } = await http.post<{ message: string; photo_url: string }>(`/admin/public-tutors/${item.id}/photo`, payload);
      onSaved(data.photo_url);
      clearApiCache("/public-tutors");
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      setConfirmed(false);
      notify.success(data.message);
    } catch (error) {
      notify.error(getApiError(error, "Foto tutor belum dapat disimpan."));
    } finally {
      setSaving(false);
    }
  };

  return <div className="mt-4 border-t border-slate-200 pt-4"><div className="flex flex-col gap-4 sm:flex-row sm:items-end"><div className="min-w-0 flex-1"><label className="text-xs font-black text-slate-700">Foto untuk Kenali Tutor<input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.webp" disabled={!item.consented} onChange={(event) => { const chosen = event.target.files?.[0]; if (!chosen) return; if (chosen.size > 5 * 1024 * 1024) { notify.error("Foto tutor maksimal 5 MB."); event.target.value = ""; return; } setFile(chosen); setConfirmed(false); }} className="mt-2 block w-full min-w-0 text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-teal-100 file:px-3 file:py-2 file:font-bold file:text-teal-800 disabled:opacity-50" /></label>{file && <label className="mt-3 flex items-start gap-2 text-xs font-semibold leading-5 text-slate-700"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="mt-0.5 h-4 w-4 shrink-0" />Saya memastikan tutor telah menyetujui penggunaan foto ini untuk profil publik.</label>}{!item.consented && <p className="mt-2 text-xs text-amber-700">Tutor perlu mengaktifkan izin profil publik dahulu.</p>}</div>{preview && <div className="flex items-center gap-2"><ImagePlus size={16} className="text-teal-700" /><img src={preview} alt="Pratinjau foto baru, belum disimpan" className="h-16 w-16 rounded-xl object-cover" /></div>}<button type="button" disabled={!file || !confirmed || saving} onClick={() => void save()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-teal-300 bg-white px-4 text-xs font-black text-teal-800 disabled:opacity-50">{saving ? <Loader2 size={15} className="animate-spin" /> : <ImagePlus size={15} />}Simpan foto tutor</button></div></div>;
}
