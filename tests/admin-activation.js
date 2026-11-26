import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createServer } from "node:http";
import { once } from "node:events";
import { neon } from "@neondatabase/serverless";
import { getUser } from "../src/auth.js";

if (!process.env.NEON_BRANCH?.includes("acceptance"))
  throw Error("Use a dedicated Neon acceptance branch.");

const sql = neon(process.env.DATABASE_URL);
const id = randomUUID();
const email = id + "@example.invalid";
const identity = {
  id,
  name: "Verified owner fixture",
  email,
  emailVerified: false,
};
const provider = createServer((_request, response) => {
  response.writeHead(200, { "content-type": "application/json" });
  response.end(JSON.stringify({ user: identity }));
});
provider.listen(0, "127.0.0.1");
await once(provider, "listening");
const env = {
  NEON_AUTH_BASE_URL: "http://127.0.0.1:" + provider.address().port,
};
const session = new Request("http://localhost/dashboard", {
  headers: { cookie: "mlh_session=neon-auth.session_token~test" },
});

try {
  await sql`INSERT INTO mylesenhub.accounts (id,name,email,pending_admin_email)
    VALUES (${id}, ${identity.name}, ${email}, ${email})`;
  assert.equal((await getUser(session, env, sql)).role, "instructor");
  identity.emailVerified = true;
  assert.equal((await getUser(session, env, sql)).role, "admin");
  const [account] =
    await sql`SELECT pending_admin_email FROM mylesenhub.accounts WHERE id=${id}`;
  assert.equal(account.pending_admin_email, null);
  await sql`UPDATE mylesenhub.accounts SET role='instructor' WHERE id=${id}`;
  assert.equal((await getUser(session, env, sql)).role, "instructor");
  await sql`UPDATE mylesenhub.accounts SET pending_admin_email=${email} WHERE id=${id}`;
  identity.email = "changed-" + email;
  assert.equal((await getUser(session, env, sql)).role, "instructor");
  console.log(
    "PASS admin activation requires the verified reserved email, is consumed once, and cancels on address change.",
  );
} finally {
  provider.close();
  await sql`DELETE FROM mylesenhub.accounts WHERE id=${id}`;
}
