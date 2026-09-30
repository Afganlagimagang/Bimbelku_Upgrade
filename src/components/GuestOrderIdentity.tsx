import { useState } from "react";
import { LocateFixed } from "lucide-react";

export type GuestLocation = {
  address: string;
  maps_link: string;
  latitude: number | null;
  longitude: number | null;
  location_consent: boolean;
};

type Props = {
  name: string;
  email: string;
  phone: string;
  mode: string;
  location: GuestLocation;
  onIdentityChange: (field: "name" | "email" | "phone", value: string) => void;
  onLocationChange: (value: GuestLocation) => void;
  section?: "identity" | "location" | "all";
};

export default function GuestOrderIdentity({ name, email, phone, mode, location, onIdentityChange, onLocationChange, section = "all" }: Props) {
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState("");

  const locate = () => {
    if (!navigator.geolocation) { setLocationError("Perangkat ini tidak mendukung lokasi. Coba browser atau perangkat lain."); return; }
    setLocating(true);
    setLocationError("");
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      const latitude = Number(coords.latitude.toFixed(7));
      const longitude = Number(coords.longitude.toFixed(7));
      onLocationChange({ ...location, latitude, longitude, maps_link: `https://www.google.com/maps?q=${latitude},${longitude}` });
      setLocating(false);
    }, () => {
      setLocating(false);
      setLocationError("Lokasi belum diberikan. Izinkan akses lokasi untuk kelas tatap muka, atau pilih online.");
    }, { enableHighAccuracy: true, timeout: 15000 });
  };

  if (section === "location") return mode === "offline" ? <LocationFields location={location} locating={locating} locationError={locationError} locate={locate} onLocationChange={onLocationChange} /> : null;

  return <section className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-sm sm:p-7">
    <h2 className="text-lg font-black text-slate-900">Identitas pemesan</h2>
    <p className="mt-2 text-sm leading-6 text-slate-600">Belum perlu login. Setelah draf pesanan tercatat, masuk atau daftar dengan email yang sama untuk membuat tagihan dan membayar.</p>
    <div className="mt-5 grid gap-4 sm:grid-cols-2">
      <label className="text-sm font-bold text-slate-700">Nama lengkap<input autoComplete="name" required maxLength={120} value={name} onChange={(event) => onIdentityChange("name", event.target.value)} className="form-field mt-2" /></label>
      <label className="text-sm font-bold text-slate-700">Nomor WhatsApp<input autoComplete="tel" type="tel" required maxLength={30} value={phone} onChange={(event) => onIdentityChange("phone", event.target.value)} className="form-field mt-2" /></label>
      <label className="text-sm font-bold text-slate-700 sm:col-span-2">Email untuk menghubungkan pesanan<input autoComplete="email" type="email" required maxLength={255} value={email} onChange={(event) => onIdentityChange("email", event.target.value)} className="form-field mt-2" /><span className="mt-1 block text-xs font-normal text-slate-500">Pastikan alamat benar dan dapat diverifikasi. Akun dengan email lain tidak dapat mengambil pesanan ini.</span></label>
    </div>
    {section === "all" && mode === "offline" && <LocationFields location={location} locating={locating} locationError={locationError} locate={locate} onLocationChange={onLocationChange} />}
  </section>;
}

function LocationFields({ location, locating, locationError, locate, onLocationChange }: { location: GuestLocation; locating: boolean; locationError: string; locate: () => void; onLocationChange: (value: GuestLocation) => void }) {
  return <div id="guest-location" className="rounded-[2rem] border border-amber-200 bg-amber-50 p-5 shadow-sm sm:p-7">
      <h3 className="font-black text-amber-950">Lokasi kelas tatap muka</h3>
      <p className="mt-1 text-sm leading-6 text-amber-900">Diisi pada tahap jadwal agar pilihan program tidak tertahan oleh data lokasi.</p>
      <label className="mt-3 block text-sm font-bold text-slate-700">Alamat belajar<textarea rows={2} maxLength={1000} value={location.address} onChange={(event) => onLocationChange({ ...location, address: event.target.value })} className="form-field mt-2" placeholder="Jalan, nomor, kelurahan, kota" /></label>
      <button type="button" onClick={locate} disabled={locating} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-amber-800 px-4 text-sm font-black text-white disabled:opacity-50"><LocateFixed size={17} />{locating ? "Mencari lokasi…" : location.latitude !== null ? "Perbarui titik lokasi" : "Ambil titik lokasi"}</button>
      {location.latitude !== null && location.longitude !== null && <p className="mt-2 text-xs font-bold text-emerald-800">Titik lokasi tersimpan untuk draf ini.</p>}
      {locationError && <p role="alert" className="mt-2 text-xs text-red-700">{locationError}</p>}
      <label className="mt-4 flex items-start gap-2 text-xs leading-5 text-slate-700"><input type="checkbox" checked={location.location_consent} onChange={(event) => onLocationChange({ ...location, location_consent: event.target.checked })} className="mt-1" />Saya setuju alamat dan titik lokasi ini disimpan ke profil akun yang terhubung agar tutor dapat dicari setelah pembayaran.</label>
    </div>;
}
