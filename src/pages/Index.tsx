import { lazy, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import LandingMarquee from "@/components/LandingMarquee";

import SectionArcDivider from "@/components/SectionArcDivider";
import { useWebsiteContent } from "@/components/WebsiteContentProvider";

const TrustSection = lazy(() => import("@/components/TrustSection"));
const SubjectsSection = lazy(() => import("@/components/SubjectsSection"));
const HowItWorksSection = lazy(() => import("@/components/HowItWorksSection"));
const FeaturesSection = lazy(() => import("@/components/FeaturesSection"));
const PackagePreviewSection = lazy(() => import("@/components/PackagePreviewSection"));
const DashboardPreviewSection = lazy(() => import("@/components/DashboardPreviewSection"));
const TutorSection = lazy(() => import("@/components/TutorSection"));
const ReviewsSection = lazy(() => import("@/components/ReviewsSection"));
const AreasSection = lazy(() => import("@/components/AreasSection"));
const FaqSection = lazy(() => import("@/components/FaqSection"));
const CTASection = lazy(() => import("@/components/CTASection"));
const Footer = lazy(() => import("@/components/Footer"));

const transitions: Record<string, { variant: "arch" | "open-book" | "learning-path"; topColor: string; bottomColor: string; accentColor?: string }> = {
  programs: { variant: "learning-path", topColor: "#F0FDFA", bottomColor: "#FFFBF7", accentColor: "#147D7E" },
  tutors: { variant: "arch", topColor: "#FFFFFF", bottomColor: "#14213D" },
  final_cta: { variant: "open-book", topColor: "#F7F1E8", bottomColor: "#FFFFFF", accentColor: "#F97316" },
};

const SectionLoader = () => <div className="h-[360px] w-full animate-pulse bg-stone-50 motion-reduce:animate-none" role="status"><span className="sr-only">Memuat konten</span></div>;

function DeferredSection({ children, minHeight = 480, anchorId }: { children: ReactNode; minHeight?: number; anchorId?: string }) {
  const markerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const marker = markerRef.current;
    if (!marker || !("IntersectionObserver" in window)) {
      setReady(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setReady(true);
        observer.disconnect();
      }
    }, { rootMargin: "350px 0px" });
    observer.observe(marker);
    return () => observer.disconnect();
  }, []);
  return <div id={anchorId} ref={markerRef} style={ready ? undefined : { minHeight }} className="scroll-mt-36 sm:scroll-mt-40">{ready ? children : null}</div>;
}

export default function Index() {
  const { sections, isVisible, loading } = useWebsiteContent();
  const registry = useMemo<Record<string, { element: ReactNode; minHeight?: number; anchorId?: string }>>(() => ({
    trust: { element: <TrustSection />, minHeight: 420, anchorId: "kepercayaan" },
    programs: { element: <SubjectsSection />, minHeight: 620, anchorId: "program" },
    how_it_works: { element: <HowItWorksSection />, minHeight: 560, anchorId: "cara-kerja" },
    proof: { element: <FeaturesSection />, minHeight: 560, anchorId: "bukti-sistem" },
    tutors: { element: <TutorSection />, minHeight: 640, anchorId: "tutor" },
    pricing: { element: <PackagePreviewSection />, minHeight: 620, anchorId: "paket" },
    progress: { element: <DashboardPreviewSection />, minHeight: 560, anchorId: "progress" },
    reviews: { element: <ReviewsSection />, minHeight: 520, anchorId: "ulasan" },
    areas: { element: <AreasSection />, minHeight: 640, anchorId: "area" },
    faq: { element: <FaqSection />, minHeight: 680, anchorId: "faq" },
    final_cta: { element: <CTASection />, minHeight: 420, anchorId: "mulai" },
  }), []);
  const orderedSections = sections
    .filter((item) => item.section_key !== "hero" && registry[item.section_key] && isVisible(item.section_key))
    .sort((left, right) => left.sort_order - right.sort_order);

  useEffect(() => {
    if (loading || !window.location.hash) return;
    const id = decodeURIComponent(window.location.hash.slice(1));
    window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  }, [loading]);

  return (
    <div className="public-site min-h-screen bg-white">
      <Navbar />
      <main>
        {isVisible("hero") && <HeroSection />}
        {isVisible("hero") && <LandingMarquee />}
        {orderedSections.map((item) => {
          const entry = registry[item.section_key];
          const transition = transitions[item.section_key];
          return <div key={item.section_key}>{transition && <SectionArcDivider {...transition} />}<DeferredSection minHeight={entry.minHeight} anchorId={entry.anchorId}><Suspense fallback={<SectionLoader />}>{entry.element}</Suspense></DeferredSection></div>;
        })}
      </main>
      <Suspense fallback={<div className="h-48 animate-pulse bg-slate-900 motion-reduce:animate-none" />}><Footer /></Suspense>

    </div>
  );
}
