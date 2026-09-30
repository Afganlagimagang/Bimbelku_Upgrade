import { Link } from "react-router-dom";
import { ArrowRight, MessageCircle } from "lucide-react";

import Reveal from "@/components/Reveal";
import LandingAmbientOrbit from "@/components/LandingAmbientOrbit";
import StudentPackageLink from "@/components/StudentPackageLink";
import { useWebsiteContent } from "@/components/WebsiteContentProvider";
import { whatsappHref } from "@/lib/websiteContent";

export default function CTASection() {
  const { settings, section } = useWebsiteContent();
  const cta = section("final_cta");
  const consultationUrl = settings.whatsapp_enabled ? whatsappHref(settings.whatsapp_number, settings.whatsapp_default_message) : null;
  const primaryUrl = settings.primary_cta_url || "/student/packages/new";
  const primaryContent = <>{settings.primary_cta_label || "Cari Program"}<ArrowRight size={18} aria-hidden="true" /></>;
  const primaryClass = "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#F97316] px-6 py-3 text-sm font-extrabold text-white transition hover:bg-orange-600";

  return (
    <section className="bg-white px-5 py-20 sm:px-8 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-[1200px]">
        <Reveal width="100%">
          <div className="relative overflow-hidden rounded-[28px] bg-[#14213D] px-6 py-12 text-center sm:px-12 sm:py-16 lg:px-20">
            <div className="absolute inset-x-0 top-0 h-1 bg-orange-500" aria-hidden="true" />
            <LandingAmbientOrbit variant="focus" color="#F6B94A" style={{ width: 232, height: 232, top: 16, right: 12, opacity: 0.72 }} />
            <div className="relative mx-auto max-w-3xl">
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-orange-300">{cta?.eyebrow || "Mulai dari kebutuhanmu"}</p>
              <h2 className="mt-4 text-balance text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">{cta?.title || "Belajar lebih terarah dimulai dari kebutuhan yang jelas."}</h2>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-300">{cta?.description || "Pilih program sendiri atau konsultasikan kebutuhan belajar terlebih dahulu bersama BimbelKu."}</p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                {primaryUrl.startsWith("/student/packages/new") ? <StudentPackageLink to={primaryUrl} className={primaryClass}>{primaryContent}</StudentPackageLink> : <Link to={primaryUrl} className={primaryClass}>{primaryContent}</Link>}
                {consultationUrl && <a href={consultationUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/5 px-6 py-3 text-sm font-extrabold text-white transition hover:bg-white/10"><MessageCircle size={18} />{cta?.content?.secondary_cta_label || settings.whatsapp_label}</a>}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
