import { BookOpenText, CheckCircle2, Clock3, Compass, GraduationCap, ShieldCheck, Sparkles, UserRound } from "lucide-react";

export type SubjectPage = {
  hero_intro?: string | null;
  hero_image_url?: string | null;
  learning_approach?: string | null;
  facts?: Array<{ label: string; value: string }> | null;
  learning_map?: Array<{ stage: string; coverage: string; difficulty?: string; approach?: string }> | null;
  learning_journey?: Array<{ period: string; title: string; description: string }> | null;
  benefits?: string[] | null;
  suitable_for?: string[] | null;
  reasons?: Array<{ title: string; description: string }> | null;
  articles?: Array<{ title: string; body: string }> | null;
  faqs?: Array<{ question: string; answer: string }> | null;
  source_note?: string | null;
  reviewed_at?: string | null;
};

export type SubjectTestimonial = {
  id: number;
  display_name: string;
  quote: string;
  audience_role?: string;
  photo_url?: string;
  rating?: number;
};

export type SubjectTutor = {
  id: number;
  name: string;
  degree?: string | null;
  title?: string | null;
  credentials?: string | null;
  experience?: string | null;
  photo_url?: string | null;
};

export default function SubjectDetailContent({ name, content, testimonials, tutors }: { name: string; content: SubjectPage | null; testimonials: SubjectTestimonial[]; tutors: SubjectTutor[] }) {
  if (!content && testimonials.length === 0 && tutors.length === 0) return null;

  return <>
    {Boolean(content?.facts?.length) && <section className="border-y border-stone-200 bg-white py-12">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
        <p className="text-xs font-extrabold uppercase tracking-[.18em] text-orange-700">Sebelum memilih paket</p>
        <h2 className="mt-2 text-2xl font-extrabold text-[#14213D]">Fakta program Les {name}</h2>
        <dl className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {content?.facts?.map((fact, index) => <div key={`${fact.label}-${index}`} className="rounded-2xl border border-stone-200 bg-[#FFFBF7] p-4">
            <dt className="text-xs font-bold uppercase tracking-wider text-slate-500">{fact.label}</dt>
            <dd className="mt-2 text-sm font-extrabold leading-6 text-[#14213D]">{fact.value}</dd>
          </div>)}
        </dl>
      </div>
    </section>}

    {Boolean(content?.learning_map?.length || content?.learning_approach) && <section className="bg-[#F7F1E8] py-16 sm:py-20">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
        <div className="max-w-3xl">
          <p className="text-xs font-extrabold uppercase tracking-[.18em] text-orange-700">Pendampingan spesifik</p>
          <h2 className="mt-2 text-3xl font-extrabold text-[#14213D]">Peta belajar {name}</h2>
          {content?.learning_approach && <p className="mt-4 leading-7 text-slate-700">{content.learning_approach}</p>}
        </div>
        {Boolean(content?.learning_map?.length) && <div className="mt-8 overflow-hidden rounded-3xl border border-stone-200 bg-white">
          <div className="hidden grid-cols-[.8fr_1.25fr_1fr_1fr] gap-4 bg-[#14213D] px-6 py-4 text-xs font-extrabold uppercase tracking-wider text-white lg:grid">
            <span>Bahasan</span><span>Yang dicakup</span><span>Titik rawan</span><span>Cara pendampingan</span>
          </div>
          <div className="divide-y divide-stone-200">
            {content?.learning_map?.map((row, index) => <article key={`${row.stage}-${index}`} className="grid gap-3 p-5 lg:grid-cols-[.8fr_1.25fr_1fr_1fr] lg:gap-4 lg:px-6">
              <div><span className="text-[10px] font-black uppercase tracking-wider text-orange-700 lg:hidden">Bahasan</span><h3 className="mt-1 font-extrabold text-[#14213D]">{row.stage}</h3></div>
              <div><span className="text-[10px] font-black uppercase tracking-wider text-slate-400 lg:hidden">Yang dicakup</span><p className="mt-1 text-sm leading-6 text-slate-700">{row.coverage}</p></div>
              <div><span className="text-[10px] font-black uppercase tracking-wider text-slate-400 lg:hidden">Titik rawan</span><p className="mt-1 text-sm leading-6 text-slate-600">{row.difficulty || "Disesuaikan setelah pemetaan awal."}</p></div>
              <div><span className="text-[10px] font-black uppercase tracking-wider text-teal-700 lg:hidden">Pendampingan</span><p className="mt-1 text-sm font-semibold leading-6 text-teal-900">{row.approach || "Tutor menyesuaikan contoh dan latihan."}</p></div>
            </article>)}
          </div>
        </div>}
      </div>
    </section>}

    {tutors.length > 0 && <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
        <p className="text-xs font-extrabold uppercase tracking-[.18em] text-teal-700">Tutor dengan persetujuan publik</p>
        <h2 className="mt-2 text-3xl font-extrabold text-[#14213D]">Siapa yang dapat mengajar {name}?</h2>
        <p className="mt-4 max-w-3xl leading-7 text-slate-600">Daftar ini hanya menampilkan tutor aktif yang sudah diverifikasi, mengajar mapel ini, dan memberi izin profilnya ditampilkan. Tutor final tetap mengikuti hasil matching jadwal, mode, jenjang, dan area.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{tutors.map((tutor) => <article key={tutor.id} className="flex gap-4 rounded-3xl border border-stone-200 bg-[#FFFBF7] p-5">{tutor.photo_url ? <img src={tutor.photo_url} alt={tutor.name} loading="lazy" decoding="async" className="h-20 w-20 shrink-0 rounded-2xl object-cover" /> : <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-[#14213D] text-white"><UserRound size={32} /></div>}<div className="min-w-0"><h3 className="font-extrabold text-[#14213D]">{tutor.name}</h3>{tutor.degree && <p className="mt-1 text-xs font-bold text-teal-800">{tutor.degree}</p>}<p className="mt-1 text-xs font-bold text-orange-700">{tutor.title || `Tutor ${name}`}</p>{tutor.credentials && <p className="mt-3 flex gap-2 text-xs leading-5 text-slate-600"><GraduationCap size={15} className="mt-0.5 shrink-0 text-teal-700" />{tutor.credentials}</p>}{tutor.experience && <p className="mt-2 text-xs font-semibold text-slate-500">Pengalaman: {tutor.experience}</p>}</div></article>)}</div>
      </div>
    </section>}

    {Boolean(content?.learning_journey?.length) && <section className="bg-[#14213D] py-16 text-white sm:py-20">
      <div className="mx-auto max-w-[1100px] px-5 sm:px-8">
        <p className="text-xs font-extrabold uppercase tracking-[.18em] text-orange-300">Tahap demi tahap</p>
        <h2 className="mt-2 text-3xl font-extrabold">Perjalanan belajar yang dapat diikuti.</h2>
        <ol className="relative mt-9 space-y-4 before:absolute before:bottom-5 before:left-[1.15rem] before:top-5 before:w-px before:bg-white/20 md:grid md:grid-cols-5 md:gap-4 md:space-y-0 md:before:bottom-auto md:before:left-[10%] md:before:right-[10%] md:before:top-[1.15rem] md:before:h-px md:before:w-auto">
          {content?.learning_journey?.map((item, index) => <li key={`${item.period}-${index}`} className="relative flex gap-4 md:block">
            <span className="relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full border-4 border-[#14213D] bg-orange-500 text-xs font-black">{index + 1}</span>
            <div className="rounded-2xl bg-white/10 p-4 md:mt-5">
              <p className="text-[10px] font-black uppercase tracking-wider text-orange-300">{item.period}</p>
              <h3 className="mt-2 font-extrabold">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">{item.description}</p>
            </div>
          </li>)}
        </ol>
      </div>
    </section>}

    {Boolean(content?.benefits?.length || content?.suitable_for?.length) && <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto grid max-w-[1100px] gap-5 px-5 sm:px-8 md:grid-cols-2">
        {Boolean(content?.benefits?.length) && <div className="rounded-3xl border border-stone-200 bg-[#FFFBF7] p-6 sm:p-8">
          <Sparkles className="text-orange-600" size={25} /><h2 className="mt-4 text-2xl font-extrabold text-[#14213D]">Yang didapat</h2>
          <ul className="mt-5 space-y-3">{content?.benefits?.map((item) => <li key={item} className="flex gap-3 text-sm leading-6 text-slate-700"><CheckCircle2 size={18} className="mt-1 shrink-0 text-teal-700" />{item}</li>)}</ul>
        </div>}
        {Boolean(content?.suitable_for?.length) && <div className="rounded-3xl border border-stone-200 bg-[#F7F1E8] p-6 sm:p-8">
          <Compass className="text-teal-700" size={25} /><h2 className="mt-4 text-2xl font-extrabold text-[#14213D]">Cocok untuk siapa?</h2>
          <ul className="mt-5 space-y-3">{content?.suitable_for?.map((item) => <li key={item} className="flex gap-3 text-sm leading-6 text-slate-700"><CheckCircle2 size={18} className="mt-1 shrink-0 text-orange-600" />{item}</li>)}</ul>
        </div>}
      </div>
    </section>}

    {Boolean(content?.reasons?.length) && <section className="bg-[#EAF4F2] py-16 sm:py-20">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
        <div className="max-w-3xl"><p className="text-xs font-extrabold uppercase tracking-[.18em] text-teal-800">Bukti melalui fungsi</p><h2 className="mt-2 text-3xl font-extrabold text-[#14213D]">Alasan memilih pendampingan BimbelKu</h2><p className="mt-4 leading-7 text-slate-700">Setiap poin di bawah merujuk pada alur atau fitur yang tersedia, bukan janji hasil belajar.</p></div>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{content?.reasons?.map((item, index) => <article key={`${item.title}-${index}`} className="rounded-3xl bg-white p-6 shadow-sm"><ShieldCheck className="text-teal-700" size={23} /><h3 className="mt-4 text-lg font-extrabold text-[#14213D]">{item.title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p></article>)}</div>
      </div>
    </section>}

    {Boolean(content?.articles?.length) && <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-[900px] px-5 sm:px-8">
        <p className="text-xs font-extrabold uppercase tracking-[.18em] text-orange-700">Wawasan belajar</p>
        <h2 className="mt-2 text-3xl font-extrabold text-[#14213D]">Mengenal pembelajaran {name}</h2>
        <div className="mt-8 space-y-4">{content?.articles?.map((article, index) => <article key={`${article.title}-${index}`} className="rounded-3xl border border-stone-200 p-6 sm:p-8"><BookOpenText size={23} className="text-orange-700" /><h3 className="mt-4 text-xl font-extrabold text-[#14213D]">{article.title}</h3>{article.body.split(/\n+/).filter(Boolean).map((paragraph, paragraphIndex) => <p key={paragraphIndex} className="mt-3 text-sm leading-7 text-slate-700">{paragraph}</p>)}</article>)}</div>
      </div>
    </section>}

    {testimonials.length > 0 && <section className="bg-[#F7F1E8] py-16 sm:py-20">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
        <p className="text-xs font-extrabold uppercase tracking-[.18em] text-orange-700">Ulasan terhubung rating</p><h2 className="mt-2 text-3xl font-extrabold text-[#14213D]">Cerita murid {name}</h2>
        <div className="mt-7 grid gap-4 md:grid-cols-3">{testimonials.map((item) => <blockquote key={item.id} className="rounded-3xl border border-stone-200 bg-white p-6"><div className="flex items-center gap-3">{item.photo_url && <img src={item.photo_url} alt="" loading="lazy" decoding="async" className="h-11 w-11 rounded-full object-cover" />}<div><p className="font-bold text-[#14213D]">{item.display_name}</p><p className="text-xs text-slate-500">{item.audience_role || "Murid"}{item.rating ? ` · ${item.rating}/5` : ""}</p></div></div><p className="mt-4 text-sm leading-6 text-slate-700">“{item.quote}”</p></blockquote>)}</div>
      </div>
    </section>}

    {Boolean(content?.faqs?.length) && <section className="bg-[#FFFBF7] py-16 sm:py-20">
      <div className="mx-auto max-w-[900px] px-5 sm:px-8">
        <p className="text-xs font-extrabold uppercase tracking-[.18em] text-teal-700">Jawaban sebelum memesan</p><h2 className="mt-2 text-3xl font-extrabold text-[#14213D]">Pertanyaan tentang Les {name}</h2>
        <div className="mt-6 space-y-2">{content?.faqs?.map((item, index) => <details key={`${item.question}-${index}`} className="group rounded-2xl border border-stone-200 bg-white p-5 open:border-orange-300"><summary className="cursor-pointer list-none pr-6 font-bold text-[#14213D]">{item.question}</summary><p className="mt-3 text-sm leading-6 text-slate-700">{item.answer}</p></details>)}</div>
        {(content?.source_note || content?.reviewed_at) && <div className="mt-8 flex gap-3 rounded-2xl border border-stone-200 bg-white p-4 text-xs leading-5 text-slate-500"><Clock3 size={17} className="mt-0.5 shrink-0" /><p>{content?.source_note}{content?.reviewed_at ? ` Ditinjau ${new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(new Date(content.reviewed_at))}.` : ""}</p></div>}
      </div>
    </section>}
  </>;
}
