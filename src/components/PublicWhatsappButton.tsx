import { MessageCircle } from "lucide-react";
import { useLocation } from "react-router-dom";

import { useWebsiteContent } from "@/components/WebsiteContentProvider";
import { whatsappHref, whatsappMessageForPath } from "@/lib/websiteContent";

export default function PublicWhatsappButton() {
  const { settings } = useWebsiteContent();
  const { pathname } = useLocation();
  const href = settings.whatsapp_enabled ? whatsappHref(settings.whatsapp_number, whatsappMessageForPath(pathname, settings.whatsapp_default_message)) : null;
  if (!href) return null;

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" aria-label={`${settings.whatsapp_label}. ${settings.whatsapp_hours || "Buka percakapan WhatsApp"}`} title={settings.whatsapp_label} className="fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom))] right-5 z-40 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#15803D] px-4 py-3 text-sm font-extrabold text-white shadow-lg transition hover:bg-green-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-green-300 sm:bottom-7 sm:right-7">
      <MessageCircle size={20} aria-hidden="true" /><span className="hidden sm:inline">{settings.whatsapp_label}</span>
    </a>
  );
}
