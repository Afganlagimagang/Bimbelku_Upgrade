import { useCallback, useEffect, useRef, useState } from "react";
import { Check, ChevronLeft, ChevronRight, ImagePlus, Loader2, Pencil, Plus, Search, Trash2, UserRound } from "lucide-react";
import { Link } from "react-router-dom";

import http, { clearApiCache, getApiError } from "@/lib/http";
import { notify } from "@/lib/notify";

type GalleryEntry = {
  id: number;
  teacher_profile_id: number | null;
  display_name: string;
  degree: string;
  description: string | null;
  photo_url: string | null;
  photo_from_account: boolean;
  consent_source: string;
  is_visible: boolean;
  sort_order: number;
};

type Candidate = {
  id: number;
  name: string;
  degree: string | null;
  description: string | null;
  photo_url: string | null;
  subject: string | null;
};

type GalleryPage = { data: GalleryEntry[]; current_page: number; last_page: number; total: number };

const emptyForm = {
  id: null as number | null,
  teacherProfileId: null as number | null,
  name: "",
  degree: "",
  description: "",
  consentSource: "",
  visible: false,
  sortOrder: 0,
  savedPhoto: null as string | null,
  photoFromAccount: false,
};

export default function WebsiteTutorGalleryEditor() {
  const [entries, setEntries] = useState<GalleryEntry[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [candidateQuery, setCandidateQuery] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [candidateLoading, setCandidateLoading] = useState(false);
  const [candidateSearched, setCandidateSearched] = useState(false);
  const [candidateError, setCandidateError] = useState("");
  const [fillMode, setFillMode] = useState<"manual" | "account">("manual");
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await http.get<GalleryPage>("/admin/website-tutor-gallery", { params: { page, per_page: 20 } });
      setEntries(data.data || []);
      setLastPage(Math.max(1, data.last_page || 1));
      setTotal(data.total || 0);
      if (page > Math.max(1, data.last_page || 1)) setPage(Math.max(1, data.last_page || 1));
    } catch (error) {
      notify.error(getApiError(error, "Galeri tutor belum dapat dimuat."));
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!file) { setFilePreview(null); return; }
    const url = URL.createObjectURL(file);
    setFilePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (fillMode !== "account") return;
    let active = true;
    setCandidateLoading(true);
    setCandidateSearched(false);
    setCandidateError("");
    const timer = window.setTimeout(async () => {
      try {
        const { data } = await http.get<Candidate[]>("/admin/website-tutor-gallery/candidates", { params: { q: candidateQuery.trim().slice(0, 100) } });
        if (active) setCandidates(Array.isArray(data) ? data : []);
      } catch (error) {
        if (active) {
          setCandidates([]);
          setCandidateError(getApiError(error, "Akun tutor belum dapat dicari."));
        }
      } finally {
        if (active) {
          setCandidateLoading(false);
          setCandidateSearched(true);
        }
      }
    }, candidateQuery.trim() ? 280 : 0);
    return () => { active = false; window.clearTimeout(timer); };
  }, [candidateQuery, fillMode]);

  const reset = () => {
    setForm(emptyForm);
    setFillMode("manual");
    setCandidateQuery("");
    setCandidates([]);
    setFile(null);
    setConfirmed(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const chooseCandidate = (id: number) => {
    const candidate = candidates.find((item) => item.id === id);
    if (!candidate) return;
    if (form.teacherProfileId !== id && (form.name.trim() || form.degree.trim() || form.description.trim())
      && !window.confirm("Isi dari akun tutor akan mengganti nama, gelar, dan jejak pendidikan yang sedang diisi. Lanjutkan?")) return;
    setForm((current) => ({
      ...current,
      teacherProfileId: candidate.id,
      name: candidate.name,
      degree: candidate.degree || "",
      description: candidate.description || "",
      savedPhoto: current.id && !current.photoFromAccount ? current.savedPhoto : candidate.photo_url,
      photoFromAccount: !current.id || current.photoFromAccount,
      consentSource: `Persetujuan profil publik tutor #${candidate.id} tercatat di sistem`,
    }));
    setConfirmed(false);
  };

  const useManual = () => {
    setFillMode("manual");
    setForm((current) => ({
      ...current,
      teacherProfileId: null,
      savedPhoto: current.photoFromAccount ? null : current.savedPhoto,
      photoFromAccount: false,
      consentSource: current.consentSource.startsWith("Persetujuan profil publik tutor #") ? "" : current.consentSource,
    }));
    setConfirmed(false);
  };

  const edit = (entry: GalleryEntry) => {
    setForm({
      id: entry.id,
      teacherProfileId: entry.teacher_profile_id,
      name: entry.display_name,
      degree: entry.degree,
      description: entry.description || "",
      consentSource: entry.consent_source,
      visible: entry.is_visible,
      sortOrder: entry.sort_order,
      savedPhoto: entry.photo_url,
      photoFromAccount: entry.photo_from_account,
    });
    setFillMode(entry.teacher_profile_id ? "account" : "manual");
    setFile(null);
    setConfirmed(false);
    editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!confirmed) { notify.error("Konfirmasi izin publikasi dan kebenaran data tutor dahulu."); return; }
    setSaving(true);
    const payload = new FormData();
    if (form.teacherProfileId) payload.append("teacher_profile_id", String(form.teacherProfileId));
    payload.append("display_name", form.name.trim());
    payload.append("degree", form.degree.trim());
    payload.append("description", form.description.trim());
    payload.append("consent_source", form.consentSource.trim());
    payload.append("is_visible", form.visible ? "1" : "0");
    payload.append("sort_order", String(form.sortOrder));
    payload.append("consent_confirmed", "1");
    payload.append("identity_confirmed", "1");
    if (file) payload.append("photo", file);
    try {
      const url = form.id ? `/admin/website-tutor-gallery/${form.id}` : "/admin/website-tutor-gallery";
      await http.post(url, payload);
      clearApiCache("/website-tutor-gallery");
      notify.success(form.id ? "Kartu tutor diperbarui." : "Kartu tutor ditambahkan.");
      reset();
      await load();
    } catch (error) {
      notify.error(getApiError(error, "Kartu tutor belum dapat disimpan."));
    } finally {
      setSaving(false);
    }
  };

  const archive = async (entry: GalleryEntry) => {
    if (!window.confirm(`Arsipkan kartu ${entry.display_name}? Kartu tidak akan tampil di beranda.`)) return;
    try {
      await http.delete(`/admin/website-tutor-gallery/${entry.id}`);
      clearApiCache("/website-tutor-gallery");
      notify.success("Kartu tutor diarsipkan.");
      if (form.id === entry.id) reset();
      await load();
    } catch (error) {
      notify.error(getApiError(error, "Kartu tutor belum dapat diarsipkan."));
    }
  };

  const importLegacy = async () => {
    try {
      const { data } = await http.post<{ message: string }>("/admin/website-tutor-gallery/import-legacy");
      notify.success(data.message);
      await load();
    } catch (error) {
      notify.error(getApiError(error, "Kartu galeri lama belum dapat diimpor."));
    }
  };

  return <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-7">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-wider text-orange-700">Galeri tutor beranda</p><h2 className="mt-2 text-2xl font-black text-[#14213D]">Isi manual atau ambil dari akun tutor</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Jumlah kartu tidak terkunci pada enam slot. Beranda menampilkan hingga 20 kartu aktif; kartu digandakan secara visual agar animasi ticker menyambung. Data akun hanya dipakai sebagai pengisi cepat dan bisa diedit sebelum disimpan.</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => void importLegacy()} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-teal-300 bg-teal-50 px-4 text-sm font-black text-teal-900">Impor foto lama</button><button type="button" onClick={reset} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-stone-300 px-4 text-sm font-black text-slate-700"><Plus size={16} />Kartu baru</button></div></div>
    <p className="mt-3 rounded-xl bg-orange-50 p-3 text-xs leading-5 text-orange-900">Foto dari enam slot lama tetap muncul selama belum ada kartu baru yang aktif. Setelah satu kartu baru ditampilkan, galeri baru menggantikan seluruh galeri lama. Impor foto lama sebagai draf, lengkapi datanya, lalu aktifkan kartu yang ingin dipertahankan.</p>

    <div ref={editorRef} className="mt-6 scroll-mt-28 rounded-2xl border border-teal-100 bg-teal-50/50 p-4 sm:p-6">
      <h3 className="font-black text-[#14213D]">{form.id ? `Edit kartu #${form.id}` : "Tambah kartu tutor"}</h3>
      <div role="group" aria-label="Cara mengisi kartu tutor" className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-white p-1.5">
        <button type="button" aria-pressed={fillMode === "manual"} onClick={useManual} className={`min-h-11 rounded-lg px-3 text-sm font-black transition ${fillMode === "manual" ? "bg-[#14213D] text-white" : "text-slate-600 hover:bg-slate-50"}`}>Isi manual</button>
        <button type="button" aria-pressed={fillMode === "account"} onClick={() => setFillMode("account")} className={`min-h-11 rounded-lg px-3 text-sm font-black transition ${fillMode === "account" ? "bg-[#14213D] text-white" : "text-slate-600 hover:bg-slate-50"}`}>Ambil dari akun</button>
      </div>
      {fillMode === "account" ? <div className="mt-4 rounded-xl border border-teal-200 bg-white p-3">
        <label className="block text-xs font-black text-slate-700">Cari tutor yang sudah siap tampil</label>
        <div className="mt-2 flex min-h-11 min-w-0 items-center gap-2 rounded-xl border border-slate-300 px-3 focus-within:border-teal-600 focus-within:ring-2 focus-within:ring-teal-100"><Search size={17} className="shrink-0 text-slate-500" /><input value={candidateQuery} onChange={(event) => setCandidateQuery(event.target.value)} maxLength={100} placeholder="Ketik nama, mapel, gelar, atau kredensial" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />{candidateLoading && <Loader2 size={16} className="shrink-0 animate-spin text-teal-700" />}</div>
        <p className="mt-2 text-[11px] leading-5 text-slate-500">Hasil diperbarui saat mengetik. Menampilkan maksimal 20 tutor; ketik lebih spesifik bila belum terlihat.</p>
        {candidateLoading ? <p role="status" className="py-5 text-center text-xs font-semibold text-slate-500">Mencari akun tutor…</p> : candidateError ? <p role="alert" className="mt-3 rounded-xl bg-rose-50 p-4 text-xs font-semibold text-rose-800">{candidateError}</p> : candidates.length ? <div className="mt-3 max-h-72 space-y-2 overflow-y-auto overscroll-contain" role="list" aria-label="Hasil pencarian tutor">{candidates.map((candidate) => <div key={candidate.id} role="listitem"><button type="button" onClick={() => chooseCandidate(candidate.id)} aria-pressed={form.teacherProfileId === candidate.id} className={`flex min-h-16 w-full min-w-0 items-center gap-3 rounded-xl border p-2 text-left transition ${form.teacherProfileId === candidate.id ? "border-teal-500 bg-teal-50" : "border-slate-200 hover:border-teal-300 hover:bg-slate-50"}`}><span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-slate-100">{candidate.photo_url ? <img src={candidate.photo_url} alt="" loading="lazy" className="h-full w-full object-cover" /> : <UserRound size={23} className="text-slate-400" />}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-black text-[#14213D]">{candidate.name}</span><span className="block truncate text-xs font-semibold text-teal-800">{candidate.degree || "Gelar belum diisi"}{candidate.subject ? ` · ${candidate.subject}` : ""}</span></span>{form.teacherProfileId === candidate.id && <Check size={18} className="shrink-0 text-teal-700" />}</button></div>)}</div> : candidateSearched && <div className="mt-3 rounded-xl bg-slate-50 p-4 text-xs leading-5 text-slate-600">Tidak ada tutor yang cocok. Hanya akun aktif, terverifikasi, berizin, dan disetujui yang muncul. <Link to="/admin/public-tutors" className="font-black text-teal-800 underline">Periksa status di Tutor Publik</Link>, atau gunakan Isi manual.</div>}
        {form.teacherProfileId && <p className="mt-3 rounded-lg bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-900">Terhubung dengan akun tutor #{form.teacherProfileId}. Nama, gelar, dan keterangan di bawah masih bisa disesuaikan sebelum disimpan.</p>}
      </div> : <p className="mt-3 text-xs leading-5 text-slate-600">Isi identitas tutor langsung di bawah. Untuk kartu manual, catat sumber izin publikasinya.</p>}
      <form onSubmit={(event) => void save(event)} className="mt-4 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2"><label className="text-xs font-black text-slate-700">Nama tampil *<input required maxLength={100} value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className="mt-1 block min-h-11 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900" /></label><label className="text-xs font-black text-slate-700">Gelar / pendidikan terakhir *<input required maxLength={120} value={form.degree} onChange={(event) => setForm((current) => ({ ...current, degree: event.target.value }))} placeholder="Contoh: S.Pd. / Mahasiswa S1 Matematika" className="mt-1 block min-h-11 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900" /></label></div>
        <label className="block text-xs font-black text-slate-700">Jejak pendidikan atau karier<input maxLength={180} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Contoh: Mengajar Matematika SMP selama 4 tahun" className="mt-1 block min-h-11 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900" /></label>
        <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end"><label className="text-xs font-black text-slate-700">Foto tutor (opsional jika foto akun tersedia)<input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.webp" onChange={(event) => { const chosen = event.target.files?.[0] || null; if (chosen && chosen.size > 5 * 1024 * 1024) { notify.error("Foto maksimal 5 MB."); event.target.value = ""; return; } setFile(chosen); }} className="mt-1 block w-full min-w-0 text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-orange-100 file:px-3 file:py-2 file:font-bold file:text-orange-800" /></label><div className="grid h-20 w-20 place-items-center overflow-hidden rounded-xl bg-white">{filePreview || form.savedPhoto ? <img src={filePreview || form.savedPhoto || ""} alt="Pratinjau tutor" className="h-full w-full object-cover" /> : <UserRound size={30} className="text-slate-400" />}</div></div>
        <label className="block text-xs font-black text-slate-700">Sumber izin publikasi *<input required maxLength={255} value={form.consentSource} onChange={(event) => setForm((current) => ({ ...current, consentSource: event.target.value }))} placeholder="Contoh: persetujuan tutor via WA pada 29 Sep 2026" className="mt-1 block min-h-11 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900" /><span className="mt-1 block font-medium text-slate-500">Catatan internal; tidak ditampilkan kepada pengunjung.</span></label>
        <div className="flex flex-wrap gap-4"><label className="flex items-center gap-2 text-xs font-bold text-slate-700"><input type="checkbox" checked={form.visible} onChange={(event) => setForm((current) => ({ ...current, visible: event.target.checked }))} />Tampilkan di beranda</label>{form.id && <label className="text-xs font-bold text-slate-700">Urutan<input type="number" min={0} max={100000} value={form.sortOrder} onChange={(event) => setForm((current) => ({ ...current, sortOrder: Number(event.target.value) }))} className="ml-2 w-20 rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm" /></label>}</div>
        <label className="flex items-start gap-2 text-xs font-semibold leading-5 text-slate-700"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="mt-0.5 h-4 w-4 shrink-0" />Saya telah memeriksa izin penggunaan identitas/foto dan kebenaran gelar atau pendidikan tutor.</label>
        <button type="submit" disabled={saving || !confirmed} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#14213D] px-5 text-sm font-black text-white disabled:opacity-50">{saving ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}{form.id ? "Simpan perubahan" : "Tambah kartu"}</button>
      </form>
    </div>

    <div className="mt-7 flex items-center justify-between gap-3"><h3 className="text-lg font-black text-[#14213D]">Kartu tersimpan ({total})</h3><span className="text-xs font-bold text-slate-500">Halaman {page} dari {lastPage} · 20 per halaman</span></div>
    {loading ? <div className="grid min-h-28 place-items-center"><Loader2 className="animate-spin text-orange-600" /></div> : entries.length ? <div className="mt-4 grid gap-3 md:grid-cols-2">{entries.map((entry) => <article key={entry.id} className="flex min-w-0 gap-3 rounded-2xl border border-stone-200 bg-[#FFFBF7] p-3"><div className="grid h-20 w-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-slate-100">{entry.photo_url ? <img src={entry.photo_url} alt={entry.display_name} loading="lazy" className="h-full w-full object-cover" /> : <UserRound className="text-slate-400" />}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-black text-[#14213D]">{entry.display_name}</p><p className="truncate text-xs font-bold text-teal-800">{entry.degree}</p><p className="mt-1 text-[11px] text-slate-500">{entry.is_visible ? "Aktif di beranda" : "Draf / disembunyikan"} · Urutan {entry.sort_order}</p><div className="mt-2 flex gap-2"><button type="button" onClick={() => edit(entry)} className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-slate-200 px-2 text-xs font-bold"><Pencil size={13} />Edit</button><button type="button" onClick={() => void archive(entry)} className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-rose-200 px-2 text-xs font-bold text-rose-700"><Trash2 size={13} />Arsipkan</button></div></div></article>)}</div> : <p className="mt-4 rounded-xl bg-slate-50 p-5 text-sm text-slate-600">Belum ada kartu manual. Foto dari enam slot lama tetap tersedia sebagai cadangan sampai galeri baru diisi.</p>}
    <div className="mt-4 flex items-center justify-between gap-3"><button type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)} className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-slate-200 px-3 text-xs font-bold disabled:opacity-40"><ChevronLeft size={15} />Sebelumnya</button><button type="button" disabled={page >= lastPage} onClick={() => setPage((current) => current + 1)} className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-slate-200 px-3 text-xs font-bold disabled:opacity-40">Berikutnya<ChevronRight size={15} /></button></div>
  </section>;
}
