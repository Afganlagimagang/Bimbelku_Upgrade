import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Loader2, ShieldAlert } from "lucide-react";
import TeacherLayout from "@/components/TeacherLayout";
import { TeacherBankSettings } from "@/pages/teacher/TeacherBankSettings";
import http, { getApiError } from "@/lib/http";

type SalarySnapshot = {
  balances: { available: number };
  withholding_tax_percent: number;
  bank: { is_complete: boolean; payout_hold_until?: string | null };
  bank_name_validation_available: boolean;
  payout_available: boolean;
  payout_unavailable_reason?: string | null;
};

const rupiah = (value: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);

export default function TeacherPayoutDestination() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const hasAmount = searchParams.has("amount");
  const amount = Number(searchParams.get("amount"));
  const [salary, setSalary] = useState<SalarySnapshot | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const response = await http.get<SalarySnapshot>("/teacher/salary");
      setSalary(response.data);
      setError("");
    } catch (cause) {
      setError(getApiError(cause, "Data pencairan belum dapat dimuat."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const validAmount = Number.isInteger(amount) && amount >= 10_000 && amount <= (salary?.balances.available || 0);
  const tax = Math.round(amount * (salary?.withholding_tax_percent || 0) / 100);

  return <TeacherLayout title="Tujuan pencairan"><main className="mx-auto max-w-6xl space-y-5 pb-12 sm:space-y-7">
    <Link to="/guru/dompet" className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-900"><ArrowLeft size={16} /> Kembali ke dompet</Link>
    <header className="rounded-[1.75rem] bg-slate-950 p-5 text-white sm:p-7">
      <p className="text-xs font-black uppercase tracking-[.18em] text-emerald-300">Langkah 2 · Rekening tujuan</p>
      <h1 className="mt-2 text-2xl font-black sm:text-3xl">{hasAmount ? "Periksa tujuan pencairan" : "Rekening tujuan pencairan"}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Periksa bank, nomor rekening, dan nama pemilik sesuai data bank. Nama pemilik rekening dapat berbeda dari nama tampilan akun tutor.</p>
    </header>
    {loading ? <div className="grid min-h-32 place-items-center"><Loader2 className="animate-spin" /></div> : error ? <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</div> : !validAmount ? <div role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{hasAmount ? "Nominal tidak valid atau melebihi saldo tersedia." : "Pilih nominal pencairan di Dompet Tutor terlebih dahulu."} <Link to="/guru/dompet" className="font-bold underline">Pilih nominal pencairan</Link>.</div> : <>
      {hasAmount && <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 text-sm sm:grid-cols-3 sm:p-6">
        <div><p className="text-slate-500">Nominal dipilih</p><p className="mt-1 font-black text-slate-900">{rupiah(amount)}</p></div>
        <div><p className="text-slate-500">Perkiraan potongan pajak</p><p className="mt-1 font-black text-slate-900">{rupiah(tax)}</p></div>
        <div><p className="text-slate-500">Jumlah yang akan ditransfer</p><p className="mt-1 font-black text-emerald-700">{rupiah(amount - tax)}</p></div>
      </section>}
      {!salary?.payout_available && <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><ShieldAlert className="mt-0.5 shrink-0" size={19} /><p>{salary?.payout_unavailable_reason || "Layanan pencairan belum siap. Hubungi admin BimbelKu."}</p></div>}
      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><ShieldAlert className="mt-0.5 shrink-0" size={19} /><p>Kepemilikan rekening belum diverifikasi otomatis. Pastikan tujuan transfer benar sebelum mengonfirmasi pencairan.</p></div>
      <TeacherBankSettings
        payoutAmount={amount}
        payoutAvailable={Boolean(salary?.payout_available)}
        payoutUnavailableMessage={salary?.payout_unavailable_reason || undefined}
        onSaved={() => void load()}
        onPayoutCompleted={() => navigate("/guru/dompet")}
      />
    </>}
  </main></TeacherLayout>;
}
