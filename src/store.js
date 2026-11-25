import { check, clean, uuid } from "./security.js";
import { promotionsEnabled, promotionFields } from "./features.js";
import { teachingClasses } from "./licence-classes.js";
const appRoles = ["instructor", "institut", "admin"];
const privateMedia = /^\/api\/media\/[a-f0-9-]{36}$/i;
function images(raw) {
  return (Array.isArray(raw) ? raw : [])
    .filter((v) => typeof v === "string" && privateMedia.test(v))
    .slice(0, 12);
}
function profilePayload(raw, kind) {
  const p = {};
  for (const k of [
    "fullName",
    "displayName",
    "phone",
    "email",
    "state",
    "district",
    "institute",
    "languages",
    "experience",
    "other",
    "address",
    "postcode",
    "representative",
    "position",
    "maps",
    "bio",
    ...(promotionsEnabled
      ? promotionFields.filter((key) => key !== "promotionPoster")
      : []),
  ]) {
    p[k] = clean(
      raw[k],
      ["bio", "other", "promotionDescription"].includes(k) ? 3000 : 300,
    );
  }
  p.bio = clean(raw.bio || raw.description, 3000);
  p.fullName = clean(raw.fullName || raw.name);
  p.name = clean(
    raw.displayName || raw.display_name || raw.name || raw.fullName,
  );
  p.displayName = clean(raw.displayName || raw.display_name || p.name);
  p.spim = teachingClasses(raw);
  p.classes = p.spim;
  p.gallery = images(raw.gallery);
  p.photo = images([raw.photo || raw.logo])[0] || "";
  if (promotionsEnabled)
    p.promotionPoster = images([raw.promotionPoster])[0] || "";
  if (p.maps && !/^https?:\/\//i.test(p.maps)) p.maps = "";
  return p;
}
function publicProfile(row) {
  const p = row.payload;
  const out = {
    id: row.id,
    slug: row.id,
    name: p.name,
    state: p.state,
    district: p.district,
    bio: p.bio,
    photo: p.photo,
    gallery: p.gallery,
    phone: p.phone,
    updated_at: row.updated_at,
  };
  const allowed =
    row.kind === "program"
      ? [
          "title",
          "description",
          "type",
          "date",
          "start",
          "end",
          "contact",
          "poster",
        ]
      : row.kind === "institut"
        ? [
            "address",
            "postcode",
            "maps",
            "classes",
            ...(promotionsEnabled ? promotionFields : []),
          ]
        : ["institute", "languages", "spim", "experience", "other"];

  allowed.push("galleryCaptions");
  if (row.kind === "program") allowed.push("location", "reference");
  for (const k of allowed) if (p[k] !== undefined) out[k] = p[k];
  if (row.kind === "instructor") out.spim = teachingClasses(p);
  return out;
}
export async function catalog(sql, includeHidden = false) {
  const listing =
    await sql`SELECT id,kind,payload,updated_at FROM mylesenhub.listings WHERE (${promotionsEnabled} OR kind<>'program') AND (${includeHidden} OR coalesce(payload->>'_hidden','false') <> 'true') ORDER BY lower(coalesce(payload->>'name',payload->>'title','')),id`;
  const group = (k) =>
    listing
      .filter((r) => r.kind === k)
      .map((r) => ({
        ...publicProfile(r),
        ...(includeHidden ? { hidden: r.payload._hidden === true } : {}),
      }));
  return {
    instructors: group("instructor"),
    institutes: group("institut"),
    programs: promotionsEnabled ? group("program") : [],
  };
}
export async function dashboardData(sql, user, url) {
  const admin = user.role === "admin";
  const subs = admin
    ? await sql`SELECT * FROM mylesenhub.submissions WHERE status<>'draft' AND (${promotionsEnabled} OR kind<>'program') ORDER BY updated_at DESC`
    : await sql`SELECT id,user_id,kind,status,payload,note,created_at,updated_at FROM mylesenhub.submissions WHERE ((user_id=${user.id} AND (kind=${user.role} OR kind NOT IN ('instructor','institut'))) OR (${user.role === "instructor"} AND kind='affiliation' AND payload->>'requester'=${user.id})) AND (${promotionsEnabled} OR kind<>'program') ORDER BY updated_at DESC`;
  const selected =
    admin && url.pathname.endsWith("/semakan")
      ? subs.find((s) => s.id === url.searchParams.get("id"))
      : null;
  const owner = selected?.user_id || user.id;
  const kind = admin
    ? ["instructor", "institut"].includes(selected?.kind)
      ? selected.kind
      : null
    : user.role;
  const [listing] =
    await sql`SELECT payload FROM mylesenhub.listings WHERE user_id=${owner} AND kind IN ('instructor','institut') AND (${kind}::text IS NULL OR kind=${kind}) ORDER BY updated_at DESC LIMIT 1`;
  const data = {
    ...(await catalog(sql, admin)),
    submissions: subs,
    user,
    profile: listing?.payload || null,
    users: [],
    messages: [],
  };
  if (admin && /\/admin(?:\/ringkasan)?\/?$/.test(url.pathname)) {
    const [counts] =
      await sql`SELECT count(*)::int AS pending FROM mylesenhub.accounts WHERE role='institut' AND NOT representative_verified`;
    data.pendingRepresentatives = counts.pending;
  }
  if (admin && url.pathname.endsWith("/pengguna"))
    data.users =
      await sql`SELECT id,name,email,role,representative_verified FROM mylesenhub.accounts ORDER BY name`;
  if (admin && url.pathname.endsWith("/pembetulan"))
    data.messages =
      await sql`SELECT id,name,subject,email,message,created_at FROM mylesenhub.messages ORDER BY created_at DESC`;
  if (user.role === "institut") {
    const affiliations =
      await sql`SELECT id,payload->>'instituteOwner' AS owner FROM mylesenhub.listings WHERE kind='instructor'`;
    const ids = new Set(
      affiliations.filter((row) => row.owner === user.id).map((row) => row.id),
    );
    const available = new Set(
      affiliations
        .filter((row) => !row.owner || row.owner === user.id)
        .map((row) => row.id),
    );
    data.availableInstructors = data.instructors.filter((row) =>
      available.has(row.id),
    );
    data.instructors = data.instructors.filter((row) => ids.has(row.id));
  }
  return data;
}
function normalise(kind, raw) {
  if (kind === "instructor" || kind === "institut")
    return profilePayload(raw, kind);
  if (kind === "media") {
    const list = Array.isArray(raw.images) ? raw.images : [];
    const payload = {
      images: list
        .filter(
          (o) =>
            ["gallery", "profile_photo"].includes(o?.type) &&
            privateMedia.test(o.url),
        )
        .map((o) => ({ url: o.url, type: o.type }))
        .slice(0, 12),
      remove: images(raw.remove),
    };
    if (Array.isArray(raw.galleryOrder)) {
      check(
        raw.galleryOrder.length <= 12 &&
          raw.galleryOrder.every((o) => o && privateMedia.test(o.url)),
        400,
        "Semak susunan galeri.",
      );
      payload.galleryOrder = raw.galleryOrder.map((o) => ({
        url: o.url,
        caption: clean(o.caption, 180),
      }));
    }
    return payload;
  }
  const payload = {};
  for (const k of [
    "title",
    "type",
    "name",
    "contact",
    "date",
    "start",
    "end",
    "description",
    "instructor",
    "instructorId",
    "action",
    "reason",
    "poster",
    "target",
  ])
    if (raw[k] !== undefined)
      payload[k] = clean(raw[k], k === "description" ? 3000 : 300);
  if (kind === "program") {
    payload.location = clean(raw.location);
    const ref = clean(raw.reference, 800);
    if (/^https?:\/\//i.test(ref)) payload.reference = ref;
  }
  if (payload.poster && !privateMedia.test(payload.poster))
    delete payload.poster;
  return payload;
}
export async function submit(sql, u, body, registrationId) {
  const { kind, status = "semakan" } = body;
  if (!promotionsEnabled) {
    check(
      kind !== "program",
      403,
      "Pendaftaran promosi dan program ditutup sementara.",
    );
    check(
      !promotionFields.some((key) => body.payload?.[key]),
      403,
      "Maklumat promosi tidak diterima buat masa ini.",
    );
  }
  check(
    kind === u.role ||
      ["media", "correction"].includes(kind) ||
      (u.role === "institut" && ["program", "affiliation"].includes(kind)),
    403,
    "Peranan akaun tidak sepadan.",
  );
  check(["draft", "semakan"].includes(status), 400, "Status tidak sah.");
  if (registrationId !== undefined)
    check(uuid(registrationId), 400, "Rujukan pendaftaran tidak sah.");
  const p = normalise(kind, body.payload || {});
  if (status === "semakan") {
    if (["instructor", "institut"].includes(kind))
      check(
        p.name && ["Johor", "Melaka"].includes(p.state) && p.district,
        400,
        "Isi nama, negeri dan daerah.",
      );
    if (kind === "program")
      check(p.title, 400, "Isi tajuk promosi atau program.");
    if (kind === "media")
      check(
        p.images.length || p.remove.length || Array.isArray(p.galleryOrder),
        400,
        "Pilih gambar untuk kemas kini.",
      );
    if (kind === "affiliation") {
      check(
        p.instructorId && ["link", "unlink"].includes(p.action),
        400,
        "Pilih instructor dan tindakan.",
      );
      const [eligible] = await sql`
        SELECT trainer.id FROM mylesenhub.listings trainer
        JOIN mylesenhub.listings org ON org.kind='institut' AND org.user_id=${u.id}
        WHERE trainer.kind='instructor' AND trainer.id=${p.instructorId}
          AND coalesce(trainer.payload->>'_hidden','false')<>'true'
          AND coalesce(org.payload->>'_hidden','false')<>'true'
          AND ((${p.action}='link' AND coalesce(trainer.payload->>'instituteOwner','')='')
            OR (${p.action}='unlink' AND trainer.payload->>'instituteOwner'=${u.id}))`;
      check(eligible, 409, "Hubungan ini tidak tersedia untuk institut anda.");
    }
  }
  if (["instructor", "institut"].includes(kind)) {
    const [current] =
      await sql`SELECT payload FROM mylesenhub.listings WHERE kind=${kind} AND user_id=${u.id}`;
    if (current) {
      const old = current.payload;
      for (const key of Object.keys(old))
        if (
          (!(key in (body.payload || {})) ||
            (!promotionsEnabled && promotionFields.includes(key))) &&
          (!p[key] || (Array.isArray(p[key]) && !p[key].length))
        )
          p[key] = old[key];
      if (old.instituteOwner) {
        p.instituteOwner = old.instituteOwner;
        p.institute = old.institute;
      }
    }
  }
  const mediaIds = [
    ...new Set(
      JSON.stringify(p).match(/\/api\/media\/[a-fA-F0-9-]{36}/g) || [],
    ),
  ].map((x) => x.split("/").pop());
  if (mediaIds.length) {
    const files =
      await sql`SELECT id FROM mylesenhub.media WHERE user_id=${u.id} AND id::text=ANY(${mediaIds}::text[])`;
    check(
      files.length === mediaIds.length,
      400,
      "Gambar tidak tersedia untuk akaun ini.",
    );
  }
  let result;
  if (body.id) {
    check(uuid(body.id), 400, "Rujukan tidak sah.");
    result =
      await sql`UPDATE mylesenhub.submissions SET payload=${JSON.stringify(p)}::jsonb || (SELECT coalesce(jsonb_object_agg(key,value),'{}'::jsonb) FROM jsonb_each(payload) WHERE NOT ${promotionsEnabled} AND key=ANY(${promotionFields}::text[])),status=${status},updated_at=now() WHERE id=${body.id} AND user_id=${u.id} AND kind=${kind} AND status IN ('draft','pembetulan') RETURNING id`;
    if (!result.length && kind === "program") {
      result =
        await sql`INSERT INTO mylesenhub.submissions(user_id,kind,payload,status) SELECT user_id,kind,${JSON.stringify(p)}::jsonb||jsonb_build_object('listingId',coalesce(payload->>'listingId',id::text)),${status} FROM mylesenhub.submissions WHERE id=${body.id} AND user_id=${u.id} AND kind='program' AND status='diterbitkan' RETURNING id`;
    }
  } else if (registrationId !== undefined) {
    result =
      await sql`INSERT INTO mylesenhub.submissions(id,user_id,kind,payload,status) VALUES(${registrationId},${u.id},${kind},${JSON.stringify(p)}::jsonb,${status}) ON CONFLICT(id) DO NOTHING RETURNING id`;
    if (!result.length)
      result =
        await sql`SELECT id FROM mylesenhub.submissions WHERE id=${registrationId} AND user_id=${u.id} AND kind=${kind}`;
  } else
    result =
      await sql`INSERT INTO mylesenhub.submissions(user_id,kind,payload,status) VALUES(${u.id},${kind},${JSON.stringify(p)}::jsonb,${status}) RETURNING id`;
  check(
    result.length,
    409,
    "Rekod telah berubah. Muat semula untuk menyemak status.",
  );
  return {
    id: result[0].id,
    message:
      status === "draft"
        ? "Draf disimpan."
        : "Maklumat dihantar untuk semakan.",
  };
}
export async function review(sql, user, b) {
  check(user.role === "admin", 403, "Akses admin diperlukan.");
  check(uuid(b.id), 400, "Permohonan tidak sah.");
  const next = {
    verify: "pengesahan",
    publish: "diterbitkan",
    return: "pembetulan",
  }[b.action];
  check(next, 400, "Pilih tindakan yang sah.");
  const prev =
    b.action === "return"
      ? ["semakan", "pengesahan"]
      : [b.action === "publish" ? "pengesahan" : "semakan"];
  const note = clean(b.note, 3000);
  if (b.action === "return")
    check(note, 400, "Nyatakan pembetulan yang diperlukan.");
  const [sub] =
    await sql`SELECT * FROM mylesenhub.submissions WHERE id=${b.id}`;
  check(
    sub && (promotionsEnabled || sub.kind !== "program"),
    404,
    "Permohonan tidak ditemui.",
  );
  if (
    sub.kind === "affiliation" &&
    sub.payload?.requester &&
    b.action !== "return"
  )
    check(
      sub.payload.instituteDecision === "approved",
      409,
      "Institut perlu mengesahkan hubungan dahulu.",
    );
  const decision = sql`WITH changed AS (UPDATE mylesenhub.submissions SET status=${next},note=${note},updated_at=now() WHERE id=${b.id} AND status=ANY(${prev}::text[]) RETURNING id) INSERT INTO mylesenhub.admin_audit(actor_id,action,target_id) SELECT ${user.id},${"review_" + b.action},id::text FROM changed RETURNING target_id`;
  if (b.action !== "publish") {
    const r = await decision;
    check(r.length, 409, "Status telah berubah.");
    return {
      status: next,
      message:
        b.action === "verify"
          ? "Permohonan disahkan dan sedia untuk diterbitkan."
          : "Permohonan dikembalikan untuk pembetulan.",
    };
  }
  const p = sub.payload,
    profileKind = ["instructor", "institut"].includes(sub.kind);
  if (profileKind || sub.kind === "program") {
    const stableId = profileKind
      ? sub.kind + "-" + sub.user_id
      : p.listingId || sub.id;
    const r =
      await sql`WITH approved AS (UPDATE mylesenhub.submissions SET status='diterbitkan',note=${note},updated_at=now() WHERE id=${b.id} AND status='pengesahan' RETURNING user_id,kind,payload), published AS (
 INSERT INTO mylesenhub.listings AS l(id,user_id,kind,payload) SELECT ${stableId},user_id,kind,payload FROM approved ON CONFLICT(id) DO UPDATE SET payload=excluded.payload,updated_at=now() WHERE l.user_id=excluded.user_id RETURNING id) INSERT INTO mylesenhub.admin_audit(actor_id,action,target_id) SELECT ${user.id},'review_publish',${b.id}::text FROM published RETURNING target_id`;
    check(r.length, 409, "Penerbitan tidak tersedia.");
  } else if (sub.kind === "media") {
    const files = p.images || [];
    const photo = files.findLast((x) => x.type === "profile_photo")?.url;
    const gal = files.filter((x) => x.type === "gallery").map((x) => x.url);
    const ordered = p.galleryOrder;
    const galleryPatch = ordered
      ? {
          gallery: ordered.map((o) => o.url),
          galleryCaptions: Object.fromEntries(
            ordered.map((o) => [o.url, o.caption]),
          ),
        }
      : {};
    const r =
      await sql`WITH approved AS (UPDATE mylesenhub.submissions SET status='diterbitkan',note=${note},updated_at=now() WHERE id=${b.id} AND status='pengesahan' AND EXISTS(SELECT 1 FROM mylesenhub.listings l WHERE l.user_id=${sub.user_id} AND l.kind IN ('instructor','institut')) RETURNING user_id), published AS (
 UPDATE mylesenhub.listings l SET payload=l.payload || ${JSON.stringify(photo ? { photo } : {})}::jsonb || jsonb_build_object('gallery', (coalesce(l.payload->'gallery','[]'::jsonb)-${p.remove || []}::text[])||${JSON.stringify(gal)}::jsonb)||${JSON.stringify(galleryPatch)}::jsonb,updated_at=now() FROM approved WHERE l.user_id=approved.user_id AND l.kind IN ('instructor','institut') RETURNING id) INSERT INTO mylesenhub.admin_audit(actor_id,action,target_id) SELECT ${user.id},'review_publish',${b.id}::text FROM published RETURNING target_id`;
    check(r.length, 409, "Terbitkan profil terlebih dahulu.");
  } else if (sub.kind === "affiliation") {
    const target = p.instructorId;
    const r =
      await sql`WITH org AS (SELECT payload->>'name' AS name FROM mylesenhub.listings WHERE user_id=${sub.user_id} AND kind='institut'),
 linked AS (UPDATE mylesenhub.listings SET payload=CASE WHEN ${p.action}='link' THEN payload || jsonb_build_object('instituteOwner',${sub.user_id}::text,'institute',(SELECT name FROM org)) ELSE payload-'instituteOwner'-'institute' END,updated_at=now() WHERE id=${target} AND kind='instructor' AND EXISTS(SELECT 1 FROM org) AND ((${p.action}='link' AND COALESCE(payload->>'instituteOwner','') IN ('',${sub.user_id})) OR (${p.action}='unlink' AND payload->>'instituteOwner'=${sub.user_id})) AND EXISTS(SELECT 1 FROM mylesenhub.submissions WHERE id=${b.id} AND status='pengesahan' FOR UPDATE) RETURNING id)
 , published AS (UPDATE mylesenhub.submissions SET status='diterbitkan',note=${note},updated_at=now() WHERE id=${b.id} AND status='pengesahan' AND EXISTS(SELECT 1 FROM linked) RETURNING id) INSERT INTO mylesenhub.admin_audit(actor_id,action,target_id) SELECT ${user.id},'review_publish',id::text FROM published RETURNING target_id`;
    check(
      r.length,
      409,
      "Semak profil institute dan instructor yang diterbitkan.",
    );
  } else {
    const r = await decision;
    check(r.length, 409, "Status telah berubah.");
  }
  return { status: next, message: "Permohonan diterbitkan." };
}
export async function setAccess(sql, u, b) {
  check(
    u.role === "admin" && b.userId !== u.id,
    403,
    "Perubahan akses ini tidak dibenarkan.",
  );
  check(appRoles.includes(b.role), 400, "Pilih peranan yang sah.");
  const r =
    await sql`WITH changed AS (UPDATE mylesenhub.accounts SET role=${b.role},representative_verified=CASE WHEN role=${b.role} THEN representative_verified ELSE false END WHERE id=${clean(b.userId)} RETURNING id) INSERT INTO mylesenhub.admin_audit(actor_id,action,target_id) SELECT ${u.id},'access_change',id FROM changed RETURNING target_id`;
  check(r.length, 404, "Akaun tidak ditemui.");
  return { message: "Akses dikemas kini." };
}
