import { useEffect } from "react";
import { seoAbsoluteUrl } from "@/lib/seo";

export type SeoSchema = Record<string, unknown>;

type SeoHeadProps = {
  title: string;
  description: string;
  canonicalPath?: string;
  image?: string | null;
  robots?: string;
  type?: "website" | "article";
  schemas?: SeoSchema[];
};

const EMPTY_SCHEMAS: SeoSchema[] = [];

const ensureMeta = (selector: string, attributes: Record<string, string>) => {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement("meta");
    element.dataset.bimbelkuSeo = "true";
    document.head.appendChild(element);
  }
  Object.entries(attributes).forEach(([key, value]) => element?.setAttribute(key, value));
};

export default function SeoHead({
  title,
  description,
  canonicalPath,
  image,
  robots = "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1",
  type = "website",
  schemas = EMPTY_SCHEMAS,
}: SeoHeadProps) {
  useEffect(() => {
    const canonical = seoAbsoluteUrl(canonicalPath || window.location.pathname);
    const resolvedImage = image ? seoAbsoluteUrl(image) : seoAbsoluteUrl("/logo_bimbel.png");
    document.title = title;

    ensureMeta('meta[name="description"]', { name: "description", content: description });
    ensureMeta('meta[name="robots"]', { name: "robots", content: robots });
    ensureMeta('meta[property="og:title"]', { property: "og:title", content: title });
    ensureMeta('meta[property="og:description"]', { property: "og:description", content: description });
    ensureMeta('meta[property="og:type"]', { property: "og:type", content: type });
    ensureMeta('meta[property="og:url"]', { property: "og:url", content: canonical });
    ensureMeta('meta[property="og:image"]', { property: "og:image", content: resolvedImage });
    ensureMeta('meta[property="og:locale"]', { property: "og:locale", content: "id_ID" });
    ensureMeta('meta[name="twitter:card"]', { name: "twitter:card", content: "summary_large_image" });
    ensureMeta('meta[name="twitter:title"]', { name: "twitter:title", content: title });
    ensureMeta('meta[name="twitter:description"]', { name: "twitter:description", content: description });
    ensureMeta('meta[name="twitter:image"]', { name: "twitter:image", content: resolvedImage });

    let canonicalElement = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonicalElement) {
      canonicalElement = document.createElement("link");
      canonicalElement.rel = "canonical";
      canonicalElement.dataset.bimbelkuSeo = "true";
      document.head.appendChild(canonicalElement);
    }
    canonicalElement.href = canonical;

    document.head.querySelectorAll('script[data-bimbelku-schema="true"]').forEach((node) => node.remove());
    schemas.forEach((schema) => {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.dataset.bimbelkuSchema = "true";
      script.text = JSON.stringify(schema).replace(/</g, "\\u003c");
      document.head.appendChild(script);
    });

    return () => {
      document.head.querySelectorAll('script[data-bimbelku-schema="true"]').forEach((node) => node.remove());
    };
  }, [canonicalPath, description, image, robots, schemas, title, type]);

  return null;
}
