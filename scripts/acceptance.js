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
const reg = await post("/api/register/institut", { name: "Institut QA " + stamp, address: "Jalan QA, Johor", latitude: "1.5", longitude: "103.7" }, inst.cookie);
await publish(reg.id);
const instituteId = "institut-" + inst.id;
const form = {
  requestId: randomUUID(),
  name: "Cikgu QA " + stamp,
  displayName: "Cikgu QA " + stamp,
  fullName: "Private QA",
  state: "Johor",
  district: "Johor Bahru",
  instituteId,
  spim: ["D", "DA"],
  experience: "5",
  other: "Bimbingan",
  languages: "Melayu",
  photo: image,
  email: instructor.email,
};
await assert.rejects(post("/api/register/institut", { name: "Tiada pin", address: "Jalan QA", latitude: "", longitude: "" }, inst.cookie), /400/);
await assert.rejects(post("/api/register/instructor", { ...form, requestId: randomUUID(), instituteId: "missing-institute" }, instructor.cookie), /400/);
await assert.rejects(post("/api/register/instructor", { ...form, requestId: randomUUID(), instituteId: "", institute: "Institut QA" }, instructor.cookie), /400/);
console.log("PASS missing pin and unlisted or free-text institute are rejected.");
const registerInstructor = () =>
  post("/api/register/instructor", form, instructor.cookie);
const [submission, repeated] = await Promise.all([
  registerInstructor(),
  registerInstructor(),
]);
assert.equal(submission.id, repeated.id);
const [counts] =
  await sql`SELECT count(*)::int AS total FROM mylesenhub.submissions WHERE user_id=${instructor.id} AND kind='instructor'`;
assert.equal(counts.total, 1);
console.log(
  "PASS two concurrent registration attempts returned the same ID and created one application.",
);
const lookup = async () =>
  await (await fetch(origin + "/cari-instructor")).text();
assert(!(await lookup()).includes(form.name));
// Exercise an existing legacy application that stored only the institute name.
await sql`UPDATE mylesenhub.submissions SET payload=(payload-'instituteId') || jsonb_build_object('institute',${"Institut QA " + stamp}::text) WHERE id=${submission.id}`;
await publish(submission.id);
const [legacyResolved] = await sql`SELECT payload FROM mylesenhub.listings WHERE id=${"instructor-" + instructor.id}`;
assert.equal(legacyResolved.payload.instituteId, instituteId);
console.log("PASS a uniquely matched legacy institute name resolves to a stable listing ID at publication.");
const replay = await registerInstructor();
assert.equal(replay.id, submission.id);
const [persisted] =
  await sql`SELECT status FROM mylesenhub.submissions WHERE id=${submission.id}`;
assert.equal(persisted.status, "diterbitkan");
console.log(
  "PASS retrying a published registration preserved its review status.",
);
assert((await lookup()).includes(form.name));
assert.equal((await fetch(origin + image)).status, 200);
console.log(
  "PASS private image upload, registration, two-step approval, public directory and published image.",
);
for (const route of ["promosi", "promosi-borang"]) {
  const response = await fetch(origin + "/dashboard/institut/" + route, {
    headers: { cookie: inst.cookie },
  });
  assert.equal(response.status, 404);
}
await assert.rejects(
  post(
    "/api/submissions",
    { kind: "program", status: "draft", payload: { title: "Test" } },
    inst.cookie,
  ),
  /403/,
);
await assert.rejects(
  post(
    "/api/register/institut",
    { name: "QA", state: "Melaka", district: "Jasin", promotionTitle: "Test" },
    inst.cookie,
  ),
  /403/,
);
const [programCount] =
  await sql`SELECT count(*)::int AS count FROM mylesenhub.submissions WHERE user_id=${inst.id} AND kind='program'`;
assert.equal(programCount.count, 0);
console.log(
  "PASS disabled promotion pages return 404, both write paths reject submissions, no program row created.",
);
const [legacyDraft] =
  await sql`INSERT INTO mylesenhub.submissions(user_id,kind,status,payload) VALUES(${inst.id},'institut','draft',${JSON.stringify({ name: "Institut QA", promotionTitle: "Archived acceptance title" })}::jsonb) RETURNING id`;
await post(
  "/api/submissions",
  {
    id: legacyDraft.id,
    kind: "institut",
    status: "draft",
    payload: { name: "Profil dikemas kini" },
  },
  inst.cookie,
);
const [savedDraft] =
  await sql`SELECT payload FROM mylesenhub.submissions WHERE id=${legacyDraft.id}`;
assert.equal(savedDraft.payload.name, "Profil dikemas kini");
assert.equal(savedDraft.payload.promotionTitle, "Archived acceptance title");
const [historical] =
  await sql`INSERT INTO mylesenhub.submissions(user_id,kind,status,payload) VALUES(${inst.id},'program','semakan',${JSON.stringify({ title: "Historical " + stamp })}::jsonb) RETURNING id`;
await assert.rejects(
  post("/api/review", { id: historical.id, action: "verify" }, admin.cookie),
  /404/,
);
const adminView = await (
  await fetch(origin + "/dashboard/admin/permohonan?q=" + stamp, {
    headers: { cookie: admin.cookie },
  })
).text();
assert(!adminView.includes("Historical " + stamp));
console.log(
  "PASS previous promotion data survives a profile edit, and archived programs stay out of admin review.",
);
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
  "PASS institute registration, approval and contact form persistence.",
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
