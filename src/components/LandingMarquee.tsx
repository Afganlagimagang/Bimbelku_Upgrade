import { useEffect, useRef, useState } from "react";
import { Asterisk } from "lucide-react";

import { useWebsiteContent } from "@/components/WebsiteContentProvider";

const messages = [
  "Harga terlihat sebelum bayar",
  "Jadwal dipilih sejak awal",
  "Matching setelah pembayaran",
  "Tutor diperiksa admin",
  "Progress materi tercatat",
] as const;

export default function LandingMarquee() {
  const { settings } = useWebsiteContent();
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || !("IntersectionObserver" in window)) {
      setActive(settings.animations_enabled);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting && settings.animations_enabled), { threshold: 0.1 });
    observer.observe(element);
    return () => observer.disconnect();
  }, [settings.animations_enabled]);

  const content = [...messages, ...messages];
  return (
    <div className="bg-[#FFFBF7] px-3 pb-2 pt-1 sm:px-0 sm:pb-0 sm:pt-20">
      <div ref={ref} data-active={active ? "true" : "false"} className="landing-marquee relative overflow-hidden rounded-2xl bg-[#14213D] py-3.5 text-white shadow-[0_10px_26px_rgba(20,33,61,.12)] sm:rounded-none sm:border-y sm:border-[#14213D]/10 sm:py-4 sm:shadow-none">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-[#14213D] to-transparent sm:w-14" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-[#14213D] to-transparent sm:w-14" aria-hidden="true" />
        <div className="landing-marquee-track flex w-max items-center">
          {content.map((message, index) => (
            <span key={`${message}-${index}`} className="flex items-center whitespace-nowrap text-xs font-extrabold tracking-tight sm:text-base">
              <span className="px-5 sm:px-9">{message}</span>
              <Asterisk size={15} className="text-[#F6B94A] sm:h-[17px] sm:w-[17px]" aria-hidden="true" />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
