import { useState } from "react";
import { Link } from "react-router-dom";
import { Laptop2, MapPin, Navigation, Wifi } from "lucide-react";

import Reveal from "@/components/Reveal";
import { useWebsiteContent } from "@/components/WebsiteContentProvider";

const areas = ["Kota Yogyakarta", "Sleman", "Bantul", "Kulon Progo", "Gunungkidul"] as const;

export default function AreasSection() {
  const { section, settings } = useWebsiteContent();
  const cms = section("areas");
  const [active, setActive] = useState<(typeof areas)[number]>("Kota Yogyakarta");

  return (
    <section className="overflow-hidden bg-white py-20 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_1fr] lg:gap-14">
          <Reveal direction="right" width="100%">
            <div className="relative min-h-[440px] overflow-hidden rounded-[36px] bg-[#14213D] p-7 text-white sm:p-10">
              <div className="area-ring absolute left-1/2 top-1/2 h-[360px] w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-orange-300/25" aria-hidden="true" />
              <div className="absolute left-1/2 top-1/2 h-[250px] w-[250px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" aria-hidden="true" />
              <div className="relative z-10 flex min-h-[360px] flex-col items-center justify-center text-center">
                <span className="grid h-16 w-16 place-items-center rounded-[22px] bg-orange-500 text-white shadow-lg"><MapPin size={28} /></span>
                <p className="mt-6 text-xs font-extrabold uppercase tracking-[.17em] text-orange-300">Area yang sedang dilihat</p>
                <h3 className="mt-2 text-3xl font-extrabold">{active}</h3>
                <p className="mt-3 max-w-sm text-sm leading-7 text-slate-300">Permintaan tatap muka dicocokkan berdasarkan alamat, jarak tempuh tutor, mata pelajaran, dan jadwal.</p>
                <div className="mt-6 flex items-center gap-2 rounded-full border border-white/15 bg-white/[.07] px-4 py-2 text-xs font-bold text-slate-200"><Navigation size={15} className="text-orange-300" />Ketersediaan diperiksa saat matching</div>
              </div>
            </div>
          </Reveal>

          <div>
            <Reveal width="100%">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-teal-700">{cms?.eyebrow || "Area layanan"}</p>
              <h2 className="mt-4 text-balance text-3xl font-extrabold tracking-tight text-[#14213D] sm:text-4xl">{cms?.title || "Belajar online dari mana saja, atau tatap muka di Yogyakarta."}</h2>
              <p className="mt-5 max-w-xl text-base leading-8 text-slate-600">{cms?.description || "Ketersediaan tutor tatap muka tetap mengikuti alamat, jarak, mapel, dan jadwal yang dipilih."}</p>
            </Reveal>
            <div className="mt-7 flex flex-wrap gap-2" role="group" aria-label="Pilih area Yogyakarta">
              {areas.map((area) => <button key={area} type="button" aria-pressed={active === area} onClick={() => setActive(area)} className={`min-h-11 rounded-full border px-4 text-sm font-extrabold transition ${active === area ? "border-[#147D7E] bg-[#147D7E] text-white" : "border-stone-200 bg-stone-50 text-slate-600 hover:border-teal-300"}`}>{area}</button>)}
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <article className="rounded-3xl border border-stone-200 bg-[#FBF7F1] p-5"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-teal-100 text-teal-800"><Laptop2 size={21} /></span><h3 className="mt-4 font-extrabold text-[#14213D]">Belajar online</h3><p className="mt-2 text-sm leading-6 text-slate-600">Tidak dibatasi area tatap muka, selama program dan tutor tersedia.</p></article>
              <article className="rounded-3xl border border-stone-200 bg-[#FBF7F1] p-5"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-orange-100 text-orange-800"><Wifi size={21} /></span><h3 className="mt-4 font-extrabold text-[#14213D]">Belajar tatap muka</h3><p className="mt-2 text-sm leading-6 text-slate-600">Ketersediaan tidak dijanjikan sebelum alamat dan jadwal dicocokkan.</p></article>
            </div>
            <Link to="/area-layanan" className="mt-6 inline-flex min-h-11 items-center rounded-xl border border-teal-200 bg-white px-4 text-sm font-extrabold text-teal-800">Pelajari area layanan</Link>
          </div>
        </div>

        {settings.office_address && (
          <Reveal width="100%">
            <address className="mt-10 flex flex-col gap-4 rounded-3xl bg-[#14213D] p-6 text-white not-italic sm:flex-row sm:items-center sm:justify-between sm:p-8">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[.16em] text-orange-300">Alamat BimbelKu</p>
                <p className="mt-2 text-lg font-extrabold">{settings.office_address}</p>
              </div>
              {settings.google_maps_url && <a href={settings.google_maps_url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-extrabold text-[#14213D]"><MapPin size={17} />Buka di peta</a>}
            </address>
          </Reveal>
        )}
      </div>
    </section>
  );
}
