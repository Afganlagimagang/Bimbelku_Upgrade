import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, FileImage, Loader2, RefreshCw, Save } from "lucide-react";
import { Link } from "react-router-dom";

import AdminLayout from "@/components/AdminLayout";
import WebsiteTutorGalleryEditor from "@/components/WebsiteTutorGalleryEditor";
import http, { clearApiCache, getApiError } from "@/lib/http";
import { notify } from "@/lib/notify";

type MediaKey = "logo" | "logo_light" | "logo_dark" | "favicon" | "social_share_image" | "hero_desktop_image" | "hero_mobile_image";
type MediaUrls = Record<`${MediaKey}_url`, string | null>;
type ActivePreview = { url: string | null; source: string };

function activePreview(key: MediaKey, media: Partial<MediaUrls>): ActivePreview {
  const saved = media[`${key}_url`];
  if (saved) return { url: saved, source: "Foto tersimpan di admin" };

  if (key === "logo_light" || key === "logo_dark") {
    if (media.logo_url) return { url: media.logo_url, source: "Mengikuti logo utama" };
    return { url: null, source: "Header/footer memakai ikon bawaan" };
  }
  if (key === "logo") return { url: "/logo_bimbel.png", source: "Logo buku bawaan untuk metadata; header memakai ikon jika slot kosong" };
  if (key === "favicon") return { url: "/logo_bimbel.png", source: "Aset bawaan dari tab browser" };
  if (key === "social_share_image") return { url: "/logo_bimbel.png", source: "Gambar bawaan; beranda bisa memakai foto hero" };
  if (key === "hero_desktop_image") return { url: "/hero-bimbelku-character-v2.webp", source: "Aset hero desktop bawaan" };
  if (key === "hero_mobile_image") return { url: "/hero-bimbelku-character-mobile-optimized.webp", source: "Aset hero mobile bawaan" };
  return { url: null, source: "Belum ada foto" };
}

const mediaItems: { key: MediaKey; label: string; detail: string; accept: string; maxMb: number }[] = [
  { key: "logo", label: "Logo utama", detail: "Identitas utama website", accept: ".jpg,.jpeg,.png,.webp", maxMb: 2 },
  { key: "logo_light", label: "Logo untuk latar gelap", detail: "Dipakai ketika latar gelap", accept: ".jpg,.jpeg,.png,.webp", maxMb: 2 },
  { key: "logo_dark", label: "Logo untuk latar terang", detail: "Dipakai ketika latar terang", accept: ".jpg,.jpeg,.png,.webp", maxMb: 2 },
  { key: "favicon", label: "Favicon", detail: "Ikon kecil pada tab browser", accept: ".png,.ico", maxMb: 0.5 },
  { key: "social_share_image", label: "Gambar saat tautan dibagikan", detail: "Rasio sekitar 1200 × 630", accept: ".jpg,.jpeg,.png,.webp", maxMb: 3 },
  { key: "hero_desktop_image", label: "Hero desktop", detail: "Foto horizontal di beranda", accept: ".jpg,.jpeg,.png,.webp", maxMb: 3 },
  { key: "hero_mobile_image", label: "Hero mobile", detail: "Foto yang disesuaikan untuk ponsel", accept: ".jpg,.jpeg,.png,.webp", maxMb: 3 },
];

