import { useEffect, useRef, type CSSProperties } from "react";

type Variant = "trail" | "focus" | "spark";

type Props = {
  variant: Variant;
  color: string;
  style: CSSProperties;
};

/**
 * Ornamen jalur belajar BimbelKu: bergerak hanya saat terlihat, tab aktif,
 * dan pengguna tidak memilih reduced motion. Tidak mengikuti toggle admin.
 */
export default function LandingAmbientOrbit({ variant, color, style }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const paths = Array.from(svg.querySelectorAll<SVGPathElement>("[data-motion-path]"));
    const travelers = Array.from(svg.querySelectorAll<SVGGElement>("[data-traveler]"));
    const ripple = svg.querySelector<SVGCircleElement>("[data-ripple]");
    const pivot = svg.querySelector<SVGGElement>("[data-pivot]");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let inView = false;
    let frameId: number | null = null;
    let elapsed = 0;
    let previousFrame = 0;

    const animate = (now: number) => {
      if (previousFrame) elapsed += Math.min(now - previousFrame, 64);
      previousFrame = now;
      travelers.forEach((traveler, index) => {
        const path = paths[index];
        if (!path) return;
        const duration = index === 0 ? 8_000 : 11_000;
        const progress = (elapsed / duration + (index ? 0.48 : 0)) % 1;
        const point = path.getPointAtLength(progress * path.getTotalLength());
        traveler.setAttribute("transform", `translate(${point.x} ${point.y})`);
      });
      if (ripple) {
        const progress = (elapsed % 4_400) / 4_400;
        ripple.setAttribute("r", String(16 + progress * 76));
        ripple.setAttribute("opacity", String((1 - progress) * 0.72));
      }
      pivot?.setAttribute("transform", `rotate(${Math.sin(elapsed / 2_200) * 11} 110 110)`);
      frameId = window.requestAnimationFrame(animate);
    };

    const update = () => {
      if (inView && !document.hidden && !reducedMotion.matches) {
        if (frameId === null) frameId = window.requestAnimationFrame(animate);
      } else if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
        frameId = null;
        previousFrame = 0;
      }
    };

    const observer = "IntersectionObserver" in window
      ? new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; update(); }, { threshold: 0.05 })
      : null;
    if (observer) observer.observe(svg);
    else { inView = true; update(); }

    reducedMotion.addEventListener?.("change", update);
    document.addEventListener("visibilitychange", update);
    return () => {
      observer?.disconnect();
      reducedMotion.removeEventListener?.("change", update);
      document.removeEventListener("visibilitychange", update);
      if (frameId !== null) window.cancelAnimationFrame(frameId);
    };
  }, [variant]);

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 220 220"
      className="pointer-events-none absolute"
      style={{ ...style, color, maxWidth: style.maxWidth ?? "50vw", maxHeight: style.maxHeight ?? "50vw" }}
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      {variant === "trail" && (
        <>
          <path data-motion-path d="M17 173 C45 152 51 71 103 67 S169 119 203 31" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity=".76" />
          <path data-motion-path d="M18 197 C82 202 151 165 204 123" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="5 9" opacity=".46" />
          <circle cx="103" cy="67" r="15" fill="currentColor" opacity=".1" />
          <circle cx="103" cy="67" r="5" fill="currentColor" opacity=".75" />
          <circle cx="203" cy="31" r="7" fill="currentColor" opacity=".7" />
          <g data-traveler transform="translate(17 173)"><circle r="13" fill="currentColor" opacity=".14" /><circle r="8" stroke="currentColor" strokeWidth="2.5" /><circle r="3" fill="currentColor" /></g>
          <g data-traveler transform="translate(18 197)"><circle r="7" fill="currentColor" opacity=".9" /></g>
        </>
      )}

      {variant === "focus" && (
        <>
          <rect x="32" y="32" width="156" height="156" rx="48" transform="rotate(-12 110 110)" stroke="currentColor" strokeWidth="2.5" opacity=".65" />
          <rect x="61" y="61" width="98" height="98" rx="32" transform="rotate(12 110 110)" stroke="currentColor" strokeWidth="2" opacity=".45" />
          <path d="M110 20V45M200 110H175M110 200V175M20 110H45" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity=".7" />
          <circle data-ripple cx="110" cy="110" r="16" stroke="currentColor" strokeWidth="2.5" opacity=".72" />
          <g data-pivot>
            <rect x="95" y="95" width="30" height="30" rx="10" fill="currentColor" opacity=".25" />
            <circle cx="110" cy="110" r="7" fill="currentColor" />
          </g>
        </>
      )}

      {variant === "spark" && (
        <>
          <path data-motion-path d="M111 18L163 51L203 110L165 169L98 204L35 160L17 91Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" opacity=".62" />
          <path d="M111 18L110 110L203 110M35 160L110 110L165 169" stroke="currentColor" strokeWidth="1.5" opacity=".38" />
          <circle cx="111" cy="18" r="5" fill="currentColor" /><circle cx="203" cy="110" r="5" fill="currentColor" /><circle cx="35" cy="160" r="5" fill="currentColor" />
          <circle data-ripple cx="110" cy="110" r="16" stroke="currentColor" strokeWidth="2" opacity=".72" />
          <g data-traveler transform="translate(111 18)"><circle r="12" fill="currentColor" opacity=".18" /><circle r="7" stroke="currentColor" strokeWidth="2.5" /><circle r="2.5" fill="currentColor" /></g>
          <g data-pivot><path d="M110 87V133M87 110H133" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity=".8" /></g>
        </>
      )}
    </svg>
  );
}
