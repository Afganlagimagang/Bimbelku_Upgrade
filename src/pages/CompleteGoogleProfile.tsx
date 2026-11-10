import { useState, type ReactNode } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, BookOpenCheck, Check, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import http, { getApiError } from "@/lib/http";
import { notify } from "@/lib/notify";

export default function CompleteGoogleProfile() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = safeRedirect(params.get("redirect"));
  const [loading, setLoading] = useState(false);
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);

  const finish = async () => {
    if (loading || !terms || !privacy) return;
    setLoading(true);
    try {
      const response = await http.post("/auth/google/complete-profile", { terms_accepted: terms, privacy_accepted: privacy });
      localStorage.setItem("user", JSON.stringify(response.data.user));
      notify.success("Akun Google berhasil disiapkan. Lengkapi profil saat siap.");
      if (redirect) {
        navigate(redirect, { replace: true });
      } else {
        const pending = await http.get("/student/guest-packages/pending").catch(() => null);
        const code = pending?.data?.data?.[0]?.code;
        navigate(code ? `/pesanan/${encodeURIComponent(code)}` : "/student/profile?welcome=google", { replace: true });
      }
    } catch (error) { notify.error(getApiError(error, "Akun belum dapat disiapkan.")); }
    finally { setLoading(false); }
  };

  return (
    <main className="min-h-dvh bg-[#f7f1e8] px-4 py-5 text-[#14213d] sm:px-6 sm:py-8 lg:grid lg:place-items-center lg:py-12">
      <div className="mx-auto w-full max-w-4xl">
        <header className="mb-5 flex items-center justify-between gap-3 sm:mb-6">
          <Link to="/" aria-label="BimbelKu, kembali ke beranda" className="inline-flex min-h-11 items-center gap-2.5 rounded-xl font-extrabold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 focus-visible:ring-offset-4">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#14213d] text-[#f6ba89]"><BookOpenCheck size={21} /></span>
            <span className="text-lg tracking-tight">Bimbel<span className="text-orange-700">Ku</span></span>
          </Link>
          <span className="rounded-full border border-[#e5d9ca] bg-white/70 px-3 py-2 text-[11px] font-bold text-slate-600">Langkah 2 dari 2</span>
        </header>

        <div className="overflow-hidden rounded-[1.5rem] border border-[#e7ded2] bg-white shadow-[0_12px_40px_-16px_rgba(20,33,61,0.2)] sm:rounded-[2rem] lg:grid lg:grid-cols-[0.9fr_1.1fr]">
          <aside className="relative overflow-hidden bg-[#14213d] p-5 text-white sm:p-7 lg:flex lg:flex-col lg:p-9">
            <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full border border-white/10" />
            <div aria-hidden="true" className="pointer-events-none absolute -right-6 -top-10 h-32 w-32 rounded-full border border-[#f6ba89]/20" />
            <div className="relative flex items-center gap-2 text-xs font-bold text-[#c3e8d7]"><ShieldCheck size={17} className="shrink-0" />Email terverifikasi oleh Google</div>
            <h2 className="relative mt-3 max-w-xs text-xl font-extrabold leading-snug tracking-tight sm:text-2xl lg:mt-8 lg:text-3xl">Tinggal satu langkah lagi.</h2>
            <p className="relative mt-2 max-w-sm text-[13px] leading-6 text-slate-300 lg:mt-4 lg:text-sm">Setujui ketentuan akun, lalu mulai perjalanan belajarmu.</p>
            <ul className="relative mt-8 hidden space-y-5 lg:block">
              {["Pesanan dengan email yang sama dapat dihubungkan", "Profil sekolah dan alamat bisa dilengkapi nanti", "Lokasi diperlukan saat memilih kelas tatap muka"].map((item) => <li key={item} className="flex items-start gap-3 text-sm leading-6 text-slate-200"><Check size={17} className="mt-1 shrink-0 text-[#f6ba89]" /><span>{item}</span></li>)}
            </ul>
            <BookOpenCheck aria-hidden="true" size={64} strokeWidth={1} className="relative mt-auto hidden pt-8 text-[#f6ba89]/50 lg:block lg:h-28 lg:w-20" />
          </aside>

          <section aria-labelledby="consent-title" className="p-5 sm:p-7 lg:p-9">
            <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-orange-700">Persetujuan akun</p>
            <h1 id="consent-title" className="mt-2 text-2xl font-extrabold leading-tight tracking-tight sm:text-[1.75rem]">Siap mulai belajar?</h1>
            <p className="mt-3 text-sm leading-6 text-slate-500">Baca dan setujui kedua kebijakan berikut untuk mengaktifkan akunmu.</p>

            <div className="mt-5 space-y-3">
              <Consent checked={terms} onChange={setTerms} disabled={loading}>
                <span className="block text-xs font-medium text-slate-500">Saya menyetujui</span>
                <Link className="mt-0.5 inline-block font-bold text-[#14213d] underline decoration-slate-300 underline-offset-4 hover:text-orange-700 focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600" to="/terms" target="_blank" rel="noopener noreferrer">Syarat dan Ketentuan<span className="sr-only"> (buka di tab baru)</span></Link>
              </Consent>
              <Consent checked={privacy} onChange={setPrivacy} disabled={loading}>
                <span className="block text-xs font-medium text-slate-500">Saya menyetujui</span>
                <Link className="mt-0.5 inline-block font-bold text-[#14213d] underline decoration-slate-300 underline-offset-4 hover:text-orange-700 focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600" to="/privacy" target="_blank" rel="noopener noreferrer">Kebijakan Privasi<span className="sr-only"> (buka di tab baru)</span></Link>
              </Consent>
            </div>

            <p aria-live="polite" className="mt-4 text-xs leading-5 text-slate-500">{terms && privacy ? "Kedua persetujuan sudah dipilih. Kamu bisa melanjutkan." : "Centang kedua persetujuan untuk melanjutkan."}</p>
            <Button type="button" onClick={finish} disabled={loading || !terms || !privacy} aria-busy={loading} className="mt-4 min-h-[3.25rem] w-full rounded-xl bg-[#df622b] px-4 py-4 text-sm font-extrabold text-white shadow-none hover:bg-[#c44f1d] disabled:bg-slate-200 disabled:text-slate-500 disabled:opacity-100">
              {loading ? <Loader2 className="animate-spin" size={18} /> : null}
              {loading ? "Menyiapkan akun..." : "Setuju & lanjutkan"}
              {!loading && <ArrowRight size={18} />}
            </Button>
            <p className="mt-4 text-center text-xs leading-5 text-slate-500">Data sekolah dan alamat bisa diisi nanti di Profil.</p>
          </section>
        </div>

        <Link to="/" className="mx-auto mt-4 flex min-h-11 w-fit items-center gap-2 rounded-lg px-3 text-xs font-bold text-slate-500 hover:text-[#14213d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600"><ArrowLeft size={14} />Kembali ke beranda</Link>
      </div>
    </main>
  );
}

function Consent({ checked, onChange, disabled, children }: { checked: boolean; onChange: (value: boolean) => void; disabled: boolean; children: ReactNode }) {
  return <label className={`flex min-h-[4.5rem] cursor-pointer items-center gap-3 rounded-xl border p-3.5 text-sm leading-6 transition-colors focus-within:ring-2 focus-within:ring-orange-600/30 ${checked ? "border-orange-300 bg-orange-50/70" : "border-slate-200 bg-white hover:border-orange-200"} ${disabled ? "cursor-wait" : ""}`}><Checkbox checked={checked} onCheckedChange={(value) => onChange(value === true)} disabled={disabled} className="h-5 w-5 rounded-md border-2 border-slate-300 data-[state=checked]:border-orange-600 data-[state=checked]:bg-orange-600" /><span className="min-w-0">{children}</span></label>;
}
function safeRedirect(value: string | null) { if (!value?.startsWith("/") || value.startsWith("//")) return null; const path = value.split(/[?#]/, 1)[0]; return path === "/search" || path === "/payment" || path.startsWith("/student/") || path.startsWith("/pesanan/") ? value : null; }
