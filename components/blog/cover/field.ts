/*
 * The particle covers, shared by the live canvas (cover and index card) and the
 * share image. A post names a shape; the shape lays out a path for each place
 * the cover appears, and a seeded scatter of particles rides along that path,
 * so the same post draws the same field everywhere.
 */

export type CoverShape = "loop" | "brain";
/** Where the field is drawn: the post's hero, its poster card on the index, or the share image. */
export type CoverKind = "cover" | "card" | "share";
export type Pt = { x: number; y: number };

/** One particle: where it sits on the path (0 to 1), how far off it, how fast it flows, how bright and big. */
export type Seed = { u: number; off: number; speed: number; tone: number; size: number; lo?: number; hi?: number };
/**
 * A background star: a fixed spot (0 to 1 of the canvas), a tint, how bright and
 * big, and how it twinkles. Stars sit behind the path and never move.
 */
export type Star = { x: number; y: number; tint: number; tone: number; size: number; halo: boolean; depth: number; rate: number; phase: number };
export type Field = {
  seeds: Seed[];
  stars: Star[];
  at: (u: number, off: number) => Pt;
  /** True for a point inside the shape, clear of its band: where a click sets off a burst. */
  inside: (p: Pt) => boolean;
};

/** Every particle goes once round the path in about this many seconds, give or take. */
const LAP_S = 24;
/** A brighter pulse goes round once in this many ms: a call going out and coming back. */
export const PULSE_MS = 4200;
const TRAIL = 0.09;

/** `ranges` splits a shape made of several strokes: a particle flows round its own stroke and never jumps to another. */
type Path = { at: (u: number, off: number) => Pt; inside: (p: Pt) => boolean; perimeter: number; band: number; size: number; ranges?: [number, number][]; flow?: number; tones?: number[] };

/** The agent loop: an ellipse, clockwise on screen. */
function loop(kind: CoverKind, w: number, h: number): Path {
  let cx: number, cy: number, rx: number, ry: number;
  if (kind === "card") {
    // A portrait poster: the loop in the upper half, the title below it.
    rx = w * 0.34; ry = rx * 0.62; cx = w * 0.5; cy = h * 0.33;
  } else if (kind === "share") {
    cx = w * 0.72; cy = h * 0.4; rx = w * 0.22; ry = rx * 0.52;
  } else if (w < 620) {
    // Phones: the loop sits above the title.
    rx = w * 0.38; ry = Math.min(h * 0.2, rx * 0.6); cx = w * 0.5; cy = h * 0.32;
  } else {
    // Wide screens: the loop takes the right of the content column, the title the bottom left.
    const col = Math.min(w, 1180);
    rx = Math.min(col * 0.3, h * 0.7, w * 0.26); ry = Math.min(rx * 0.48, h * 0.34); cy = h * 0.44;
    // Kept inside the right edge on narrower screens.
    cx = Math.min(w * 0.5 + col * 0.22, w - rx - Math.max(24, w * 0.03));
  }
  const at = (u: number, off: number): Pt => {
    const a = u * 2 * Math.PI;
    const c = Math.cos(a), s = Math.sin(a);
    // Offset along the outward normal of the ellipse.
    const nx = ry * c, ny = rx * s, nl = Math.hypot(nx, ny) || 1;
    return { x: cx + rx * c + (nx / nl) * off, y: cy + ry * s + (ny / nl) * off };
  };
  const perimeter = 2 * Math.PI * Math.sqrt((rx * rx + ry * ry) / 2);
  const inside = (p: Pt) => ((p.x - cx) / rx) ** 2 + ((p.y - cy) / ry) ** 2 < 0.8;
  const band = kind === "card" ? Math.max(2, w * 0.011) : Math.max(4, rx * 0.028);
  const size = kind === "card" ? 2.2 : 2.4;
  return { at, inside, perimeter, band, size };
}

