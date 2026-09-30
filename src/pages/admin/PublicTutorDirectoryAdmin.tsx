import AdminLayout from "@/components/AdminLayout";
import PublicTutorManagement from "@/components/PublicTutorManagement";

export default function PublicTutorDirectoryAdmin() {
  return <AdminLayout title="Tutor Publik" subtitle="Foto dan profil yang tampil di Kenali Tutor, dengan filter untuk seluruh akun tutor.">
    <div className="mx-auto max-w-6xl pb-16"><PublicTutorManagement /></div>
  </AdminLayout>;
}
