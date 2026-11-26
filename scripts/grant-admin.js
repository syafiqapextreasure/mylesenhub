import { neon } from "@neondatabase/serverless";
const email = (process.argv[2] || "").trim().toLowerCase();
if (!/^\S+@\S+\.\S+$/.test(email))
  throw Error("Provide the exact email of the verified owner account.");
const sql = neon(process.env.DATABASE_URL);
const afterVerification = process.argv[3] === "--after-verification";
const [owner] = await sql`UPDATE mylesenhub.accounts a
    SET role=CASE WHEN u."emailVerified" IS TRUE THEN 'admin' ELSE a.role END,
        pending_admin_email=CASE WHEN u."emailVerified" IS TRUE THEN NULL ELSE lower(a.email) END
    FROM neon_auth."user" u
    WHERE u.id::text=a.id AND lower(a.email)=${email} AND lower(u.email)=${email}
      AND (u."emailVerified" IS TRUE OR ${afterVerification})
    RETURNING a.role, a.pending_admin_email`;
if (!owner)
  throw Error(
    "No matching verified account. Verify the email and sign in first.",
  );
console.log(
  owner.pending_admin_email
    ? "Admin activation reserved. The account must verify its email and sign in."
    : "Admin access assigned to the verified account.",
);