// ---- the brain: a side view, facing right, drawn as many strokes: outlines, fissures and folds ----

type Poly = { pts: Pt[]; cum: number[]; len: number };

function cubic(a: Pt, b: Pt, c: Pt, d: Pt, t: number): Pt {
  const k = 1 - t;
  return {
    x: k * k * k * a.x + 3 * k * k * t * b.x + 3 * k * t * t * c.x + t * t * t * d.x,
    y: k * k * k * a.y + 3 * k * k * t * b.y + 3 * k * t * t * c.y + t * t * t * d.y,
  };
}

/** A stroke as a run of cubic Béziers (and straight lines, as flat ones) sampled into a polyline. */
function stroke(start: Pt, segs: number[][]): Poly {
  const pts: Pt[] = [start];
  let cur = start;
  for (const g of segs) {
    const c = g.length === 6
      ? [{ x: g[0], y: g[1] }, { x: g[2], y: g[3] }, { x: g[4], y: g[5] }]
      : [{ x: cur.x + (g[0] - cur.x) / 3, y: cur.y + (g[1] - cur.y) / 3 }, { x: cur.x + ((g[0] - cur.x) * 2) / 3, y: cur.y + ((g[1] - cur.y) * 2) / 3 }, { x: g[0], y: g[1] }];
    for (let i = 1; i <= 24; i++) pts.push(cubic(cur, c[0], c[1], c[2], i / 24));
    cur = c[2];
  }
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  return { pts, cum, len: cum[cum.length - 1] };
}

function within(pts: Pt[], x: number, y: number) {
  let c = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    if ((pts[i].y > y) !== (pts[j].y > y) && x < ((pts[j].x - pts[i].x) * (y - pts[i].y)) / (pts[j].y - pts[i].y) + pts[i].x) c = !c;
  }
  return c;
}

/** One stroke of the drawing, with how much it wobbles and how bright its particles are. */
type Part = { poly: Poly; amp: number; tone: number; centre?: Pt };
const part = (amp: number, tone: number, start: [number, number], segs: number[][], centre?: Pt): Part =>
  ({ poly: stroke({ x: start[0], y: start[1] }, segs), amp, tone, centre });

// Facing right: the frontal lobe on the right, the cerebellum tucked under the back, the stem below.
const CEREBRUM = part(2.2, 0.22, [380, 138], [
  [378, 170, 356, 186, 322, 186], [308, 186, 300, 192, 298, 202], [296, 226, 268, 240, 236, 240],
  [206, 240, 178, 232, 150, 228], [120, 224, 92, 214, 72, 198], [50, 182, 34, 160, 36, 134],
  [38, 86, 76, 46, 132, 32], [170, 12, 250, 8, 300, 30], [346, 50, 384, 96, 380, 138],
], { x: 210, y: 130 });
const CEREBELLUM = part(1.2, 0.16, [98, 222], [
  [88, 248, 118, 282, 160, 284], [196, 286, 220, 268, 216, 246], [214, 232, 196, 224, 176, 226], [150, 228, 120, 220, 98, 222],
], { x: 158, y: 252 });

const STEM = [
  part(0.4, 0.06, [240, 238], [[242, 258, 240, 278, 236, 296]]),
  part(0.4, 0.06, [214, 248], [[216, 266, 214, 282, 212, 296]]),
];
// The two big fissures: lateral (between the temporal lobe and the rest) and central.
const FISSURES = [
  part(1.6, 0.1, [300, 196], [[270, 184, 236, 176, 210, 170], [190, 166, 176, 150, 168, 138]]),
  part(1.6, 0.1, [228, 12], [[222, 40, 236, 62, 226, 86], [216, 110, 232, 130, 224, 160]]),
];
// The fine, parallel folds of the cerebellum.
const FOLIA = [
  part(0.8, -0.04, [108, 234], [[132, 252, 176, 256, 210, 238]]),
  part(0.8, -0.04, [102, 248], [[128, 270, 176, 274, 212, 254]]),
  part(0.8, -0.04, [112, 264], [[134, 280, 172, 282, 204, 270]]),
];

