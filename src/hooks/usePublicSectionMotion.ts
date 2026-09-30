import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

/** A brief entrance cue for editorial sections; never keeps animating off-screen. */
export function usePublicSectionMotion(refreshKey?: unknown) {
  const mainRef = useRef<HTMLElement>(null);
  const { pathname } = useLocation();

  useEffect(() => {
    const main = mainRef.current;
    if (!main || !("IntersectionObserver" in window) || !("animate" in Element.prototype)) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const animations = new Map<Element, Animation>();
    // The opening section is usually the LCP element: show it immediately.
    const targets = main.querySelectorAll(":scope > section:not(:first-child), :scope > article > section:not(:first-child)");
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const target = entry.target;
        if (!entry.isIntersecting) {
          animations.get(target)?.pause();
          continue;
        }
        if (reducedMotion.matches || document.documentElement.dataset.siteAnimations === "off") continue;
        const existing = animations.get(target);
        if (existing) {
          if (!document.hidden) existing.play();
          continue;
        }
        const animation = target.animate(
          [{ opacity: 0.65, transform: "translateY(18px)" }, { opacity: 1, transform: "translateY(0)" }],
          { duration: 560, easing: "cubic-bezier(.2,.7,.2,1)", fill: "none" },
        );
        animations.set(target, animation);
        animation.onfinish = () => {
          animations.delete(target);
          observer.unobserve(target);
        };
        if (document.hidden) animation.pause();
      }
    }, { threshold: 0.01 });

    targets.forEach((target) => observer.observe(target));
    const settingsObserver = new MutationObserver(() => {
      if (document.documentElement.dataset.siteAnimations === "off") {
        animations.forEach((animation) => animation.cancel());
        animations.clear();
        return;
      }
      if (!reducedMotion.matches) targets.forEach((target) => {
        observer.unobserve(target);
        observer.observe(target);
      });
    });
    settingsObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-site-animations"] });
    const onVisibilityChange = () => {
      for (const [target, animation] of animations) {
        if (document.hidden) animation.pause();
        else if (target.getBoundingClientRect().bottom > 0 && target.getBoundingClientRect().top < innerHeight) animation.play();
      }
    };
    const onMotionChange = () => {
      if (reducedMotion.matches) {
        observer.disconnect();
        animations.forEach((animation) => animation.cancel());
        animations.clear();
      } else if (document.documentElement.dataset.siteAnimations !== "off") {
        targets.forEach((target) => observer.observe(target));
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    reducedMotion.addEventListener("change", onMotionChange);
    return () => {
      observer.disconnect();
      settingsObserver.disconnect();
      animations.forEach((animation) => animation.cancel());
      document.removeEventListener("visibilitychange", onVisibilityChange);
      reducedMotion.removeEventListener("change", onMotionChange);
    };
  }, [pathname, refreshKey]);

  return mainRef;
}
