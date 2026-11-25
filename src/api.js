import { promotionsEnabled } from "./features.js";
import { neon } from "@neondatabase/serverless";
import { check, input, bytes, clean, json, uuid } from "./security.js";
import { authAction, getUser } from "./auth.js";
import { submit, review, setAccess } from "./store.js";
import { instructorAffiliation, decideAffiliation } from "./affiliations.js";
const mimeTypes = ["image/png", "image/jpeg", "image/webp"];
function actualMime(a) {
  if (a.length < 12) return "";
  if (a[0] === 255 && a[1] === 216 && a[2] === 255) return "image/jpeg";
  if (
    a[0] === 137 &&
    a[1] === 80 &&
    a[2] === 78 &&
    a[3] === 71 &&
    a[4] === 13 &&
    a[5] === 10 &&
    a[6] === 26 &&
    a[7] === 10
  )
    return "image/png";
  const text = new TextDecoder().decode(a.subarray(0, 12));
  return text.startsWith("RIFF") && text.endsWith("WEBP") ? "image/webp" : "";
}
async function upload(req, sql, user) {
  const mime = req.headers.get("content-type")?.split(";")[0];
  check(mimeTypes.includes(mime), 415, "Gunakan fail JPG, PNG atau WebP.");
  const a = await bytes(req, 2 * 1024 * 1024);
  check(actualMime(a) === mime, 415, "Format imej tidak sepadan.");
  let binary = "";
  for (let i = 0; i < a.length; i += 8192)
    binary += String.fromCharCode(...a.subarray(i, i + 8192));
  const [r] =
    await sql`INSERT INTO mylesenhub.media(user_id,mime,bytes) SELECT ${user.id},${mime},decode(${btoa(binary)},'base64') WHERE (SELECT count(*) FROM mylesenhub.media WHERE user_id=${user.id})<100 RETURNING id`;
  check(r, 429, "Had gambar akaun telah dicapai. Hubungi admin untuk bantuan.");
  return json({ ok: true, url: "/api/media/" + r.id }, 201);
}
async function media(req, env, sql, path) {
  const id = path.split("/").pop();
  check(uuid(id), 404, "Gambar tidak ditemui.");
  const user = await getUser(req, env, sql);
  const [r] =
    await sql`SELECT mime,encode(bytes,'base64') AS encoded FROM mylesenhub.media m WHERE id=${id} AND (user_id=${user?.id || ""} OR ${user?.role === "admin"} OR EXISTS(SELECT 1 FROM mylesenhub.listings l WHERE l.user_id=m.user_id AND coalesce(l.payload->>'_hidden','false')<>'true' AND (${promotionsEnabled} OR l.kind<>'program') AND ((l.payload->>'photo')=${path} OR (${promotionsEnabled} AND ((l.payload->>'promotionPoster')=${path} OR (l.payload->>'poster')=${path})) OR (l.payload->'gallery') ? ${path})))`;
  check(r, 404, "Gambar tidak ditemui.");
  return new Response(
    Uint8Array.from(atob(r.encoded), (c) => c.charCodeAt(0)),
    {
      headers: {
        "content-type": r.mime,
        "cache-control": "private, no-store",
        "x-content-type-options": "nosniff",
      },
    },
  );
}
export async function api(req, env, path) {
  check(env.DATABASE_URL, 503, "Pangkalan data belum tersedia.");
  const sql = neon(env.DATABASE_URL);
  if (req.method === "GET" && path.startsWith("/api/media/"))
    return media(req, env, sql, path);
  check(req.method === "POST", 405, "Kaedah tidak disokong.");
  check(
    req.headers.get("origin") === new URL(req.url).origin,
    403,
    "Asal permintaan tidak sah.",
  );
  if (path === "/api/media") {
    const user = await getUser(req, env, sql);
    check(user, 401, "Sila log masuk.");
    return upload(req, sql, user);
  }
  const b = await input(req);
  if (
    [
      "/api/login",
      "/api/signup",
      "/api/forgot",
      "/api/reset",
      "/api/logout",
    ].includes(path)
  )
    return authAction(req, env, sql, path, b);
  if (path === "/api/contact") {
    const name = clean(b.name),
      email = clean(b.email, 254),
      subject = clean(b.subject),
      message = clean(b.message, 5000);
    check(
      name && /^\S+@\S+\.\S+$/.test(email) && message,
      400,
      "Lengkapkan nama, e-mel dan mesej.",
    );
    const r =
      await sql`INSERT INTO mylesenhub.messages(name,email,subject,message) SELECT ${name},${email},${subject},${message} WHERE (SELECT count(*) FROM mylesenhub.messages WHERE email=${email} AND created_at>now()-interval '10 minutes')<5 RETURNING id`;
    check(r.length, 429, "Sila cuba semula sebentar lagi.");
    return json({ ok: true, message: "Mesej diterima untuk semakan." }, 201);
  }
  const user = await getUser(req, env, sql);
  check(user, 401, "Sila log masuk.");
  let result;
  if (path === "/api/submissions") result = await submit(sql, user, b);
  else if (
    ["/api/register/instructor", "/api/register/institut"].includes(path)
  )
    result = await submit(
      sql,
      user,
      {
        kind: path.split("/").pop(),
        payload: b,
        status: "semakan",
      },
      b.requestId,
    );
  else if (path === "/api/directory") {
    check(
      user.role === "admin" && ["unpublish", "publish"].includes(b.action),
      403,
      "Akses admin diperlukan.",
    );
    const changed =
      await sql`WITH changed AS (UPDATE mylesenhub.listings SET payload=jsonb_set(payload, '{_hidden}', to_jsonb(${b.action === "unpublish"}::boolean)),updated_at=now() WHERE id=${clean(b.id)} AND (${promotionsEnabled} OR kind<>'program') RETURNING id) INSERT INTO mylesenhub.admin_audit(actor_id,action,target_id) SELECT ${user.id},${"directory_" + b.action},id FROM changed RETURNING target_id`;
    check(changed.length, 404, "Rekod tidak ditemui.");
    result = {
      message:
        b.action === "unpublish"
          ? "Paparan awam disembunyikan."
          : "Paparan awam diterbitkan semula.",
    };
  } else if (path === "/api/review-note") {
    check(user.role === "admin", 403, "Akses admin diperlukan.");
    check(uuid(b.id), 400, "Permohonan tidak sah.");
    const changed =
      await sql`WITH changed AS (UPDATE mylesenhub.submissions SET internal_note=${clean(b.note, 3000)},updated_at=now() WHERE id=${b.id} AND (${promotionsEnabled} OR kind<>'program') RETURNING id) INSERT INTO mylesenhub.admin_audit(actor_id,action,target_id) SELECT ${user.id},'review_note',id::text FROM changed RETURNING target_id`;
    check(changed.length, 404, "Permohonan tidak ditemui.");
    result = { message: "Nota dalaman disimpan." };
  } else if (path === "/api/representative") {
    check(
      user.role === "admin" && ["verify", "revoke"].includes(b.action),
      403,
      "Akses admin diperlukan.",
    );
    if (b.action === "verify")
      check(
        b.identityChecked === true && b.authorityChecked === true,
        400,
        "Sahkan semakan identiti dan kebenaran wakil.",
      );
    const changed =
      await sql`WITH changed AS (UPDATE mylesenhub.accounts SET representative_verified=${b.action === "verify"} WHERE id=${clean(b.userId)} AND role='institut' RETURNING id) INSERT INTO mylesenhub.admin_audit(actor_id,action,target_id) SELECT ${user.id},${"representative_" + b.action},id FROM changed RETURNING target_id`;
    check(changed.length, 404, "Wakil institut tidak ditemui.");
    result = {
      message:
        b.action === "verify"
          ? "Wakil disahkan."
          : "Pengesahan wakil ditarik balik.",
    };
  } else if (path === "/api/review") result = await review(sql, user, b);
  else if (path === "/api/access") result = await setAccess(sql, user, b);
  else if (path === "/api/affiliation/request")
    result = await instructorAffiliation(sql, user, b);
  else if (path === "/api/affiliation/decision")
    result = await decideAffiliation(sql, user, b);
  else check(false, 404, "Halaman tidak ditemui.");
  return json({ ok: true, ...result });
}
