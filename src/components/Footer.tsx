import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpenCheck, Mail, MapPin, MessageCircle } from "lucide-react";

import SocialLogo from "@/components/SocialLogo";
import StudentPackageLink from "@/components/StudentPackageLink";
import { useWebsiteContent } from "@/components/WebsiteContentProvider";
import { getCached } from "@/lib/http";
import { whatsappHref as buildWhatsappHref } from "@/lib/websiteContent";

type LegacyFooter = { footer_address?: string; footer_phone?: string; footer_email?: string };
type Social = { id: number; name: string; link: string; icon_key?: string | null; icon_url?: string | null };

export default function Footer() {
  const { settings } = useWebsiteContent();
  const [legacy, setLegacy] = useState<LegacyFooter>({});
  const [socials, setSocials] = useState<Social[]>([]);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    let active = true;
    Promise.allSettled([
      getCached<LegacyFooter>("/settings/footer", { maxAgeMs: 5 * 60_000 }),
      getCached<Social[]>("/socials", { maxAgeMs: 5 * 60_000 }),
    ]).then(([footerResult, socialResult]) => {
      if (!active) return;
      if (footerResult.status === "fulfilled") setLegacy(footerResult.value.data || {});
      if (socialResult.status === "fulfilled") setSocials(socialResult.value.data || []);
    });
    return () => { active = false; };
  }, []);

  const address = settings.office_address?.trim() || legacy.footer_address?.trim() || "Yogyakarta, Indonesia";
  const email = settings.contact_email?.trim() || legacy.footer_email?.trim() || null;
  const phone = settings.whatsapp_number?.trim() || legacy.footer_phone?.trim() || null;
  const mapHref = settings.google_maps_url || (address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}` : null);
  const consultationHref = phone ? buildWhatsappHref(phone, settings.whatsapp_default_message) : null;
  const logo = settings.logo_light_url || settings.logo_url;
  const navItems = settings.navigation_items.filter((item) => item.is_visible !== false);

  return (
    <footer id="footer" className="border-t border-slate-800 bg-[#101A31] text-white">
      <div className="mx-auto max-w-[1200px] px-5 pb-8 pt-14 sm:px-8 sm:pt-16">
        <div className={`grid gap-12 border-b border-white/10 pb-12 sm:grid-cols-2 ${navItems.length ? "lg:grid-cols-[1.3fr_.8fr_.8fr_1fr]" : "lg:grid-cols-[1.3fr_.8fr_1fr]"}`}>
          <div>
            <Link to="/" className="inline-flex items-center gap-3" aria-label={`${settings.brand_name}, halaman utama`}>
              {logo ? <img src={logo} alt="" loading="lazy" decoding="async" className="h-11 w-auto max-w-[11rem] object-contain" /> : <span className="grid h-11 w-11 place-items-center rounded-xl bg-orange-500 text-white"><BookOpenCheck size={23} /></span>}
              {!logo && <span className="text-2xl font-extrabold">{settings.brand_name}</span>}
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-7 text-slate-300">{settings.brand_description || "Bimbingan belajar SD–SMA di Yogyakarta dengan pilihan belajar online dan offline."}</p>
            {socials.length > 0 && <div className="mt-6 flex flex-wrap gap-2">{socials.map((social) => <a key={social.id} href={social.link} target="_blank" rel="noreferrer" aria-label={social.name} className="grid h-10 w-10 place-items-center rounded-xl border border-white/15 bg-white text-slate-900 transition hover:bg-orange-100 hover:border-orange-400"><SocialLogo iconKey={social.icon_key} iconUrl={social.icon_url} className="h-5 w-5 object-contain" /></a>)}</div>}
          </div>

          {navItems.length > 0 && <FooterGroup title="Jelajahi">
            {navItems.slice(0, 5).map((item) => <li key={item.key}><a href={item.url} className="footer-public-link">{item.label}</a></li>)}
          </FooterGroup>}

          <FooterGroup title="Program populer">
            <li><StudentPackageLink to="/student/packages/new?subject_name=Matematika" className="footer-public-link">Matematika</StudentPackageLink></li>
            <li><StudentPackageLink to="/student/packages/new?subject_name=Bahasa%20Inggris" className="footer-public-link">Bahasa Inggris</StudentPackageLink></li>
            <li><StudentPackageLink to="/student/packages/new?subject_name=Fisika" className="footer-public-link">Fisika</StudentPackageLink></li>
            <li><Link to="/jadi-tutor" className="footer-public-link">Gabung jadi tutor</Link></li>
          </FooterGroup>

          <div>
            <h2 className="text-sm font-extrabold uppercase tracking-[0.14em] text-orange-300">Hubungi kami</h2>
            <ul className="mt-5 space-y-4 text-sm leading-6 text-slate-300">
              <li><a href={mapHref || undefined} target={mapHref ? "_blank" : undefined} rel={mapHref ? "noreferrer" : undefined} className="flex items-start gap-3 transition hover:text-white"><MapPin className="mt-0.5 shrink-0 text-orange-400" size={18} /><span>{address}</span></a></li>
              {consultationHref && <li><a href={consultationHref} target="_blank" rel="noreferrer" className="flex items-start gap-3 transition hover:text-white"><MessageCircle className="mt-0.5 shrink-0 text-orange-400" size={18} /><span>{settings.whatsapp_label}{settings.whatsapp_hours ? <small className="mt-1 block text-xs text-slate-400">{settings.whatsapp_hours}</small> : null}</span></a></li>}
              {email && <li><a href={`mailto:${email}`} className="flex items-start gap-3 transition hover:text-white"><Mail className="mt-0.5 shrink-0 text-orange-400" size={18} /><span className="break-all">{email}</span></a></li>}
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-4 pt-7 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {currentYear} {settings.brand_name}. Hak cipta dilindungi.</p>
          <div className="flex flex-wrap gap-x-6 gap-y-2"><Link to="/privacy" className="hover:text-white">Kebijakan Privasi</Link><Link to="/terms" className="hover:text-white">Syarat & Ketentuan</Link></div>
        </div>
      </div>
    </footer>
  );
}

function FooterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return <div><h2 className="text-sm font-extrabold uppercase tracking-[0.14em] text-orange-300">{title}</h2><ul className="mt-5 space-y-3 text-sm text-slate-300">{children}</ul></div>;
}
