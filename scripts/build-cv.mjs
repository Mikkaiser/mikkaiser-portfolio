// Renders public/assets/Mikael_Ribeiro_CV.pdf from scripts/cv-data.mjs.
//
//   node scripts/build-cv.mjs
//
// Needs Playwright's Chromium for the HTML -> PDF step. It is not a project
// dependency, so point NODE_PATH at an install that has it, e.g.
//   NODE_PATH=/path/to/node_modules node scripts/build-cv.mjs
// Fonts are fetched from Google Fonts once and cached in scripts/.fonts/.
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { cv } from "./cv-data.mjs";

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fontDir = path.join(root, "scripts", ".fonts");
const outFile = path.join(root, "public", "assets", "Mikael_Ribeiro_CV.pdf");

// Google Fonts serves a CSS stub with the woff2 URLs, but only to something that
// looks like a browser; without a UA it hands back a legacy ttf declaration.
const UA =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";

const FONTS = {
  body: "family=Roboto:wght@400;500;700",
  mono: "family=JetBrains+Mono:wght@400;500",
  display: "family=Bricolage+Grotesque:opsz,wght@12..96,700",
};

async function font(name, query) {
  const file = path.join(fontDir, `${name}.bin`);
  try {
    return await readFile(file);
  } catch {
    /* not cached yet */
  }
  const css = await fetch(`https://fonts.googleapis.com/css2?${query}&display=swap`, {
    headers: { "user-agent": UA },
  }).then((r) => r.text());
  // The latin subset is the last @font-face block Google emits.
  const url = [...css.matchAll(/https:\/\/fonts\.gstatic\.com[^)]+/g)].at(-1)?.[0];
  if (!url) throw new Error(`no font URL for ${name}`);
  const buf = Buffer.from(await fetch(url, { headers: { "user-agent": UA } }).then((r) => r.arrayBuffer()));
  await mkdir(fontDir, { recursive: true });
  await writeFile(file, buf);
  return buf;
}

const face = (family, buf, weight = 400) => {
  const woff2 = buf.subarray(0, 4).toString("latin1") === "wOF2";
  return `@font-face{font-family:'${family}';font-style:normal;font-weight:${weight};font-display:block;
    src:url(data:font/${woff2 ? "woff2" : "ttf"};base64,${buf.toString("base64")}) format('${woff2 ? "woff2" : "truetype"}')}`;
};

const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);

function html(faces) {
  const list = (rows, cls) =>
    rows
      .map(([a, b]) => `<div class="${cls}"><span class="${cls}__a">${esc(a)}</span><span class="${cls}__b">${esc(b)}</span></div>`)
      .join("");

  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>${esc(cv.name)} — CV</title>
<style>
${faces}
:root{
  --bg:#FFFFFF; --ink:#000000; --ink-soft:#404040; --muted:#525252; --faint:#737373;
  --rule:#E3E3E3; --gold:#8A6100;
  --display:'Bricolage CV',sans-serif; --body:'Roboto CV',system-ui,sans-serif; --mono:'JetBrains CV',monospace;
}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--bg);color:var(--ink);font-family:var(--body);font-size:9.3pt;line-height:1.5;
  -webkit-print-color-adjust:exact;print-color-adjust:exact}
/* Margins live on the PDF itself so every page gets them, not just the first.
   Screen padding is only for the CV_PREVIEW render. */
@media screen{.page{padding:12mm 13mm 10mm}}

.name{font-family:var(--display);font-weight:700;font-size:25pt;letter-spacing:-0.035em;line-height:1}
.title{font-family:var(--mono);font-weight:500;font-size:8.4pt;letter-spacing:.04em;color:var(--gold);margin-top:5px}
.contact{display:flex;flex-wrap:wrap;gap:4px 14px;margin-top:9px;font-family:var(--mono);font-size:7.5pt;
  letter-spacing:.02em;color:var(--muted)}
.contact span{white-space:nowrap}
.rule{border:0;border-top:1px solid var(--ink);margin:10px 0 0}

.summary{margin-top:11px;color:var(--ink-soft);line-height:1.6;text-wrap:pretty}
.summary b{color:var(--ink);font-weight:500}

.sec{margin-top:15px;break-inside:avoid}
.sec__h{font-family:var(--mono);font-size:7.2pt;font-weight:500;letter-spacing:.18em;text-transform:uppercase;
  color:var(--faint);padding-bottom:4px;border-bottom:1px solid var(--rule);margin-bottom:9px}

.job{margin-bottom:11px;break-inside:avoid}
.job:last-child{margin-bottom:0}
.job__head{display:flex;justify-content:space-between;align-items:baseline;gap:12px}
.job__role{font-family:var(--display);font-weight:700;font-size:11.5pt;letter-spacing:-0.02em;line-height:1.2}
.job__when{font-family:var(--mono);font-size:7.4pt;letter-spacing:.03em;color:var(--faint);white-space:nowrap}
.job__org{font-size:8.8pt;color:var(--gold);font-weight:500;margin-top:1px}
.job__org i{font-style:normal;color:var(--faint);font-weight:400}
ul{list-style:none;margin-top:5px}
li{position:relative;padding-left:11px;color:var(--ink-soft);line-height:1.45;margin-bottom:2.5px}
li::before{content:"";position:absolute;left:1px;top:.52em;width:3px;height:3px;background:var(--gold);border-radius:50%}

