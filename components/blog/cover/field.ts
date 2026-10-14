/*
 * The particle covers, shared by the live canvas (cover and thumbnail) and the
 * share image. A post names a shape; the shape lays out a path for each place
 * the cover appears, and a seeded scatter of particles rides along that path,
 * so the same post draws the same field everywhere.
 */

export type CoverShape = "loop";
/** Where the field is drawn: the post's hero, the index thumbnail, or the share image. */
export type CoverKind = "cover" | "thumb" | "share";
export type Pt = { x: number; y: number };

/** One particle: where it sits on the path (0 to 1), how far off it, how fast it flows, how bright and big. */
export type Seed = { u: number; off: number; speed: number; tone: number; size: number };
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

type Path = { at: (u: number, off: number) => Pt; inside: (p: Pt) => boolean; perimeter: number; band: number; size: number };

/** The agent loop: an ellipse, clockwise on screen. */
function loop(kind: CoverKind, w: number, h: number): Path {
  let cx: number, cy: number, rx: number, ry: number;
  if (kind === "thumb") {
    cx = w * 0.5; cy = h * 0.5; rx = w * 0.36; ry = h * 0.3;
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
  // A thumbnail grows to full width on a phone, so its particles grow with it.
  const band = kind === "thumb" ? Math.max(1.4, w * 0.009) : Math.max(4, rx * 0.028);
  const size = kind === "thumb" ? Math.min(2.4, 1.3 * Math.max(1, w / 200)) : 2.4;
  return { at, inside, perimeter, band, size };
}

const SHAPES: Record<CoverShape, (kind: CoverKind, w: number, h: number) => Path> = { loop };

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
  const n = Math.round(path.perimeter * (kind === "thumb" ? 1.1 : 0.85));
  const seeds: Seed[] = [];
  for (let i = 0; i < n; i++) {
    // Most particles hug the path; a few stray wider, for texture.
    const spread = r() < 0.06 ? 3.5 : 1;
    seeds.push({
      u: r(),
      off: gauss() * path.band * spread,
      speed: (1 / LAP_S) * (0.75 + r() * 0.5),
      tone: (kind === "thumb" ? 0.45 : 0.28) + r() * 0.45,
      size: path.size * (0.7 + r() * 0.45),
    });
  }
  // A sky of faint stars over the whole canvas, so the loop hangs in space. Most
  // are pinpricks, a few are brighter, and only a handful carry a soft halo; all
  // of them stay dimmer and sparser than the loop, which is the subject.
  const stars: Star[] = [];
  const m = kind === "thumb" ? 0 : Math.min(900, Math.round((w * h) / 1500));
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
