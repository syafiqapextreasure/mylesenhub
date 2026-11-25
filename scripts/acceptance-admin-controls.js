import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";
const origin = "http://localhost:8788";
if (!process.env.NEON_BRANCH?.includes("acceptance"))
  throw Error("Acceptance branch required");
const sql = neon(process.env.DATABASE_URL),
  stamp = randomUUID().slice(0, 10);
async function post(path, body, cookie = "", expected = 200) {
  let r = await fetch(origin + path, {
    method: "POST",
    headers: {
      Origin: origin,
      "Content-Type": "application/json",
      Cookie: cookie,
    },
    body: JSON.stringify(body),
  });
  let j = await r.json();
  assert.equal(r.status, expected, `${path}: ${j.message}`);
  return { ...j, cookie: r.headers.get("set-cookie")?.split(";")[0] || cookie };
}
async function account(role) {
  let email = `test-admin-${role}-${stamp}@example.test`,
    password = randomUUID() + "aB!";
  let r = await post("/api/signup", {
    name: "QA " + role,
    email,
    password,
    accountType: role === "institut" ? "institut" : "instructor",
  });
  let login = await post("/api/login", { email, password });
  let [u] = await sql`SELECT id FROM mylesenhub.accounts WHERE email=${email}`;
  if (role === "admin")
    await sql`UPDATE mylesenhub.accounts SET role='admin' WHERE id=${u.id}`;
  return { id: u.id, email, cookie: login.cookie };
}
let admin = await account("admin"),
  instructor = await account("instructor"),
  institute = await account("institut");
let body = {
  name: "Instructor QA " + stamp,
  displayName: "Instructor QA " + stamp,
  fullName: "QA",
  email: instructor.email,
  phone: "0123456789",
  state: "Johor",
  district: "Johor Bahru",
  institute: "Institut QA",
  languages: "Melayu",
  spim: ["D"],
  experience: "4",
  bio: "Maklumat contoh",
  consent: true,
  requestId: randomUUID(),
};
let s = await post("/api/register/instructor", body, instructor.cookie);
await post(
  "/api/review-note",
  { id: s.id, note: "Nota dalaman QA" },
  admin.cookie,
);
let v = await post("/api/review", { id: s.id, action: "verify" }, admin.cookie);
assert.equal(v.status, "pengesahan");
let pub = await post(
  "/api/review",
  { id: s.id, action: "publish" },
  admin.cookie,
);
assert.equal(pub.status, "diterbitkan");
let page = await (await fetch(origin + "/cari-instructor")).text();
assert(page.includes(body.name));
let own = await (
  await fetch(origin + "/dashboard/instructor/status-semakan", {
    headers: { Cookie: instructor.cookie },
  })
).text();
assert(!own.includes("Nota dalaman QA"));
let listing = "instructor-" + instructor.id;
await post(
  "/api/directory",
  { id: listing, action: "unpublish" },
  admin.cookie,
);
assert(
  !(await (await fetch(origin + "/cari-instructor")).text()).includes(
    body.name,
  ),
);
await post("/api/directory", { id: listing, action: "publish" }, admin.cookie);
assert(
  (await (await fetch(origin + "/cari-instructor")).text()).includes(body.name),
);
await post(
  "/api/representative",
  { userId: institute.id, action: "verify" },
  admin.cookie,
  400,
);
await post(
  "/api/representative",
  {
    userId: institute.id,
    action: "verify",
    identityChecked: true,
    authorityChecked: true,
  },
  admin.cookie,
);
let [rep] =
  await sql`SELECT representative_verified FROM mylesenhub.accounts WHERE id=${institute.id}`;
assert.equal(rep.representative_verified, true);
let [count] =
  await sql`SELECT count(*)::int AS n FROM mylesenhub.submissions WHERE user_id=${institute.id} AND status='diterbitkan'`;
assert.equal(count.n, 0);
await post(
  "/api/representative",
  { userId: institute.id, action: "revoke" },
  instructor.cookie,
  403,
);
let audit =
  await sql`SELECT action FROM mylesenhub.admin_audit WHERE actor_id=${admin.id}`;
assert.deepEqual(
  new Set(audit.map((x) => x.action)),
  new Set([
    "review_note",
    "review_verify",
    "review_publish",
    "directory_unpublish",
    "directory_publish",
    "representative_verify",
  ]),
);
console.log(
  "PASS internal note privacy, verify→publish, hide→relist, representative authorization/independence, audit",
);
