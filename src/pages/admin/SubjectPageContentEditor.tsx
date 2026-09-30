import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AdminLayout from "@/components/AdminLayout";
import { useConfirmDialog } from "@/components/ConfirmDialogProvider";
import http, { getApiError } from "@/lib/http";
import { notify } from "@/lib/notify";

type Fact = { label: string; value: string };
type MapRow = { stage: string; coverage: string; difficulty: string; approach: string };
type Journey = { period: string; title: string; description: string };
type Reason = { title: string; description: string };
type Article = { title: string; body: string };
type Faq = { question: string; answer: string };
type Content = {
  hero_intro: string; hero_image_url: string | null; learning_approach: string; facts: Fact[]; learning_map: MapRow[];
  learning_journey: Journey[]; benefits: string[]; suitable_for: string[]; reasons: Reason[]; articles: Article[]; faqs: Faq[];
  source_note: string; reviewed_at: string; is_published: boolean;
};
const blank: Content = { hero_intro: "", hero_image_url: null, learning_approach: "", facts: [], learning_map: [], learning_journey: [], benefits: [], suitable_for: [], reasons: [], articles: [], faqs: [], source_note: "", reviewed_at: "", is_published: false };

export default function SubjectPageContentEditor() {
  const { id } = useParams();
  const [name, setName] = useState("Mapel");
  const [form, setForm] = useState<Content>(blank);
  const [saving, setSaving] = useState(false);
  const [heroFile, setHeroFile] = useState<File | null>(null);
  const confirm = useConfirmDialog();

  useEffect(() => {
    void http.get<{ subject: { name: string }; content: Partial<Content> }>(`/admin/subjects/${id}/page`)
      .then(({ data }) => {
        setName(data.subject.name);
        setForm({ ...blank, ...data.content, facts: data.content.facts || [], learning_map: data.content.learning_map || [], learning_journey: data.content.learning_journey || [], benefits: data.content.benefits || [], suitable_for: data.content.suitable_for || [], reasons: data.content.reasons || [], articles: data.content.articles || [], faqs: data.content.faqs || [], reviewed_at: data.content.reviewed_at?.slice(0, 10) || "" });
      }).catch((error) => notify.error(getApiError(error, "Konten mapel gagal dimuat.")));
  }, [id]);

  const updateFact = (index: number, key: keyof Fact, value: string) => setForm((current) => ({ ...current, facts: current.facts.map((row, i) => i === index ? { ...row, [key]: value } : row) }));
  const updateMap = (index: number, key: keyof MapRow, value: string) => setForm((current) => ({ ...current, learning_map: current.learning_map.map((row, i) => i === index ? { ...row, [key]: value } : row) }));
  const updateJourney = (index: number, key: keyof Journey, value: string) => setForm((current) => ({ ...current, learning_journey: current.learning_journey.map((row, i) => i === index ? { ...row, [key]: value } : row) }));
  const updateReason = (index: number, key: keyof Reason, value: string) => setForm((current) => ({ ...current, reasons: current.reasons.map((row, i) => i === index ? { ...row, [key]: value } : row) }));
  const updateArticle = (index: number, key: keyof Article, value: string) => setForm((current) => ({ ...current, articles: current.articles.map((row, i) => i === index ? { ...row, [key]: value } : row) }));
  const updateFaq = (index: number, key: keyof Faq, value: string) => setForm((current) => ({ ...current, faqs: current.faqs.map((row, i) => i === index ? { ...row, [key]: value } : row) }));
  const updateList = (key: "benefits" | "suitable_for", index: number, value: string) => setForm((current) => ({ ...current, [key]: current[key].map((row, i) => i === index ? value : row) }));
  const save = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true);
    try {
      const { hero_image_url: _heroImageUrl, ...contentPayload } = form;
      await http.put(`/admin/subjects/${id}/page`, contentPayload);
      if (heroFile) {
        const media = new FormData();
        media.append("hero_image", heroFile);
        const response = await http.post<{ hero_image_url: string }>(`/admin/subjects/${id}/page/hero`, media);
        setForm((current) => ({ ...current, hero_image_url: response.data.hero_image_url }));
        setHeroFile(null);
      }
      notify.success("Konten mapel tersimpan.");
    } catch (error) { notify.error(getApiError(error, "Konten mapel gagal disimpan.")); }
    finally { setSaving(false); }
  };

  const removeHero = async () => {
    const approved = await confirm({ title: "Hapus foto hero Mapel?", description: "Foto tidak lagi tampil di halaman publik. Konten teks Mapel tetap aman.", confirmText: "Hapus foto", tone: "danger" });
    if (!approved) return;
    try {
      await http.delete(`/admin/subjects/${id}/page/hero`);
      setForm((current) => ({ ...current, hero_image_url: null }));
      setHeroFile(null);
      notify.success("Foto hero Mapel dihapus.");
    } catch (error) { notify.error(getApiError(error, "Foto hero gagal dihapus.")); }
  };

  return <AdminLayout title={`Halaman ${name}`}><div className="mx-auto max-w-5xl pb-16">
    <Link to="/admin/subjects" className="text-sm font-bold text-orange-700">← Kembali ke Mapel</Link>
    <h1 className="mt-4 text-3xl font-black text-slate-900">Konten halaman {name}</h1>
    <p className="mt-2 text-sm leading-6 text-slate-600">Isi hanya informasi yang benar-benar tersedia. Bagian kosong tidak ditampilkan ke publik. Konten baru tampil setelah dipublikasikan.</p>
    <form onSubmit={save} className="mt-7 space-y-6">
      <section className="space-y-4 rounded-2xl bg-white p-6"><h2 className="text-xl font-black">Pengantar</h2><Field label="Foto hero Mapel (JPG, PNG, atau WebP; minimal 720 × 480)"><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setHeroFile(event.target.files?.[0] || null)} className="form-field w-full" /></Field>{heroFile && <p className="text-xs font-bold text-orange-700">Foto baru: {heroFile.name}. Foto akan diunggah saat konten disimpan.</p>}{form.hero_image_url && <div className="overflow-hidden rounded-2xl border border-slate-200"><img src={form.hero_image_url} alt={`Hero ${name}`} loading="lazy" decoding="async" className="aspect-[3/2] w-full object-cover sm:max-w-xl" /><button type="button" onClick={() => void removeHero()} className="m-3 min-h-10 rounded-xl border border-rose-200 px-4 text-sm font-bold text-rose-700">Hapus foto hero</button></div>}<Field label="Deskripsi hero"><textarea value={form.hero_intro} onChange={(event) => setForm({ ...form, hero_intro: event.target.value })} maxLength={1000} className="form-field min-h-24 w-full" /></Field><Field label="Cara pendampingan"><textarea value={form.learning_approach} onChange={(event) => setForm({ ...form, learning_approach: event.target.value })} maxLength={3000} className="form-field min-h-24 w-full" /></Field></section>
      <section className="space-y-3 rounded-2xl bg-white p-6"><h2 className="text-xl font-black">Fakta Program</h2>{form.facts.map((row, index) => <div key={index} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]"><input aria-label={`Label fakta ${index + 1}`} placeholder="Mis. Durasi sesi" value={row.label} onChange={(event) => updateFact(index, "label", event.target.value)} className="form-field" /><input aria-label={`Nilai fakta ${index + 1}`} placeholder="Mis. 1–2 jam" value={row.value} onChange={(event) => updateFact(index, "value", event.target.value)} className="form-field" /><Remove onClick={() => setForm({ ...form, facts: form.facts.filter((_, i) => i !== index) })} /></div>)}<Add onClick={() => setForm({ ...form, facts: [...form.facts, { label: "", value: "" }] })} label="Tambah fakta" /></section>
      <section className="space-y-3 rounded-2xl bg-white p-6"><h2 className="text-xl font-black">Peta Materi</h2>{form.learning_map.map((row, index) => <div key={index} className="grid gap-2 rounded-xl border border-slate-200 p-3 sm:grid-cols-2"><input placeholder="Tahap / bahasan" aria-label={`Tahap ${index + 1}`} value={row.stage} onChange={(event) => updateMap(index, "stage", event.target.value)} className="form-field" /><input placeholder="Yang dicakup" aria-label={`Cakupan ${index + 1}`} value={row.coverage} onChange={(event) => updateMap(index, "coverage", event.target.value)} className="form-field" /><input placeholder="Kesulitan umum (opsional)" aria-label={`Kesulitan ${index + 1}`} value={row.difficulty} onChange={(event) => updateMap(index, "difficulty", event.target.value)} className="form-field" /><input placeholder="Cara pendampingan (opsional)" aria-label={`Pendampingan ${index + 1}`} value={row.approach} onChange={(event) => updateMap(index, "approach", event.target.value)} className="form-field" /><Remove onClick={() => setForm({ ...form, learning_map: form.learning_map.filter((_, i) => i !== index) })} /></div>)}<Add onClick={() => setForm({ ...form, learning_map: [...form.learning_map, { stage: "", coverage: "", difficulty: "", approach: "" }] })} label="Tambah tahap" /></section>
      <section className="space-y-3 rounded-2xl bg-white p-6"><h2 className="text-xl font-black">Tahap demi tahap</h2><p className="text-sm leading-6 text-slate-500">Perjalanan peserta dari pemetaan kebutuhan sampai evaluasi paket.</p>{form.learning_journey.map((row, index) => <div key={index} className="grid gap-2 rounded-xl border border-slate-200 p-3 sm:grid-cols-2"><input placeholder="Periode, mis. Sesi pertama" aria-label={`Periode ${index + 1}`} value={row.period} onChange={(event) => updateJourney(index, "period", event.target.value)} className="form-field" /><input placeholder="Judul tahap" aria-label={`Judul tahap ${index + 1}`} value={row.title} onChange={(event) => updateJourney(index, "title", event.target.value)} className="form-field" /><textarea placeholder="Penjelasan" aria-label={`Penjelasan tahap ${index + 1}`} value={row.description} onChange={(event) => updateJourney(index, "description", event.target.value)} className="form-field min-h-20 sm:col-span-2" /><Remove onClick={() => setForm({ ...form, learning_journey: form.learning_journey.filter((_, i) => i !== index) })} /></div>)}<Add onClick={() => setForm({ ...form, learning_journey: [...form.learning_journey, { period: "", title: "", description: "" }] })} label="Tambah tahap belajar" /></section>
      {(["benefits", "suitable_for"] as const).map((key) => <section key={key} className="space-y-3 rounded-2xl bg-white p-6"><h2 className="text-xl font-black">{key === "benefits" ? "Yang didapat" : "Cocok untuk siapa"}</h2>{form[key].map((row, index) => <div key={index} className="flex gap-2"><input aria-label={`${key} ${index + 1}`} value={row} onChange={(event) => updateList(key, index, event.target.value)} className="form-field flex-1" /><Remove onClick={() => setForm({ ...form, [key]: form[key].filter((_, i) => i !== index) })} /></div>)}<Add onClick={() => setForm({ ...form, [key]: [...form[key], ""] })} label="Tambah item" /></section>)}
      <section className="space-y-3 rounded-2xl bg-white p-6"><h2 className="text-xl font-black">Alasan memilih BimbelKu</h2>{form.reasons.map((row, index) => <div key={index} className="space-y-2 rounded-xl border border-slate-200 p-3"><input placeholder="Judul alasan" aria-label={`Judul alasan ${index + 1}`} value={row.title} onChange={(event) => updateReason(index, "title", event.target.value)} className="form-field w-full" /><textarea placeholder="Penjelasan berdasarkan fungsi atau kebijakan yang nyata" aria-label={`Penjelasan alasan ${index + 1}`} value={row.description} onChange={(event) => updateReason(index, "description", event.target.value)} className="form-field min-h-20 w-full" /><Remove onClick={() => setForm({ ...form, reasons: form.reasons.filter((_, i) => i !== index) })} /></div>)}<Add onClick={() => setForm({ ...form, reasons: [...form.reasons, { title: "", description: "" }] })} label="Tambah alasan" /></section>
      <section className="space-y-3 rounded-2xl bg-white p-6"><h2 className="text-xl font-black">Artikel edukatif</h2><p className="text-sm leading-6 text-slate-500">Gunakan teks biasa; tiap paragraf baru dapat dibuat dengan menekan Enter. Hindari klaim hasil yang tidak mempunyai bukti.</p>{form.articles.map((row, index) => <div key={index} className="space-y-2 rounded-xl border border-slate-200 p-3"><input placeholder="Judul artikel" aria-label={`Judul artikel ${index + 1}`} value={row.title} onChange={(event) => updateArticle(index, "title", event.target.value)} className="form-field w-full" /><textarea placeholder="Isi artikel" aria-label={`Isi artikel ${index + 1}`} value={row.body} onChange={(event) => updateArticle(index, "body", event.target.value)} className="form-field min-h-36 w-full" /><Remove onClick={() => setForm({ ...form, articles: form.articles.filter((_, i) => i !== index) })} /></div>)}<Add onClick={() => setForm({ ...form, articles: [...form.articles, { title: "", body: "" }] })} label="Tambah artikel" /></section>
      <section className="space-y-3 rounded-2xl bg-white p-6"><h2 className="text-xl font-black">FAQ khusus mapel</h2>{form.faqs.map((row, index) => <div key={index} className="space-y-2 rounded-xl border border-slate-200 p-3"><input placeholder="Pertanyaan" aria-label={`Pertanyaan ${index + 1}`} value={row.question} onChange={(event) => updateFaq(index, "question", event.target.value)} className="form-field w-full" /><textarea placeholder="Jawaban" aria-label={`Jawaban ${index + 1}`} value={row.answer} onChange={(event) => updateFaq(index, "answer", event.target.value)} className="form-field min-h-20 w-full" /><Remove onClick={() => setForm({ ...form, faqs: form.faqs.filter((_, i) => i !== index) })} /></div>)}<Add onClick={() => setForm({ ...form, faqs: [...form.faqs, { question: "", answer: "" }] })} label="Tambah FAQ" /></section>
      <section className="space-y-4 rounded-2xl border border-orange-200 bg-orange-50 p-6"><h2 className="text-xl font-black">Sumber dan publikasi</h2><Field label="Sumber informasi / penanggung jawab"><input value={form.source_note} onChange={(event) => setForm({ ...form, source_note: event.target.value })} maxLength={500} className="form-field w-full" /></Field><Field label="Tanggal ditinjau"><input type="date" value={form.reviewed_at} onChange={(event) => setForm({ ...form, reviewed_at: event.target.value })} className="form-field" /></Field><label className="flex gap-2 text-sm font-bold"><input type="checkbox" checked={form.is_published} onChange={(event) => setForm({ ...form, is_published: event.target.checked })} /> Publikasikan konten terverifikasi</label></section>
      <button disabled={saving} className="min-h-12 rounded-xl bg-orange-600 px-7 font-black text-white disabled:opacity-50">{saving ? "Menyimpan..." : "Simpan halaman Mapel"}</button>
    </form>
  </div></AdminLayout>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block text-sm font-bold text-slate-700"><span className="mb-2 block">{label}</span>{children}</label>; }
function Add({ onClick, label }: { onClick: () => void; label: string }) { return <button type="button" onClick={onClick} className="min-h-10 rounded-xl border border-orange-300 px-4 text-sm font-bold text-orange-700">+ {label}</button>; }
function Remove({ onClick }: { onClick: () => void }) { return <button type="button" onClick={onClick} className="min-h-10 rounded-xl border border-rose-200 px-3 text-sm font-bold text-rose-700">Hapus</button>; }
