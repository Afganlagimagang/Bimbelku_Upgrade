import { useEffect, useRef, useState } from "react";
import { BadgeCheck, Camera, GraduationCap, ShieldCheck, UserRound } from "lucide-react";

import Reveal from "@/components/Reveal";
import { useWebsiteContent } from "@/components/WebsiteContentProvider";

const fallbackTitles = [
  "Nama tutor 1",
  "Nama tutor 2",
  "Nama tutor 3",
  "Nama tutor 4",
  "Nama tutor 5",
  "Nama tutor 6",
];

const fallbackNotes = [
  "Tambahkan riwayat pendidikan atau karier dari admin.",
  "Tambahkan alumni, profesi, sertifikasi, atau prestasi.",
  "Gunakan informasi yang sudah disetujui tutor.",
  "Tambahkan pengalaman mengajar yang dapat diverifikasi.",
  "Cantumkan pencapaian yang relevan dan faktual.",
  "Lengkapi profil publik melalui pengaturan website.",
];

const placeholderTones = [
  "bg-teal-800",
  "bg-orange-700",
  "bg-sky-800",
  "bg-indigo-800",
  "bg-emerald-800",
  "bg-amber-700",
];

type TutorCardData = {
  imageUrl: string | null;
  title: string;
  note: string;
};

export default function TutorSection() {
  const { settings, section, trust_items: items } = useWebsiteContent();
  const cms = section("tutors");
  const tutorCount = items.find((item) => item.source_key === "verified_tutors")?.resolved_value;
  const tickerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const titles = section("trust")?.content?.trust_media_titles || [];
  const notes = section("trust")?.content?.trust_media_notes || [];
  const images = [
    settings.trust_image_1_url,
    settings.trust_image_2_url,
    settings.trust_image_3_url,
    settings.trust_image_4_url,
    settings.trust_image_5_url,
    settings.trust_image_6_url,
  ];
  const tutors: TutorCardData[] = images.map((imageUrl, index) => ({
    imageUrl,
    title: titles[index] || fallbackTitles[index],
    note: notes[index] || fallbackNotes[index],
  }));

  useEffect(() => {
    const element = tickerRef.current;
    if (!element || !("IntersectionObserver" in window)) {
      setActive(settings.animations_enabled);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setActive(entry.isIntersecting && settings.animations_enabled),
      { threshold: 0.08 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [settings.animations_enabled]);

  const setTickerPlayState = (playState: "paused" | "") => {
    const track = tickerRef.current?.firstElementChild as HTMLElement | null;
    if (track) track.style.animationPlayState = playState;
  };

  return (
    <section className="overflow-hidden bg-[#14213D] py-20 text-white sm:py-24 lg:py-28">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
        <Reveal width="100%">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-orange-300">{cms?.eyebrow || "Tutor BimbelKu"}</p>
              <h2 className="mt-4 text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">{cms?.title || "Kenali tutor yang siap mendampingi belajar."}</h2>
              <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300">{cms?.description || "Galeri hanya memuat tutor yang telah diverifikasi dan memberikan izin untuk ditampilkan."}</p>
            </div>
            <div className="inline-flex w-fit items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
              <BadgeCheck className="text-teal-300" size={22} />
              <div><p className="text-lg font-extrabold">{tutorCount || "Diverifikasi"}</p><p className="text-xs font-semibold text-slate-300">berdasarkan status sistem</p></div>
            </div>
          </div>
        </Reveal>
      </div>

      <div
        ref={tickerRef}
        onMouseEnter={() => setTickerPlayState("paused")}
        onMouseLeave={() => setTickerPlayState("")}
        data-active={active ? "true" : "false"}
        className="tutor-ticker mt-10 overflow-hidden py-5"
        role="region"
        aria-label="Galeri tutor BimbelKu"
      >
        <div className="tutor-ticker-track flex w-max">
          <TutorGroup tutors={tutors} />
          <TutorGroup tutors={tutors} duplicate />
        </div>
      </div>

      <div className="mx-auto mt-6 max-w-[1200px] px-5 sm:px-8">
        <p className="flex items-start gap-2 text-xs font-semibold leading-5 text-slate-400"><ShieldCheck size={17} className="mt-0.5 shrink-0 text-emerald-300" />Bagian ini khusus galeri tutor. Foto hanya ditampilkan setelah ada persetujuan publik; nomor kontak dan dokumen pribadi tetap tidak dipublikasikan.</p>
      </div>
    </section>
  );
}

function TutorGroup({ tutors, duplicate = false }: { tutors: TutorCardData[]; duplicate?: boolean }) {
  return (
    <div className={`flex shrink-0 gap-4 px-2 ${duplicate ? "tutor-ticker-clone" : ""}`} aria-hidden={duplicate || undefined}>
      {tutors.map((tutor, index) => (
        <article key={`${duplicate ? "copy" : "original"}-${index}`} tabIndex={duplicate ? -1 : 0} className="group hover-scale-110 relative aspect-[4/5] w-52 shrink-0 overflow-hidden rounded-3xl border border-white/10 bg-slate-800 shadow-2xl transition-transform duration-300 sm:w-56 lg:w-60">
          {tutor.imageUrl ? (
            <img src={tutor.imageUrl} alt={duplicate ? "" : tutor.title} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className={`absolute inset-0 grid place-items-center ${placeholderTones[index]}`}>
              <div className="px-4 text-center">
                <UserRound size={48} className="mx-auto text-white/70" />
                <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-black/20 px-3 py-2 text-[11px] font-extrabold"><Camera size={14} />Tambahkan dari admin</p>
              </div>
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0c1730] via-[#14213D]/90 to-transparent p-5 pt-16">
            <p className="text-base font-extrabold">{tutor.title}</p>
            <p className="mt-2 flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide text-orange-200"><GraduationCap size={13} />Jejak pendidikan & karier</p><p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-slate-300">{tutor.note}</p>
          </div>
        </article>
      ))}
    </div>
  );
}
