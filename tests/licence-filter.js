import assert from "node:assert/strict";
import { test } from "node:test";
import { renderPublic } from "../src/public.js";

const path = "/cari-instructor";
const instructor = (name, profile) => ({
  name,
  slug: name.toLowerCase(),
  state: "Johor",
  district: "Kulai",
  institute: "Institut Kulai",
  ...profile,
});
const instructors = [
  instructor("Azlan", { spim: ["B", "D"] }),
  instructor("Belinda", { spim: ["B2"] }),
  instructor("Chong", { classes: "da, QTI", district: "Muar" }),
  instructor("Devi", { spim: ["QTI"], state: "Melaka", district: "Jasin", institute: "Institut Jasin" }),
  instructor("Ema", {}),
];
const directory = (query, rows = instructors) =>
  renderPublic(path, new URL(path + "?" + query, "https://example.test"), { instructors: rows });
const names = (html) => [...html.matchAll(/<h3>([^<]+)<\/h3><p>/g)].map((match) => match[1]);

test("all five licence codes match whole teaching classes on published profiles", () => {
  for (const [code, expected] of Object.entries({
    B: ["Azlan"], B2: ["Belinda"], D: ["Azlan"], DA: ["Chong"], QTI: ["Chong", "Devi"],
  })) {
    assert.deepEqual(names(directory("kelas=" + code)), expected);
  }
  assert.deepEqual(names(directory("")), instructors.map((item) => item.name));
});

test("licence class combines with location, institute and name, including empty results", () => {
  const filters = "kelas=QTI&state=Melaka&district=Jasin&institute=Institut+Jasin&name=dev";
  assert.deepEqual(names(directory(filters)), ["Devi"]);
  assert.match(directory(filters.replace("kelas=QTI", "kelas=B")), /Tiada profil untuk carian ini/);
});

test("class-filtered pagination counts matching profiles and carries the selection forward", () => {
  const rows = Array.from({ length: 7 }, (_, i) => instructor("Guru" + (i + 1), { spim: ["DA"] }));
  rows.unshift(instructor("Lain", { spim: ["D"] }));
  const first = directory("kelas=DA", rows);
  assert.equal(names(first).length, 6);
  assert.match(first, /<b>7 profil<\/b>/);
  assert.match(first, /href="\/cari-instructor\?kelas=DA&amp;page=2"/);
  assert.deepEqual(names(directory("kelas=DA&page=2", rows)), ["Guru7"]);
});
