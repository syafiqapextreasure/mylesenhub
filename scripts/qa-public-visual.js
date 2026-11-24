import { chromium } from "@playwright/test";
import fs from "node:fs";
const out = "../website-review/public";
fs.mkdirSync(out, { recursive: true });
const approved = {
  home: ["/", "MyLesenHub_Designs/01_Moden_Profesional_Supplied_Hero_v6.png"],
  directory: [
    "/cari-instructor?contoh=1",
    "Cari_Instructor_Designs/Cari_Instructor_Find_The_Best_v3.png",
  ],
  amir: [
    "/instructor/cikgu-amir?contoh=1",
    "Instructor_Profile_Designs/Profil_01_Cikgu_Amir.png",
  ],
  aina: [
    "/instructor/cikgu-aina?contoh=1",
    "Instructor_Profile_Designs/Profil_02_Cikgu_Aina.png",
  ],
  daniel: [
    "/instructor/cikgu-daniel?contoh=1",
    "Instructor_Profile_Designs/Profil_03_Cikgu_Daniel_SPIM_L_v2.png",
  ],
  about: ["/tentang-kami", "Support_Page_Designs/01_Tentang_Kami_L_v2.png"],
  contact: ["/hubungi", "Support_Page_Designs/02_Hubungi.png"],
  join: [
    "/sertai-kami",
    "Support_Page_Designs/03_Join_Us_Instructor_Institut_v3.png",
  ],
  institute: [
    "/daftar-institut",
    "Support_Page_Designs/04_Daftar_Institut_Memandu.png",
  ],
  login: ["/login", "Dashboard_Designs/00_Login_Bersama_v2.png"],
};
const comparisonNotes = {
  home: "The desktop follows the approved split hero, location search, regional images, and four search steps. The hero reflows vertically on mobile.",
  directory:
    "The desktop has a persistent filter column and three card columns. Tablet and mobile use two card columns. The preview flag identifies sample profiles.",
  amir: "The portrait and language tags lead the profile. Two images and the right-hand contact column follow the reference.",
  aina: "The full-width instructor image, section links, location cards, and side-by-side gallery follow the alternative approved layout.",
  daniel:
    "The portrait sidebar, SPIM information table, and three-picture gallery follow v2. Sample contact controls are unavailable.",
  about:
    "The article and group photo sit together on desktop, followed by the benefit and step cards.",
  contact:
    "The help cards and message form sit side by side on desktop. Inputs begin blank and retain their consent control.",
  join: "The standalone institute registration callout precedes the instructor form. Real registration starts with empty fields. Mobile prioritizes the form after the callout.",
  institute:
    "The separate institute form includes location, representative, uploads, and the optional promotion editor.",
  login:
    "The two desktop panels are retained. Tablet and mobile keep the welcome copy and role labels above the car photo.",
};
const extras = {
  farah: ["/instructor/cikgu-farah?contoh=1"],
  hafiz: ["/instructor/cikgu-hafiz?contoh=1"],
  "mei-ling": ["/instructor/cikgu-mei-ling?contoh=1"],
  "instructor-registration": ["/daftar-instructor"],
  signup: ["/signup"],
  forgot: ["/lupa-kata-laluan"],
  reset: ["/reset-password"],
  privacy: ["/privasi"],
  terms: ["/terma"],
  "empty-directory": ["/cari-instructor?contoh=1&state=Melaka"],
};
const widths = [
  ["desktop", 1440, 900],
  ["tablet", 768, 1024],
  ["mobile", 390, 844],
];
const routes = { ...approved, ...extras };
const browser = await chromium.launch({
  headless: true,
  executablePath:
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
});
const results = [];
const origin = "http://127.0.0.1:4173";
try {
  const captures = Object.entries(routes).flatMap(([key, [path]]) =>
    widths.map(([size, w, h]) => ({ key, path, size, w, h })),
  );
  for (let i = 0; i < captures.length; i += 4)
    await Promise.all(
      captures.slice(i, i + 4).map(async ({ key, path, size, w, h }) => {
        const page = await browser.newPage({
          viewport: { width: w, height: h },
        });
        try {
          const errors = [];
          page.on("pageerror", (error) => errors.push(error.message));
          const response = await page
            .goto(origin + path)
            .catch(() => page.goto(origin + path));
          const html = await page.evaluate(async () => {
            for (const img of document.images) img.loading = "eager";
            await document.fonts.ready;
            await Promise.all(
              [...document.images].map((img) => img.decode().catch(() => {})),
            );
            return {
              overflow: document.documentElement.scrollWidth > innerWidth,
              missing: [...document.images]
                .filter((img) => !img.naturalWidth)
                .map((img) => img.currentSrc || img.src),
              h1: document.querySelector("h1")?.innerText.trim(),
            };
          });
          await page.screenshot({
            path: out + "/" + key + "-" + size + ".png",
            fullPage: true,
            animations: "disabled",
          });
          results.push({
            key,
            path,
            size,
            status: response.status(),
            ...html,
            errors,
          });
        } finally {
          await page.close();
        }
      }),
    );
} finally {
  await browser.close();
}
fs.writeFileSync(
  out + "/visual-results.json",
  JSON.stringify(results, null, 2),
);
const html =
  '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>MyLesenHub public visual review</title><style>body{font:16px/1.45 system-ui;color:#11183c;background:#edf5fb;margin:2rem}section{margin:2rem 0;padding:1rem;background:#fff;border-radius:1rem}figure{margin:0;min-width:0}img{width:100%;display:block;border:1px solid #d6e2ee;border-radius:.5rem}figcaption{padding:.6rem 0;font-weight:700}.comparison{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:.8rem}.comparison.extra{grid-template-columns:repeat(3,minmax(0,1fr))}a{color:#165594}@media(max-width:900px){.comparison,.comparison.extra{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:480px){body{margin:.7rem}.comparison,.comparison.extra{grid-template-columns:1fr}}</style></head><body><h1>MyLesenHub public visual review</h1><p>Approved references are paired with captures at 1440 px, 768 px, and 390 px. Open an image for full-size inspection. See the <a href="visual-results.json">visual check results</a> and <a href="functional-results.json">functional check results</a>.</p><nav>' +
  Object.keys(routes)
    .map((key) => '<a href="#' + key + '">' + key + "</a>")
    .join(" · ") +
  "</nav>" +
  Object.entries(routes)
    .map(
      ([key, [path, reference]]) =>
        '<section id="' +
        key +
        '"><h2>' +
        key +
        "</h2><p>" +
        path +
        "</p>" +
        (comparisonNotes[key] ? "<p>" + comparisonNotes[key] + "</p>" : "") +
        '<div class="comparison ' +
        (!reference ? "extra" : "") +
        '">' +
        (reference ? figure("../../" + reference, "Approved reference") : "") +
        widths
          .map(([view, w]) =>
            figure(key + "-" + view + ".png", view + " · " + w + " px"),
          )
          .join("") +
        "</div></section>",
    )
    .join("") +
  "</body></html>";
function figure(src, label) {
  return (
    "<figure><figcaption>" +
    label +
    '</figcaption><a href="' +
    src +
    '"><img loading="lazy" src="' +
    src +
    '" alt="' +
    label +
    '"></a></figure>'
  );
}
fs.writeFileSync(out + "/index.html", html);
console.log(
  JSON.stringify(
    {
      checks: results.length,
      problems: results.filter(
        (entry) =>
          entry.status !== 200 ||
          entry.overflow ||
          entry.missing.length ||
          entry.errors.length,
      ),
    },
    null,
    2,
  ),
);
