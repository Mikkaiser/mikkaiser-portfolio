"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Hover/focus reference popover with measured placement.
 *
 * Which side a panel should open on depends on where its trigger happens to sit
 * in the viewport, which CSS cannot see. Left to CSS these panels either ran
 * through the section heading and off the top of the screen, or off the bottom,
 * or past the right edge on a phone. So the room around the trigger is measured
 * when the panel opens: the roomier side wins, the height is capped to what is
 * actually there, and the panel is nudged sideways if it would overhang.
 *
 * Without JavaScript the stylesheet's own placement still applies.
 */

const GAP = 12;
const EDGE = 16;
const MIN = 180;
const SIDE_GAP = 14; // matches the side offset in the stylesheet

/** "none" means the panel fits and should not be capped, so no scrollbar. */
type Max = number | "none";

type Placement =
  /** Stacked above or below the trigger: the award tiles, and the hero on phones. */
  | { mode: "stack"; dir: "up" | "down"; max: Max; shift: number }
  /** Beside the trigger: the hero reference on wide screens. */
  | { mode: "side"; side: "right" | "left"; top: number; max: Max };

type Props = {
  id: string;
  label: string;
  children: React.ReactNode;
  wrapClass: string;
  triggerClass: string;
  panelClass: string;
  /** True for the hero reference, which opens to the side on wide screens where
   *  the stylesheet already places it correctly. */
  sideOnDesktop?: boolean;
};

export function Popover({ id, label, children, wrapClass, triggerClass, panelClass, sideOnDesktop }: Props) {
  const wrap = useRef<HTMLSpanElement>(null);
  const [placement, setPlacement] = useState<Placement | null>(null);
  const [open, setOpen] = useState(false);

  const measure = useCallback(() => {
    const el = wrap.current;
    const panel = el?.querySelector<HTMLElement>(`.${panelClass}`);
    if (!el || !panel) return;

    const r = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const width = panel.offsetWidth || 340;

    // scrollHeight is the full content height even while max-height clips it,
    // but it stops at the padding edge. max-height is border-box here, so the
    // borders have to be added back or the panel is capped a couple of pixels
    // under its own content and grows a scrollbar it does not need.
    const cs = getComputedStyle(panel);
    const borders = parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth);
    const needed = Math.ceil(panel.scrollHeight + borders);
    // Only cap when the content genuinely does not fit.
    const cap = (room: number): Max => (needed <= room ? "none" : Math.floor(room));

    if (sideOnDesktop && window.matchMedia("(min-width: 620px)").matches) {
      // Beside the trigger. The stylesheet pins the panel's bottom to the
      // trigger's, which sends a tall one off the top of the screen, so the
      // top is computed instead and clamped to the viewport.
      const room = vh - EDGE * 2;
      const max = cap(room);
      const height = Math.min(needed, room);
      const wanted = r.bottom - height;
      const top = Math.max(EDGE, Math.min(wanted, vh - EDGE - height));
      // Only sit beside the trigger if a side actually has room; a narrow
      // window has neither, and then stacking below is the honest answer.
      const fitsRight = r.right + SIDE_GAP + width <= vw - EDGE;
      const fitsLeft = r.left - SIDE_GAP - width >= EDGE;
      if (fitsRight || fitsLeft) {
        setPlacement({ mode: "side", side: fitsRight ? "right" : "left", top: Math.round(top - r.top), max });
        return;
      }
    }

    const below = vh - r.bottom - GAP - EDGE;
    const above = r.top - GAP - EDGE;
    // Prefer downward, and flip only when upward genuinely buys more room.
    const dir = below >= needed || below >= above || below >= MIN ? "down" : "up";
    // The real space on the chosen side. Never inflate it: the cap below is
    // what keeps the panel on screen.
    const room = Math.max(dir === "down" ? below : above, 0);

    // Keep it inside the viewport horizontally too. The hero trigger sits mid
    // sentence, so a panel anchored to it can overhang the right edge.
    const overhang = r.left + width - (vw - EDGE);
    const shift = overhang > 0 ? Math.max(-(r.left - EDGE), -overhang) : 0;

    setPlacement({ mode: "stack", dir, max: cap(room), shift: Math.round(shift) });
  }, [panelClass, sideOnDesktop]);

  // A hover panel rarely outlives a scroll, but a resize mid-hover would strand it.
  useEffect(() => {
    if (!open) return;
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [open, measure]);

  const show = () => { measure(); setOpen(true); };
  const hide = () => setOpen(false);

  return (
    <span
      className={wrapClass}
      ref={wrap}
      onPointerEnter={show}
      onMouseEnter={show}
      onPointerLeave={hide}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      <span className={triggerClass} tabIndex={0} role="button" aria-describedby={id}>{label}</span>
      <span
        className={panelClass}
        id={id}
        role="note"
        data-dir={placement?.mode === "stack" ? placement.dir : undefined}
        data-side={placement?.mode === "side" ? placement.side : undefined}
        style={
          placement?.mode === "side"
            ? { top: placement.top, maxHeight: placement.max }
            : placement
              ? { maxHeight: placement.max, marginLeft: placement.shift || undefined }
              : undefined
        }
      >
        <span className="ref__label">Reference</span>
        {children}
      </span>
    </span>
  );
}

/** Award tile reference. */
export function Cref({ id, button, children }: { id: string; button: string; children: React.ReactNode }) {
  return (
    <Popover id={id} label={button} wrapClass="crefwrap" triggerClass="cbtn" panelClass="cref">
      {children}
    </Popover>
  );
}
