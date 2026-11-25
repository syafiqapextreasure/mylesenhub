import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { expect } from "@playwright/test";
import { renderPublic, publicPageStyles } from "../src/public.js";

const origin = "https://registration.test";
const mode = "Local registration fixture";
const email = "registration@example.invalid";
const userId = "096f3c38-c15a-412a-9a38-dd530bb2ef43";
const successLink = (page) =>
  page.getByRole("link", { name: "Lihat status di dashboard" });
const submitProfile = (page) =>
  page.getByRole("button", { name: "Hantar untuk semakan" }).click();
const media = (name) => "public/media/" + name + ".webp";
const uuid =
  /^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i;

const journeys = {
  instructor: {
    path: "/sertai-kami",
    fields: {
      fullName: "Ujian Instructor",
      displayName: "Cikgu Ujian",
      institute: "Institut Ujian",
      languages: "Melayu",
      experience: "5",
      other: "Bimbingan berperingkat",
    },
    files: { photo: "daniel", gallery: ["profile-car", "amir"] },
  },
  institut: {
    path: "/daftar-institut",
    fields: {
      name: "Institut Ujian",
      address: "Jalan Ujian",
      postcode: "81200",
      representative: "Wakil Ujian",
      position: "Wakil",

    },
    files: {
      logo: "brand",
      gallery: ["profile-car", "amir"],

    },
  },
};

// Serve the current form renderer and browser JS. All authentication, media
// and application writes terminate inside this browser context.
async function fixture(
  page,
  role,
  { failFirst = false, requireVerification = false } = {},
) {
  const state = {
    signedIn: false,
    auth: [],
    uploads: new Map(),
    submissions: [],
    unexpected: [],
  };
  const path = journeys[role].path;
  await page.context().route("**/*", async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    if (url.origin !== origin) {
      state.unexpected.push(req.method() + " " + url.origin);
      return route.abort();
    }
    const at = url.pathname;
    if (req.method() === "GET" && [path, "/signup", "/login"].includes(at)) {
      const user = state.signedIn ? { id: userId, role } : null;
      return route.fulfill({
        contentType: "text/html",
        body:
          '<!doctype html><html lang="ms"><meta charset="utf-8"><link rel="stylesheet" href="/base.css"><link rel="stylesheet" href="/public.css">' +
          publicPageStyles(at) +
          '<script src="/public.js" defer></script>' +
          renderPublic(at, url, { user }) +
          "</html>",
      });
    }
    if (
      req.method() === "GET" &&
      /^\/(?:public\.js|[a-z-]+\.css|(?:font|media)\/[a-zA-Z\d._-]+)$/.test(at)
    ) {
      return route.fulfill({ path: "public" + at });
    }
    if (req.method() === "POST" && ["/api/signup", "/api/login"].includes(at)) {
      state.auth.push(req.postDataJSON());
      if (at === "/api/signup" && requireVerification)
        return route.fulfill({
          json: {
            ok: true,
            message: "Semak e-mel anda untuk mengesahkan akaun.",
          },
        });
      state.signedIn = true;
      return route.fulfill({
        json: { ok: true, redirect: "/dashboard", userId },
      });
    }
    if (req.method() === "POST" && state.signedIn && at === "/api/media") {
      const url = "/api/media/fixture-" + (state.uploads.size + 1);
      state.uploads.set(url, req.postDataBuffer());
      return route.fulfill({ json: { ok: true, url } });
    }
    if (
      req.method() === "POST" &&
      state.signedIn &&
      at === "/api/register/" + role
    ) {
      state.submissions.push(req.postDataJSON());
      if (failFirst && state.submissions.length === 1) {
        return route.fulfill({
          status: 503,
          json: {
            ok: false,
            message: "Perkhidmatan tergendala. Sila cuba lagi.",
          },
        });
      }
      return route.fulfill({
        status: 201,
        json: { ok: true, message: "Maklumat dihantar untuk semakan." },
      });
    }
    if (at !== "/favicon.ico") state.unexpected.push(req.method() + " " + at);
    return route.fulfill({ status: 404, body: "" });
  });
  await page.goto(origin + path);
  return state;
}

