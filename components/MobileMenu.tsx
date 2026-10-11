"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * The site map on screens where the header nav is hidden (920px and below).
 * A disclosure button opens a panel of rows under the header bar. The rows are
 * rendered by the server Header and passed in as children; this only owns the
 * open state. It closes on a link tap, Escape, a tap outside, or growing past
 * the breakpoint. Without JavaScript the footer carries the same links.
 */
export function MobileMenu({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    };
    const onPointer = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!panel.current?.contains(t) && !button.current?.contains(t)) setOpen(false);
    };
    const wide = matchMedia("(min-width: 921px)");
    const onWide = () => wide.matches && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    wide.addEventListener("change", onWide);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
      wide.removeEventListener("change", onWide);
    };
  }, [open]);

  return (
    <>
      <button
        ref={button}
        type="button"
        className="btn btn--ghost btn--tag menu-btn"
        aria-expanded={open}
        aria-controls="mobile-nav"
        onClick={() => setOpen((o) => !o)}
      >
        {open ? "Close" : "Menu"}
      </button>
      <div
        ref={panel}
        id="mobile-nav"
        className="mnav"
        data-open={open ? "" : undefined}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("a")) setOpen(false);
        }}
      >
        {children}
      </div>
    </>
  );
}
