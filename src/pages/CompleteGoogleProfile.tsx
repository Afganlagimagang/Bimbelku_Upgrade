import { FormEvent, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import DateOfBirthInput from "@/components/DateOfBirthInput";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EDUCATION_LEVELS } from "@/lib/educationCatalog";
import http, { getApiError } from "@/lib/http";
import { notify } from "@/lib/notify";
import { sanitizePersonName, sanitizePhoneInput } from "@/lib/validation";

export default function CompleteGoogleProfile() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = safeRedirect(params.get("redirect"));
  const [loading, setLoading] = useState(false);
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [guardianConsent, setGuardianConsent] = useState(false);
  const [form, setForm] = useState({ phone: "", date_of_birth: "", school_name: "", grade: "", guardian_name: "", guardian_phone: "", guardian_relationship: "" });
  const minor = isUnderEighteen(form.date_of_birth);
  const set = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await http.post("/auth/google/complete-profile", {
        ...form, terms_accepted: terms, privacy_accepted: privacy, guardian_consent: guardianConsent,
      });
      localStorage.setItem("user", JSON.stringify(response.data.user));
      notify.success(response.data.message);
      navigate(redirect || "/student/dashboard", { replace: true });
    } catch (error) {
      notify.error(getApiError(error, "Profil belum dapat disimpan. Periksa kembali data Anda."));
    } finally { setLoading(false); }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-indigo-50 px-4 py-10">
      <form onSubmit={submit} className="mx-auto w-full max-w-2xl space-y-5 rounded-3xl border border-white bg-white p-6 shadow-2xl shadow-slate-200/60 sm:p-9">
        <div><p className="text-xs font-black uppercase tracking-[.2em] text-orange-500">Satu langkah lagi</p><h1 className="mt-2 text-3xl font-black text-slate-900">Lengkapi profil murid</h1><p className="mt-2 text-sm leading-6 text-slate-500">Google sudah memverifikasi email Anda. Data berikut diperlukan untuk keamanan dan layanan belajar.</p></div>
        <Field label="Nomor WhatsApp/telepon"><Input required value={form.phone} onChange={(e) => set("phone", sanitizePhoneInput(e.target.value))} className="h-12 rounded-xl" /></Field>
        <Field label="Tanggal lahir murid"><DateOfBirthInput value={form.date_of_birth} max={today()} onChange={(value) => set("date_of_birth", value)} className="h-12 rounded-xl" /></Field>
        <div className="grid gap-4 sm:grid-cols-2"><Field label="Sekolah (opsional)"><Input value={form.school_name} onChange={(e) => set("school_name", e.target.value)} className="h-12 rounded-xl" /></Field><Field label="Jenjang (opsional)"><Select value={form.grade} onValueChange={(value) => set("grade", value)}><SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Pilih jenjang" /></SelectTrigger><SelectContent>{EDUCATION_LEVELS.map((level) => <SelectItem key={level} value={level}>{level}</SelectItem>)}</SelectContent></Select></Field></div>
        {minor && <div className="space-y-4 rounded-2xl border border-amber-200 bg-amber-50 p-4"><p className="text-sm font-bold text-amber-900">Murid di bawah 18 tahun memerlukan data dan persetujuan orang tua/wali.</p><Field label="Nama orang tua/wali"><Input required value={form.guardian_name} onChange={(e) => set("guardian_name", sanitizePersonName(e.target.value))} className="h-12 rounded-xl bg-white" /></Field><Field label="Nomor orang tua/wali"><Input required value={form.guardian_phone} onChange={(e) => set("guardian_phone", sanitizePhoneInput(e.target.value))} className="h-12 rounded-xl bg-white" /></Field><Field label="Hubungan"><Select value={form.guardian_relationship} onValueChange={(value) => set("guardian_relationship", value)}><SelectTrigger className="h-12 rounded-xl bg-white"><SelectValue placeholder="Pilih hubungan" /></SelectTrigger><SelectContent><SelectItem value="orang_tua">Orang tua</SelectItem><SelectItem value="wali_keluarga">Wali keluarga</SelectItem><SelectItem value="wali_resmi">Wali resmi lainnya</SelectItem></SelectContent></Select></Field><Consent checked={guardianConsent} onChange={setGuardianConsent}>Orang tua/wali menyetujui pendaftaran dan penggunaan layanan BimbelKu.</Consent></div>}
        <div className="space-y-3"><Consent checked={terms} onChange={setTerms}>Saya menyetujui <Link className="font-bold text-indigo-600" to="/terms">Syarat dan Ketentuan</Link>.</Consent><Consent checked={privacy} onChange={setPrivacy}>Saya menyetujui <Link className="font-bold text-indigo-600" to="/privacy">Kebijakan Privasi</Link>.</Consent></div>
        <Button disabled={loading || !terms || !privacy || (minor && !guardianConsent)} className="w-full rounded-xl bg-orange-600 py-6 font-black hover:bg-orange-700">{loading && <Loader2 className="mr-2 animate-spin" size={18} />}Simpan dan masuk</Button>
      </form>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-2"><Label className="font-bold text-slate-700">{label}</Label>{children}</div>; }
function Consent({ checked, onChange, children }: { checked: boolean; onChange: (value: boolean) => void; children: React.ReactNode }) { return <label className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-slate-600"><Checkbox checked={checked} onCheckedChange={(value) => onChange(value === true)} className="mt-1" /><span>{children}</span></label>; }
function isUnderEighteen(value: string) { if (!value) return false; const birth = new Date(`${value}T00:00:00`); const now = new Date(); let age = now.getFullYear() - birth.getFullYear(); const month = now.getMonth() - birth.getMonth(); if (month < 0 || (month === 0 && now.getDate() < birth.getDate())) age--; return age < 18; }
function today() { const date = new Date(); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
function safeRedirect(value: string | null) { if (!value?.startsWith("/") || value.startsWith("//")) return null; const path = value.split(/[?#]/, 1)[0]; return path === "/search" || path === "/payment" || path.startsWith("/student/") ? value : null; }
