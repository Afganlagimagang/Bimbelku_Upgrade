import { MessageCircle } from "lucide-react";

import { useWebsiteContent } from "@/components/WebsiteContentProvider";
import { whatsappHref } from "@/lib/websiteContent";

export default function PublicWhatsappButton() {
  const { settings } = useWebsiteContent();
  const href = settings.whatsapp_enabled ? whatsappHref(settings.whatsapp_number, settings.whatsapp_default_message) : null;
  if (!href) return null;

  return (
    <a href={href} target="_blank" rel="noreferrer" aria-label={`${settings.whatsapp_label}. ${settings.whatsapp_hours || "Buka percakapan WhatsApp"}`} className="fixed bottom-5 right-5 z-40 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#15803D] px-4 py-3 text-sm font-extrabold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-green-800 sm:bottom-7 sm:right-7">
      <MessageCircle size={20} aria-hidden="true" /><span className="hidden sm:inline">{settings.whatsapp_label}</span>
    </a>
  );
}
