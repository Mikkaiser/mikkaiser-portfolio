"use client";

import { useEffect } from "react";

const KEY = "mk-code-lang";

/**
 * Picking a language on one code card switches every card on the page to it,
 * and the choice is remembered for the next post. The card that was clicked
 * stays where it was on screen while the cards above it change height.
 */
export function CodeLangSync() {
  useEffect(() => {
    const apply = (lang: string) =>
      document.querySelectorAll<HTMLInputElement>(`.code--tabs input[value="${CSS.escape(lang)}"]`).forEach((i) => (i.checked = true));

    try {
      const saved = localStorage.getItem(KEY);
      if (saved) apply(saved);
    } catch {}

    const onChange = (e: Event) => {
      const input = e.target;
      if (!(input instanceof HTMLInputElement) || !input.closest(".code--tabs")) return;
      const card = input.closest("figure")!;
      const before = card.getBoundingClientRect().top;
      apply(input.value);
      const shift = card.getBoundingClientRect().top - before;
      if (shift) window.scrollBy({ top: shift, behavior: "instant" });
      try {
        localStorage.setItem(KEY, input.value);
      } catch {}
    };
    document.addEventListener("change", onChange);
    return () => document.removeEventListener("change", onChange);
  }, []);
  return null;
}
