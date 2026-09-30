import type { WebsiteContentPayload } from "./websiteContent";
declare global { interface Window { __bimbelkuWebsiteContent?: Promise<WebsiteContentPayload | null>; __bimbelkuWebsiteContentValue?: WebsiteContentPayload | null; } }
// Start public content alongside the JS bundle, not after React's first effect.
const base = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api").replace(/\/$/, "");
window.__bimbelkuWebsiteContent = fetch(base + "/website-content", {
  credentials: "include", headers: { Accept: "application/json" }, signal: AbortSignal.timeout(10000),
}).then(response => response.ok ? response.json() : null).then((content) => { window.__bimbelkuWebsiteContentValue = content; return content; }).catch(() => null);