function polyOf(pts: Pt[]): Poly {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  return { pts, cum, len: cum[cum.length - 1] };
}

/**
 * The sulci: the winding grooves of the cortex. Seeded random walks start all over the
 * cerebrum, bend smoothly as they go, and stop when they would leave it or come too close
 * to another groove, the outline or a fissure, so together they fill it like a labyrinth.
 */
function sulci(): Part[] {
  const r = rng(11);
  const G = 7, COLS = 60, ROWS = 46;
  const grid = new Int32Array(COLS * ROWS);
  const cell = (x: number, y: number) => Math.floor(y / G) * COLS + Math.floor(x / G);
  const mark = (x: number, y: number, id: number) => { const c = cell(x, y); if (c >= 0 && c < grid.length) grid[c] = id; };
  for (const pt of [CEREBRUM, CEREBELLUM, ...FISSURES]) for (const q of pt.poly.pts) mark(q.x, q.y, -1);
  const inside = (x: number, y: number) => within(CEREBRUM.poly.pts, x, y) && !within(CEREBELLUM.poly.pts, x, y);
  // Free if no other groove is in this cell or the eight around it.
  const free = (x: number, y: number, id: number) => {
    const cx = Math.floor(x / G), cy = Math.floor(y / G);
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const v = grid[(cy + dy) * COLS + cx + dx];
      if (v !== 0 && v !== id) return false;
    }
    return true;
  };
  const starts: Pt[] = [];
  for (let gy = 1; gy < ROWS - 1; gy++) for (let gx = 1; gx < COLS - 1; gx++) starts.push({ x: (gx + 0.5) * G, y: (gy + 0.5) * G });
  for (let i = starts.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [starts[i], starts[j]] = [starts[j], starts[i]]; }

  const out: Part[] = [];
  let id = 0;
  for (const s0 of starts) {
    if (!inside(s0.x, s0.y) || !free(s0.x, s0.y, -2)) continue;
    id++;
    let x = s0.x, y = s0.y, a = r() * 2 * Math.PI, k = 0;
    const pts: Pt[] = [{ x, y }];
    mark(x, y, id);
    for (let step = 0; step < 34; step++) {
      // The heading drifts smoothly, so the groove meanders instead of going straight.
      k = Math.max(-0.22, Math.min(0.22, (k + (r() - 0.5) * 0.45) * 0.9));
      a += k;
      let moved = false;
      for (const turn of [0, 0.8, -0.8, 1.6, -1.6]) {
        const nx = x + Math.cos(a + turn) * 2.6, ny = y + Math.sin(a + turn) * 2.6;
        if (inside(nx, ny) && free(nx, ny, id)) { a += turn; x = nx; y = ny; moved = true; break; }
      }
      if (!moved) break;
      pts.push({ x, y });
      mark(x, y, id);
    }
    if (pts.length >= 6) out.push({ poly: polyOf(pts), amp: 0.6, tone: 0 });
  }
  return out;
}

const BRAIN_PARTS: Part[] = [CEREBRUM, CEREBELLUM, ...STEM, ...FISSURES, ...sulci(), ...FOLIA];
const BRAIN_TOTAL = BRAIN_PARTS.reduce((n, p) => n + p.poly.len, 0);
// About 2,000 particles at the hero's size.
const BRAIN_DENSITY = 0.44;

function polyPoint(poly: Poly, s: number): { p: Pt; tx: number; ty: number } {
  let i = 1;
  while (i < poly.cum.length - 1 && poly.cum[i] < s) i++;
  const a = poly.pts[i - 1], b = poly.pts[i];
  const f = (s - poly.cum[i - 1]) / (poly.cum[i] - poly.cum[i - 1] || 1);
  const dx = b.x - a.x, dy = b.y - a.y, dl = Math.hypot(dx, dy) || 1;
  return { p: { x: a.x + dx * f, y: a.y + dy * f }, tx: dx / dl, ty: dy / dl };
}


