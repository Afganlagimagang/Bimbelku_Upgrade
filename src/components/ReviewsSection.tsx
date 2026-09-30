import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, ShieldCheck, Star } from "lucide-react";
import { Link } from "react-router-dom";

import Reveal from "@/components/Reveal";
import LandingAmbientOrbit from "@/components/LandingAmbientOrbit";
import TestimonialCard from "@/components/TestimonialCard";
import { useWebsiteContent } from "@/components/WebsiteContentProvider";

const demoCards = [
  { title: "Cerita siswa", text: "Foto, pengalaman, dan hasil belajar akan tampil setelah izin publikasi diperiksa." },
  { title: "Hasil terverifikasi", text: "Klaim seperti kelulusan atau penerimaan kampus memerlukan bukti yang disimpan privat." },
  { title: "Terhubung ke sistem", text: "Rating kelas dapat ditautkan agar penilaian tidak dibuat sekadar untuk pemasaran." },
] as const;

export default function ReviewsSection() {
  const { section, rating_summary: summary, testimonials } = useWebsiteContent();
  const cms = section("reviews");
  const tickerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const featured = useMemo(() => {
    const chosen = testimonials.filter((item) => item.is_featured).slice(0, 3);
    return chosen.length >= 3 ? chosen : testimonials.slice(0, 3);
  }, [testimonials]);
  const featuredIds = new Set(featured.map((item) => item.id));
  const more = testimonials.filter((item) => !featuredIds.has(item.id));
  const tickerItems = more.length > 1 ? [...more, ...more] : more;

  useEffect(() => {
    const node = tickerRef.current;
    if (!node) return;
    if (!("IntersectionObserver" in window)) { setInView(true); return; }
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { rootMargin: "100px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, [more.length]);

  return (
    <section className="relative overflow-hidden bg-orange-50 py-20 sm:py-24 lg:py-28">
      <LandingAmbientOrbit variant="trail" color="#C2410C" style={{ width: 242, height: 242, bottom: 10, left: 18, opacity: 0.72 }} />
      <div className="relative mx-auto max-w-[1200px] px-5 sm:px-8">
        <Reveal width="100%"><div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"><div className="max-w-3xl"><p className="text-xs font-extrabold uppercase tracking-[0.18em] text-orange-700">{cms?.eyebrow || "Cerita dari proses belajar"}</p><h2 className="mt-4 text-balance text-3xl font-extrabold tracking-tight text-[#14213D] sm:text-4xl">{cms?.title || "Bukan hanya kata kami—lihat pengalaman belajarnya."}</h2><p className="mt-5 max-w-2xl text-base leading-8 text-slate-600">{cms?.description || "Cerita publik hanya ditampilkan setelah izin dan pemeriksaan admin."}</p></div>{summary ? <div className="flex w-fit items-center gap-4 rounded-3xl border border-orange-200 bg-white px-5 py-4 shadow-sm"><p className="text-3xl font-extrabold text-[#14213D]">{summary.average.toLocaleString("id-ID", { maximumFractionDigits: 1 })}</p><div><div className="flex gap-1">{[1, 2, 3, 4, 5].map((star) => <Star key={star} size={15} className={star <= Math.round(summary.average) ? "fill-orange-400 text-orange-400" : "text-stone-300"} />)}</div><p className="mt-1 text-xs font-bold text-slate-500">{summary.count} rating sistem</p></div></div> : <span className="w-fit rounded-full border border-orange-200 bg-white px-4 py-2 text-xs font-extrabold text-orange-800">Menunggu rating sistem</span>}</div></Reveal>

        {featured.length ? <div className="mt-10 grid gap-5 md:grid-cols-3">{featured.map((item, index) => <Reveal key={item.id} delay={index * 0.07} width="100%" className="h-full"><TestimonialCard testimonial={item} /></Reveal>)}</div> : <div className="mt-10 grid gap-4 md:grid-cols-3">{demoCards.map((item) => <article key={item.title} className="rounded-3xl border border-dashed border-orange-300 bg-white/70 p-6"><div className="grid h-12 w-12 place-items-center rounded-full bg-orange-100 text-orange-700"><ShieldCheck size={22} /></div><h3 className="mt-5 font-extrabold text-[#14213D]">{item.title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p><p className="mt-5 text-xs font-extrabold text-orange-700">Slot contoh · bukan testimoni</p></article>)}</div>}
      </div>

      {more.length > 0 && <div ref={tickerRef} className="testimonial-ticker mt-10 overflow-hidden" data-active={inView ? "true" : "false"}><div className="testimonial-ticker-track flex w-max gap-4 px-5 sm:px-8">{tickerItems.map((item, index) => <TestimonialCard key={`${item.id}-${index}`} testimonial={item} compact />)}</div></div>}

      <div className="mx-auto mt-8 flex max-w-[1200px] flex-col gap-4 px-5 sm:flex-row sm:items-center sm:justify-between sm:px-8"><p className="flex max-w-3xl items-start gap-2 text-xs font-semibold leading-5 text-slate-600"><ShieldCheck size={17} className="mt-0.5 shrink-0 text-emerald-700" />Foto dan klaim hasil hanya dipublikasikan setelah persetujuan serta verifikasi. Bukti pendukung tidak ditampilkan kepada publik.</p>{testimonials.length > 0 && <Link to="/testimonials" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-[#14213D] px-5 text-sm font-extrabold text-white transition hover:bg-slate-800">Lihat semua cerita <ArrowRight size={16} /></Link>}</div>
    </section>
  );
}
