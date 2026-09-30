import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import http, { getApiError } from "@/lib/http";
import { notify } from "@/lib/notify";

type Subject = { id: number; name: string };
type Program = { id: number; name: string; description: string | null; is_active: boolean; sort_order: number; allow_multi_mapel: boolean; subjects: Subject[] };
type Form = { name: string; description: string; sort_order: number; is_active: boolean; allow_multi_mapel: boolean; subject_ids: number[] };
const emptyForm: Form = { name: "", description: "", sort_order: 0, is_active: true, allow_multi_mapel: false, subject_ids: [] };

export default function ProgramManagement() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<Form>(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const [programResponse, subjectResponse] = await Promise.all([
        http.get<Program[]>("/admin/program-groups"),
        http.get<Subject[]>("/admin/subjects", { params: { all: 1, active_only: 1 } }),
      ]);
      setPrograms(programResponse.data);
      setSubjects(subjectResponse.data);
    } catch (error) { notify.error(getApiError(error, "Program belum dapat dimuat.")); }
  };
  useEffect(() => { void load(); }, []);

  const edit = (program: Program) => {
    setEditingId(program.id);
    setForm({
      name: program.name,
      description: program.description || "",
      sort_order: program.sort_order,
      is_active: program.is_active,
      allow_multi_mapel: program.allow_multi_mapel,
      subject_ids: program.subjects.map((subject) => subject.id),
    });
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      if (editingId) await http.put(`/admin/program-groups/${editingId}`, form);
      else await http.post("/admin/program-groups", form);
      notify.success("Program berhasil disimpan.");
      setEditingId(null); setForm(emptyForm);
      await load();
    } catch (error) { notify.error(getApiError(error, "Program gagal disimpan.")); }
    finally { setSaving(false); }
  };

  const toggleSubject = (id: number) => setForm((current) => ({
    ...current,
    subject_ids: current.subject_ids.includes(id) ? current.subject_ids.filter((value) => value !== id) : [...current.subject_ids, id],
  }));

  return <AdminLayout title="Kelola Program">
    <div className="grid gap-6 pb-16 xl:grid-cols-[minmax(0,1fr)_430px]">
      <section className="rounded-3xl border border-slate-200 bg-white p-6">
        <h1 className="text-2xl font-black text-slate-900">Program dan Mapel</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Program adalah kelompok pada katalog. Satu mapel boleh muncul di beberapa kelompok tanpa menggandakan halaman detailnya.</p>
        <div className="mt-6 space-y-3">{programs.map((program) => <div key={program.id} className="rounded-2xl border border-slate-200 p-4">
          <div className="flex items-start justify-between gap-4"><div><h2 className="font-black text-slate-900">{program.name}</h2><p className="mt-1 text-xs text-slate-500">{program.subjects.length} mapel · urutan {program.sort_order} · {program.is_active ? "Tampil" : "Disembunyikan"}</p></div><button onClick={() => edit(program)} className="min-h-10 rounded-xl border border-slate-300 px-4 text-sm font-bold">Ubah</button></div>
          {program.description && <p className="mt-3 text-sm text-slate-600">{program.description}</p>}
          <p className="mt-3 text-xs text-slate-500">{program.subjects.map((subject) => subject.name).join(" · ") || "Belum ada mapel"}</p>
        </div>)}{programs.length === 0 && <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">Belum ada Program. Buat kelompok pertama agar katalog publik terstruktur.</p>}</div>
      </section>
      <form onSubmit={save} className="h-fit space-y-4 rounded-3xl border border-slate-200 bg-white p-6 xl:sticky xl:top-24">
        <h2 className="text-lg font-black text-slate-900">{editingId ? "Ubah Program" : "Tambah Program"}</h2>
        <label className="block text-sm font-bold">Nama Program<input required minLength={2} maxLength={120} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3" /></label>
        <label className="block text-sm font-bold">Deskripsi singkat<textarea maxLength={1000} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="mt-1 min-h-20 w-full rounded-xl border border-slate-300 p-3" /></label>
        <label className="block text-sm font-bold">Urutan<input required type="number" min={0} max={9999} value={form.sort_order} onChange={(event) => setForm({ ...form, sort_order: Number(event.target.value) })} className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3" /></label>
        <label className="flex gap-2 text-sm font-bold"><input type="checkbox" checked={form.is_active} onChange={(event) => setForm({ ...form, is_active: event.target.checked })} /> Tampilkan di katalog</label>
        <label className="flex gap-2 text-sm font-bold"><input type="checkbox" checked={form.allow_multi_mapel} onChange={(event) => setForm({ ...form, allow_multi_mapel: event.target.checked })} /> Izinkan pilihan beberapa mapel</label>
        <fieldset className="max-h-64 overflow-y-auto rounded-xl border border-slate-200 p-3"><legend className="px-1 text-sm font-black">Mapel dalam Program</legend><div className="space-y-2">{subjects.map((subject) => <label key={subject.id} className="flex gap-2 text-sm"><input type="checkbox" checked={form.subject_ids.includes(subject.id)} onChange={() => toggleSubject(subject.id)} />{subject.name}</label>)}</div></fieldset>
        <div className="flex gap-2"><button disabled={saving} className="min-h-11 flex-1 rounded-xl bg-orange-600 px-4 font-bold text-white disabled:opacity-50">{saving ? "Menyimpan..." : "Simpan Program"}</button>{editingId && <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm); }} className="min-h-11 rounded-xl border border-slate-300 px-4 font-bold">Batal</button>}</div>
      </form>
    </div>
  </AdminLayout>;
}
