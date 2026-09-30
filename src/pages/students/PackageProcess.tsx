import { lazy, Suspense, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { BookOpenCheck, History, Loader2, Search } from "lucide-react";

import StudentLayout from "@/components/StudentLayout";
import { Button } from "@/components/ui/button";
import WorkspacePageIntro from "@/components/WorkspacePageIntro";
import http from "@/lib/http";
import {
  announceNavigationAttentionChanged,
  unreadIdsForStudentClassTab,
  type AttentionNotification,
} from "@/lib/navigationAttention";

const PackageProcessList = lazy(() => import("./MyPackages"));
type ProcessScope = "active" | "history";

export default function PackageProcess() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [attention, setAttention] = useState<AttentionNotification[]>([]);
  const scope: ProcessScope = searchParams.get("scope") === "history" ? "history" : "active";

  const openScope = async (nextScope: ProcessScope) => {
    const next = new URLSearchParams(searchParams);
    if (nextScope === "history") next.set("scope", "history");
    else next.delete("scope");
    setSearchParams(next, { replace: true });

    const ids = unreadIdsForStudentClassTab(nextScope === "history" ? "history" : "process", attention);
    if (!ids.length) return;
    const idSet = new Set(ids);
    setAttention((current) => current.filter((item) => !idSet.has(item.id)));
    try {
      await http.post("/notifications/read-batch", { ids });
      announceNavigationAttentionChanged();
    } catch {
      // Polling layout akan menyelaraskan kembali indikator bila request gagal.
    }
  };

  useEffect(() => {
    if (searchParams.get("tab") !== "process") return;
    const next = new URLSearchParams(searchParams);
    next.delete("tab");
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  return (
    <StudentLayout title="Proses Pesanan" onAttentionNotificationsChange={setAttention}>
      <div className="mx-auto max-w-7xl space-y-5 pb-4 sm:space-y-7 sm:pb-12">
        <WorkspacePageIntro eyebrow="Sebelum kelas dimulai" title="Proses Pesanan" description="Pantau pembayaran, pencarian tutor, perubahan jadwal, dan status paket tanpa bercampur dengan kalender belajar." icon={BookOpenCheck} actions={<Button asChild className="min-h-11 w-full rounded-xl bg-indigo-600 font-black hover:bg-indigo-700 lg:w-auto"><Link to="/student/packages/new"><Search size={17} className="mr-2" />Buat pesanan baru</Link></Button>} />

        <nav aria-label="Bagian proses pesanan" className="rounded-[1.5rem] border border-slate-100 bg-white p-1.5 shadow-sm">
          <div className="grid grid-cols-2 gap-1.5">
            {([
              ["active", "Sedang Diproses", BookOpenCheck],
              ["history", "Riwayat Paket", History],
            ] as const).map(([value, label, Icon]) => (
              <button key={value} type="button" aria-pressed={scope === value} onClick={() => void openScope(value)} className={`flex min-h-12 items-center justify-center gap-2 rounded-xl px-3 text-sm font-black transition ${scope === value ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`}>
                <Icon size={17} />{label}
              </button>
            ))}
          </div>
        </nav>

        <Suspense fallback={<div role="status" className="grid min-h-48 place-items-center rounded-[1.5rem] border border-slate-100 bg-white"><Loader2 className="animate-spin text-indigo-600" size={30} /></div>}>
          <PackageProcessList scope={scope} />
        </Suspense>
      </div>
    </StudentLayout>
  );
}
