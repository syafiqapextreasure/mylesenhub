import { chromium, expect } from "@playwright/test";
import fs from "node:fs";
import assert from "node:assert/strict";
import { renderPublic } from "../src/public.js";
import { registrationCases } from "./qa-registration.js";

const origin = process.env.MLH_QA_ORIGIN || "http://localhost:8788";
const registrationOnly = process.argv.includes("--registration");
const browser = await chromium.launch({
  headless: true,
  executablePath:
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
});
const results = [];
const client = (page, path, handler) =>
  page.route("**" + path, async (route) =>
    route.fulfill({ json: await handler(route.request()) }),
  );
async function fields(page, names) {
  for (const [name, value] of Object.entries(names))
    await page.locator('[name="' + name + '"]').fill(value);
}
async function test(name, mode, run, viewport = { width: 1440, height: 900 }) {
  if (registrationOnly && mode !== "Local registration fixture") return;
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  page.setDefaultTimeout(9000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  try {
    await run(page);
    assert.deepEqual(errors, []);
    results.push({ name, mode, status: "pass" });
  } catch (error) {
    results.push({ name, mode, status: "fail", error: String(error), errors });
  } finally {
    console.log(results.at(-1).status + " " + name);
    await context.close();
  }
}
async function chooseClass(page, value) {
  const picker = page.locator(".pub-class-picker");
  await picker.locator("summary").click();
  const choice = picker.locator('[name="spim"][value="' + value + '"]');
  await choice.check();
  await expect(picker.locator("summary")).toContainText(value);
  await choice.press("Escape");
  await expect(picker.locator("summary")).toBeFocused();
}
async function chooseLocation(page) {
  await page.locator("[name=state]").selectOption("Johor");
  await page.locator("[name=district]").selectOption("Johor Bahru");
}
try {
  await test(
    "Homepage, state links, live directory, sample filters and profile",
    "Worker",
    async (page) => {
      await page.goto(origin + "/");
      await expect(
        page.getByRole("heading", { name: "Everyone Can Drive" }),
      ).toBeVisible();
      await expect(page.locator("[name=district]")).toBeDisabled();
      await chooseLocation(page);
      await page.getByRole("button", { name: "Cari Instructor" }).click();
      await expect(page).toHaveURL(/state=Johor.*district=Johor\+Bahru/);
      // The sample-directory link is offered when the live filter has no matches.
      await page.locator("[name=name]").fill("QA-" + crypto.randomUUID());
      await page.getByRole("button", { name: "Cari Instructor" }).click();
      await expect(page.getByRole("heading", { name: "Tiada profil untuk carian ini" })).toBeVisible();
      await page.getByRole("link", { name: "Terokai profil contoh" }).click();
      await expect(page.locator(".pub-instructor-card")).toHaveCount(6);
      await page.locator("[name=name]").fill("Daniel");
      await page.getByRole("button", { name: "Cari Instructor" }).click();
      await expect(page).toHaveURL(/contoh=1/);
      await expect(page.locator(".pub-instructor-card")).toHaveCount(1);
      await page
        .getByRole("link", { name: "Lihat profil", exact: true })
        .click();
      await expect(page).toHaveURL(/cikgu-daniel\?contoh=1$/);
      await expect(
        page.getByRole("heading", { name: "Cikgu Daniel", exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Hubungi instructor" }),
      ).toBeDisabled();
      await expect(page.locator(".pub-gallery img")).toHaveCount(3);
      await page.getByRole("link", { name: "Kembali ke carian" }).click();
      await page.getByRole("link", { name: "Tetapkan semula" }).click();
      await expect(page.locator("[name=state]")).toHaveValue("");
      await expect(page.locator(".pub-instructor-card")).toHaveCount(6);
      await page.goto(origin + "/");
      await page.getByRole("link", { name: "Melaka Lihat direktori" }).click();
      await expect(page.locator("[name=state]")).toHaveValue("Melaka");
    },
  );
  await test(
    "Mobile menu and support pages",
    "Worker",
    async (page) => {
      await page.goto(origin + "/");
      const menu = page.getByRole("button", { name: "Menu" });
      await expect(menu).toHaveAttribute("aria-expanded", "false");
      await menu.click();
      await expect(menu).toHaveAttribute("aria-expanded", "true");
      await page
        .getByRole("link", { name: "Tentang Kami", exact: true })
        .click();
      await expect(
        page.getByRole("heading", { name: "Tentang Kami", exact: true }),
      ).toBeVisible();
      await page.getByRole("link", { name: "Privasi", exact: true }).click();
      await expect(
        page.getByRole("heading", { name: "Dasar Privasi" }),
      ).toBeVisible();
      await page.getByRole("link", { name: "Terma", exact: true }).click();
      await expect(
        page.getByRole("heading", { name: "Terma Penggunaan" }),
      ).toBeVisible();
    },
    { width: 390, height: 844 },
  );
  await test(
    "Contact required fields, consent, successful response and reset",
    "Worker UI with stubbed write",
    async (page) => {
      let payload;
      await client(page, "/api/contact", async (request) => {
        payload = request.postDataJSON();
        return { ok: true, message: "Mesej diterima untuk semakan." };
      });
      await page.goto(origin + "/hubungi");
      await page.getByRole("button", { name: "Hantar mesej" }).click();
      assert(!payload);
      await fields(page, {
        name: "Ujian fungsi",
        email: "test@example.invalid",
        message: "Ujian borang pertanyaan biasa.",
      });
      await page.locator("[name=subject]").selectOption("Pertanyaan umum");
      await page.locator("[name=consent]").check();
      await page.getByRole("button", { name: "Hantar mesej" }).click();
      await expect(page.getByRole("status")).toContainText("Mesej diterima");
      assert.deepEqual(payload, {
        name: "Ujian fungsi",
        email: "test@example.invalid",
        subject: "Pertanyaan umum",
        message: "Ujian borang pertanyaan biasa.",
        consent: true,
      });
      await expect(page.locator("[name=name]")).toHaveValue("");
    },
  );
  await registrationCases({ test, fields, chooseLocation, chooseClass });
  await test(
    "Institut registration and gallery with promotions disabled",
    "Authenticated fixture UI with stubbed writes",
    async (page) => {
      const path = "/daftar-institut";
      let submitted;
      let uploads = 0;
      await page.route(origin + path, async (route) => {
        const user = { id: "qa", role: "institut" };
        const html =
          '<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="/base.css"><link rel="stylesheet" href="/public.css"><script src="/public.js" defer></script>' +
          renderPublic(path, new URL(origin + path), { user });
        await route.fulfill({ contentType: "text/html", body: html });
      });
      await client(page, "/api/media", async (request) => {
        assert(request.postDataBuffer().length > 0);
        return { ok: true, url: "/api/media/mock-" + ++uploads };
      });
      await client(page, "/api/register/institut", async (request) => {
        submitted = request.postDataJSON();
        return { ok: true, message: "Maklumat dihantar untuk semakan." };
      });
      await page.goto(origin + path);
      await chooseLocation(page);
      await fields(page, {
        name: "Institut Ujian",
        address: "Jalan Ujian",
        postcode: "81200",
        representative: "Ujian",
        position: "Wakil",
        email: "test@example.invalid",
        phone: "0120000000",
        bio: "Pengenalan untuk ujian fungsi.",
      });
      await chooseClass(page, "DA");
      await expect(page.locator('[name^="promotion"]')).toHaveCount(0);
      await page
        .locator("[name=logo]")
        .setInputFiles("public/media/brand.webp");
      await page
        .locator("[name=gallery]")
        .setInputFiles("public/media/profile-car.webp");

      await page.locator("[name=consent]").check();
      await page.getByRole("button", { name: "Hantar untuk semakan" }).click();
      await expect(page.getByRole("status")).toContainText(
        "Maklumat dihantar untuk semakan",
      );
      await expect(
        page.getByRole("link", { name: "Lihat status di dashboard" }),
      ).toBeVisible();
      assert.equal(uploads, 2);
      assert.equal(submitted.promotionTitle, undefined);
      assert.deepEqual(submitted.spim, ["DA"]);
      assert.equal(submitted.logo, "/api/media/mock-1");
      assert.equal(submitted.promotionPoster, undefined);
    },
  );
  await test(
    "Contact message persists through the QA Worker",
    "Dedicated QA database",
    async (page) => {
      const response = page.waitForResponse((r) =>
        r.url().endsWith("/api/contact"),
      );
      await page.goto(origin + "/hubungi");
      await fields(page, {
        name: "Playwright QA",
        email: "mlh-contact-qa@example.com",
        message: "Synthetic QA verification for MyLesenHub.",
      });
      await page.locator("[name=subject]").selectOption("Pertanyaan umum");
      await page.locator("[name=consent]").check();
      await page.getByRole("button", { name: "Hantar mesej" }).click();
      const saved = await response;
      assert.equal(saved.status(), 201, await saved.text());
      await expect(page.getByRole("status")).toContainText("Mesej diterima");
    },
  );
  await test(
    "Real signup session and instructor submission",
    "Dedicated QA database and identity service",
    async (page) => {
      const response = page.waitForResponse((r) =>
        r.url().endsWith("/api/signup"),
      );
      await page.goto(origin + "/signup?type=instructor&return=%2Fsertai-kami");
      const email = "mlh-signup-" + Date.now() + "@example.com";
      await fields(page, {
        name: "Playwright QA Instructor",
        email,
        password: "QA-valid-password-2026!",
      });
      await page.getByRole("button", { name: "Daftar akaun" }).click();
      const signedUp = await response;
      if (!signedUp.ok()) throw new Error(await signedUp.text());
      await expect(page).toHaveURL(origin + "/sertai-kami");
      await expect(
        page.getByRole("link", { name: "Dashboard", exact: true }).first(),
      ).toBeVisible();
      await chooseLocation(page);
      await fields(page, {
        fullName: "Playwright QA Instructor",
        displayName: "Cikgu Playwright QA",
        email,
        phone: "0120000000",
        institute: "Institut Ujian",
        languages: "Melayu",
        experience: "5",
        bio: "Pengenalan untuk ujian fungsi.",
      });
      await chooseClass(page, "D");
      await page
        .locator("[name=photo]")
        .setInputFiles("public/media/daniel.webp");
      await page.locator("[name=consent]").check();
      const submitted = page.waitForResponse((r) =>
        r.url().endsWith("/api/register/instructor"),
      );
      await page.getByRole("button", { name: "Hantar untuk semakan" }).click();
      const saved = await submitted;
      if (!saved.ok()) throw new Error(await saved.text());
      await expect(
        page.getByRole("link", { name: "Lihat status di dashboard" }),
      ).toBeVisible();
    },
  );
  await test(
    "Shared login, password visibility, remember option, and recovery screens",
    "Worker UI with stubbed auth",
    async (page) => {
      let action;
      await client(page, "/api/login", async (request) => {
        action = request.postDataJSON();
        return { ok: true, redirect: "/dashboard" };
      });
      await page.goto(origin + "/login?return=%2Fdaftar-institut");
      await fields(page, {
        email: "test@example.invalid",
        password: "ujian1234",
      });
      await page.getByRole("button", { name: "Tunjukkan kata laluan" }).click();
      await expect(page.locator("[name=password]")).toHaveAttribute(
        "type",
        "text",
      );
      await page
        .getByRole("button", { name: "Sembunyikan kata laluan" })
        .click();
      await page.locator("[name=rememberMe]").check();
      await page.getByRole("button", { name: "Log masuk" }).click();
      await expect(page).toHaveURL(origin + "/daftar-institut");
      assert.equal(action.rememberMe, true);
      await client(page, "/api/forgot", async (request) => {
        action = request.postDataJSON();
        return { ok: true, message: "Semak peti masuk anda." };
      });
      await page.goto(origin + "/login");
      await page.getByRole("link", { name: "Lupa kata laluan?" }).click();
      await fields(page, { email: "test@example.invalid" });
      await page.getByRole("button", { name: "Hantar pautan" }).click();
      await expect(page.getByRole("status")).toContainText("Semak peti masuk");
      assert.equal(action.email, "test@example.invalid");
    },
  );
} finally {
  await browser.close();
}
fs.mkdirSync("../website-review/public", { recursive: true });
fs.writeFileSync(
  registrationOnly
    ? "../website-review/public/registration-results.json"
    : "../website-review/public/functional-results.json",
  JSON.stringify(results, null, 2),
);
console.log(JSON.stringify(results, null, 2));
if (results.some((item) => item.status === "fail")) process.exitCode = 1;