.win{display:flex;justify-content:space-between;align-items:baseline;gap:14px;padding:4px 0;border-bottom:1px solid var(--rule)}
.win:last-child{border-bottom:0}
.win__a{font-weight:500;flex:0 0 auto;max-width:47%}
.win__b{font-size:8.3pt;color:var(--faint);text-align:right;line-height:1.35}

.row{display:flex;gap:12px;padding:2.5px 0}
.row__a{font-family:var(--mono);font-size:7.4pt;letter-spacing:.05em;text-transform:uppercase;color:var(--faint);
  flex:0 0 27mm;padding-top:1.5px}
.row__b{color:var(--ink-soft);flex:1}

.two{display:grid;grid-template-columns:1fr 1fr;gap:0 20px}
.lang{margin-top:9px;font-size:8.6pt;color:var(--ink-soft)}
.lang b{font-family:var(--mono);font-size:7.2pt;font-weight:500;letter-spacing:.18em;text-transform:uppercase;
  color:var(--faint);margin-right:8px}
</style></head><body><div class="page">

<header>
  <h1 class="name">${esc(cv.name)}</h1>
  <div class="title">${esc(cv.title)}</div>
  <div class="contact">${cv.contact.map((c) => `<span>${esc(c)}</span>`).join("")}</div>
  <hr class="rule">
  <p class="summary">${esc(cv.summary)
    .replace(/(6\+ years|780,000\+ users|500\+ students and professionals|two WorldSkills gold medals|Chief Expert for the United Arab Emirates)/g, "<b>$1</b>")}</p>
</header>

<section class="sec">
  <h2 class="sec__h">Experience</h2>
  ${cv.experience
    .map(
      (j) => `<article class="job">
    <div class="job__head"><h3 class="job__role">${esc(j.role)}</h3><span class="job__when">${esc(j.when)}</span></div>
    <div class="job__org">${esc(j.org)} <i>· ${esc(j.place)}</i></div>
    <ul>${j.points.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
  </article>`,
    )
    .join("")}
</section>

<section class="sec">
  <h2 class="sec__h">Awards &amp; Recognition</h2>
  ${list(cv.achievements, "win")}
</section>

<section class="sec">
  <h2 class="sec__h">Technical Stack</h2>
  ${list(cv.stack, "row")}
</section>

<section class="sec">
  <h2 class="sec__h">Selected Projects</h2>
  ${list(cv.projects, "win")}
</section>

<div class="two">
  <section class="sec">
    <h2 class="sec__h">Education</h2>
    ${cv.education.map(([a, b]) => `<div style="padding:3px 0"><div style="font-weight:500">${esc(a)}</div><div style="font-size:8.2pt;color:var(--faint)">${esc(b)}</div></div>`).join("")}
  </section>
  <section class="sec">
    <h2 class="sec__h">Certifications</h2>
    ${cv.certifications.map(([a, b]) => `<div style="padding:3px 0"><div style="font-weight:500">${esc(a)}</div><div style="font-size:8.2pt;color:var(--faint)">${esc(b)}</div></div>`).join("")}
  </section>
</div>

<p class="lang"><b>Languages</b>${esc(cv.languages)}</p>

</div></body></html>`;
}

const [body, medium, bold, mono, monoMed, display] = await Promise.all([
  font("roboto-400", FONTS.body),
  font("roboto-500", "family=Roboto:wght@500"),
  font("roboto-700", "family=Roboto:wght@700"),
  font("jetbrains-400", FONTS.mono),
  font("jetbrains-500", "family=JetBrains+Mono:wght@500"),
  font("bricolage-700", FONTS.display),
]);

const faces = [
  face("Roboto CV", body, 400),
  face("Roboto CV", medium, 500),
  face("Roboto CV", bold, 700),
  face("JetBrains CV", mono, 400),
  face("JetBrains CV", monoMed, 500),
  face("Bricolage CV", display, 700),
].join("\n");

const { chromium } = require("playwright");
const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent(html(faces), { waitUntil: "load" });
await page.evaluate(() => document.fonts.ready);
await page.pdf({ path: outFile, format: "A4", printBackground: true, margin: { top: "12mm", right: "13mm", bottom: "10mm", left: "13mm" } });

// CV_PREVIEW=<dir> also drops a full-height PNG there, for eyeballing the layout.
if (process.env.CV_PREVIEW) {
  await page.setViewportSize({ width: 794, height: 1123 });
  await page.screenshot({ path: path.join(process.env.CV_PREVIEW, "cv.png"), fullPage: true });
}
await browser.close();
console.log(`wrote ${path.relative(root, outFile)}`);
