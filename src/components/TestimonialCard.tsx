import { Quote, ShieldCheck, Star } from "lucide-react";

import type { WebsiteTestimonial } from "@/lib/websiteContent";

export default function TestimonialCard({ testimonial, compact = false }: { testimonial: WebsiteTestimonial; compact?: boolean }) {
  const detail = [testimonial.institution, testimonial.major, testimonial.achievement_year].filter(Boolean).join(" · ");

  return (
    <article className={`group flex h-full overflow-hidden rounded-[1.75rem] border border-orange-200/80 bg-white shadow-[0_16px_50px_-34px_rgba(20,33,61,.45)] ${compact ? "min-w-[290px] max-w-[340px]" : "flex-col"}`}>
      <div className={`relative shrink-0 overflow-hidden bg-orange-100 ${compact ? "w-24" : "aspect-[16/10] w-full"}`}>
        <img src={testimonial.photo_url || ""} alt={`Foto ${testimonial.display_name}`} loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
        {testimonial.is_verified && <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-emerald-700 px-2.5 py-1 text-[10px] font-extrabold text-white shadow-sm"><ShieldCheck size={12} /> Terverifikasi</span>}
      </div>
      <div className={`flex min-w-0 flex-1 flex-col ${compact ? "p-4" : "p-6"}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-extrabold text-[#14213D]">{testimonial.display_name}</h3>
            <p className="mt-1 truncate text-xs font-bold text-slate-500">{testimonial.audience_role || testimonial.program_name || "Siswa BimbelKu"}</p>
            {testimonial.program_name && testimonial.audience_role && <p className="mt-1 truncate text-xs text-slate-500">{testimonial.program_name}</p>}
          </div>
          <Quote size={20} className="shrink-0 text-orange-300" aria-hidden="true" />
        </div>
        {testimonial.rating && <div className="mt-3 flex gap-0.5" aria-label={`${testimonial.rating} dari 5 bintang`}>{[1, 2, 3, 4, 5].map((star) => <Star key={star} size={13} className={star <= testimonial.rating! ? "fill-orange-400 text-orange-400" : "text-stone-200"} />)}</div>}
        <blockquote className={`${compact ? "mt-3 line-clamp-3 text-sm leading-6" : "mt-5 flex-1 text-base leading-7"} font-semibold text-slate-700`}>“{testimonial.quote}”</blockquote>
        {testimonial.outcome && <div className="mt-5 rounded-2xl bg-orange-50 px-4 py-3"><p className="text-xs font-extrabold uppercase tracking-[0.12em] text-orange-700">Hasil belajar</p><p className="mt-1 font-extrabold text-[#14213D]">{testimonial.outcome}</p>{detail && <p className="mt-1 text-xs font-semibold text-slate-500">{detail}</p>}</div>}
        <p className="mt-4 border-t border-stone-100 pt-3 text-[11px] leading-5 text-slate-500">Rating murid terhubung · Izin publikasi tercatat{testimonial.consent_at ? ` ${new Date(testimonial.consent_at).toLocaleDateString("id-ID")}` : ""} · Bukti pendukung disimpan privat · Diperiksa {testimonial.verified_by_name || "tim BimbelKu"}{testimonial.verified_at ? ` ${new Date(testimonial.verified_at).toLocaleDateString("id-ID")}` : ""}</p>
      </div>
    </article>
  );
}
