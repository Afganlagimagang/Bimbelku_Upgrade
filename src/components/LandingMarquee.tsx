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
    <div className="bg-[#FFFBF7] pt-24 sm:pt-20">
      <div ref={ref} data-active={active ? "true" : "false"} className="landing-marquee overflow-hidden border-y border-[#14213D]/10 bg-[#14213D] py-4 text-white">
        <div className="landing-marquee-track flex w-max items-center">
          {content.map((message, index) => (
            <span key={`${message}-${index}`} className="flex items-center whitespace-nowrap text-sm font-extrabold tracking-tight sm:text-base">
              <span className="px-6 sm:px-9">{message}</span>
              <Asterisk size={17} className="text-orange-400" aria-hidden="true" />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
