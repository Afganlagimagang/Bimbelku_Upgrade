import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Clock3, Copy, Loader2, LockKeyhole, MailCheck, ReceiptText } from "lucide-react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { notify } from "@/lib/notify";
import http, { getApiError } from "@/lib/http";

type Status = {
  code: string;
  status: "pending" | "claimed" | "expired" | string;
  quoted_total_amount: number;
  email_hint: string;
  expires_at: string;
  summary?: {
    package_name?: string | null;
    education_level?: string | null;
    grade?: string | null;
    learning_mode?: string | null;
    participant_count?: number;
    session_count?: number;
    subjects?: string[];
  };
};

const rupiah = (value: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value || 0);
const two = (value: number) => String(Math.max(0, value)).padStart(2, "0");

export default function GuestOrderStatus() {
  const { code = "" } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const guestEmail = ((location.state as { email?: string } | null)?.email || "").trim().toLowerCase();
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const token = localStorage.getItem("token");
  const returnTo = `/pesanan/${encodeURIComponent(code)}`;

  useEffect(() => {
    if (code) localStorage.setItem("pending_guest_order_code", code);
    void http.get<Status>(`/guest/packages/${encodeURIComponent(code)}`)
      .then(({ data }) => setStatus(data))
      .catch((requestError) => setError(getApiError(requestError, "Pesanan tidak ditemukan atau sudah tidak tersedia.")))
      .finally(() => setLoading(false));
  }, [code]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const remaining = useMemo(() => {
    if (!status?.expires_at) return 0;
    return Math.max(0, Math.floor((new Date(status.expires_at).getTime() - now) / 1000));
  }, [now, status?.expires_at]);
  const timeLabel = `${two(Math.floor(remaining / 3600))}:${two(Math.floor((remaining % 3600) / 60))}:${two(remaining % 60)}`;

  const continueOrder = async () => {
    setClaiming(true);
    setError("");
    try {
      const { data } = await http.post(`/guest/packages/${encodeURIComponent(code)}/claim`);
      const order = data.order;
      localStorage.removeItem("pending_guest_order_code");
      notify.success(data.message || "Pesanan terhubung ke akun.");
      navigate("/payment", {
        replace: true,
        state: {
          orderId: order.order_id,
          invoiceId: order.order_number,
          tutorName: order.tutor_name,
          subject: order.subject,
          type: order.type,
          price: Number(order.amount),
          subtotalAmount: Number(order.subtotal_amount || order.amount),
          discountAmount: Number(order.discount_amount || 0),
          packageName: order.package_name,
          date: order.scheduled_at,
          paymentDueAt: order.payment_due_at,
          durationHours: Number(order.duration_hours || 1),
          totalLearningHours: Number(order.total_learning_hours || 0),
          orderKind: order.order_kind || "package",
        },
      });
    } catch (requestError) {
      setError(getApiError(requestError, "Pesanan belum dapat dihubungkan ke akun ini."));
    } finally {
      setClaiming(false);
    }
  };

  useEffect(() => {
    if (token && status?.status === "pending" && remaining > 0 && !claiming && !error) void continueOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status?.status, token]);

  const expired = status?.status === "expired" || (status?.status === "pending" && remaining <= 0);

  return <div className="public-site min-h-screen bg-[#F8F6F2]"><Navbar /><main className="mx-auto min-h-[70vh] max-w-[1040px] px-5 py-12 sm:px-8 sm:py-16">
    {loading ? <div className="grid min-h-[50vh] place-items-center"><div className="inline-flex items-center gap-2 font-bold text-slate-600"><Loader2 className="animate-spin" />Memuat pesanan…</div></div> : error && !status ? <EmptyState title="Pesanan belum dapat dilanjutkan" text={error} /> : expired ? <EmptyState title="Waktu penyimpanan pesanan habis" text="Draf disimpan selama satu jam agar harga dan jadwal tidak tertahan tanpa kepastian. Belum ada tagihan atau pencarian tutor yang dibuat." /> : status && <section className="overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-xl shadow-stone-200/60">
      <div className="grid gap-8 bg-[#14213D] p-7 text-white sm:p-10 lg:grid-cols-[1fr_280px] lg:items-center">
        <div><CheckCircle2 className="text-emerald-300" size={38} /><p className="mt-5 text-xs font-black uppercase tracking-[.16em] text-orange-300">Pesanan berhasil disimpan</p><h1 className="mt-2 max-w-2xl text-3xl font-black sm:text-4xl">Satu langkah lagi sebelum pembayaran.</h1><p className="mt-3 max-w-2xl leading-7 text-slate-200">Hubungkan email yang sama ke akun BimbelKu. Pembayaran dan pencarian tutor belum dimulai pada tahap ini.</p></div>
        <div className="rounded-3xl border border-white/10 bg-white/10 p-5"><p className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-orange-200"><Clock3 size={16} />Sisa waktu draf</p><p className="mt-3 font-mono text-3xl font-black tracking-wider">{timeLabel}</p><p className="mt-2 text-xs leading-5 text-slate-300">Sampai {new Date(status.expires_at).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}</p></div>
      </div>

      <div className="grid gap-8 p-6 sm:p-9 lg:grid-cols-[1fr_320px]">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 pb-5"><div><p className="text-xs font-black uppercase tracking-wider text-slate-500">Kode pesanan</p><div className="mt-2 flex items-center gap-2"><code className="break-all text-xl font-black text-[#14213D]">{status.code}</code><button type="button" aria-label="Salin kode pesanan" onClick={() => { void navigator.clipboard.writeText(status.code); notify.success("Kode disalin."); }} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-stone-100"><Copy size={16} /></button></div></div><div className="rounded-2xl bg-orange-50 px-4 py-3 text-right"><p className="text-xs font-bold text-orange-800">Estimasi total</p><p className="mt-1 text-xl font-black text-orange-950">{rupiah(status.quoted_total_amount)}</p></div></div>
          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <Summary label="Paket" value={status.summary?.package_name || "Paket belajar"} />
            <Summary label="Jenjang / kelas" value={[status.summary?.education_level, status.summary?.grade].filter(Boolean).join(" · ") || "-"} />
            <Summary label="Cara belajar" value={status.summary?.learning_mode === "online" ? "Online" : "Tatap muka"} />
            <Summary label="Peserta & sesi" value={`${status.summary?.participant_count || 1} peserta · ${status.summary?.session_count || 0} sesi`} />
          </dl>
          {!!status.summary?.subjects?.length && <div className="mt-5"><p className="text-xs font-black uppercase tracking-wider text-slate-500">Mata pelajaran</p><div className="mt-2 flex flex-wrap gap-2">{status.summary.subjects.map((subject) => <span key={subject} className="rounded-full bg-teal-50 px-3 py-1.5 text-xs font-black text-teal-800">{subject}</span>)}</div></div>}
          <div className="mt-8 grid gap-3 sm:grid-cols-3">{[
            ["1", "Draf tersimpan", "Data dan jadwal sudah tercatat."],
            ["2", "Hubungkan akun", "Masuk dengan email pemesan."],
            ["3", "Bayar & matching", "Tagihan dibuat, lalu tutor dicari."],
          ].map(([number, title, text], index) => <div key={number} className={`rounded-2xl border p-4 ${index === 0 ? "border-emerald-200 bg-emerald-50" : "border-stone-200 bg-stone-50"}`}><span className="grid h-7 w-7 place-items-center rounded-full bg-[#14213D] text-xs font-black text-white">{number}</span><p className="mt-3 text-sm font-black text-slate-900">{title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{text}</p></div>)}</div>
        </div>
        <aside className="h-fit rounded-3xl bg-orange-50 p-6"><LockKeyhole className="text-orange-700" /><h2 className="mt-3 text-xl font-black text-orange-950">Email pemesan: {status.email_hint}</h2><p className="mt-2 text-sm leading-6 text-orange-900">Sistem hanya menghubungkan pesanan ke akun murid aktif dengan email terverifikasi yang sama.</p>{error && <p role="alert" className="mt-4 rounded-xl bg-rose-100 p-3 text-xs font-bold leading-5 text-rose-800">{error}</p>}{token ? <button type="button" disabled={claiming} onClick={() => void continueOrder()} className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#C2410C] px-4 text-sm font-black text-white disabled:opacity-60">{claiming ? <Loader2 className="animate-spin" size={17} /> : <ArrowRight size={17} />}{claiming ? "Menghubungkan…" : "Lanjutkan pembayaran"}</button> : <div className="mt-5 grid gap-2"><Link to={`/login?redirect=${encodeURIComponent(returnTo)}`} state={guestEmail ? { email: guestEmail } : undefined} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#C2410C] px-4 text-sm font-black text-white"><MailCheck size={17} />Masuk dengan email ini</Link><Link to={`/register?redirect=${encodeURIComponent(returnTo)}`} state={guestEmail ? { email: guestEmail } : undefined} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-orange-200 bg-white px-4 text-sm font-black text-orange-900">Belum punya akun? Daftar</Link></div>}<p className="mt-5 flex gap-2 border-t border-orange-200 pt-4 text-xs leading-5 text-orange-800"><ReceiptText className="mt-0.5 shrink-0" size={15} />Harga diperiksa kembali sebelum tagihan dibuat. Jika berubah, sistem tidak akan menagih diam-diam.</p></aside>
      </div>
    </section>}
  </main><Footer /></div>;
}

function Summary({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-stone-200 p-4"><dt className="text-xs font-bold text-slate-500">{label}</dt><dd className="mt-1 font-black text-slate-900">{value}</dd></div>; }
function EmptyState({ title, text }: { title: string; text: string }) { return <section className="mx-auto mt-16 max-w-2xl rounded-3xl border border-amber-200 bg-white p-8 text-center"><Clock3 className="mx-auto text-amber-600" size={38} /><h1 className="mt-4 text-2xl font-black text-slate-950">{title}</h1><p className="mt-3 leading-7 text-slate-600">{text}</p><Link to="/pesan" className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-[#C2410C] px-5 text-sm font-black text-white">Susun pesanan baru</Link></section>; }
