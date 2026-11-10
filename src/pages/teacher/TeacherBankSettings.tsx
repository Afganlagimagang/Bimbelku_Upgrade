import { notify } from "@/lib/notify";
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import TeacherLayout from "../../components/TeacherLayout"; 
import { 
  CreditCard, Save, Send, Building, User, Wallet, MapPin,
  AlertCircle, ShieldCheck, CheckCircle2, Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useConfirmDialog } from "@/components/ConfirmDialogProvider";
import http, { getApiError, getCached } from "@/lib/http";
import { isValidAccountNumber, sanitizeDigits } from "@/lib/validation";

const PAYOUT_ACCOUNT_MIN_DIGITS = 8;
const PAYOUT_ACCOUNT_MAX_DIGITS = 20;
const PAYOUT_CHANNELS = [
  ["BCA", "Bank Central Asia (BCA)"],
  ["MANDIRI", "Bank Mandiri"],
  ["BRI", "Bank Rakyat Indonesia (BRI)"],
  ["BNI", "Bank Negara Indonesia (BNI)"],
  ["CIMB", "CIMB Niaga"],
  ["PERMATA", "PermataBank"],
  ["BSI", "Bank Syariah Indonesia (BSI)"],
] as const;

export function TeacherBankSettings({ onSaved, payoutAmount, payoutAvailable = false, payoutUnavailableMessage, onPayoutCompleted }: {
  onSaved?: () => void;
  payoutAmount?: number;
  payoutAvailable?: boolean;
  payoutUnavailableMessage?: string;
  onPayoutCompleted?: () => void;
}) {
  const confirm = useConfirmDialog();
  const [payoutChannelCode, setPayoutChannelCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [address, setAddress] = useState("");
  const [profileAddress, setProfileAddress] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchBankData();
  }, []);

  const fetchBankData = async () => {
    try {
        const response = await getCached("/teacher/profile", { force: true });
        
        const profileData = response.data.profile;
        setProfileAddress(String(response.data.user?.address || "").trim());
        if (profileData) {
            setPayoutChannelCode(profileData.payout_channel_code || "");
            setAccountNumber(sanitizeDigits(profileData.account_number || "", 50));
            setAccountHolder(String(profileData.account_name || "").trim());
        }
    } catch (error) {
        console.error("Gagal load data bank", error);
        notify.error("Gagal memuat data rekening.");
    } finally {
        setIsLoading(false);
    }
  };

  const handleSave = async () => {
    const wantsPayout = payoutAmount !== undefined;
    if (isSaving) return;
    if (wantsPayout && !payoutAvailable) {
        notify.error(payoutUnavailableMessage || "Layanan pencairan belum siap. Hubungi admin BimbelKu.");
        return;
    }
    const holderName = accountHolder.trim().replace(/\s+/g, " ");
    if (wantsPayout && !profileAddress && !address.trim()) {
        notify.error("Isi alamat lengkap pada formulir pencairan.");
        document.getElementById("payout-address")?.focus();
        return;
    }
    if(!payoutChannelCode || !accountNumber || !holderName || !currentPassword) {
        notify.error("Mohon lengkapi semua data rekening.");
        return;
    }
    if (
        !isValidAccountNumber(accountNumber)
        || accountNumber.length < PAYOUT_ACCOUNT_MIN_DIGITS
        || accountNumber.length > PAYOUT_ACCOUNT_MAX_DIGITS
    ) {
        notify.error(`Nomor rekening atau e-wallet harus berisi ${PAYOUT_ACCOUNT_MIN_DIGITS}–${PAYOUT_ACCOUNT_MAX_DIGITS} digit.`);
        return;
    }
    const approved = await confirm({
        title: wantsPayout ? "Konfirmasi pencairan dana?" : "Simpan rekening pencairan?",
        description: wantsPayout
          ? `Cairkan Rp${new Intl.NumberFormat("id-ID").format(payoutAmount)} ke ${payoutChannelCode}, nomor ${accountNumber}, atas nama ${holderName}. Kepemilikan rekening belum diverifikasi otomatis. Pastikan seluruh data tujuan transfer benar.`
          : `Simpan rekening ${payoutChannelCode}, nomor ${accountNumber}, atas nama ${holderName}. Pastikan data sesuai rekening bank Anda.`,
        confirmText: wantsPayout ? "Cairkan dana" : "Simpan rekening",
        tone: "warning",
    });
    if (!approved) return;

    setIsSaving(true);
    try {
        const bankData = {
            payout_channel_code: payoutChannelCode,
            account_number: accountNumber,
            account_name: holderName,
            current_password: currentPassword,
            address: profileAddress ? undefined : address.trim() || undefined,
        };

        if (wantsPayout) {
            await http.post("/teacher/payout-requests", { ...bankData, amount: payoutAmount });
            setCurrentPassword("");
            notify.success("Permintaan pencairan tercatat. Pantau status transfer di Dompet Tutor.");
            if (onPayoutCompleted) onPayoutCompleted();
            else onSaved?.();
            return;
        }

        await http.post("/teacher/bank", bankData);
        setCurrentPassword("");
        notify.success("Rekening Berhasil Disimpan!", {
            description: "Periksa kembali tujuan transfer sebelum mencairkan dana.",
            icon: <CheckCircle2 className="text-emerald-600" />,
            style: { background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#047857' }
        });
        onSaved?.();
    } catch (error) {
        notify.error(getApiError(error, wantsPayout ? "Pencairan belum dapat diproses. Saldo tetap aman." : "Gagal menyimpan rekening."));
    } finally {
        setIsSaving(false);
    }
  };

  if (isLoading) return <div className="grid min-h-60 place-items-center"><Loader2 className="animate-spin text-indigo-600"/></div>;

  return (
      <div id="rekening" className="mx-auto max-w-5xl scroll-mt-6 space-y-6 pb-10 sm:space-y-8">
          
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Rekening Pencairan</h1>
            <p className="text-slate-500 mt-1">Isi tujuan pencairan. Nomor dan nama pemiliknya harus benar-benar sesuai.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            
            {/* --- KOLOM KIRI: FORMULIR --- */}
            <Card className="rounded-[2rem] border-none shadow-sm bg-white h-fit order-2 lg:order-1">
               <CardHeader className="pb-4 border-b border-slate-50">
                  <div className="flex items-center gap-3">
                     <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                        <Wallet size={24} />
                     </div>
                     <div>
                        <CardTitle className="text-lg font-bold text-slate-900">Data Rekening</CardTitle>
                        <p className="text-xs text-slate-500">Pastikan data sesuai buku tabungan</p>
                     </div>
                  </div>
               </CardHeader>
               <CardContent className="space-y-5 p-4 sm:p-6">
                  <div className="space-y-2">
                     <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <Building size={16} className="text-slate-400" /> Bank tujuan pencairan
                     </label>
                     <select value={payoutChannelCode} onChange={(event) => setPayoutChannelCode(event.target.value)} className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-400 focus:bg-white">
                       <option value="">Pilih bank</option>
                       {PAYOUT_CHANNELS.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
                     </select>
                     <p className="text-xs leading-5 text-slate-500">Daftar dibatasi pada bank yang mendukung pencairan otomatis.</p>
                  </div>

                  <div className="space-y-2">
                     <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <ShieldCheck size={16} className="text-slate-400" /> Konfirmasi Kata Sandi
                     </label>
                     <Input
                        type="password"
                        autoComplete="current-password"
                        placeholder="Kata sandi akun tutor"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="h-12 rounded-xl border-slate-200 focus:bg-white bg-slate-50 transition"
                     />
                     <p className="text-xs leading-5 text-slate-500">Masukkan kata sandi akun tutor untuk mengonfirmasi data rekening dan pencairan.</p>
                  </div>

                  {profileAddress ? <div className="rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600"><p className="font-bold text-slate-700">Alamat dari profil digunakan otomatis.</p><p className="mt-1 break-words">{profileAddress}</p><Link to="/guru/profil" className="mt-1 inline-block font-bold text-indigo-700 underline">Ubah di profil</Link></div> : <div className="space-y-2">
                     <label htmlFor="payout-address" className="flex items-center gap-2 text-sm font-bold text-slate-700"><MapPin size={16} className="text-slate-400" />Alamat lengkap tutor</label>
                     <Textarea id="payout-address" value={address} onChange={(event) => setAddress(event.target.value)} maxLength={255} autoComplete="street-address" placeholder="Jalan, nomor rumah, kelurahan, kecamatan, dan kota" className="min-h-24 rounded-xl border-slate-200 bg-slate-50" />
                     <p className="text-xs leading-5 text-slate-500">Alamat diperlukan untuk transfer bank dan disimpan ke profil Anda. Kolom ini berbeda dari wilayah mengajar.</p>
                  </div>}

                  <div className="space-y-2">
                     <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <CreditCard size={16} className="text-slate-400" /> Nomor Rekening
                     </label>
                     <Input 
                        placeholder="Contoh: 1234567890"
                        inputMode="numeric"
                        minLength={PAYOUT_ACCOUNT_MIN_DIGITS}
                        maxLength={PAYOUT_ACCOUNT_MAX_DIGITS}
                        autoComplete="off"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(sanitizeDigits(e.target.value, PAYOUT_ACCOUNT_MAX_DIGITS))}
                        className="h-12 rounded-xl border-slate-200 focus:bg-white bg-slate-50 transition font-mono tracking-wide text-lg"
                     />
                     <p className="text-xs leading-5 text-slate-500">
                        Masukkan {PAYOUT_ACCOUNT_MIN_DIGITS}–{PAYOUT_ACCOUNT_MAX_DIGITS} digit tanpa spasi atau tanda baca.
                     </p>
                  </div>

                  <div className="space-y-2">
                     <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <User size={16} className="text-slate-400" /> Nama pemilik rekening
                     </label>
                     <Input value={accountHolder} onChange={(event) => setAccountHolder(event.target.value)} maxLength={150} autoComplete="off" placeholder="Nama lengkap sesuai rekening bank" className="h-12 rounded-xl border-slate-200 bg-slate-50 text-slate-700" />
                     <p className="text-xs leading-5 text-slate-500">Isi sesuai data bank. Nama ini dapat berbeda dari nama tampilan akun tutor.</p>
                  </div>

                  <div className="pt-4">
                     <Button 
                        onClick={() => void handleSave()}
                        disabled={isSaving || (payoutAmount !== undefined && !payoutAvailable)}
                        title={payoutAmount !== undefined && !payoutAvailable ? payoutUnavailableMessage || "Layanan pencairan belum siap" : undefined}
                        className="w-full h-12 rounded-xl bg-slate-900 hover:bg-indigo-600 font-bold text-base shadow-lg shadow-slate-900/20 transition-all"
                     >
                        {isSaving ? <span className="flex items-center gap-2"><Loader2 className="animate-spin"/> Memproses...</span> : (
                           <span className="flex items-center gap-2">{payoutAmount !== undefined ? <Send size={18}/> : <Save size={18}/>} {payoutAmount !== undefined ? (payoutAvailable ? "Cairkan dana" : "Pencairan belum tersedia") : "Simpan Rekening"}</span>
                        )}
                     </Button>
                  </div>
               </CardContent>
            </Card>

            {/* --- KOLOM KANAN: INFORMASI KEAMANAN --- */}
            <div className="space-y-6 order-1 lg:order-2 flex flex-col items-center lg:items-start">
               {/* Info Box */}
               <div className="w-full bg-amber-50 border border-amber-100 rounded-2xl p-5 flex gap-3 items-start">
                  <AlertCircle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                     <h4 className="font-bold text-amber-800 text-sm">Penting:</h4>
                     <ul className="text-xs text-amber-700 space-y-1 list-disc ml-4">
                        <li>Periksa bank, nomor rekening, dan nama pemilik sesuai data bank Anda.</li>
                        <li>Kepemilikan rekening belum diverifikasi otomatis. Kesalahan nomor rekening dapat menyebabkan salah transfer.</li>
                        <li>Setelah dikonfirmasi, data disimpan dan permintaan transfer langsung dikirim. Pantau hasilnya di Dompet Tutor.</li>
                     </ul>
                  </div>
               </div>

               <div className="flex items-center gap-2 justify-center w-full text-slate-400 text-xs">
                  <ShieldCheck size={14} />
                  <span>Akses data rekening dibatasi untuk proses pencairan.</span>
               </div>
            </div>

          </div>
      </div>
  );
}

export default function TeacherBankSettingsPage() {
  return <TeacherLayout title="Dompet Tutor"><TeacherBankSettings /></TeacherLayout>;
}
