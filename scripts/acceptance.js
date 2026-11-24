import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { readFile } from "node:fs/promises";
const origin = process.env.TEST_ORIGIN || "http://localhost:8788";
if (
  !process.env.NEON_BRANCH?.includes("acceptance") ||
  !["localhost", "127.0.0.1"].includes(new URL(origin).hostname)
)
  throw Error("Use the dedicated acceptance branch and a local Worker.");
const sql = neon(process.env.DATABASE_URL);
const stamp = randomUUID().slice(0, 10);
const seen = [];
async function post(path, b, cookie = "") {
  const r = await fetch(origin + path, {
    method: "POST",
    headers: {
      Origin: origin,
      "Content-Type": "application/json",
      Cookie: cookie,
    },
    body: JSON.stringify(b),
  });
  const j = await r.json();
  if (!r.ok) throw Error(path + " " + r.status + " " + j.message);
  return { ...j, cookie: r.headers.get("set-cookie")?.split(";")[0] || cookie };
}
async function account(role) {
  const email = "qa-" + role + "-" + stamp + "@example.com",
    password = randomUUID() + "aB!";
  const s = await post("/api/signup", {
    name: "Test " + role,
    email,
    password,
    accountType: role === "institut" ? "institut" : "instructor",
  });
  if (s.cookie) await post("/api/logout", {}, s.cookie);
  const r = await post("/api/login", { email, password });
  assert(r.cookie);
  const [u] =
    await sql`SELECT id FROM mylesenhub.accounts WHERE email=${email}`;
  assert(u, "Worker and the test runner must use the same temporary branch");
  seen.push(email);
  if (role === "admin")
    await sql`UPDATE mylesenhub.accounts SET role='admin' WHERE id=${u.id}`;
  const page = await fetch(origin + "/dashboard", {
    headers: { cookie: r.cookie },
  });
  assert(page.url.includes("/dashboard/" + role));
  assert.equal(page.status, 200);
  return { cookie: r.cookie, email, id: u.id };
}
const instructor = await account("instructor"),
  inst = await account("institut"),
  admin = await account("admin");
console.log(
  "PASS signup, logout, email/password login and session restoration for all three dashboard roles.",
);
const file = await readFile("public/media/daniel.webp");
const upload = await fetch(origin + "/api/media", {
  method: "POST",
  headers: { origin, "content-type": "image/webp", cookie: instructor.cookie },
  body: file,
});
assert.equal(upload.status, 201);
const image = (await upload.json()).url;
assert.equal((await fetch(origin + image)).status, 404);
async function publish(id) {
  await post("/api/review", { id, action: "verify" }, admin.cookie);
  await post("/api/review", { id, action: "publish" }, admin.cookie);
}
const form = {
  name: "Cikgu QA " + stamp,
  displayName: "Cikgu QA " + stamp,
  fullName: "Private QA",
  state: "Johor",
  district: "Johor Bahru",
  institute: "Institut QA",
  spim: ["D", "DA"],
  experience: "5",
  other: "Bimbingan",
  languages: "Melayu",
  photo: image,
  email: instructor.email,
};
const submission = await post(
  "/api/register/instructor",
  form,
  instructor.cookie,
);
const lookup = async () =>
  await (await fetch(origin + "/cari-instructor")).text();
assert(!(await lookup()).includes(form.name));
await publish(submission.id);
assert((await lookup()).includes(form.name));
assert.equal((await fetch(origin + image)).status, 200);
console.log(
  "PASS private image upload, registration, two-step approval, public directory and published image.",
);
const reg = await post(
  "/api/register/institut",
  {
    name: "Institut QA " + stamp,
    state: "Melaka",
    district: "Jasin",
    classes: ["D"],
  },
  inst.cookie,
);
await publish(reg.id);
const promo = await post(
  "/api/submissions",
  {
    kind: "program",
    status: "semakan",
    payload: {
      title: "Program QA " + stamp,
      type: "Program",
      description: "Semakan paparan program.",
    },
  },
  inst.cookie,
);
await publish(promo.id);
const [listing] =
  await sql`SELECT payload FROM mylesenhub.listings WHERE id=${promo.id}`;
assert.equal(listing.payload.title, "Program QA " + stamp);
await post("/api/contact", {
  name: "QA",
  email: instructor.email,
  subject: "Ujian penerimaan",
  message: "Ujian borang pada branch penerimaan.",
});
const msgs =
  await sql`SELECT id FROM mylesenhub.messages WHERE email=${instructor.email}`;
assert(msgs.length);
console.log(
  "PASS institute registration, program approval and contact form persistence.",
);
await post(
  "/api/directory",
  { id: "instructor-" + instructor.id, action: "unpublish" },
  admin.cookie,
);
assert(!(await lookup()).includes(form.name));
assert.equal((await fetch(origin + image)).status, 404);
await post("/api/logout", {}, instructor.cookie);
const guest = await fetch(origin + "/dashboard", {
  headers: { cookie: instructor.cookie },
  redirect: "manual",
});
assert.equal(guest.status, 302);
assert(guest.headers.get("location").includes("/login"));
console.log(
  "PASS directory withdrawal and logout protecting dashboard. Test data isolated to acceptance branch.",
);