export default function WebsiteMediaSettings() {
  const [media, setMedia] = useState<Partial<MediaUrls>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [savingKey, setSavingKey] = useState<MediaKey | null>(null);

  const loadMedia = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const { data } = await http.get<{ media: MediaUrls }>("/admin/website-media");
      if (!data?.media || typeof data.media !== "object") throw new Error("Data gambar website tidak lengkap.");
      setMedia(data.media);
    } catch (error) {
      const message = getApiError(error, "Gambar website belum dapat dimuat.");
      setLoadError(message);
      notify.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadMedia(); }, [loadMedia]);

  const save = async (key: MediaKey, file: File) => {
    setSavingKey(key);
    const payload = new FormData();
    payload.append(key, file);
    try {
      const { data } = await http.post<{ message: string; media: MediaUrls }>("/admin/website-media", payload);
      setMedia(data.media);
      clearApiCache("/website-content");
      window.dispatchEvent(new Event("bimbelku:website-content-changed"));
      notify.success(data.message);
      return true;
    } catch (error) {
      notify.error(getApiError(error, "Foto belum dapat disimpan."));
      return false;
    } finally {
      setSavingKey(null);
    }
  };

  return <AdminLayout title="Media Website" subtitle="Logo dan foto publik dikelola terpisah dari teks landing page.">
    <div className="mx-auto max-w-6xl space-y-6 pb-16">
      <header className="flex flex-col gap-4 rounded-3xl border border-stone-200 bg-[#FFFBF7] p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8"><div><p className="text-xs font-black uppercase tracking-[.16em] text-orange-700">Galeri website publik</p><h1 className="mt-2 text-3xl font-black text-[#14213D]">Lihat foto aktif sebelum menggantinya.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">Setiap slot disimpan sendiri. Memilih file belum mengubah website sampai tombol Simpan foto ditekan.</p></div><Link to="/admin/website" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-4 text-sm font-bold text-[#14213D]">Kelola teks landing page <ArrowRight size={16} /></Link></header>
      <WebsiteTutorGalleryEditor />
      <p className="rounded-2xl border border-teal-200 bg-teal-50 p-4 text-sm leading-6 text-teal-900">Untuk pengisian cepat dari akun, tutor harus memberi izin profil publik dan disetujui admin. <Link to="/admin/public-tutors" className="font-black underline">Kelola persetujuan tutor publik</Link>.</p>
      {loading ? <div className="grid min-h-64 place-items-center"><Loader2 className="animate-spin text-orange-700" /></div> : loadError ? <div role="alert" className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-900"><p className="font-black">Data media gagal dimuat</p><p className="mt-2 text-sm">{loadError}</p><button type="button" onClick={() => void loadMedia()} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#14213D] px-4 text-sm font-black text-white"><RefreshCw size={16} />Coba muat ulang</button></div> : <div className="grid gap-5 lg:grid-cols-2">{mediaItems.map((item) => <MediaCard key={item.key} item={item} active={activePreview(item.key, media)} saving={savingKey === item.key} disabled={savingKey !== null} onSave={save} />)}</div>}
    </div>
  </AdminLayout>;
}

function MediaCard({ item, active, saving, disabled, onSave }: {
  item: (typeof mediaItems)[number]; active: ActivePreview; saving: boolean; disabled: boolean;
  onSave: (key: MediaKey, file: File) => Promise<boolean>;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!file) { setPreview(null); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const choose = (selected?: File) => {
    if (!selected) return;
    if (selected.size > item.maxMb * 1024 * 1024) {
      notify.error(`Ukuran ${item.label} maksimal ${item.maxMb} MB.`);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    setFile(selected);
  };

  return <section className="min-w-0 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm"><div className="flex items-start gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-orange-100 text-orange-700"><FileImage size={19} /></span><div><h2 className="font-black text-[#14213D]">{item.label}</h2><p className="mt-1 text-xs leading-5 text-slate-500">{item.detail} · maks. {item.maxMb} MB</p></div></div>
    <div className="mt-5 grid grid-cols-2 gap-3"><PhotoPreview label="Yang digunakan saat ini" src={active.url} /><PhotoPreview label="Pengganti belum disimpan" src={preview} /></div>
    <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold leading-5 text-slate-600">Sumber saat ini: {active.source}</p>
    <label className="mt-4 block text-xs font-bold text-slate-700">Pilih file pengganti<input ref={inputRef} type="file" accept={item.accept} onChange={(event) => choose(event.target.files?.[0])} className="mt-2 block w-full min-w-0 text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-orange-100 file:px-3 file:py-2 file:font-bold file:text-orange-800" /></label>
    <button type="button" disabled={!file || disabled} onClick={async () => { if (file && await onSave(item.key, file)) { setFile(null); if (inputRef.current) inputRef.current.value = ""; } }} className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#14213D] px-4 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50">{saving ? <Loader2 size={17} className="animate-spin" /> : <Save size={17} />}Simpan foto</button>
  </section>;
}

function PhotoPreview({ label, src }: { label: string; src?: string | null }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => { setFailed(false); }, [src]);
  return <div className="min-w-0"><p className="mb-2 text-[11px] font-black uppercase tracking-wide text-slate-500">{label}</p><div className="grid aspect-[4/3] place-items-center overflow-hidden rounded-2xl border border-dashed border-stone-200 bg-stone-50">{src && !failed ? <img src={src} alt={label} loading="lazy" decoding="async" onError={() => setFailed(true)} className="h-full w-full object-contain" /> : <span className="px-2 text-center text-xs font-semibold text-slate-400">{failed ? "Gambar gagal dibuka. Periksa URL atau server media." : "Belum ada foto"}</span>}</div>{failed && src && <a href={src} target="_blank" rel="noreferrer" className="mt-1 block break-all text-[11px] font-bold text-orange-700 underline">Buka URL gambar</a>}</div>;
}
