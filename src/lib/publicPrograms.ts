export type CatalogSubject = {
  id: number;
  name: string;
  group_name?: string | null;
  education_levels?: string[] | null;
  grades?: string[] | null;
};

export type PublicProgramCategory = "all" | "favorite" | "science" | "language" | "social" | "technology";

export const publicProgramCategories: Array<{ key: PublicProgramCategory; label: string }> = [
  { key: "all", label: "Semua program" },
  { key: "favorite", label: "Paling dicari" },
  { key: "science", label: "Sains & matematika" },
  { key: "language", label: "Bahasa" },
  { key: "social", label: "Sosial & bisnis" },
  { key: "technology", label: "Teknologi & lainnya" },
];

const favoriteSubjects = new Set(["Matematika", "Bahasa Indonesia", "Bahasa Inggris", "Fisika", "Kimia", "Biologi"]);

export const programSlug = (name: string) => name
  .normalize("NFKD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLocaleLowerCase("id-ID")
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "");

export const programPath = (subject: CatalogSubject, level?: string) => {
  const query = level ? `?level=${encodeURIComponent(level)}` : "";
  return `/program/${programSlug(subject.name)}${query}`;
};

export const packagePath = (subject: CatalogSubject, level?: string) => {
  const params = new URLSearchParams({ subject_name: subject.name });
  if (level) params.set("education_level", level);
  return `/student/packages/new?${params.toString()}`;
};

export const supportedLevels = (subject: CatalogSubject) => {
  const values = (subject.education_levels || []).filter((value) => ["SD", "SMP", "SMA"].includes(value));
  return values.length ? values : ["SD", "SMP", "SMA"];
};

export const programSummary = (subject: CatalogSubject) => {
  const name = subject.name.toLocaleLowerCase("id-ID");
  if (name.includes("matematika")) return "Pendampingan konsep, latihan bertahap, dan pemecahan soal.";
  if (name.includes("inggris")) return "Latihan tata bahasa, kosakata, membaca, dan komunikasi.";
  if (name.includes("indonesia")) return "Pemahaman teks, kebahasaan, menulis, dan literasi.";
  if (/fisika|kimia|biologi|ipa|ipas/.test(name)) return "Memahami konsep sains dan menghubungkannya dengan latihan soal.";
  if (/ekonomi|akuntansi/.test(name)) return "Mendalami konsep, perhitungan, dan penerapan materi.";
  if (/sejarah|geografi|sosiologi|ips/.test(name)) return "Menguatkan pemahaman materi sosial melalui pembahasan terarah.";
  if (/informatika|komputer|teknologi/.test(name)) return "Belajar konsep dan praktik sesuai materi sekolah.";
  return "Pendampingan belajar yang mengikuti jenjang, Bab, dan target siswa.";
};

export const isProgramInCategory = (subject: CatalogSubject, category: PublicProgramCategory) => {
  if (category === "all") return true;
  if (category === "favorite") return favoriteSubjects.has(subject.name);
  const value = `${subject.name} ${subject.group_name || ""}`.toLocaleLowerCase("id-ID");
  if (category === "science") return /(ipa|ipas|sains|fisika|kimia|biologi|matematika)/.test(value);
  if (category === "language") return /(bahasa|inggris|jepang|mandarin|arab|literasi)/.test(value);
  if (category === "social") return /(ips|sosial|ekonomi|akuntansi|bisnis|geografi|sejarah|sosiologi)/.test(value);
  return !isProgramInCategory(subject, "science") && !isProgramInCategory(subject, "language") && !isProgramInCategory(subject, "social");
};
