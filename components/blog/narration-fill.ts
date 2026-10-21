/** A word the narration says: where it sits on the page, and when it is said, in seconds. */
export type Cue = { range: Range; start: number; end: number };

/** The parts of the article nobody reads aloud, the same list narration-words.ts skips. */
const SKIP = ".cref, .code, .sr-only, [aria-hidden='true']";
const BLOCK = "p, li, h2, h3, h4, blockquote, figcaption, td, th, dt, dd";
/** A pause shorter than this after a word is crossed at the same speed as the word. */
const BLEND = 0.08;

/** One letter the fill crosses: where it sits in the text, its box inside the article, and how far along the stretch it ends. */
type Letter = { node: Text; offset: number; x: number; y: number; w: number; h: number; to: number };

/** What the fill crosses from one word to the next: the word, then the space and punctuation after it, in pixels. */
type Stretch = { letters: Letter[]; word: number; length: number };

/** The last cue that has started by time t, or -1. */
export function cueAt(cues: Cue[], t: number) {
  let lo = 0, hi = cues.length - 1, found = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (cues[mid].start <= t) { found = mid; lo = mid + 1; } else hi = mid - 1;
  }
  return found;
}

/**
 * Fills the article with mint up to the point the narration has reached.
 * Everything already said is lit through the CSS Custom Highlight API, a
 * letter at a time. The leading edge is a strip of mint behind the text that
 * moves by the pixel, across each word while it is said and then across the
 * gap to the next one, so the fill glides instead of stepping. Drawing is
 * driven by the audio's clock alone, so a seek lands on the right word.
 */
