import { useEffect, useState } from "react";
import { CalendarClock, CalendarX2, Loader2, Monitor, MapPin } from "lucide-react";
import http, { getApiError } from "@/lib/http";

type Range = { start_time: string; end_time: string };
type ScheduleResponse = {
  weekly: Array<{ day: string; is_active: boolean; ranges: Range[] }>;
  exceptions: Array<{ id: number; start_date: string; end_date: string; reason?: string | null }>;
  upcoming_bookings: Array<{ id: number; subject_name: string; student_name: string; learning_mode: "online" | "offline"; status: string; start_at: string; end_at: string }>;
};

const dateTime = (value: string) => new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(new Date(value));
const date = (value: string) => new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeZone: "Asia/Jakarta" }).format(new Date(value + "T00:00:00+07:00"));

export default function TeacherScheduleAdminPanel({ teacherId }: { teacherId: number }) {
  const [data, setData] = useState<ScheduleResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setData(null);
    setError("");
    const controller = new AbortController();
    void http.get<ScheduleResponse>("/admin/teachers/" + teacherId + "/schedule", { signal: controller.signal })
      .then(({ data: payload }) => setData(payload))
      .catch((reason) => { if (reason?.name !== "CanceledError") setError(getApiError(reason)); });
    return () => controller.abort();
  }, [teacherId]);

  if (error) return <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">{error}</div>;
  if (!data) return <div className="flex items-center justify-center gap-2 rounded-xl bg-slate-50 p-6 text-sm font-bold text-slate-500"><Loader2 className="animate-spin" size={17} />Memuat jadwal tutor…</div>;

  return <div className="space-y-4">
    <div>
      <h5 className="flex items-center gap-2 text-sm font-black text-slate-900"><CalendarClock size={17} className="text-orange-600" />Ketersediaan mingguan</h5>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {data.weekly.map((item) => <div key={item.day} className={"rounded-xl border p-3 " + (item.is_active ? "border-emerald-100 bg-emerald-50/60" : "border-slate-100 bg-slate-50")}>
          <p className="text-xs font-black uppercase tracking-wide text-slate-600">{item.day}</p>
          <p className={"mt-1 text-sm font-bold " + (item.is_active ? "text-emerald-800" : "text-slate-400")}>{item.is_active ? item.ranges.map((range) => range.start_time + "–" + range.end_time).join(", ") : "Tidak tersedia"}</p>
        </div>)}
      </div>
    </div>

    <div>
      <h5 className="flex items-center gap-2 text-sm font-black text-slate-900"><CalendarX2 size={17} className="text-rose-600" />Tanggal tidak tersedia</h5>
      <div className="mt-2 space-y-2">{data.exceptions.length ? data.exceptions.map((item) => <div key={item.id} className="rounded-xl border border-rose-100 bg-rose-50/60 p-3 text-sm"><p className="font-black text-rose-800">{date(item.start_date)}{item.end_date !== item.start_date ? " – " + date(item.end_date) : ""}</p><p className="mt-1 text-xs text-rose-700">{item.reason || "Tidak ada alasan tambahan"}</p></div>) : <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500">Tidak ada tanggal libur mendatang.</p>}</div>
    </div>

    <div>
      <h5 className="flex items-center gap-2 text-sm font-black text-slate-900"><CalendarClock size={17} className="text-indigo-600" />Kelas terjadwal</h5>
      <div className="mt-2 max-h-64 space-y-2 overflow-y-auto pr-1">{data.upcoming_bookings.length ? data.upcoming_bookings.map((item) => <div key={item.id} className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3"><div className="flex items-start justify-between gap-2"><div><p className="text-sm font-black text-slate-900">{item.subject_name}</p><p className="mt-1 text-xs text-slate-600">{item.student_name} · {dateTime(item.start_at)}</p></div><span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white px-2 py-1 text-[10px] font-black text-indigo-700">{item.learning_mode === "online" ? <Monitor size={11} /> : <MapPin size={11} />}{item.learning_mode === "online" ? "Online" : "Offline"}</span></div></div>) : <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500">Belum ada kelas aktif mendatang.</p>}</div>
    </div>
  </div>;
}