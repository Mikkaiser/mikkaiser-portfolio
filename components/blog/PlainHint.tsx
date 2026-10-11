"use client";

import { useEffect, useRef, useState } from "react";

/**
 * While a code card that has an "In plain words" panel under it fills the
 * screen, a small hint floats at the bottom offering to skip to the panel.
 * It hides once the panel itself is on screen, so it never covers what it
 * points to.
 */
export function PlainHint() {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const pairs = useRef<{ code: Element; plain: HTMLElement }[]>([]);

  useEffect(() => {
    pairs.current = [...document.querySelectorAll<HTMLElement>(".prose .plain")]
      .map((plain) => ({ code: plain.previousElementSibling, plain }))
      .filter((p): p is { code: Element; plain: HTMLElement } => !!p.code?.classList.contains("code"));
    if (!pairs.current.length) return;

    let raf = 0;
    const check = () => {
      raf = 0;
      const vh = window.innerHeight;
      // The card is being read: it is well into the screen, and its panel is still below the fold.
      const hit = pairs.current.find(({ code, plain }) => {
        const c = code.getBoundingClientRect();
        return c.top < vh * 0.7 && c.bottom > vh * 0.4 && plain.getBoundingClientRect().top > vh * 0.8;
      });
      setTarget(hit?.plain ?? null);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(check); };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    check();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const skip = () => {
    if (!target) return;
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" });
    target.focus({ preventScroll: true });
    setTarget(null);
  };

  return (
    <button type="button" className="plainhint" data-show={target ? "" : undefined} tabIndex={target ? 0 : -1} aria-hidden={!target} onClick={skip}>
      Don&rsquo;t want to read the code? <strong>Skip to In plain words ↓</strong>
    </button>
  );
}
