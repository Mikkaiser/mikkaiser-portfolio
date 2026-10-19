// Times every word of a post against its narration, for the follow-along highlight.
//
//   python3 scripts/narration-transcribe.py public/audio/<slug>.m4a words.json
//   NODE_PATH=/path/to/node_modules node scripts/narration-sync.mjs <slug> words.json [http://localhost:3000]
//
// The first step writes what was said, word by word, with timestamps. This one
// opens the post in Chromium (the site must be running), reads its words with
// the same function the page uses, lines the two lists up and writes
// public/audio/<slug>.json. Like build-cv.mjs it needs Playwright's Chromium,
// which is not a project dependency, hence NODE_PATH.
//
// The narration is not word for word: headings are read as "Part 3. ...", some
// lines are said differently ("seven dirhams" for "7.00 AED") and labels are
// skipped. So the lists are aligned like a diff that tolerates swaps. Words
// heard as said anchor the timing; a reworded stretch between two anchors
// shares out the time between them; text that was skipped gets no time.
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { narrationWords } from "../components/blog/narration-words.ts";

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const [slug, wordsFile, base = "http://localhost:3000"] = process.argv.slice(2);
if (!slug || !wordsFile) {
  console.error("usage: node scripts/narration-sync.mjs <slug> <words.json> [base url]");
  process.exit(1);
}

const plain = (s) => s.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
const spoken = JSON.parse(await readFile(wordsFile, "utf8"))
  .map((w) => ({ word: plain(w.w), s: w.s, e: w.e }))
  .filter((w) => w.word);

const { chromium } = require("playwright-core");
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(`${base}/blog/${slug}`, { waitUntil: "networkidle" });
const page_words = await page.evaluate(`(${narrationWords})(document.querySelector(".prose")).map((w) => w.word)`);
await browser.close();

// Close enough to count as the same word: whisper writes "getPrice" for get_price, "C-sharp" for C#.
function near(a, b) {
  if (a === b) return true;
  if (a.length < 4 || b.length < 4) return false;
  if (a.startsWith(b) || b.startsWith(a)) return true;
  if (Math.abs(a.length - b.length) > 1) return false;
  let diff = 0;
  for (let i = 0, j = 0; i < a.length && j < b.length; i++, j++) {
    if (a[i] === b[j]) continue;
    if (++diff > 1) return false;
    if (a.length > b.length) j--;
    else if (b.length > a.length) i--;
  }
  return true;
}

// Needleman-Wunsch: a match scores, a swap or a skipped word costs.
const n = page_words.length;
const m = spoken.length;
const MATCH = 3, NEAR = 2, SWAP = -2, SKIP = -1;
const score = new Int32Array((n + 1) * (m + 1));
const move = new Uint8Array((n + 1) * (m + 1)); // 1 diagonal, 2 page word skipped, 3 spoken word skipped
const at = (i, j) => i * (m + 1) + j;
for (let i = 1; i <= n; i++) { score[at(i, 0)] = i * SKIP; move[at(i, 0)] = 2; }
for (let j = 1; j <= m; j++) { score[at(0, j)] = j * SKIP; move[at(0, j)] = 3; }
for (let i = 1; i <= n; i++) {
  for (let j = 1; j <= m; j++) {
    const a = page_words[i - 1];
    const b = spoken[j - 1].word;
    const pair = a === b ? MATCH : near(a, b) ? NEAR : SWAP;
    const diag = score[at(i - 1, j - 1)] + pair;
    const up = score[at(i - 1, j)] + SKIP;
    const left = score[at(i, j - 1)] + SKIP;
    const best = Math.max(diag, up, left);
    score[at(i, j)] = best;
    move[at(i, j)] = best === diag ? 1 : best === up ? 2 : 3;
  }
}

// Walk back from the end, keeping the pairs that are really the same word.
const anchors = [];
for (let i = n, j = m; i > 0 || j > 0;) {
  const step = move[at(i, j)];
  if (step === 1) {
    if (near(page_words[i - 1], spoken[j - 1].word)) anchors.push({ i: i - 1, j: j - 1 });
    i--; j--;
  } else if (step === 2) i--;
  else j--;
}
anchors.reverse();

const times = new Array(n).fill(null);
for (const { i, j } of anchors) times[i] = { s: spoken[j].s, e: spoken[j].e };

// Between two anchors: if something was said there, it was these words reworded,
// so share the time out. If nothing was said, the words were skipped.
for (let k = 1; k < anchors.length; k++) {
  const a = anchors[k - 1];
  const b = anchors[k];
  const gap = b.i - a.i - 1;
  const said = b.j - a.j - 1;
  if (gap === 0 || said === 0 || gap > said * 3 + 3) continue;
  const from = spoken[a.j].e;
  const step = (spoken[b.j].s - from) / gap;
  for (let g = 0; g < gap; g++) times[a.i + 1 + g] = { s: from + step * g, e: from + step * (g + 1) };
}

// [index of the word on the page, the word, start ms, end ms]. The word lets the
// page notice when the post has changed since this file was made.
const words = [];
times.forEach((t, i) => { if (t) words.push([i, page_words[i], Math.round(t.s * 1000), Math.round(t.e * 1000)]); });

const out = path.join(root, "public", "audio", `${slug}.json`);
await writeFile(out, JSON.stringify({ words }) + "\n");
const heard = anchors.length;
console.log(`${n} words on the page, ${m} heard, ${heard} matched, ${words.length} timed → ${path.relative(root, out)}`);