export function narrationFill(prose: HTMLElement, cues: Cue[]) {
  const blockOf = (c: Cue) => c.range.startContainer.parentElement?.closest(BLOCK);
  // The fill runs on to the next word only inside one paragraph, heading or list item.
  const next = cues.map((c, i) => (cues[i + 1] && blockOf(cues[i + 1]) === blockOf(c) ? cues[i + 1] : null));

  const highlight = new Highlight();
  CSS.highlights.set("narration", highlight);
  const layer = document.createElement("div");
  layer.className = "narration-edge";
  layer.setAttribute("aria-hidden", "true");
  prose.append(layer);

  const walker = document.createTreeWalker(prose, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (n.parentElement?.closest(SKIP) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
  });

  // The last word of a paragraph takes the punctuation after it, so the full stop fills too.
  const tail = (c: Cue): [Node, number] => {
    const block = blockOf(c);
    let node: Node = c.range.endContainer, offset = c.range.endOffset;
    walker.currentNode = node;
    for (;;) {
      const data = (node as Text).data;
      const space = data.slice(offset).search(/\s/);
      if (space >= 0) return [node, offset + space];
      const after = walker.nextNode();
      if (!after || after.parentElement?.closest(BLOCK) !== block) return [node, data.length];
      node = after;
      offset = 0;
    }
  };

  // The text from each word to the next, split around anything skipped, like a closed popover.
  const pieces = new Map<number, Range[]>();
  const piecesOf = (i: number) => {
    const cached = pieces.get(i);
    if (cached) return cached;
    const { range } = cues[i];
    const stop = next[i]?.range;
    const [endNode, endOffset] = stop ? [stop.startContainer, stop.startOffset] : tail(cues[i]);
    walker.currentNode = range.startContainer;
    const found: Range[] = [];
    for (let node: Node | null = range.startContainer; node; node = walker.nextNode()) {
      const from = node === range.startContainer ? range.startOffset : 0;
      const to = node === endNode ? endOffset : (node as Text).length;
      if (to > from) {
        const r = new Range();
        r.setStart(node, from);
        r.setEnd(node, to);
        found.push(r);
      }
      if (node === endNode) break;
    }
    pieces.set(i, found);
    return found;
  };

  // Where each letter of a stretch sits. Measured when first needed, and again after the article reflows.
  const stretches = new Map<number, Stretch>();
  const stretchOf = (i: number) => {
    const cached = stretches.get(i);
    if (cached) return cached;
    const box = prose.getBoundingClientRect();
    const { range } = cues[i];
    const letters: Letter[] = [];
    let to = 0, word = 0;
    for (const piece of piecesOf(i)) {
      const node = piece.startContainer as Text;
      for (let o = piece.startOffset; o < piece.endOffset; o++) {
        const one = new Range();
        one.setStart(node, o);
        one.setEnd(node, o + 1);
        const r = one.getClientRects()[0];
        if (!r || !r.width) continue;
        to += r.width;
        letters.push({ node, offset: o, x: r.left - box.left - prose.clientLeft, y: r.top - box.top - prose.clientTop, w: r.width, h: r.height, to });
        if (node === range.startContainer && o < range.endOffset) word = to;
      }
    }
    const stretch = { letters, word, length: to };
    stretches.set(i, stretch);
    return stretch;
  };

  // How many pixels of stretch i are filled at time t.
  const reach = (i: number, t: number) => {
    const c = cues[i], s = stretchOf(i);
    const until = next[i]?.start ?? c.end;
    if (t >= until) return s.length;
    if (until - c.end < BLEND) return (s.length * (t - c.start)) / (until - c.start);
    if (t < c.end) return (s.word * (t - c.start)) / (c.end - c.start);
    return s.word + ((s.length - s.word) * (t - c.end)) / (until - c.end);
  };

  let done = 0;
  let edge: Range[] = [];
  let edgeKey = "";
  let last = 0;

  const draw = (t: number) => {
    last = t;
    const i = cueAt(cues, t);
    // Light every word before this one, or unlight the ones a seek went back past.
    const upTo = Math.max(i, 0);
    for (; done < upTo; done++) for (const r of piecesOf(done)) highlight.add(r);
    for (; done > upTo; done--) for (const r of piecesOf(done - 1)) highlight.delete(r);

    const s = i < 0 ? null : stretchOf(i);
    const d = s ? Math.max(0, reach(i, t)) : 0;

    // A letter takes the dark ink once the edge has passed its middle.
    const lit = s ? s.letters.filter((l) => l.to - l.w / 2 <= d) : [];
    const key = `${i}:${lit.length}`;
    if (key !== edgeKey) {
      edgeKey = key;
      for (const r of edge) highlight.delete(r);
      edge = [];
      for (const l of lit) {
        const prev = edge[edge.length - 1];
        if (prev && prev.endContainer === l.node && prev.endOffset === l.offset) prev.setEnd(l.node, l.offset + 1);
        else {
          const r = new Range();
          r.setStart(l.node, l.offset);
          r.setEnd(l.node, l.offset + 1);
          edge.push(r);
        }
      }
      for (const r of edge) highlight.add(r);
    }

    // The strip behind the text: one bar per line the stretch is on, cut off at the edge.
    const bars: { x: number; y: number; w: number; h: number }[] = [];
    for (const l of s?.letters ?? []) {
      const from = l.to - l.w;
      if (from >= d) break;
      const right = l.x + Math.min(l.w, d - from);
      const bar = bars[bars.length - 1];
      if (bar && Math.abs(bar.y - l.y) < 1) { bar.w = right - bar.x; bar.h = Math.max(bar.h, l.h); }
      else bars.push({ x: l.x, y: l.y, w: right - l.x, h: l.h });
    }
    while (layer.children.length < bars.length) layer.append(document.createElement("span"));
    while (layer.children.length > bars.length) layer.lastElementChild?.remove();
    bars.forEach((b, k) => {
      const el = layer.children[k] as HTMLElement;
      el.style.transform = `translate(${b.x}px, ${b.y}px)`;
      el.style.width = `${b.w}px`;
      el.style.height = `${b.h}px`;
    });
    return i;
  };

  const reflow = new ResizeObserver(() => { stretches.clear(); edgeKey = ""; draw(last); });
  reflow.observe(prose);

  return {
    draw,
    destroy() {
      reflow.disconnect();
      layer.remove();
      CSS.highlights.delete("narration");
    },
  };
}
