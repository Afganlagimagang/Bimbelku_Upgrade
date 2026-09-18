import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { BookOpenCheck, CalendarCheck2, ChartNoAxesColumnIncreasing, CheckCircle2, MapPinned, ReceiptText, ShieldCheck, Star } from "lucide-react";

import Reveal from "@/components/Reveal";
import { useWebsiteContent } from "@/components/WebsiteContentProvider";
import type { WebsiteTrustItem } from "@/lib/websiteContent";

const icons: Record<string, ComponentType<{ className?: string; size?: number }>> = {
  "book-open-check": BookOpenCheck,
  "shield-check": ShieldCheck,
  receipt: ReceiptText,
  "calendar-check": CalendarCheck2,
  "chart-no-axes-column-increasing": ChartNoAxesColumnIncreasing,
  "map-pinned": MapPinned,
  star: Star,
};

type ParsedValue = { number: number; decimals: number; suffix: string };

const parseValue = (value: string): ParsedValue | null => {
  const match = value.match(/^([\d.]+(?:,\d+)?)(.*)$/);
  if (!match) return null;
  const decimals = match[1].includes(",") ? match[1].split(",")[1].length : 0;
  const number = Number(match[1].replace(/\./g, "").replace(",", "."));
  return Number.isFinite(number) ? { number, decimals, suffix: match[2] } : null;
};

const formatValue = (number: number, parsed: ParsedValue) => `${number.toLocaleString("id-ID", { minimumFractionDigits: parsed.decimals, maximumFractionDigits: parsed.decimals })}${parsed.suffix}`;

function AnimatedValue({ value, active, enabled }: { value: string; active: boolean; enabled: boolean }) {
  const parsed = useMemo(() => parseValue(value), [value]);
  const current = useRef(0);
  const complete = useRef(false);
  const [display, setDisplay] = useState(enabled && parsed ? formatValue(0, parsed) : value);

  useEffect(() => {
    current.current = 0;
    complete.current = false;
    setDisplay(enabled && parsed ? formatValue(0, parsed) : value);
  }, [enabled, parsed, value]);

  useEffect(() => {
    if (!parsed || !enabled || !active || complete.current) return;
    const from = current.current;
    const started = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - started) / 800);
      current.current = from + (parsed.number - from) * (1 - Math.pow(1 - progress, 3));
      setDisplay(formatValue(current.current, parsed));
      if (progress < 1) frame = requestAnimationFrame(tick);
      else complete.current = true;
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, enabled, parsed]);

  return <>{display}</>;
}

export default function TrustSection() {
  const { settings, section, trust_items: trustItems } = useWebsiteContent();
  const trust = section("trust");
  const rootRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const element = rootRef.current;
    if (!element || !("IntersectionObserver" in window)) {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.12 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  if (!trustItems.length) return null;

  return (
    <section ref={rootRef} className="border-y border-teal-100 bg-teal-50 py-20 sm:py-24">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
        <Reveal width="100%">
          <div className="grid gap-6 lg:grid-cols-3 lg:items-end">
            <div className="lg:col-span-2">
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-teal-800">{trust?.eyebrow || "Bukti yang dapat diperiksa"}</p>
              <h2 className="mt-3 text-balance text-3xl font-extrabold tracking-tight text-[#14213D] sm:text-4xl">{trust?.title || "Kepercayaan dibangun dari sistem yang jelas."}</h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">{trust?.description || "Setiap angka berasal dari sistem atau dilengkapi catatan sumber dan tanggal pembaruan."}</p>
            </div>
            <div className="rounded-3xl bg-[#14213D] p-5 text-white">
              <p className="flex items-center gap-2 text-sm font-extrabold"><ShieldCheck size={19} className="text-orange-300" />Bukti, bukan dekorasi</p>
              <p className="mt-2 text-xs font-semibold leading-5 text-slate-300">Angka sistem diperbarui otomatis. Angka manual wajib memiliki sumber dan tanggal.</p>
            </div>
          </div>
        </Reveal>

        <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {trustItems.slice(0, 5).map((item, index) => (
            <TrustCard key={`${item.id}-${item.title}`} item={item} index={index} inView={inView} animationsEnabled={settings.animations_enabled} />
          ))}
        </div>
      </div>
    </section>
  );
}

function TrustCard({ item, index, inView, animationsEnabled }: { item: WebsiteTrustItem; index: number; inView: boolean; animationsEnabled: boolean }) {
  const Icon = icons[item.icon_key || ""] || CheckCircle2;
  const updated = item.source_updated_at ? new Intl.DateTimeFormat("id-ID", { month: "short", year: "numeric" }).format(new Date(item.source_updated_at)) : null;
  const sourceLabel = item.source_type === "system" ? "Data sistem" : item.source_type === "manual" ? `Sumber terverifikasi${updated ? ` · ${updated}` : ""}` : "Komitmen layanan";

  return (
    <Reveal delay={index * 0.06} width="100%" className="h-full">
      <article className="h-full rounded-3xl border border-teal-100 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-orange-100 text-orange-700"><Icon size={21} aria-hidden="true" /></span>
        {item.resolved_value && <p className="mt-5 text-3xl font-extrabold tracking-tight text-[#14213D]"><AnimatedValue value={item.resolved_value} active={inView} enabled={animationsEnabled} /></p>}
        <h3 className={`${item.resolved_value ? "mt-2" : "mt-5"} text-sm font-extrabold leading-6 text-[#14213D]`}>{item.title}</h3>
        {item.description && <p className="mt-2 text-xs leading-5 text-slate-600">{item.description}</p>}
        <p className="mt-4 text-[11px] font-bold text-slate-500">{sourceLabel}</p>
      </article>
    </Reveal>
  );
}