/** The brain: right of the title on wide screens, above it on phones, centred on a card. The drawing spans x 34 to 384, y 8 to 296. */
function brain(kind: CoverKind, w: number, h: number): Path {
  const CX = 208, CY = 152, HW = 178, HH = 290;
  let scale: number, ox: number, oy: number;
  if (kind === "card") {
    scale = (w * 0.76) / (2 * HW); ox = w / 2 - CX * scale; oy = h * 0.36 - CY * scale;
  } else if (kind === "share") {
    scale = (h * 0.64) / HH; ox = w * 0.72 - CX * scale; oy = h * 0.42 - CY * scale;
  } else if (w < 620) {
    scale = Math.min((w * 0.8) / (2 * HW), 240 / HH); ox = w / 2 - CX * scale; oy = 16 - 8 * scale;
  } else {
    const col = Math.min(w, 1180);
    scale = Math.min((h * 0.86) / HH, (col * 0.38) / (2 * HW));
    const cx = Math.min(w * 0.5 + col * 0.25, w - HW * scale - Math.max(24, w * 0.03));
    ox = cx - CX * scale; oy = h / 2 - CY * scale;
  }
  // Each stroke gets a slice of u in proportion to its length, so particles are evenly spread.
  const ranges: [number, number][] = [];
  let acc = 0;
  for (const pt of BRAIN_PARTS) { ranges.push([acc / BRAIN_TOTAL, (acc + pt.poly.len) / BRAIN_TOTAL]); acc += pt.poly.len; }
  ranges[ranges.length - 1][1] = 1;

  const at = (u: number, off: number): Pt => {
    const gi = Math.max(0, ranges.findIndex(([, hi]) => u < hi));
    const [lo, hi] = ranges[gi];
    const { poly, amp, centre } = BRAIN_PARTS[gi];
    const along = ((u - lo) / (hi - lo)) * poly.len;
    const { p, tx, ty } = polyPoint(poly, along);
    // Offset along the normal; on a closed outline, outward is positive.
    let nx = -ty, ny = tx;
    if (centre && nx * (p.x - centre.x) + ny * (p.y - centre.y) < 0) { nx = -nx; ny = -ny; }
    // A slow, uneven wobble, so no line looks drawn with a ruler.
    const wave = (amp * (Math.sin(along * 0.33 + gi * 1.7) + 0.55 * Math.sin(along * 0.77 + 1.3 + gi))) / 1.55;
    return { x: ox + (p.x + nx * wave) * scale + nx * off, y: oy + (p.y + ny * wave) * scale + ny * off };
  };
  // Inside the cerebrum or the cerebellum: where a click sets off a burst.
  const inside = (q: Pt) => {
    const x = (q.x - ox) / scale, y = (q.y - oy) / scale;
    return within(CEREBRUM.poly.pts, x, y) || within(CEREBELLUM.poly.pts, x, y);
  };
  return {
    at, inside, ranges,
    perimeter: BRAIN_TOTAL * scale * BRAIN_DENSITY,
    band: Math.max(1.2, scale * 1.5),
    size: kind === "card" ? 1.9 : 2.1,
    tones: BRAIN_PARTS.map((pt) => pt.tone),
    // Every stroke shares one u scale, so the whole drawing is longer than a loop: slow it to a loop's pace along the line.
    flow: Math.min(1, 950 / (BRAIN_TOTAL * scale)),
  };
}

const SHAPES: Record<CoverShape, (kind: CoverKind, w: number, h: number) => Path> = { loop, brain };

