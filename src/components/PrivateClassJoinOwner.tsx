import { useCallback, useEffect, useState } from "react";
import { Check, Copy, Loader2, Users, X } from "lucide-react";
import http, { getApiError } from "@/lib/http";
import { notify } from "@/lib/notify";

type JoinRequest = { id: number; status: string; name: string; email: string; created_at: string };
type JoinOverview = { code: string | null; capacity: number; approved_count: number; can_join: boolean; requests: JoinRequest[] };

export default function PrivateClassJoinOwner({ packageId }: { packageId: number }) {
  const [overview, setOverview] = useState<JoinOverview | null>(null);
  const [working, setWorking] = useState<number | "code" | null>(null);

  const reload = useCallback(async () => {
    try {
      const response = await http.get<JoinOverview>(`/student/packages/${packageId}/class-joins`);
      setOverview(response.data);
    } catch {
      // Paket mungkin sudah berganti status; tindakan akan memberi pesan yang jelas.
    }
  }, [packageId]);

  useEffect(() => {
    void reload();
    const refresh = () => { if (document.visibilityState === "visible") void reload(); };
    window.addEventListener("focus", refresh);
    window.addEventListener("bimbelku:data-changed", refresh);
    return () => { window.removeEventListener("focus", refresh); window.removeEventListener("bimbelku:data-changed", refresh); };
  }, [reload]);

  const createCode = async () => {
    setWorking("code");
    try {
      await http.post(`/student/packages/${packageId}/class-code`);
      await reload();
    } catch (error) {
      notify.error(getApiError(error, "Kode kelas belum dapat dibuat."));
    } finally {
      setWorking(null);
    }
  };

  const decide = async (requestId: number, decision: "approve" | "reject") => {
    setWorking(requestId);
    try {
      const response = await http.post(`/student/packages/${packageId}/class-joins/${requestId}/decision`, { decision });
      notify.success(response.data.message);
      await reload();
    } catch (error) {
      notify.error(getApiError(error, "Permintaan belum dapat diproses."));
    } finally {
      setWorking(null);
    }
  };

  if (!overview?.can_join) return null;
  const pending = overview.requests.filter((entry) => entry.status === "pending");
  const approved = overview.requests.filter((entry) => entry.status === "approved");

  return (
    <section className="mx-4 mb-5 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4 sm:mx-6 sm:p-5" aria-label="Peserta privat bersama">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-indigo-700"><Users size={18} /></span>
        <div className="min-w-0">
          <h3 className="font-black text-slate-900">Undang teman ke kelas</h3>
          <p className="mt-1 text-xs leading-5 text-slate-600">Bagikan kode hanya kepada peserta paket. Mereka memasukkannya di Kelas Saya; jadwal terbuka setelah kamu menyetujui. Absen dan konfirmasi sesi tetap dilakukan akun pemesan.</p>
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        {overview.code ? <>
          <code className="min-w-0 rounded-xl border border-indigo-200 bg-white px-4 py-3 text-center text-base font-black tracking-[.18em] text-indigo-900">{overview.code}</code>
          <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(overview.code!); notify.success("Kode kelas disalin."); } catch { notify.error("Salin kode secara manual dari kotak di sebelahnya."); } }} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-white px-4 text-xs font-black text-indigo-700"><Copy size={15} /> Salin kode</button>
        </> : <button type="button" disabled={working === "code"} onClick={() => void createCode()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-xs font-black text-white disabled:opacity-60">{working === "code" && <Loader2 size={15} className="animate-spin" />} Buat kode kelas</button>}
        <span className="text-xs font-bold text-slate-600">{overview.approved_count}/{overview.capacity} tempat terisi</span>
        <button type="button" onClick={() => void reload()} className="min-h-10 rounded-lg border border-indigo-200 bg-white px-3 text-xs font-black text-indigo-700">Perbarui permintaan</button>
      </div>
      {pending.length > 0 && <div className="mt-4 space-y-2"><p className="text-xs font-black uppercase tracking-wider text-amber-800">Menunggu persetujuan ({pending.length})</p>{pending.map((entry) => <div key={entry.id} className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="break-words text-sm font-black text-slate-900">{entry.name}</p><p className="break-all text-xs text-slate-500">{entry.email}</p></div><div className="flex gap-2"><button type="button" disabled={working === entry.id || overview.approved_count >= overview.capacity} onClick={() => void decide(entry.id, "approve")} className="inline-flex min-h-10 flex-1 items-center justify-center gap-1 rounded-lg bg-emerald-600 px-3 text-xs font-black text-white disabled:opacity-50"><Check size={15} /> Setujui</button><button type="button" disabled={working === entry.id} onClick={() => void decide(entry.id, "reject")} className="inline-flex min-h-10 flex-1 items-center justify-center gap-1 rounded-lg border border-rose-200 bg-white px-3 text-xs font-black text-rose-700 disabled:opacity-50"><X size={15} /> Tolak</button></div></div>)}</div>}
      {approved.length > 0 && <div className="mt-4"><p className="text-xs font-black uppercase tracking-wider text-slate-500">Sudah bergabung</p><p className="mt-1 text-xs leading-5 text-slate-700">{approved.map((entry) => entry.name).join(", ")}</p></div>}
    </section>
  );
}
