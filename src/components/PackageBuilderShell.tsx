import type { ReactNode } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import StudentLayout from "@/components/StudentLayout";

export default function PackageBuilderShell({ children, title, guest }: { children: ReactNode; title: string; guest: boolean }) {
  if (!guest) return <StudentLayout title={title}>{children}</StudentLayout>;
  return <div className="public-site min-h-screen bg-[#F8F6F2]"><Navbar /><main className="mx-auto max-w-[1200px] px-5 py-8 sm:px-8 sm:py-12">{children}</main><Footer /></div>;
}
