import { FormEvent, useCallback, useEffect, useState } from "react";
import { KeyRound, Loader2 } from "lucide-react";
import http, { getApiError } from "@/lib/http";
import { notify } from "@/lib/notify";

type JoinStatus = { id: number; status: string; package_code: string; package_status: string; owner_name: string };

export default function PrivateClassJoinEntry() {
  const [code, setCode] = useState("");
  const [joins, setJoins] = useState<JoinStatus[]>([]);
  const [working, setWorking] = useState(false);

  const reload = useCallback(async () => {
    try {
      const response = await http.get<JoinStatus[]>("/student/class-joins");
      setJoins(Array.isArray(response.data) ? response.data : []);
    } catch {
      // Jadwal kelas tetap bisa dimuat meskipun daftar permintaan gagal.
    }
  }, []);

  useEffect(() => {
    void reload();
    const refresh = () => { if (document.visibilityState === "visible") void reload(); };
    window.addEventListener("focus", refresh);
    const timer = window.setInterval(refresh, 30000);
    return () => { window.removeEventListener("focus", refresh); window.clearInterval(timer); };
  }, [reload]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = code.replace(/\s/g, "").toUpperCase();
    if (!/^[A-Z0-9]{12}$/.test(normalized)) { notify.error("Kode kelas harus terdiri dari 12 karakter huruf atau angka."); return; }
    setWorking(true);
    try {
      const response = await http.post("/student/class-joins", { code: normalized });
      notify.success(response.data.message);
      setCode("");
      await reload();
      window.dispatchEvent(new Event("bimbelku:data-changed"));
    } catch (error) {
      notify.error(getApiError(error, "Kode belum dapat diproses."));
    } finally {
      setWorking(false);
    }
  };

  return <section className="rounded-[1.5rem] border border-indigo-100 bg-white p-4 shadow-sm sm:p-5" aria-label="Gabung privat bersama teman">
    <div className="flex items-start gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-700"><KeyRound size={18} /></span><div><h2 className="font-black text-slate-900">Punya kode kelas dari teman?</h2><p className="mt-1 text-xs leading-5 text-slate-500">Masukkan kode privat bersama. Pemesan akan meninjau permintaanmu sebelum jadwal ditampilkan.</p></div></div>
    <form onSubmit={submit} className="mt-4 flex flex-col gap-2 sm:flex-row"><label htmlFor="private-class-code" className="sr-only">Kode kelas</label><input id="private-class-code" autoComplete="off" inputMode="text" maxLength={16} value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder="Kode kelas 12 karakter" className="min-h-11 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold uppercase tracking-wider text-slate-900 outline-none focus:border-indigo-500" /><button type="submit" disabled={working} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-black text-white disabled:opacity-50">{working && <Loader2 size={16} className="animate-spin" />} Minta bergabung</button></form>
    {joins.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{joins.map((join) => <span key={join.id} className={`rounded-lg px-3 py-2 text-xs font-bold ${join.status === "approved" ? "bg-emerald-50 text-emerald-800" : join.status === "pending" ? "bg-amber-50 text-amber-800" : "bg-slate-100 text-slate-600"}`}>{join.package_code} · {join.owner_name} · {join.status === "approved" ? "Tergabung" : join.status === "pending" ? "Menunggu pemesan" : "Ditolak"}</span>)}</div>}
    <p className="mt-3 text-xs leading-5 text-slate-500">Peserta yang bergabung dapat melihat jadwal dan tautan kelas. Absen serta konfirmasi hasil sesi hanya dilakukan oleh akun pemesan.</p>
  </section>;
}
