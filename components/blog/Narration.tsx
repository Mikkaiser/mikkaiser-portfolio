"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { narrationWords, type NarrationWord } from "./narration-words";

/** A word on the page, when the narration says it in seconds, and the cue its sentence starts at. */
type Cue = { range: Range; start: number; end: number; sentence: number };

/** public/audio/<slug>.json, from scripts/narration-sync.mjs: [word index, word, start ms, end ms]. */
type Timing = { words: [number, string, number, number][] };

const RATES = [1, 1.25, 1.5, 0.75];
/** How long a sentence stays lit after its last word, when nothing follows it (a pause, or a skipped label). */
const HOLD = 1.2;

function clock(s: number) {
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

function spoken(s: number) {
  const m = Math.floor(s / 60);
  return `${m} minute${m === 1 ? "" : "s"} ${Math.floor(s % 60)} seconds`;
}

const BLOCK = "p, li, h2, h3, h4, blockquote, figcaption, td, th, dt, dd";

/**
 * Numbers the sentences on the page: a word starts a new one when the word
 * before it ends in . ! or ?, or sits in another paragraph, heading or list item.
 */
function sentences(page: NarrationWord[]) {
  const ids: number[] = [];
  let id = 0;
  page.forEach((w, k) => {
    const prev = page[k - 1];
    if (prev) {
      const gap = new Range();
      gap.setStart(prev.node, prev.end);
      gap.setEnd(w.node, w.start);
      const stop = /^[\s"'”’)\]]*[.!?]/.test(gap.toString());
      if (stop || prev.node.parentElement?.closest(BLOCK) !== w.node.parentElement?.closest(BLOCK)) id++;
    }
    ids.push(id);
  });
  return ids;
}

/** Ties each timed word to its place on the page. If the post changed since the timing was made, a word is looked for a little further on. */
function buildCues({ words }: Timing): Cue[] {
  const prose = document.querySelector(".prose");
  if (!prose) return [];
  const page = narrationWords(prose);
  const ids = sentences(page);
  const cues: Cue[] = [];
  let next = 0, id = -1, first = 0;
  for (const [i, word, start, end] of words) {
    let k = i >= next && page[i]?.word === word ? i : -1;
    for (let j = next; k < 0 && j < Math.min(page.length, next + 40); j++) if (page[j].word === word) k = j;
    if (k < 0) continue;
    const range = new Range();
    range.setStart(page[k].node, page[k].start);
    range.setEnd(page[k].node, page[k].end);
    if (ids[k] !== id) { id = ids[k]; first = cues.length; }
    cues.push({ range, start: start / 1000, end: end / 1000, sentence: first });
    next = k + 1;
  }
  return cues;
}

/** The last cue that has started by time t, or -1. */
function cueAt(cues: Cue[], t: number) {
  let lo = 0, hi = cues.length - 1, found = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (cues[mid].start <= t) { found = mid; lo = mid + 1; } else hi = mid - 1;
  }
  return found;
}

/**
 * The post read aloud. The sentence being said fills with ink from left to
 * right, a letter at a time, in step with the voice. The page scrolls to keep
 * the word being said in view until the reader scrolls themselves; then
 * "Follow the text" picks it back up. Once the player at the top is out of
 * view, a copy of it docks at the bottom of the screen.
 *
 * The highlight uses the CSS Custom Highlight API, so the article's markup
 * never changes. Where that API is missing the audio still plays, unlit.
 */
export function Narration({ slug, seconds }: { slug: string; seconds: number }) {
  const audio = useRef<HTMLAudioElement>(null);
  const inline = useRef<HTMLElement>(null);
  const cues = useRef<Cue[] | null>(null);
  const lit = useRef("");
  const follow = useRef(true);
  const lastScroll = useRef(0);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(seconds);
  const [rate, setRate] = useState(1);
  const [following, setFollowing] = useState(true);
  const [docked, setDocked] = useState(false);

  // Fill the sentence up to the letter being said, and scroll to it if the reader is following.
  const sync = useCallback(() => {
    const el = audio.current;
    const list = cues.current;
    if (!el || !list || typeof CSS === "undefined" || !("highlights" in CSS)) return;
    const t = el.currentTime;
    const i = cueAt(list, t);
    const at = i >= 0 && t < list[i].end + HOLD ? i : -1;
    // The word being said fills in proportion to how much of it has been said.
    const word = at < 0 ? null : list[at].range;
    const said = !word ? 0 : Math.max(0, Math.min(1, (t - list[at].start) / (list[at].end - list[at].start || 1)));
    const letters = !word ? 0 : Math.round(said * (word.endOffset - word.startOffset));
    const key = `${at}:${letters}`;
    if (key !== lit.current) {
      lit.current = key;
      if (!word) CSS.highlights.delete("narration");
      else {
        const fill = new Range();
        const from = list[list[at].sentence].range;
        fill.setStart(from.startContainer, from.startOffset);
        fill.setEnd(word.startContainer, word.startOffset + letters);
        CSS.highlights.set("narration", new Highlight(fill));
      }
    }
    if (at < 0 || !follow.current || el.paused) return;
    // Keep the word in the upper middle of the screen. Leave a running scroll alone.
    const r = list[at].range.getBoundingClientRect();
    const vh = window.innerHeight;
    const now = performance.now();
    if (r.height && (r.top < vh * 0.15 || r.bottom > vh * 0.7) && now - lastScroll.current > 800) {
      lastScroll.current = now;
      const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: window.scrollY + r.top - vh * 0.35, behavior: smooth ? "smooth" : "auto" });
    }
  }, []);

  // Words change many times a second, faster than timeupdate fires, so check on every frame while playing.
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    const tick = () => { sync(); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, sync]);

  // Scrolling by hand means the reader wants to look somewhere else, so stop following.
  useEffect(() => {
    if (!playing) return;
    const stop = (e: Event) => {
      if ((e.target as Element | null)?.closest?.(".listen")) return;
      follow.current = false;
      setFollowing(false);
    };
    const keys = new Set(["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "]);
    const onKey = (e: KeyboardEvent) => { if (keys.has(e.key)) stop(e); };
    window.addEventListener("wheel", stop, { passive: true });
    window.addEventListener("touchmove", stop, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("wheel", stop);
      window.removeEventListener("touchmove", stop);
      window.removeEventListener("keydown", onKey);
    };
  }, [playing]);

  // Dock the player once the one at the top has scrolled away.
  useEffect(() => {
    const el = inline.current;
    if (!el || !started) return;
    const io = new IntersectionObserver(([e]) => setDocked(!e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, [started]);

  // The docked player sits where the "skip to In plain words" hint would, so the hint steps aside.
  useEffect(() => {
    document.documentElement.toggleAttribute("data-narrating", docked);
    return () => document.documentElement.removeAttribute("data-narrating");
  }, [docked]);

  useEffect(() => () => { if (typeof CSS !== "undefined" && "highlights" in CSS) CSS.highlights.delete("narration"); }, []);

  const toggle = () => {
    const el = audio.current;
    if (!el) return;
    if (!el.paused) { el.pause(); return; }
    void el.play();
    setStarted(true);
    follow.current = true;
    setFollowing(true);
    if (!cues.current) {
      fetch(`/audio/${slug}.json`)
        .then((r) => r.json() as Promise<Timing>)
        .then((timing) => { cues.current = buildCues(timing); sync(); })
        .catch(() => { cues.current = []; });
    }
  };

  const seek = (value: number) => {
    const el = audio.current;
    if (!el) return;
    el.currentTime = value;
    setTime(value);
  };

  const nextRate = () => {
    const r = RATES[(RATES.indexOf(rate) + 1) % RATES.length];
    if (audio.current) audio.current.playbackRate = r;
    setRate(r);
  };

  const refollow = () => {
    follow.current = true;
    setFollowing(true);
    lastScroll.current = 0;
    sync();
  };

  const controls = (title: boolean) => (
    <>
      <button type="button" className="listen__play" onClick={toggle} aria-label={playing ? "Pause" : "Listen to this post"}>
        {playing ? (
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="3" y="2" width="3.5" height="12" rx="1" /><rect x="9.5" y="2" width="3.5" height="12" rx="1" /></svg>
        ) : (
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M4 2.6v10.8a.9.9 0 0 0 1.37.77l8.6-5.4a.9.9 0 0 0 0-1.54l-8.6-5.4A.9.9 0 0 0 4 2.6Z" /></svg>
        )}
      </button>
      <div className="listen__main">
        {title ? <span className="listen__title">Listen to this post</span> : null}
        <div className="listen__track">
          <input
            type="range"
            className="listen__seek"
            min={0}
            max={Math.round(duration)}
            step={1}
            value={Math.round(time)}
            onChange={(e) => seek(Number(e.target.value))}
            aria-label="Position in the narration"
            aria-valuetext={`${spoken(time)} of ${spoken(duration)}`}
            style={{ "--p": `${duration ? (time / duration) * 100 : 0}%` } as React.CSSProperties}
          />
          <span className="listen__time">{clock(time)} / {clock(duration)}</span>
        </div>
      </div>
      <button type="button" className="listen__rate" onClick={nextRate} aria-label={`Speed: ${rate} times. Change speed`}>{rate}×</button>
    </>
  );

  return (
    <>
      <section ref={inline} className="listen listen--top" aria-label="Narration">
        {controls(true)}
        <audio
          ref={audio}
          src={`/audio/${slug}.m4a`}
          preload="none"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => setDuration(Math.round(e.currentTarget.duration))}
          onSeeked={sync}
          onEnded={() => { lit.current = ""; CSS.highlights?.delete("narration"); }}
        />
      </section>
      <div className="listen listen--dock" data-show={docked ? "" : undefined} inert={!docked}>
        {controls(false)}
        {following ? null : (
          <button type="button" className="listen__follow" onClick={refollow}>Follow the text</button>
        )}
      </div>
    </>
  );
}
