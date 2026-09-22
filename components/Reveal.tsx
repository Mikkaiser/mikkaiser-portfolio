"use client";

import { useEffect } from "react";

/**
 * Arms every [data-anim] element below the fold with data-out, then removes it
 * as each one scrolls into view. Elements already on screen at mount are left
 * visible so the prerendered HTML never hides above-the-fold content.
 */
export function Reveal() {
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-anim]"));
    const h = window.innerHeight || 800;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            (e.target as HTMLElement).removeAttribute("data-out");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    // Read every position first, then write, so layout is computed once.
    const below = els.map((el) => el.getBoundingClientRect().top > h * 0.92);
    els.forEach((el, i) => {
      if (below[i]) {
        el.setAttribute("data-out", "");
        el.style.transitionDelay = `${(i % 3) * 70}ms`;
      }
      io.observe(el);
    });
    return () => io.disconnect();
  }, []);
  return null;
}
