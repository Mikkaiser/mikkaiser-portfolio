"use client";

import { useEffect } from "react";

/**
 * Marks the table-of-contents link for the section being read with aria-current.
 * The list works without it; this only adds the active state.
 */
export function TocActive({ ids }: { ids: string[] }) {
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const headings = ids.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => el !== null);
    const links = new Map(ids.map((id) => [id, document.querySelector<HTMLAnchorElement>(`.toc__link[href="#${CSS.escape(id)}"]`)]));
    const setActive = (id: string) => links.forEach((a, key) => a?.setAttribute("aria-current", key === id ? "true" : "false"));

    // The active section is the last heading that has passed the upper third of the viewport.
    const pick = () => {
      const line = window.innerHeight / 3;
      let current = headings[0]?.id;
      for (const h of headings) if (h.getBoundingClientRect().top <= line) current = h.id;
      if (current) setActive(current);
    };
    const io = new IntersectionObserver(pick, { rootMargin: "0px 0px -66% 0px" });
    headings.forEach((h) => io.observe(h));
    pick();
    return () => io.disconnect();
  }, [ids]);
  return null;
}
