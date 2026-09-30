export async function scrollToPublicAnchor(target: HTMLElement, animated = true): Promise<void> {
  if (target.dataset.deferredReady === "false" || target.querySelector("[data-section-loader]")) {
    await new Promise<void>((resolve) => {
      const done = () => {
        if (target.dataset.deferredReady === "false" || target.querySelector("[data-section-loader]")) return;
        observer.disconnect();
        window.clearTimeout(timeout);
        resolve();
      };
      const observer = new MutationObserver(done);
      observer.observe(target, { attributes: true, childList: true, subtree: true });
      const timeout = window.setTimeout(() => { observer.disconnect(); resolve(); }, 4000);
      done();
    });
  }
  const header = document.querySelector<HTMLElement>(".public-site header.sticky");
  const offset = (header?.getBoundingClientRect().height || 0) + 20;
  const heading = target.querySelector<HTMLElement>("h1, h2") || target;
  const top = Math.max(0, heading.getBoundingClientRect().top + window.scrollY - offset);
  window.scrollTo({ top, behavior: animated && !window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "smooth" : "auto" });
}