/** Mulberry32: a tiny seeded generator, so the server and the browser scatter the same field. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function field(shape: CoverShape, kind: CoverKind, w: number, h: number): Field {
  const path = SHAPES[shape](kind, w, h);
  const r = rng(7);
  const gauss = () => Math.sqrt(-2 * Math.log(r() || 1e-9)) * Math.cos(2 * Math.PI * r());
  const n = Math.round(path.perimeter * (kind === "card" ? 1 : 0.85));
  const seeds: Seed[] = [];
  for (let i = 0; i < n; i++) {
    // Most particles hug the path; a few stray wider, for texture.
    const spread = r() < 0.06 ? 3.5 : 1;
    const u = r();
    const ri = path.ranges ? path.ranges.findIndex(([lo, hi]) => u >= lo && u < hi) : -1;
    const range = ri >= 0 ? path.ranges![ri] : undefined;
    seeds.push({
      u,
      lo: range?.[0],
      hi: range?.[1],
      off: gauss() * path.band * spread,
      speed: (1 / LAP_S) * (path.flow ?? 1) * (0.75 + r() * 0.5),
      tone: (kind === "card" ? 0.4 : 0.28) + r() * 0.45 + (ri >= 0 ? path.tones?.[ri] ?? 0 : 0),
      size: path.size * (0.7 + r() * 0.45),
    });
  }
  // A sky of faint stars over the whole canvas, so the loop hangs in space. Most
  // are pinpricks, a few are brighter, and only a handful carry a soft halo; all
  // of them stay dimmer and sparser than the loop, which is the subject.
  const stars: Star[] = [];
  const m = Math.min(900, Math.round((w * h) / 1500));
  for (let i = 0; i < m; i++) {
    const k = r();
    const halo = k < 0.015;
    const mid = !halo && k < 0.14;
    stars.push({
      x: r(),
      y: r(),
      tint: pickTint(r()),
      tone: halo ? 0.7 + r() * 0.2 : mid ? 0.45 + r() * 0.2 : 0.2 + r() * 0.3,
      size: halo ? 2.2 + r() * 0.5 : mid ? 1.6 + r() * 0.5 : 1 + r() * 0.6,
      halo,
      // About half twinkle noticeably; the rest barely shimmer.
      depth: r() < 0.5 ? 0.35 + r() * 0.35 : r() * 0.15,
      rate: 0.6 + r() * 1.8,
      phase: r() * 2 * Math.PI,
    });
  }
  return { seeds, stars, at: path.at, inside: path.inside };
}

/**
 * Star colours, from hot to cool, each as a pale tint for the dark theme and a
 * deeper one for the light theme. Weighted like a real sky: mostly white and
 * blue-white, a little yellow and orange, a rare red.
 */
export const STAR_TINTS: { dark: string; light: string; share: number }[] = [
  { dark: "#F2F3FF", light: "#3B3B4A", share: 0.4 },
  { dark: "#8FB0FF", light: "#2E4A8A", share: 0.25 },
  { dark: "#FFD97A", light: "#80651E", share: 0.18 },
  { dark: "#FFA95E", light: "#8F521D", share: 0.11 },
  { dark: "#FF7F6B", light: "#8C392E", share: 0.06 },
];

function pickTint(x: number) {
  for (let i = 0; i < STAR_TINTS.length; i++) {
    x -= STAR_TINTS[i].share;
    if (x < 0) return i;
  }
  return 0;
}

/** How lit a star is at time `t` (ms): its tone, dipping now and then as it twinkles. */
export function twinkle(star: Star, t: number) {
  return star.tone * (1 - star.depth * (0.5 + 0.5 * Math.sin(t * 0.001 * star.rate + star.phase)));
}

/** How lit a particle at `u` is by the pulse whose head is at `head`: a short trail behind it. */
export function glow(u: number, head: number) {
  const behind = (((head - u) % 1) + 1) % 1;
  return behind < TRAIL ? 1 - behind / TRAIL : 0;
}

/** Where the pulse sits in a still frame (reduced motion, the share image). */
export const STILL_HEAD = 0.18;
