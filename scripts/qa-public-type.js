import { chromium } from "@playwright/test";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const origin = process.env.MLH_VISUAL_ORIGIN || "http://127.0.0.1:4173";
const destination =
  process.argv[2] || "../website-review/public/typography.json";
const routes = {
  home: "/",
  directory: "/cari-instructor?contoh=1",
  amir: "/instructor/cikgu-amir?contoh=1",
  aina: "/instructor/cikgu-aina?contoh=1",
  daniel: "/instructor/cikgu-daniel?contoh=1",
  about: "/tentang-kami",
  contact: "/hubungi",
  join: "/sertai-kami",
  institute: "/daftar-institut",
  login: "/login",
};
const selectors = {
  body: ".pub-site",
  navigation: ".pub-head nav a, .pub-back-home",
  headline: "main h1",
  paragraph: "main p",
  label: ".pub-field > span:first-child",
  input: "main input:not([type=hidden]), main select",
  cta: ".pub-head-actions .pub-btn, .pub-access-form .pub-btn",
  footer: ".pub-footer a",
};
const edge = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const browser = await chromium.launch({
  headless: true,
  executablePath:
    process.env.MLH_BROWSER || (existsSync(edge) ? edge : undefined),
});
const rows = [];
try {
  for (const width of [320, 390, 768, 1024, 1440, 1920, 2560, 3840]) {
    const context = await browser.newContext({
      viewport: { width, height: width > 1920 ? 1440 : 960 },
      reducedMotion: "reduce",
    });
    for (const [name, path] of Object.entries(routes)) {
      const page = await context.newPage();
      const response = await page.goto(origin + path);
      if (!response.ok()) throw Error(path + " returned " + response.status());
      const metrics = await page.evaluate(async (selectors) => {
        await document.fonts.ready;
        const visible = (el) =>
          el.getClientRects().length > 0 &&
          getComputedStyle(el).visibility !== "hidden";
        const sizes = {};
        for (const [key, selector] of Object.entries(selectors)) {
          const el = [...document.querySelectorAll(selector)].find(visible);
          if (el)
            sizes[key] = Number(
              parseFloat(getComputedStyle(el).fontSize).toFixed(2),
            );
        }
        const clipped = [];
        for (const el of document.querySelectorAll(
          "nav a,.pub-btn,label > span, main h1,main h2, main h3",
        )) {
          if (
            visible(el) &&
            el.clientWidth > 0 &&
            el.scrollWidth > el.clientWidth + 2 &&
            getComputedStyle(el).display !== "inline"
          )
            clipped.push(el.textContent.trim().slice(0, 48));
        }
        return {
          sizes,
          clipped,
          overflow: document.documentElement.scrollWidth - innerWidth,
          fontLoaded: [...document.fonts].some(
            (face) =>
              face.family.replace(/["']/g, "") === "DM Sans" &&
              face.status === "loaded",
          ),
          family: getComputedStyle(document.querySelector(".pub-site"))
            .fontFamily,
        };
      }, selectors);
      rows.push({ name, width, ...metrics });
      await page.close();
    }
    await context.close();
  }
} finally {
  await browser.close();
}
for (const name of Object.keys(routes)) {
  const wide = rows.filter(
    (r) => r.name === name && [1440, 1920, 2560].includes(r.width),
  );
  for (const key of [
    "body",
    "navigation",
    "headline",
    "paragraph",
    "label",
    "input",
    "cta",
    "footer",
  ]) {
    const sizes = wide.map((r) => r.sizes[key]);
    if (
      sizes.every((v) => v !== undefined) &&
      !(sizes[0] < sizes[1] && sizes[1] < sizes[2])
    ) {
      console.warn("Check scaling", name, key, sizes);
      process.exitCode = 1;
    }
  }
}
mkdirSync(dirname(destination), { recursive: true });
writeFileSync(destination, JSON.stringify(rows, null, 2) + "\n");
if (rows.some((row) => row.overflow || row.clipped.length || !row.fontLoaded))
  process.exitCode = 1;
console.log(
  JSON.stringify({
    views: rows.length,
    home: rows
      .filter((r) => r.name === "home")
      .map((r) => ({ width: r.width, ...r.sizes })),
    issues: rows
      .filter((r) => r.clipped.length || r.overflow || !r.fontLoaded)
      .map(({ name, width, clipped, overflow, fontLoaded }) => ({
        name,
        width,
        clipped,
        overflow,
        fontLoaded,
      })),
  }),
);
