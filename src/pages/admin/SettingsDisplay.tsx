import { notify } from "@/lib/notify";
import http, { clearApiCache, getApiError } from "@/lib/http";
import { useState, useEffect, useRef } from "react";
import AdminLayout from "../../components/AdminLayout";
import { Image, Upload, Save, Loader2, Info } from "lucide-react";
import { useConfirmDialog } from "@/components/ConfirmDialogProvider";
import { validateUpload } from "@/lib/validation";
import { Link } from "react-router-dom";

export default function SettingsDisplay() {
  const confirm = useConfirmDialog();
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [coverStatus, setCoverStatus] = useState<{ teacher_count: number; custom_cover_count: number } | null>(null);
  const [isApplyingDefault, setIsApplyingDefault] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewObjectUrlRef = useRef<string | null>(null);

  // Ambil gambar saat ini
  useEffect(() => {
    fetchCurrentCover();
    fetchCoverStatus();
    return () => {
      if (previewObjectUrlRef.current) URL.revokeObjectURL(previewObjectUrlRef.current);
    };
  }, []);

  const fetchCurrentCover = async () => {
    try {
      const res = await http.get<{ url: string | null }>("/settings/teacher-cover");
      setPreview(res.data.url);
    } catch (error) {
      notify.error(getApiError(error, "Sampul tutor belum dapat dimuat."));
    } finally {
      setIsFetching(false);
    }
  };

  const fetchCoverStatus = async () => {
    try {
      const res = await http.get<{ teacher_count: number; custom_cover_count: number }>("/admin/settings/teacher-cover/status");
      setCoverStatus(res.data);
    } catch (error) {
      notify.error(getApiError(error, "Status sampul tutor belum dapat dimuat."));
    }
  };

  const applyDefaultToTeachers = async () => {
    if (!coverStatus?.custom_cover_count) return;
    const approved = await confirm({
      title: "Tampilkan sampul default pada semua tutor?",
      description: `${coverStatus.custom_cover_count} tutor yang memakai sampul pribadi akan beralih ke sampul default. Foto pribadi mereka tetap tersimpan dan bisa dipakai lagi.`,
      confirmText: "Terapkan sampul default",
      tone: "primary",
    });
    if (!approved) return;

    setIsApplyingDefault(true);
    try {
      const res = await http.post<{ message: string; updated_count: number }>("/admin/settings/teacher-cover/apply-default");
      notify.success(`${res.data.message} ${res.data.updated_count} tutor diperbarui.`);
      await fetchCoverStatus();
    } catch (error) {
      notify.error(getApiError(error, "Sampul default gagal diterapkan ke tutor."));
    } finally {
      setIsApplyingDefault(false);
    }
  };

  const optimizeCoverImage = async (selected: File): Promise<File> => {
    const sourceUrl = URL.createObjectURL(selected);
    try {
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const element = new window.Image();
        element.onload = () => resolve(element);
        element.onerror = () => reject(new Error("Gambar tidak dapat dibaca."));
        element.src = sourceUrl;
      });

      const maxWidth = 1600;
      const maxHeight = 900;
      const ratio = Math.min(1, maxWidth / image.naturalWidth, maxHeight / image.naturalHeight);
      const width = Math.max(1, Math.round(image.naturalWidth * ratio));
      const height = Math.max(1, Math.round(image.naturalHeight * ratio));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) return selected;
      context.drawImage(image, 0, 0, width, height);

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, "image/webp", 0.82);
      });
      if (!blob || blob.size >= selected.size) return selected;

      return new File([blob], "sampul-tutor.webp", {
        type: "image/webp",
        lastModified: Date.now(),
      });
    } finally {
      URL.revokeObjectURL(sourceUrl);
    }
  };

  // Handle pilih file dan kecilkan gambar sebelum dikirim.
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (!selected) return;

    const error = validateUpload(selected, {
      label: "Sampul tutor",
      maxSizeMb: 10,
      extensions: ["jpg", "jpeg", "png", "webp"],
    });
    if (error) {
      notify.error(error);
      event.target.value = "";
      return;
    }

    try {
      const optimized = await optimizeCoverImage(selected);
      if (optimized.size > 5 * 1024 * 1024) {
        notify.error("Sampul masih lebih dari 5 MB setelah diperkecil. Pilih foto dengan resolusi lebih rendah.");
        event.target.value = "";
        return;
      }
      setFile(optimized);
      if (previewObjectUrlRef.current) URL.revokeObjectURL(previewObjectUrlRef.current);
      const objectUrl = URL.createObjectURL(optimized);
      previewObjectUrlRef.current = objectUrl;
      setPreview(objectUrl);
      if (optimized.size < selected.size) {
        notify.success("Gambar diperkecil agar halaman tutor lebih ringan.");
      }
    } catch {
      notify.error("Gambar tidak dapat diproses. Pilih file lain.");
      event.target.value = "";
    }
  };

  // Handle Upload
  const handleSave = async () => {
    if (!file) return notify.error("Pilih gambar baru dulu.");

    const approved = await confirm({
      title: "Ganti sampul default tutor?",
      description: "Gambar ini tampil pada profil tutor yang belum mempunyai sampul khusus. Sampul khusus milik tutor tidak ditimpa.",
      confirmText: "Ya, ganti sampul",
      tone: "primary",
    });
    if (!approved) return;

    setIsLoading(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await http.post<{ url: string }>("/admin/settings/teacher-cover", formData);
      notify.success("Sampul tutor berhasil diperbarui.");
      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(previewObjectUrlRef.current);
        previewObjectUrlRef.current = null;
      }
      setPreview(res.data.url); // Update preview dari server
      clearApiCache("/settings/teacher-cover");
      setFile(null); // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      notify.error(getApiError(error, "Sampul tutor gagal diunggah."));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout title="Tampilan Tutor">
      <div className="min-w-0 max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Card Upload */}
        <div className="min-w-0 rounded-[2rem] border border-slate-100 bg-white p-5 shadow-xl sm:p-8">
            
            <div className="flex items-start gap-4 mb-8">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
                    <Image size={24}/>
                </div>
                <div>
                    <h3 className="text-xl font-bold text-slate-900">Sampul Default Tutor</h3>
                    <p className="text-slate-500 text-sm mt-1">Gambar ini menjadi latar profil tutor yang memilih sampul default.</p>
                    <p className="mt-2 text-xs leading-5 text-slate-600">Untuk mengganti sampul tutor tertentu, buka <Link to="/admin/users" className="font-bold text-indigo-700 underline underline-offset-2">Manajemen Akun Pengguna</Link>, pilih tab Tutor, lalu buka detailnya.</p>
                </div>
            </div>

            {/* Preview Area */}
            <div className="group relative mb-6 h-48 w-full min-w-0 overflow-hidden rounded-3xl border-2 border-dashed border-slate-200 bg-slate-100 sm:h-64">
                {isFetching ? (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <Loader2 className="animate-spin" />
                    </div>
                ) : preview ? (
                    <img src={preview} alt="Pratinjau sampul tutor" loading="lazy" decoding="async" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                        <Image size={48} className="mb-2 opacity-50"/>
                        <span className="text-sm font-medium">Belum ada gambar</span>
                    </div>
                )}

                {/* Overlay Hover */}
                <button type="button" aria-label="Pilih gambar sampul tutor" className="absolute inset-0 flex items-center justify-center bg-slate-900/50 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
                     onClick={() => fileInputRef.current?.click()}>
                    <div className="bg-white/20 backdrop-blur-md text-white px-6 py-3 rounded-full font-bold flex items-center gap-2 border border-white/30">
                        <Upload size={18}/> Ganti Gambar
                    </div>
                </button>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs font-medium leading-5 text-slate-500">
                    <Info size={14}/> Rekomendasi: 1600 × 900 piksel; foto akan diperkecil otomatis sebelum disimpan.
                </div>

                <div className="flex min-w-0 flex-col gap-3 sm:flex-row">
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept=".jpg,.jpeg,.png,.webp"
                        onChange={handleFileChange}
                    />
                    
                    {file && (
                         <button 
                            type="button"
                            onClick={handleSave} 
                            disabled={isLoading}
                            className="flex min-h-11 min-w-0 items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3 font-bold text-white shadow-lg shadow-slate-200 transition hover:bg-slate-800 disabled:opacity-50"
                        >
                            {isLoading ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>}
                            Simpan Perubahan
                        </button>
                    )}
                </div>
            </div>
            {file && <p role="status" className="mt-3 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-bold leading-5 text-orange-900">Ini baru pratinjau. Tekan “Simpan Perubahan” agar sampul default benar-benar diperbarui.</p>}

            {coverStatus && <div className="mt-5 rounded-2xl border border-indigo-100 bg-indigo-50 p-4 text-sm text-indigo-950">
                <p className="font-black">Sampul yang terlihat pada profil tutor</p>
                <p className="mt-1 leading-6">{coverStatus.custom_cover_count} dari {coverStatus.teacher_count} tutor masih memakai sampul pribadi, sehingga perubahan default belum terlihat pada profil mereka.</p>
                {coverStatus.custom_cover_count > 0 && <button type="button" disabled={isApplyingDefault || Boolean(file)} onClick={() => void applyDefaultToTeachers()} className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-indigo-900 px-4 py-2 text-center text-xs font-black text-white disabled:opacity-50 sm:w-auto">{isApplyingDefault ? "Menerapkan…" : `Terapkan default ke ${coverStatus.custom_cover_count} tutor`}</button>}
                {file && <p className="mt-2 text-xs font-bold">Simpan gambar baru dulu sebelum menerapkannya ke tutor.</p>}
            </div>}

        </div>
        <div className="mt-7 rounded-2xl border border-teal-200 bg-teal-50 p-5"><p className="font-black text-teal-950">Kelola foto dan profil Kenali Tutor di halaman terpisah</p><p className="mt-2 text-sm leading-6 text-teal-800">Sampul default di atas tidak sama dengan foto kartu tutor publik. Daftar tutor, izin, filter, dan persetujuan tampil kini dikelola sendiri agar lebih mudah dicari.</p><Link to="/admin/public-tutors" className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-teal-800 px-4 text-sm font-black text-white">Buka Tutor Publik</Link></div>
      </div>
    </AdminLayout>
  );
}
