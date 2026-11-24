import { chromium } from "@playwright/test";
import assert from "node:assert/strict";

// Run against the read-only demo preview: npm run qa:preview, then node tests/review-flow.js.
// API writes are intercepted, so no real records are modified.
const browser = await chromium.launch({
  headless: true,
  ...(process.env.BROWSER_PATH
    ? { executablePath: process.env.BROWSER_PATH }
    : {}),
});
const url = "http://127.0.0.1:4173/dashboard/admin/semakan?id=profil-im";
try {
  const page = await browser.newPage();
  let requests = [],
    failedOnce = false;
  await page.route("**/api/review", async (route) => {
    const body = route.request().postDataJSON();
    requests.push(body);
    if (body.action === "verify" && !failedOnce) {
      failedOnce = true;
      return route.fulfill({
        status: 503,
        json: { ok: false, message: "Cuba lagi." },
      });
    }
    const status = {
      verify: "pengesahan",
      publish: "diterbitkan",
      return: "pembetulan",
    }[body.action];
    await route.fulfill({
      json: { ok: true, status, message: "Status dikemas kini." },
    });
  });
  await page.goto(url);
  assert.equal(
    await page.getByRole("button", { name: "Sahkan", exact: true }).count(),
    1,
  );
  await page.getByRole("button", { name: "Sahkan", exact: true }).click();
  await page.getByText("Cuba lagi.", { exact: true }).waitFor();
  assert.equal(
    await page.getByRole("button", { name: "Sahkan", exact: true }).isEnabled(),
    true,
  );
  await page.getByRole("button", { name: "Sahkan", exact: true }).click();
  const publish = page.getByRole("button", { name: "Terbitkan", exact: true });
  await publish.waitFor();
  assert.equal(
    await page.evaluate(() => document.activeElement?.textContent),
    "Terbitkan",
  );
  assert.equal(
    await page.locator("[data-review-status]").innerText(),
    "Pengesahan",
  );
  assert.equal(
    await page.locator('[data-review-step="2"]').getAttribute("aria-current"),
    "step",
  );
  assert.equal(page.url(), url);
  await publish.click();
  await page.locator("[data-review-status] .d-diterbitkan").waitFor();
  assert.equal(await page.locator("[data-review-actions] button").count(), 0);
  assert.equal(
    await page.locator("[data-review-status]").innerText(),
    "Diterbitkan",
  );
  assert.deepEqual(
    requests.map((x) => x.action),
    ["verify", "verify", "publish"],
  );
  await page.goto(url);
  await page.getByRole("button", { name: "Minta pembetulan" }).click();
  assert.equal(requests.length, 3);
  assert.match(await page.locator(".d-feedback").innerText(), /Nyatakan/);
  await page.locator("[name=note]").fill("Sila betulkan lokasi.");
  await page.getByRole("button", { name: "Minta pembetulan" }).click();
  await page.locator("[data-review-status] .d-pembetulan").waitFor();
  assert.equal(await page.locator("[data-review-actions] button").count(), 0);
  console.log("Review retry, verify, publish, return and focus passed.");
} finally {
  await browser.close();
}
