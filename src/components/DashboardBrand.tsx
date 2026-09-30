import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { defaultWebsiteContent, type WebsiteSettings } from "@/lib/websiteContent";
export default function DashboardBrand({ className = "h-10 w-10" }: { className?: string }) {
  const [settings, setSettings] = useState<WebsiteSettings>(defaultWebsiteContent.settings);
  useEffect(() => {
    let active = true;
    void window.__bimbelkuWebsiteContent?.then((content) => {
      if (active && content?.settings) {
        setSettings({ ...defaultWebsiteContent.settings, ...content.settings });
      }
    });
    return () => { active = false; };
  }, []);
  return <Link to="/" aria-label={`${settings.brand_name}, kembali ke beranda`} className={`grid shrink-0 place-items-center rounded-xl bg-orange-50 p-1 shadow-sm ring-1 ring-orange-100 transition hover:bg-orange-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 ${className}`}>
    <img src={settings.logo_url || "/logo_bimbel.png"} alt="" width={44} height={44} className="h-full w-full object-contain" onError={(event) => { if (!event.currentTarget.src.endsWith("/logo_bimbel.png")) event.currentTarget.src = "/logo_bimbel.png"; }} />
  </Link>;
}
