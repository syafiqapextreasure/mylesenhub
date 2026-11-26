import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
const origin = process.env.MLH_QA_ORIGIN || "http://localhost:8794";
const browser = await chromium.launch({
  headless: true,
  executablePath:
    process.env.MLH_QA_BROWSER ||
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
});
for (const size of [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
]) {
  const ctx = await browser.newContext({
    viewport: size,
    geolocation: { latitude: 1.5, longitude: 103.7 },
    permissions: ["geolocation"],
  });
  await ctx.route("https://photon.komoot.io/**", (r) =>
    r.fulfill({
      json: {
        features: [
          {
            geometry: { coordinates: [103.7, 1.5] },
            properties: {
              street: "Jalan Ujian",
              city: "Johor Bahru",
              country: "Malaysia",
            },
          },
        ],
      },
    }),
  );
  const p = await ctx.newPage(),
    errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  for (const route of [
    "/",
    "/cari-instructor",
    "/sertai-kami",
    "/daftar-institut",
    "/tentang-kami",
    "/hubungi",
  ]) {
    const r = await p.goto(origin + route);
    assert.equal(r.status(), 200, route);
  }
  await p.goto(origin + "/daftar-institut");
  await p.locator("[data-detect-location]").click();
  await p.waitForFunction(() =>
    document.querySelector("[name=address]").value.includes("Jalan Ujian"),
  );
  assert.equal(await p.locator("[name=latitude]").inputValue(), "1.500000");
  const canvas = p.locator("[data-map-canvas]");
  const box = await canvas.boundingBox();
  await canvas.click({ position: { x: box.width * 0.7, y: box.height * 0.5 } });
  assert.notEqual(
    await p.locator("[name=longitude]").inputValue(),
    "103.700000",
  );
  await p
    .locator("[data-map-paste]")
    .fill(
      "https://www.google.com/maps/place/Test/@1.1,103.1,17z/data=!3d1.5201!4d103.7702",
    );
  await p.locator("[data-use-map-paste]").click();
  assert.equal(await p.locator("[name=latitude]").inputValue(), "1.520100");
  await p.locator("[name=address]").fill("Jalan Ujian");
  await p.locator("[data-find-address]").click();
  await p.waitForFunction(
    () => document.querySelector("[name=longitude]").value === "103.700000",
  );
  assert.equal(await p.locator("[name=state]").count(), 0);
  await p.goto(origin + "/sertai-kami");
  assert.equal(await p.locator("select[name=instituteId]").count(), 1);
  assert.equal(await p.locator("input[name=institute]").count(), 0);
  assert.deepEqual(errors, []);
  console.log(
    "PASS public routes, map search, reverse address, pin adjustment, select and console",
    size.width,
  );
  await ctx.close();
}
const denied = await browser.newContext({ permissions: [] });
const page = await denied.newPage();
await page.goto(origin + "/daftar-institut");
await page.locator("[data-detect-location]").click();
await page.locator("[data-map-status]").waitFor();
await page.waitForFunction(() =>
  document.querySelector("[data-map-status]").textContent.includes("manual"),
);
assert.equal(await page.locator("[name=latitude]").inputValue(), "");
await page.locator("[name=latitude]").fill("1.5");
await page.locator("[name=longitude]").fill("103.7");
assert.equal(await page.locator("[name=latitude]").inputValue(), "1.5");
console.log("PASS denied geolocation and manual coordinate fallback");
await denied.close();
await browser.close();
