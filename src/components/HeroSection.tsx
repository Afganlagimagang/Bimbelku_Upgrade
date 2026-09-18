import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CalendarCheck2, CheckCircle2, MessageCircle, Search, ShieldCheck } from "lucide-react";

import Reveal from "@/components/Reveal";
import StudentPackageLink from "@/components/StudentPackageLink";
import { useWebsiteContent } from "@/components/WebsiteContentProvider";
import { whatsappHref } from "@/lib/websiteContent";

const quickLinks = [
  ["Program", "#program"],
  ["Cara kerja", "#cara-kerja"],
  ["Tutor", "#tutor"],
  ["Area", "#area"],
  ["FAQ", "#faq"],
] as const;

export default function HeroSection() {
  const { settings, section } = useWebsiteContent();
  const hero = section("hero");
  const content = hero?.content;
  const visualRef = useRef<HTMLDivElement>(null);
  const [visualActive, setVisualActive] = useState(false);
  const [query, setQuery] = useState("");
  const consultationUrl = settings.whatsapp_enabled
    ? whatsappHref(settings.whatsapp_number, settings.whatsapp_default_message)
    : null;

  useEffect(() => {
    const element = visualRef.current;
    if (!element || !("IntersectionObserver" in window)) {
      setVisualActive(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => setVisualActive(entry.isIntersecting), { threshold: 0.12 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    window.dispatchEvent(new CustomEvent("bimbelku:program-search", { detail: query.trim() }));
    document.getElementById("program")?.scrollIntoView({ behavior: settings.animations_enabled ? "smooth" : "auto" });
  };

  const primaryUrl = settings.primary_cta_url || "/student/packages/new";
  const primaryButton = (
    <span className="inline-flex min-h-13 items-center justify-center gap-2 rounded-2xl bg-[#C2410C] px-6 py-3.5 text-sm font-extrabold text-white shadow-[0_12px_28px_rgba(154,52,18,.2)] transition hover:-translate-y-0.5 hover:bg-[#9A3412]">
      {settings.primary_cta_label || "Cari Bimbingan"}<ArrowRight size={18} aria-hidden="true" />
    </span>
  );

  return (
    <section id="hero" className="relative overflow-visible bg-[#F7F1E8] pb-28 pt-12 sm:pb-32 sm:pt-16 lg:pb-36 lg:pt-20">
      <div className="pointer-events-none absolute inset-0 opacity-70" aria-hidden="true">
        <div className="absolute -left-28 top-16 h-56 w-56 rounded-full border border-orange-300/40" />
        <div className="absolute -left-20 top-24 h-40 w-40 rounded-full border border-orange-300/25" />
        <div className="absolute right-[41%] top-16 h-2 w-2 rounded-full bg-teal-600" />
      </div>

      <div className="relative mx-auto grid min-w-0 max-w-[1240px] items-center gap-8 px-5 sm:px-8 lg:grid-cols-[1.02fr_.98fr] lg:gap-10">
        <div className="relative z-10 min-w-0 w-[calc(100vw-2.5rem)] max-w-2xl py-4 sm:w-auto lg:py-10">
          <Reveal eager width="100%">
            <p className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/[.85] px-4 py-2 text-xs font-extrabold text-orange-800 shadow-sm backdrop-blur sm:text-sm">
              <ShieldCheck size={17} aria-hidden="true" />
              {hero?.eyebrow || "Bimbingan belajar SD–SMA di Yogyakarta"}
            </p>
          </Reveal>
          <Reveal eager width="100%">
            <h1 className="mt-6 max-w-[13ch] text-balance text-[2.7rem] font-extrabold leading-[1.04] tracking-[-0.045em] text-[#14213D] sm:text-[3.6rem] lg:text-[4.5rem]">
              {hero?.title || "Belajar lebih pas, mulai dari tutor yang tepat."}
            </h1>
          </Reveal>
          <Reveal eager width="100%">
            <p className="mt-6 w-full max-w-[calc(100vw-2.5rem)] whitespace-normal break-words text-base font-medium leading-8 text-slate-600 sm:max-w-xl sm:text-lg">
              {hero?.description || "Pilih kebutuhan dan jadwalmu. Harga terlihat sejak awal, lalu BimbelKu mencarikan tutor setelah pembayaran terverifikasi."}
            </p>
          </Reveal>
          <Reveal eager width="100%">
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {primaryUrl.startsWith("/student/packages/new") ? (
                <StudentPackageLink to={primaryUrl}>{primaryButton}</StudentPackageLink>
              ) : (
                <Link to={primaryUrl}>{primaryButton}</Link>
              )}
              {consultationUrl ? (
                <a href={consultationUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-13 items-center justify-center gap-2 rounded-2xl border border-stone-300 bg-white/80 px-6 py-3.5 text-sm font-extrabold text-[#14213D] transition hover:border-orange-300 hover:bg-white">
                  <MessageCircle size={18} aria-hidden="true" />{settings.whatsapp_label}
                </a>
              ) : (
                <a href="#cara-kerja" className="inline-flex min-h-13 items-center justify-center gap-2 rounded-2xl border border-stone-300 bg-white/80 px-6 py-3.5 text-sm font-extrabold text-[#14213D] transition hover:border-orange-300 hover:bg-white">
                  Lihat cara kerja
                </a>
              )}
            </div>
          </Reveal>
          <Reveal eager width="100%">
            <ul className="mt-7 grid w-full min-w-0 max-w-[calc(100vw-2.5rem)] grid-cols-1 gap-x-5 gap-y-2 text-xs font-extrabold text-slate-600 min-[480px]:grid-cols-2 sm:flex sm:max-w-none sm:flex-wrap sm:text-sm">
              {(content?.trust_points?.length ? content.trust_points : ["Harga transparan", "Tutor diverifikasi", "Progress tercatat"]).slice(0, 3).map((point) => (
                <li key={point} className="flex items-center gap-2"><CheckCircle2 className="shrink-0 text-emerald-700" size={16} aria-hidden="true" />{point}</li>
              ))}
            </ul>
          </Reveal>
        </div>

        <Reveal eager direction="left" width="100%">
          <div ref={visualRef} data-active={visualActive ? "true" : "false"} className="hero-orbit-scene relative mx-auto h-[430px] min-w-0 w-[calc(100vw-2.5rem)] max-w-[570px] sm:h-[590px] sm:w-full">
            <div className="hero-orbit hero-orbit-one absolute left-1/2 top-1/2 h-[390px] w-[390px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-orange-500/55 sm:h-[490px] sm:w-[490px]" aria-hidden="true" />
            <div className="hero-orbit hero-orbit-two absolute left-1/2 top-1/2 h-[300px] w-[430px] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border border-teal-700/30 sm:h-[380px] sm:w-[550px]" aria-hidden="true" />
            <div className="hero-orbit hero-orbit-three absolute left-1/2 top-1/2 h-[410px] w-[280px] -translate-x-1/2 -translate-y-1/2 rotate-[24deg] rounded-[50%] border border-[#14213D]/20 sm:h-[520px] sm:w-[350px]" aria-hidden="true" />
            <div className="absolute left-1/2 top-[53%] h-[350px] w-[350px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#F6B94A] shadow-[0_30px_70px_rgba(180,83,9,.16)] sm:h-[430px] sm:w-[430px]" aria-hidden="true" />
            <div className="absolute left-1/2 top-[53%] h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#F9D989]/70 sm:h-[360px] sm:w-[360px]" aria-hidden="true" />

            <img
              src={settings.hero_desktop_image_url || "/hero-bimbelku-character-v2.webp"}
              alt="Siswa mengenakan batik dan membawa tas sekolah"
              loading="eager"
              decoding="async"
              fetchPriority="high"
              width={1024}
              height={1365}
              className="absolute bottom-0 left-1/2 z-10 h-[440px] w-auto max-w-none -translate-x-1/2 object-contain object-bottom sm:h-[570px]"
            />

            <div className="absolute left-1/2 h-20 w-3/4 -translate-x-1/2 overflow-hidden border-t-4 border-white/90 bg-gradient-to-b from-orange-50 to-amber-300" style={{ bottom: "-0.35rem", zIndex: 15, borderRadius: "55% 55% 24px 24px", boxShadow: "0 -10px 35px rgb(20 33 61 / .12), 0 18px 35px rgb(180 83 9 / .16)" }} aria-hidden="true">
              <div className="absolute top-3 h-px bg-orange-700/20" style={{ insetInline: "12%" }} />
              <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full border border-orange-900/10 bg-white/80 px-3 py-1.5 text-xs font-extrabold uppercase text-[#14213D] shadow-sm sm:bottom-4">
                <span className="h-2 w-2 rounded-full bg-teal-700" /> Online & tatap muka
              </div>
            </div>

            <div className="hero-status-card absolute right-0 top-[16%] z-20 hidden rounded-2xl border border-white/70 bg-white/95 px-4 py-3 shadow-[0_16px_36px_rgba(20,33,61,.15)] backdrop-blur min-[480px]:block sm:right-2">
              <p className="flex items-center gap-2 text-xs font-extrabold text-[#14213D]"><CalendarCheck2 size={17} className="text-orange-600" aria-hidden="true" />Jadwal dipilih</p>
              <p className="mt-1 text-[11px] font-semibold text-slate-500">Selasa & Kamis · 16.00</p>
            </div>

            <div className="hero-status-card hero-match-card absolute bottom-[7%] left-0 z-20 rounded-2xl border border-emerald-200 bg-white/95 px-4 py-3 shadow-[0_16px_36px_rgba(20,33,61,.15)] backdrop-blur sm:left-4">
              <p className="flex items-center gap-2 text-xs font-extrabold text-[#14213D]"><span className="hero-match-dot h-2.5 w-2.5 shrink-0 rounded-full bg-orange-500" aria-hidden="true" /><span className="relative min-w-[7.5rem]"><span className="hero-status-pending block">{content?.status_pending || "Memeriksa jadwal"}</span><span className="hero-status-found absolute inset-0 opacity-0">{content?.status_found || "Tutor ditemukan"}</span></span></p>
              <p className="mt-1 text-[11px] font-semibold text-slate-500">Sesuai mapel dan waktu</p>
            </div>
          </div>
        </Reveal>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-30 translate-y-1/2 px-5 sm:px-8">
        <div className="mx-auto max-w-[1120px] rounded-[26px] border border-stone-200 bg-white p-3 shadow-[0_22px_55px_rgba(20,33,61,.13)] sm:p-4">
          <form onSubmit={submitSearch} className="flex flex-col gap-3 sm:flex-row">
            <label className="flex min-h-14 flex-1 items-center gap-3 rounded-2xl bg-stone-50 px-4 focus-within:ring-4 focus-within:ring-orange-100">
              <Search className="shrink-0 text-teal-700" size={20} aria-hidden="true" />
              <span className="sr-only">Cari program belajar</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Mau belajar apa? Matematika, Inggris, Fisika..." className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-[#14213D] outline-none placeholder:text-slate-400 sm:text-base" />
            </label>
            <button type="submit" className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-[#147D7E] px-6 text-sm font-extrabold text-white transition hover:bg-[#0E6566]">Temukan program <ArrowRight size={17} /></button>
          </form>
          <nav aria-label="Jelajah cepat" className="mt-3 flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:justify-center">
            {quickLinks.map(([label, href]) => <a key={label} href={href} className="shrink-0 rounded-full border border-stone-200 px-3.5 py-2 text-xs font-extrabold text-slate-600 transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-800">{label}</a>)}
          </nav>
        </div>
      </div>
    </section>
  );
}
