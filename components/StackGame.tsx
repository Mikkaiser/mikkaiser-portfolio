"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { OPEN_GAME_EVENT } from "./GameButton";
import { Icon, type IconSlug, type Tint } from "./Icon";

type Card = { key: string; name: string; slug: IconSlug; tint?: Tint; id: number };
type Best = { secs: number; moves: number };

const DECK: Omit<Card, "id">[] = [
  { key: "dotnet", name: ".NET", slug: "dotnet", tint: "dotnet" },
  { key: "node", name: "Node.js", slug: "nodedotjs" },
  { key: "docker", name: "Docker", slug: "docker" },
  { key: "k8s", name: "Kubernetes", slug: "kubernetes" },
];
const BEST_KEY = "mk-stack-best";

function shuffle<T>(a: T[]) {
  const r = a.slice();
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}
const freshDeck = (): Card[] => shuffle([...DECK, ...DECK].map((d, i) => ({ ...d, id: i })));

export function StackGame() {
  const [open, setOpen] = useState(false);
  const [deck, setDeck] = useState<Card[]>([]);
  const [up, setUp] = useState<number[]>([]);
  const [done, setDone] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [started, setStarted] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [best, setBest] = useState<Best | null>(null);
  const flipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Deck is shuffled on first open (client only) so the prerendered HTML is deterministic.
    const onOpen = () => {
      setDeck((d) => (d.length ? d : freshDeck()));
      try {
        const b = localStorage.getItem(BEST_KEY);
        if (b) setBest(JSON.parse(b));
      } catch { /* storage unavailable */ }
      setOpen(true);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener(OPEN_GAME_EVENT, onOpen);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener(OPEN_GAME_EVENT, onOpen);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    if (open) cardRef.current?.focus();
  }, [open]);

  const cleared = deck.length > 0 && done.length === deck.length;

  useEffect(() => {
    if (started === null || cleared) return;
    const t = setInterval(() => setElapsed(Math.round((Date.now() - started) / 1000)), 500);
    return () => clearInterval(t);
  }, [started, cleared]);

  const reset = useCallback(() => {
    if (flipTimer.current) clearTimeout(flipTimer.current);
    setDeck(freshDeck());
    setUp([]); setDone([]); setMoves(0); setStarted(null); setElapsed(0);
  }, []);

  const flip = useCallback((idx: number) => {
    if (done.includes(idx) || up.includes(idx) || up.length === 2) return;
    const startAt = started ?? Date.now();
    if (started === null) setStarted(startAt);
    const nextUp = [...up, idx];
    setUp(nextUp);
    if (nextUp.length < 2) return;
    const nextMoves = moves + 1;
    setMoves(nextMoves);
    const [a, b] = [deck[nextUp[0]], deck[nextUp[1]]];
    if (a.key === b.key) {
      const nextDone = [...done, ...nextUp];
      setDone(nextDone);
      setUp([]);
      if (nextDone.length === deck.length) {
        const secs = Math.max(1, Math.round((Date.now() - startAt) / 1000));
        setElapsed(secs);
        const rec = { secs, moves: nextMoves };
        if (!best || rec.moves < best.moves || (rec.moves === best.moves && rec.secs < best.secs)) {
          setBest(rec);
          try { localStorage.setItem(BEST_KEY, JSON.stringify(rec)); } catch { /* ignore */ }
        }
      }
    } else {
      flipTimer.current = setTimeout(() => setUp([]), 650);
    }
  }, [best, deck, done, moves, started, up]);

  const hint = cleared
    ? `Cleared in ${elapsed} seconds and ${moves} moves. Four things I use every week.`
    : "Four things I use every week, twice each. Find the pairs.";

  return (
    <div className="modal" data-open={open ? "" : undefined} onClick={() => setOpen(false)} aria-hidden={!open}>
      <div
        className="modal__card"
        role="dialog"
        aria-modal="true"
        aria-label="Match the stack"
        tabIndex={-1}
        ref={cardRef}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal__head">
          <h2>Match the stack</h2>
          <span className="eyebrow">{moves} moves · {elapsed}s</span>
        </div>
        <p className="body modal__hint">{hint}</p>
        <div className="game">
          {deck.map((c, i) => {
            const shown = up.includes(i) || done.includes(i);
            const matched = done.includes(i);
            return (
              <button
                type="button"
                key={c.id}
                className={`tilebtn${matched ? " tilebtn--done" : shown ? " tilebtn--up" : ""}`}
                aria-label={shown ? c.name : "Hidden tile"}
                onClick={() => flip(i)}
                disabled={!open}
              >
                <Icon slug={c.slug} tint={c.tint} size={48} className="tilebtn__icon" />
                <span aria-hidden="true">?</span>
              </button>
            );
          })}
        </div>
        <div className="modal__foot">
          <span className="modal__best">{best ? `Best ${best.moves} moves · ${best.secs}s` : "No best yet"}</span>
          <button type="button" onClick={reset} className="btn btn--ghost btn--tag" style={{ color: "var(--ink)" }}>Shuffle</button>
          <button type="button" onClick={() => setOpen(false)} className="btn btn--ghost btn--tag btn--fill">Close</button>
        </div>
      </div>
    </div>
  );
}
