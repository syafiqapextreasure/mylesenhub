import { neon } from "@neondatabase/serverless";
const email = (process.argv[2] || "").trim().toLowerCase();
if (!/^\S+@\S+\.\S+$/.test(email))
  throw Error("Provide the exact email of the verified owner account.");
const sql = neon(process.env.DATABASE_URL);
const [owner] =
  await sql`UPDATE mylesenhub.accounts a SET role='admin' FROM neon_auth."user" u WHERE u.id::text=a.id AND lower(a.email)=${email} AND lower(u.email)=${email} AND u."emailVerified" IS TRUE RETURNING a.id`;
if (!owner)
  throw Error(
    "No matching verified account. Verify the email and sign in first.",
  );
console.log("Admin access assigned to the verified account.");
