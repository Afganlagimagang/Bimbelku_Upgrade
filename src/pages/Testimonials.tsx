import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, ShieldCheck } from "lucide-react";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import TestimonialCard from "@/components/TestimonialCard";
import http from "@/lib/http";
import type { WebsiteTestimonial } from "@/lib/websiteContent";

type PagePayload = { data: WebsiteTestimonial[]; current_page: number; last_page: number; total: number };

export default function Testimonials() {
  const [payload, setPayload] = useState<PagePayload | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    http.get<PagePayload>(`/testimonials?page=${page}`)
      .then(({ data }) => active && setPayload(data))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [page]);

  return <div className="public-site min-h-screen bg-[#FFFBF7]"><Navbar /><main className="pb-24 pt-36 sm:pt-44"><section className="mx-auto max-w-[1200px] px-5 sm:px-8"><div className="max-w-3xl"><p className="text-xs font-extrabold uppercase tracking-[0.18em] text-orange-700">Cerita terverifikasi</p><h1 className="mt-4 text-4xl font-extrabold tracking-tight text-[#14213D] sm:text-5xl">Pengalaman belajar yang dapat dipertanggungjawabkan.</h1><p className="mt-5 text-base leading-8 text-slate-600">Setiap cerita yang tampil telah memiliki izin publikasi dan diperiksa admin. Bukti pendukung tetap disimpan privat.</p><p className="mt-5 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-xs font-extrabold text-emerald-800"><ShieldCheck size={16} /> {payload?.total || 0} cerita publik terverifikasi</p></div>{loading ? <div className="grid min-h-72 place-items-center"><Loader2 className="animate-spin text-orange-600" /></div> : payload?.data.length ? <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{payload.data.map((item) => <TestimonialCard key={item.id} testimonial={item} />)}</div> : <div className="mt-12 rounded-3xl border border-orange-200 bg-white p-10 text-center"><h2 className="text-xl font-extrabold text-[#14213D]">Cerita publik sedang disiapkan</h2><p className="mt-2 text-sm leading-6 text-slate-500">Testimoni baru akan muncul setelah izin dan bukti selesai diperiksa.</p></div>}{payload && payload.last_page > 1 && <div className="mt-10 flex items-center justify-center gap-4"><button type="button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className="grid h-11 w-11 place-items-center rounded-full border border-stone-200 bg-white disabled:opacity-40" aria-label="Halaman sebelumnya"><ChevronLeft /></button><span className="text-sm font-extrabold text-slate-700">{payload.current_page} / {payload.last_page}</span><button type="button" disabled={page >= payload.last_page} onClick={() => setPage((value) => value + 1)} className="grid h-11 w-11 place-items-center rounded-full border border-stone-200 bg-white disabled:opacity-40" aria-label="Halaman berikutnya"><ChevronRight /></button></div>}</section></main><Footer /></div>;
}
