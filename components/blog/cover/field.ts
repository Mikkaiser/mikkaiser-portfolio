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
type Path = { at: (u: number, off: number) => Pt; inside: (p: Pt) => boolean; perimeter: number; band: number; size: number; ranges?: [number, number][]; flow?: number };

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

// ---- the brain: a side view in a 400 x 300 box, facing right, drawn as three strokes ----

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

const BRAIN_OUTLINE = stroke({ x: 300, y: 205 }, [
  [335, 205, 372, 180, 370, 135], [372, 90, 330, 45, 275, 45], [250, 18, 190, 15, 160, 42], [110, 32, 62, 68, 66, 112],
  [40, 135, 48, 180, 85, 190], [80, 215, 110, 238, 145, 235], [165, 248, 195, 246, 208, 230], [212, 252],
  [213, 262, 228, 262, 229, 252], [232, 226], [262, 232, 290, 222, 300, 205],
]);
const BRAIN_CENTRE: Pt = { x: 215, y: 128 };

/** Horizontal strokes across the inside of the outline, one per crossing, like the winding folds of the cortex. */
function folds(outline: Poly, gap: number): Poly[] {
  const out: Poly[] = [];
  const pts = outline.pts;
  for (let y = 40; y < 255; y += gap) {
    const xs: number[] = [];
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i];
      if ((a.y <= y && b.y > y) || (b.y <= y && a.y > y)) xs.push(a.x + ((y - a.y) / (b.y - a.y)) * (b.x - a.x));
    }
    xs.sort((m, n) => m - n);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      if (xs[k + 1] - xs[k] > 30) out.push(stroke({ x: xs[k] + 7, y }, [[xs[k + 1] - 7, y]]));
    }
  }
  return out;
}

// The outline, the folds inside it, and the central and lateral fissures: wavy strokes that together
// read as the winding surface of a brain.
const BRAIN_STROKES: Poly[] = [
  BRAIN_OUTLINE,
  ...folds(BRAIN_OUTLINE, 15),
  stroke({ x: 215, y: 34 }, [[205, 80, 218, 110, 206, 142]]),
  stroke({ x: 128, y: 168 }, [[180, 150, 235, 165, 290, 176]]),
];
const FOLDS_END = BRAIN_STROKES.length - 2;
const BRAIN_TOTAL = BRAIN_STROKES.reduce((n, p) => n + p.len, 0);

function polyPoint(poly: Poly, s: number): { p: Pt; tx: number; ty: number } {
  let i = 1;
  while (i < poly.cum.length - 1 && poly.cum[i] < s) i++;
  const a = poly.pts[i - 1], b = poly.pts[i];
  const f = (s - poly.cum[i - 1]) / (poly.cum[i] - poly.cum[i - 1] || 1);
  const dx = b.x - a.x, dy = b.y - a.y, dl = Math.hypot(dx, dy) || 1;
  return { p: { x: a.x + dx * f, y: a.y + dy * f }, tx: dx / dl, ty: dy / dl };
}

/** The brain: right of the title on wide screens, above it on phones; centred on a card. */
function brain(kind: CoverKind, w: number, h: number): Path {
  let scale: number, ox: number, oy: number;
  if (kind === "card") {
    scale = (w * 0.74) / 400; ox = w * 0.13; oy = h * 0.33 - 140 * scale;
  } else if (kind === "share") {
    scale = (h * 0.62) / 300; ox = w * 0.72 - 215 * scale; oy = h * 0.4 - 140 * scale;
  } else if (w < 620) {
    scale = Math.min((w * 0.78) / 400, 230 / 300); ox = w / 2 - 215 * scale; oy = 20;
  } else {
    scale = Math.min((h * 0.84) / 300, (Math.min(w, 1180) * 0.38) / 400);
    const col = Math.min(w, 1180);
    const cx = Math.min(w * 0.5 + col * 0.25, w - 200 * scale - Math.max(24, w * 0.03));
    ox = cx - 215 * scale; oy = h / 2 - 140 * scale;
  }
  // Each stroke gets a slice of u in proportion to its length, so particles are evenly spread.
  const ranges: [number, number][] = [];
  let acc = 0;
  for (const p of BRAIN_STROKES) { ranges.push([acc / BRAIN_TOTAL, (acc + p.len) / BRAIN_TOTAL]); acc += p.len; }
  ranges[ranges.length - 1][1] = 1;

  const at = (u: number, off: number): Pt => {
    const gi = Math.max(0, ranges.findIndex(([, hi]) => u < hi));
    const [lo, hi] = ranges[gi];
    const poly = BRAIN_STROKES[gi];
    const along = ((u - lo) / (hi - lo)) * poly.len;
    const { p, tx, ty } = polyPoint(poly, along);
    // Offset along the normal; on the outline, the side facing away from the middle is positive.
    let nx = -ty, ny = tx;
    if (gi === 0 && nx * (p.x - BRAIN_CENTRE.x) + ny * (p.y - BRAIN_CENTRE.y) < 0) { nx = -nx; ny = -ny; }
    // The folds of the cortex: a slow, uneven wave along every stroke.
    const amp = gi === 0 ? 5 : gi < FOLDS_END ? 4.2 : 2.2;
    const wave = amp * (Math.sin(along * (gi === 0 ? 0.4 : 0.2) + gi * 1.7) + 0.55 * Math.sin(along * (gi === 0 ? 0.93 : 0.47) + 1.3 + gi)) / 1.55;
    return { x: ox + (p.x + nx * wave) * scale + nx * off, y: oy + (p.y + ny * wave) * scale + ny * off };
  };
  // Inside the outline, away from its band: where a click sets off a burst.
  const inside = (q: Pt) => {
    const x = (q.x - ox) / scale, y = (q.y - oy) / scale;
    const pts = BRAIN_OUTLINE.pts;
    let c = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      if ((pts[i].y > y) !== (pts[j].y > y) && x < ((pts[j].x - pts[i].x) * (y - pts[i].y)) / (pts[j].y - pts[i].y) + pts[i].x) c = !c;
    }
    return c;
  };
  return { at, inside, perimeter: BRAIN_TOTAL * scale * 0.4, band: Math.max(1.6, scale * 2.4), size: kind === "card" ? 2 : 2.2, ranges,
    // Every stroke shares one u scale, so the whole drawing is longer than a loop: slow it to a loop's pace along the line.
    flow: Math.min(1, 950 / (BRAIN_TOTAL * scale)) };
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
    const range = path.ranges?.find(([lo, hi]) => u >= lo && u < hi);
    seeds.push({
      u,
      lo: range?.[0],
      hi: range?.[1],
      off: gauss() * path.band * spread,
      speed: (1 / LAP_S) * (path.flow ?? 1) * (0.75 + r() * 0.5),
      tone: (kind === "card" ? 0.4 : 0.28) + r() * 0.45,
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
