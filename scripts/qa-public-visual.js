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
  home: "Gambar asal Putrajaya serta lencana L dan P digunakan dalam hero. Kedudukan gambar negeri, pemisah empat langkah dan pautan Sertai Komuniti diselaraskan.",
  directory:
    "Lebar penapis, tinggi hero, jarak kad dan potret Cikgu Daniel diselaraskan. Enam profil contoh dipaparkan untuk membandingkan grid dengan rujukan.",
  amir: "Potret, pengenalan, bahasa, kapsyen galeri, petikan dan panel lokasi diselaraskan. Hero Amir menggunakan Axia daripada lakarannya sendiri, dengan pelekat L pada bonet.",
  aina: "Gambar hero, kedudukan teks, garisan merah pautan aktif, panel bahasa dan nisbah foto galeri diselaraskan.",
  daniel:
    "Lebar panel profil, pemisah label dan nilai, cip kelas SPIM serta tiga gambar galeri diselaraskan. Butang hubungan pada profil contoh dilumpuhkan.",
  about:
    "Nisbah foto berkumpulan, kedudukan kad manfaat dan jarak empat langkah diselaraskan dengan rujukan.",
  contact:
    "Ketinggian ruang mesej, penjajaran kad bantuan serta ikon mesej dibetulkan. Borang sebenar bermula dengan medan kosong.",
  join: "Sepanduk, pautan institut, ikon muat naik dan menu lungsur kelas SPIM dengan pilihan berbilang diselaraskan. Borang sebenar bermula kosong dan memaparkan foto selepas pengguna memilih fail.",
  institute:
    "Susun atur maklumat institut, wakil, muat naik dan butang tambah promosi diselaraskan. Medan kosong boleh dilengkapkan oleh pemohon.",
  login:
    "Dua panel desktop, gambar, tinggi medan dan butang log masuk diselaraskan. Pada telefon, panel disusun menegak.",
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
  ["wide", 1920, 1080],
  ["qhd", 2560, 1440],
  ["tablet", 768, 1024],
  ["mobile", 390, 844],
];
const routes = { ...approved, ...extras };
const edge = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const browser = await chromium.launch({
  headless: true,
  executablePath:
    process.env.MLH_BROWSER || (fs.existsSync(edge) ? edge : undefined),
});
const results = [];
const origin = process.env.MLH_VISUAL_ORIGIN || "http://127.0.0.1:4173";
try {
  const captures = Object.entries(routes).flatMap(([key, [path]]) =>
    widths.map(([size, w, h]) => ({ key, path, size, w, h })),
  );
  for (let i = 0; i < captures.length; i += 4)
    await Promise.all(
      captures.slice(i, i + 4).map(async ({ key, path, size, w, h }) => {
        const page = await browser.newPage({
          viewport: { width: w, height: h },
          reducedMotion: "reduce",
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
const titles = {
  home: "Laman utama",
  directory: "Cari Instructor",
  amir: "Cikgu Amir",
  aina: "Cikgu Aina",
  daniel: "Cikgu Daniel",
  about: "Tentang Kami",
  contact: "Hubungi",
  join: "Join Us",
  institute: "Daftar Institut Memandu",
  login: "Log masuk",
  farah: "Cikgu Farah",
  hafiz: "Cikgu Hafiz",
  "mei-ling": "Cikgu Mei Ling",
  "instructor-registration": "Daftar Instructor",
  signup: "Daftar akaun",
  forgot: "Lupa kata laluan",
  reset: "Tetapkan kata laluan",
  privacy: "Privasi",
  terms: "Terma",
  "empty-directory": "Carian tanpa hasil",
};
const nav = Object.keys(routes)
  .map((key) => `<a href="#${key}">${titles[key]}</a>`)
  .join(" · ");
function figure(src, label, display = "") {
  return `<figure ${display}><figcaption>${label}</figcaption><a href="${src}"><img loading="lazy" src="${src}" alt="${label}"></a></figure>`;
}
const sections = Object.entries(routes)
  .map(([key, [, reference]]) => {
    const original = reference
      ? figure("../../" + reference, "Reka bentuk diluluskan")
      : "";
    const views = widths
      .map(([view, width]) =>
        figure(
          `${key}-${view}.png`,
          `Paparan laman · ${width} px`,
          `data-view="${view}" ${view === "desktop" ? "" : "hidden"}`,
        ),
      )
      .join("");
    return `<section id="${key}"><h2>${titles[key]}</h2><p>${comparisonNotes[key] || "Halaman tambahan mengikut gaya projek. Tiada lakaran asal berasingan."}</p><div class="pair">${original}${views}</div></section>`;
  })
  .join("");
const sizes = widths
  .map(([view, width]) => `<option value="${view}">${width} px</option>`)
  .join("");
const typeFile = out + "/typography.json";
const measurements = fs.existsSync(typeFile)
  ? JSON.parse(fs.readFileSync(typeFile, "utf8"))
  : [];
const measured = measurements
  .filter(
    (row) => row.name === "home" && [1440, 1920, 2560].includes(row.width),
  )
  .map(
    ({ width, sizes }) =>
      `<tr><th>${width} px</th><td>${sizes.body}</td><td>${sizes.navigation}</td><td>${sizes.label}</td><td>${sizes.input}</td></tr>`,
  )
  .join("");
const typography = measured
  ? `<details><summary>Ukuran teks desktop</summary><table><caption>Laman utama · saiz dikira oleh pelayar dalam piksel CSS</caption><thead><tr><th>Skrin</th><th>Teks asas</th><th>Navigasi</th><th>Label borang</th><th>Medan</th></tr></thead><tbody>${measured}</tbody></table><a href="typography.json">Semua ukuran mengikut halaman</a></details>`
  : "";
const html = `<!doctype html><html lang="ms"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>MyLesenHub · Perbandingan halaman awam</title><style>
*{box-sizing:border-box}html{scroll-padding-top:5rem}body{margin:0 auto;padding:clamp(.8rem,2vw,2.8rem);font:clamp(1rem,.87rem + .35vw,1.42rem)/1.5 system-ui,sans-serif;max-width:170rem;color:#131a3b;background:#f1f6fa}h1,h2{line-height:1.12}h1{margin:.5rem 0}h2{margin:0}p{max-width:80ch}a{color:#174f84}section,details{background:white;border:1px solid #d3dfeb;border-radius:1rem;padding:clamp(.75rem,1.5vw,1.8rem);margin:1rem 0}summary,label{font-weight:700}.pair{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem;align-items:start}figure{margin:0;min-width:0}img{width:100%;height:auto;display:block;border:1px solid #d6e2ee}figcaption{padding:.5rem 0;font-weight:650}.picker{position:sticky;top:0;background:#e6f0f9;z-index:1;padding:.5rem .75rem;border-block:1px solid #c3d4e2}select{padding:.45rem;font:inherit;color:inherit;border:1px solid #9cabbd;border-radius:.45rem}table{border-collapse:collapse;margin:1rem 0}th,td{text-align:left;border-bottom:1px solid #d4dfeb;padding:.4em .75em}caption{text-align:left}nav{line-height:1.9}@media(max-width:600px){.pair{grid-template-columns:1fr}.picker{font-size:1rem}details{overflow-x:auto}}
</style></head><body><h1>Perbandingan halaman awam MyLesenHub</h1><p>Bandingkan 10 reka bentuk yang diluluskan dengan paparan laman pada lebar pilihan. Klik gambar untuk melihat saiz penuhnya. Profil dan institusi dalam pratonton menggunakan data contoh.</p>
<details><summary>Pilih halaman</summary><nav>${nav}</nav></details>${typography}
<div class="picker"><label for="width">Lebar paparan laman </label><select id="width">${sizes}</select></div>${sections}
<p><a href="visual-results.json">Keputusan semakan visual</a> · <a href="functional-results.json">Keputusan ujian fungsi</a></p>
<script>document.getElementById("width").addEventListener("change",event=>{document.querySelectorAll("[data-view]").forEach(el=>{el.hidden=el.dataset.view!==event.target.value})})</script></body></html>`;
fs.writeFileSync(out + "/index.html", html);
const problems = results.filter(
  (entry) =>
    entry.status !== 200 ||
    entry.overflow ||
    entry.missing.length ||
    entry.errors.length,
);
console.log(JSON.stringify({ checks: results.length, problems }, null, 2));
if (problems.length) process.exitCode = 1;