export async function registrationCases({
  test,
  fields,
  chooseLocation,
  chooseClass,
}) {
  async function completeForm(page, role) {
    const journey = journeys[role];
    await chooseLocation(page);
    if (role === "institut")
      await expect(page.locator('[name^="promotion"]')).toHaveCount(0);
    await fields(page, {
      email,
      phone: "0120000000",
      bio: "Pengenalan untuk ujian fungsi.",
      ...journey.fields,
    });
    await chooseClass(page, "D");
    await chooseClass(page, "DA");
    for (const [name, images] of Object.entries(journey.files)) {
      const files = [images].flat().map(media);
      await page.locator('[name="' + name + '"]').setInputFiles(files);
    }
    await page.locator("[name=consent]").check();
  }

  async function signUp(page, role, requireVerification = false) {
    await expect(page).toHaveURL(/\/signup\?/);
    await expect(page.locator("[name=accountType]")).toHaveValue(role);
    await fields(page, {
      name: "Pemohon Ujian",
      email,
      password: "QA-only-1234!",
    });
    await page
      .getByRole("button", { name: "Daftar akaun", exact: true })
      .click();
    if (requireVerification)
      await expect(page.getByRole("status")).toContainText("Semak e-mel");
    else await expect(page).toHaveURL(origin + journeys[role].path);
  }

  function checkPost(state, role) {
    const payload = state.submissions.at(-1);
    assert.match(payload.requestId, uuid);
    for (const [name, value] of Object.entries(journeys[role].fields))
      assert.deepEqual(
        payload[name],
        name === "experience" ? Number(value) : value,
        name,
      );
    assert.equal(payload.email, email);
    assert.equal(payload.district, "Johor Bahru");
    assert.equal(payload.state, "Johor");
    assert.deepEqual(payload.spim, ["D", "DA"]);
    assert.equal(payload.consent, true);
    for (const [name, assets] of Object.entries(journeys[role].files)) {
      const urls = [payload[name]].flat();
      assert.equal(urls.length, [assets].flat().length, name);
      for (const [index, asset] of [assets].flat().entries()) {
        const bytes = state.uploads.get(urls[index]);
        assert.ok(
          bytes?.equals(readFileSync(media(asset))),
          name + " must match source file " + asset,
        );
      }
    }
    assert.deepEqual(state.unexpected, []);
  }

  for (const [role, journey] of Object.entries(journeys)) {
    await test(
      "Guest " + role + ": signup submits the complete application once",
      mode,
      async (page) => {
        const state = await fixture(page, role);
        await completeForm(page, role);
        await submitProfile(page);
        await signUp(page, role);
        await expect(successLink(page)).toBeVisible();
        assert.equal(state.auth[0].return, journey.path);
        assert.equal(state.auth[0].accountType, role);
        const count = Object.values(journey.files).flat().length;
        assert.equal(state.uploads.size, count);
        assert.equal(state.submissions.length, 1);
        checkPost(state, role);
        await page.reload({ waitUntil: "networkidle" });
        assert.equal(
          state.submissions.length,
          1,
          "Refresh must not submit again",
        );
        assert.equal(
          state.uploads.size,
          count,
          "Refresh must not upload again",
        );
        await expect(page.locator("[data-preview] img")).toHaveCount(0);
      },
    );
  }

  await test(
    "Verification email opened in a new tab resumes the guest application once",
    mode,
    async (page) => {
      const role = "instructor";
      const { path } = journeys[role];
      const state = await fixture(page, role, { requireVerification: true });
      await completeForm(page, role);
      await submitProfile(page);
      await signUp(page, role, true);
      const { registrationId } = state.auth[0];
      assert.match(registrationId, uuid);
      assert.equal(state.signedIn, false);
      assert.equal(state.uploads.size, 0);
      assert.equal(state.submissions.length, 0);

      const callback = new URL("/login", origin);
      callback.searchParams.set("return", path);
      callback.searchParams.set("application", registrationId);
      const verificationTab = await page.context().newPage();
      const errors = [];
      verificationTab.on("pageerror", (error) => errors.push(error.message));
      try {
        await verificationTab.goto(callback.href);
        await fields(verificationTab, { email, password: "QA-only-1234!" });
        await verificationTab
          .getByRole("button", { name: "Log masuk", exact: true })
          .click();
        await expect(verificationTab).toHaveURL(origin + path);
        await expect(successLink(verificationTab)).toBeVisible();
        await verificationTab.reload({ waitUntil: "networkidle" });
        await page.goto(origin + path, { waitUntil: "networkidle" });
        assert.equal(state.submissions.length, 1);
        assert.equal(state.submissions[0].requestId, registrationId);
        assert.equal(state.uploads.size, 3);
        checkPost(state, role);
        assert.deepEqual(errors, []);
      } finally {
        await verificationTab.close();
      }
    },
  );

  await test(
    "A saved draft survives signup without submitting",
    mode,
    async (page) => {
      const role = "instructor";
      const state = await fixture(page, role);
      await completeForm(page, role);
      await page.getByRole("button", { name: "Simpan draf" }).click();
      await expect(page.getByRole("status")).toContainText("Draf disimpan");
      await page.goto(origin + "/signup?return=%2Fsertai-kami&type=instructor");
      await signUp(page, role);
      await expect(page.locator("[data-preview] img")).toHaveCount(3);
      await expect(page.locator("[name=displayName]")).toHaveValue(
        "Cikgu Ujian",
      );
      await expect(page.locator("[data-class-summary] > span")).toHaveText([
        "D",
        "DA",
      ]);
      await page.waitForLoadState("networkidle");
      assert.equal(state.uploads.size, 0);
      assert.deepEqual(state.submissions, []);
      assert.deepEqual(state.unexpected, []);
    },
  );

  await test(
    "Failed automatic submission keeps the draft and its ID for manual retry",
    mode,
    async (page) => {
      const role = "instructor";
      const state = await fixture(page, role, { failFirst: true });
      await completeForm(page, role);
      await submitProfile(page);
      await signUp(page, role);
      await expect(page.getByRole("status")).toContainText("Sila cuba lagi");
      assert.equal(state.submissions.length, 1);
      checkPost(state, role);
      const firstId = state.submissions[0].requestId;
      await page.reload({ waitUntil: "networkidle" });
      await expect(page.locator("[data-preview] img")).toHaveCount(3);
      await expect(page.locator("[name=displayName]")).toHaveValue(
        "Cikgu Ujian",
      );
      assert.equal(
        state.submissions.length,
        1,
        "Failure must leave a manual retry",
      );
      await submitProfile(page);
      await expect(successLink(page)).toBeVisible();
      assert.equal(state.submissions.length, 2);
      assert.equal(
        state.submissions[1].requestId,
        firstId,
        "A retry is the same application",
      );
      checkPost(state, role);
    },
  );
}
