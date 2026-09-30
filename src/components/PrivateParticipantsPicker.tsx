import { BadgePercent } from "lucide-react";
import { emptyParticipantDetail, type PrivateParticipantDetail } from "@/lib/privateParticipants";

type Props = {
  count: number;
  purchaserParticipates: boolean;
  details: PrivateParticipantDetail[];
  ready: boolean;
  maximumParticipants: number;
  discounts: Record<string, number>;
  onCountChange: (count: number) => void;
  onPurchaserParticipatesChange: (value: boolean) => void;
  onDetailChange: (index: number, patch: Partial<PrivateParticipantDetail>) => void;
};

const percentLabel = (value: number) => new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(value);

export default function PrivateParticipantsPicker({
  count, purchaserParticipates, details, ready, maximumParticipants, discounts, onCountChange, onPurchaserParticipatesChange, onDetailChange,
}: Props) {
  const otherParticipantCount = Math.max(0, count - (purchaserParticipates ? 1 : 0));
  const today = new Date().toISOString().slice(0, 10);
  const currentDiscount = count > 1 ? Number(discounts[String(count)] || 0) : 0;

  return <section className="min-w-0 max-w-full overflow-hidden rounded-[2rem] border border-slate-100 bg-white p-4 shadow-sm sm:p-7">
    <div className="min-w-0">
      <h2 className="break-words text-lg font-black text-slate-900">Peserta privat</h2>
      <p className="mt-2 break-words text-sm leading-6 text-slate-600">Satu pemesan membayar seluruh peserta. Ini tetap privat dengan satu tutor, bukan Kelas Bersama yang memiliki pendaftaran dan kuota terpisah.</p>
    </div>
    <div className="mt-5 grid min-w-0 gap-5 md:grid-cols-2">
      <div className="min-w-0">
        <label className="block text-xs font-black uppercase tracking-wider text-slate-500" htmlFor="private-participant-count">Jumlah peserta</label>
        <select id="private-participant-count" value={count} onChange={(event) => onCountChange(Number(event.target.value))} className="form-field mt-2 min-w-0 max-w-full">
          <option value={1}>1 peserta · harga normal</option>
          {ready && Array.from({ length: Math.max(0, maximumParticipants - 1) }, (_, index) => index + 2).map((value) => {
            const discount = Number(discounts[String(value)] || 0);
            return <option key={value} value={value}>{value} peserta · diskon {percentLabel(discount)}%</option>;
          })}
        </select>
        <div className={`mt-3 flex min-w-0 items-start gap-3 rounded-2xl border p-3 ${currentDiscount > 0 ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-slate-200 bg-slate-50 text-slate-700"}`}>
          <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${currentDiscount > 0 ? "bg-emerald-600 text-white" : "bg-white text-slate-500"}`}><BadgePercent size={18} /></span>
          <div className="min-w-0"><p className="break-words text-sm font-black">{currentDiscount > 0 ? `Diskon peserta ${percentLabel(currentDiscount)}%` : "Belum ada diskon peserta"}</p><p className="mt-0.5 break-words text-xs leading-5 opacity-80">{count > 1 ? "Diskon dihitung dari total harga normal seluruh peserta." : "Pilih dua peserta atau lebih untuk melihat diskon bertingkat."}</p></div>
        </div>
      </div>
      <fieldset className="min-w-0 max-w-full">
        <legend className="max-w-full break-words text-xs font-black uppercase tracking-wider text-slate-500">Apakah pemesan ikut belajar?</legend>
        <div className="mt-2 grid min-w-0 grid-cols-1 gap-2 min-[380px]:grid-cols-2">
          <button type="button" aria-pressed={purchaserParticipates} onClick={() => onPurchaserParticipatesChange(true)} className={`min-h-12 min-w-0 break-words rounded-xl border px-3 py-2 text-sm font-black leading-5 ${purchaserParticipates ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-200 bg-white text-slate-700"}`}>Ya, saya ikut</button>
          <button type="button" aria-pressed={!purchaserParticipates} onClick={() => onPurchaserParticipatesChange(false)} className={`min-h-12 min-w-0 break-words rounded-xl border px-3 py-2 text-sm font-black leading-5 ${!purchaserParticipates ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-200 bg-white text-slate-700"}`}>Hanya mendaftarkan</button>
        </div>
      </fieldset>
    </div>
    {!ready && <p className="mt-3 break-words rounded-xl bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">Privat 2–{maximumParticipants} peserta belum dibuka karena tabel harga dan bayaran tutor masih perlu dilengkapi admin.</p>}
    {otherParticipantCount > 0 && <div className="mt-6 min-w-0 space-y-4">
      <div className="min-w-0"><h3 className="break-words font-black text-slate-900">Identitas peserta lain</h3><p className="mt-1 break-words text-xs leading-5 text-slate-500">Data ini membantu tutor mengenali peserta dan menyesuaikan pendampingan. Tidak ditampilkan ke publik.</p></div>
      {Array.from({ length: otherParticipantCount }, (_, index) => {
        const detail = details[index] || emptyParticipantDetail();
        return <fieldset key={index} className="min-w-0 max-w-full rounded-2xl border border-slate-200 p-3 sm:p-4">
          <legend className="max-w-full break-words px-2 text-sm font-black text-slate-800">Peserta {index + 1}</legend>
          <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="min-w-0 text-sm font-bold text-slate-700">Nama lengkap<input required maxLength={100} value={detail.full_name} onChange={(event) => onDetailChange(index, { full_name: event.target.value })} className="form-field mt-2 min-w-0 max-w-full" /></label>
            <label className="min-w-0 text-sm font-bold text-slate-700">Nama panggilan<input required maxLength={60} value={detail.nickname} onChange={(event) => onDetailChange(index, { nickname: event.target.value })} className="form-field mt-2 min-w-0 max-w-full" /></label>
            <label className="min-w-0 text-sm font-bold text-slate-700">Tanggal lahir<input required type="date" max={today} value={detail.birth_date} onChange={(event) => onDetailChange(index, { birth_date: event.target.value })} className="form-field mt-2 min-w-0 max-w-full" /></label>
            <label className="min-w-0 text-sm font-bold text-slate-700">Jenis kelamin<select required value={detail.gender} onChange={(event) => onDetailChange(index, { gender: event.target.value as PrivateParticipantDetail["gender"] })} className="form-field mt-2 min-w-0 max-w-full"><option value="">Pilih</option><option value="female">Perempuan</option><option value="male">Laki-laki</option></select></label>
          </div>
        </fieldset>;
      })}
    </div>}
    {count > 1 && <p className="mt-4 break-words text-xs leading-5 text-slate-500">Diskon peserta mengikuti tabel admin. Dari harga final setelah diskon, 80% menjadi hak tutor dan 20% menjadi bagian admin.</p>}
  </section>;
}
