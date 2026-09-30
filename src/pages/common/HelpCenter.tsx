import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { ChevronDown, Clock3, MessageCircle, ShieldAlert } from "lucide-react";
import { defaultWebsiteContent, whatsappHref, type WebsiteContentPayload, type WebsiteSettings } from "@/lib/websiteContent";
import { getCached } from "@/lib/http";

export default function HelpCenter() {
  const [settings, setSettings] = useState<WebsiteSettings>(defaultWebsiteContent.settings);
  const [fallbackPhone, setFallbackPhone] = useState<string | null>(null);
  const { pathname } = useLocation();
  const role = pathname.startsWith("/guru") ? "tutor" : "murid";
  const questions = role === "tutor" ? [
    ["Bagaimana proses pendaftaran tutor?", "Lengkapi formulir dan dokumen terlebih dahulu. Setelah data tersimpan, lanjutkan seleksi melalui WhatsApp resmi. Akun mengajar aktif setelah pemeriksaan."],
    ["Di mana mengatur jam tersedia?", "Atur hari dan rentang jam pada Jadwal Mengajar. Ketersediaan ini dipakai saat sistem mencari tutor yang sesuai."],
    ["Kapan bayaran sesi masuk ke saldo?", "Bayaran mengikuti status kelas dan verifikasi penyelesaian sesi. Periksa rincian serta statusnya pada halaman Pencairan."],
  ] : [
    ["Mengapa saya membayar sebelum tutor ditemukan?", "Harga dan jadwal ditampilkan sebelum pembayaran. Setelah pembayaran terkonfirmasi, sistem mencari tutor yang sesuai. Pantau hasilnya di Proses Pesanan."],
    ["Bagaimana jika tutor tidak ditemukan?", "Lihat pilihan lanjutan di Proses Pesanan. Jika memenuhi syarat refund, pilih tujuan pengembalian di Riwayat Transaksi dan konfirmasikan sebelum dana diproses."],
    ["Apa beda Saldo BimbelKu dan pembayaran asal?", "Saldo BimbelKu bisa dipakai untuk membayar layanan belajar berikutnya, tetapi tidak dapat ditarik tunai. Dana yang semula dibayar dari saldo selalu kembali ke saldo."],
    ["Di mana melihat jadwal dan perkembangan belajar?", "Jadwal tersedia di Kelas Saya. Laporan dan perkembangan muncul setelah sesi dicatat melalui alur kelas."],
  ];
  useEffect(() => {
    void getCached<WebsiteContentPayload>("/website-content", { maxAgeMs: 5 * 60_000 })
      .then((response) => setSettings({ ...defaultWebsiteContent.settings, ...response.data.settings }))
      .catch(() => undefined);
    void getCached<{ footer_phone?: string }>("/settings/footer", { maxAgeMs: 5 * 60_000 })
      .then((response) => setFallbackPhone(response.data.footer_phone || null))
      .catch(() => undefined);
  }, []);
  const url = whatsappHref(settings.whatsapp_number || fallbackPhone, `Halo BimbelKu, saya ${role} dan membutuhkan bantuan. Kendala saya: `);
  return <div className={`mx-auto w-full space-y-6 pb-10 ${role === "tutor" ? "max-w-7xl" : "max-w-4xl"}`}>
    <header className="border-b border-slate-200 pb-6"><p className="text-[11px] font-black uppercase tracking-[.18em] text-emerald-700">Pusat bantuan BimbelKu</p><h1 className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">Cari jawaban dulu, kami siap membantu jika perlu.</h1><p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">Pertanyaan umum untuk {role} dijawab di bawah. Jika masalah belum selesai, hubungi tim melalui WhatsApp resmi.</p></header>
    <section aria-labelledby="help-faq-title" className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><h2 id="help-faq-title" className="text-xl font-black text-slate-900">Pertanyaan yang sering ditanyakan</h2><div className="mt-5 divide-y divide-slate-100">{questions.map(([question, answer]) => <details key={question} className="group py-2"><summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 py-2 font-bold text-slate-800 marker:hidden"><span>{question}</span><ChevronDown size={18} className="shrink-0 text-emerald-700 transition-transform group-open:rotate-180" /></summary><p className="pb-4 pr-7 text-sm leading-7 text-slate-600">{answer}</p></details>)}</div></section>
    <section className="grid gap-4 md:grid-cols-[1fr_18rem]">
      <div className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm sm:p-7"><div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full border-8 border-emerald-50" /><div className="relative"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><MessageCircle size={23} /></span><h2 className="mt-5 text-xl font-black text-slate-900">Hubungi melalui WhatsApp</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Sertakan kode pesanan atau kelas, halaman tempat masalah muncul, dan penjelasan singkat. Pesan awal sudah menandai bahwa kamu adalah {role}.</p>{url ? <a href={url} target="_blank" rel="noreferrer" className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 font-black text-white hover:bg-emerald-800 sm:w-auto"><MessageCircle size={20} />Buka WhatsApp</a> : <p role="status" className="mt-6 rounded-xl bg-amber-50 p-4 text-sm font-bold text-amber-900">Nomor WhatsApp bantuan belum dikonfigurasi.</p>}</div></div>
      <aside className="space-y-3"><div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4"><span aria-hidden="true" className="absolute -right-10 -top-10 h-32 w-32 rounded-full border-8 border-white" /><div className="relative"><Clock3 className="text-slate-500" size={20} /><p className="mt-3 text-xs font-black uppercase tracking-wider text-slate-400">Jam layanan</p><p className="mt-1 text-sm font-bold text-slate-800">{settings.whatsapp_hours || "Ikuti informasi pada WhatsApp resmi"}</p></div></div><div className="relative overflow-hidden rounded-2xl border border-amber-200 bg-amber-50 p-4"><span aria-hidden="true" className="absolute -right-10 -top-10 h-32 w-32 rounded-full border-8 border-amber-100" /><div className="relative"><ShieldAlert className="text-amber-700" size={20} /><p className="mt-3 text-sm font-black text-amber-950">Jaga keamanan akun</p><p className="mt-1 text-xs leading-5 text-amber-900">Jangan pernah mengirim kata sandi, PIN pembayaran, atau kode OTP.</p></div></div></aside>
    </section>
  </div>;
}
