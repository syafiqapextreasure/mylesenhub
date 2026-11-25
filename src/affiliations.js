import { check, clean, uuid } from "./security.js";

async function requestId(instructorId, instituteId) {
  const bytes = new Uint8Array(
    await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(
        JSON.stringify(["affiliation", instructorId, instituteId]),
      ),
    ),
  );
  bytes[6] = (bytes[6] & 15) | 80;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = [...bytes.slice(0, 16)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join("-");
}

export async function instructorAffiliation(sql, user, body) {
  check(user.role === "instructor", 403, "Akses instructor diperlukan.");
  const instituteId = clean(body.instituteId);
  check(instituteId, 400, "Pilih institut memandu.");
  const id = await requestId(user.id, instituteId);
  const rows = await sql`
    INSERT INTO mylesenhub.submissions AS previous (id,user_id,kind,payload,status)
    SELECT ${id},org.user_id,'affiliation',
      jsonb_build_object('action','link','requester',${user.id}::text,'instructorId',trainer.id,'name',org.payload->>'name','title','Permintaan hubungan instructor'),
      'semakan'
    FROM mylesenhub.listings trainer
    JOIN mylesenhub.listings org ON org.id=${instituteId} AND org.kind='institut'
    WHERE trainer.user_id=${user.id} AND trainer.kind='instructor'
      AND coalesce(trainer.payload->>'instituteOwner','')=''
      AND coalesce(trainer.payload->>'_hidden','false')<>'true'
      AND coalesce(org.payload->>'_hidden','false')<>'true'
    ON CONFLICT (id) DO UPDATE SET payload=excluded.payload,status='semakan',note='',updated_at=now()
      WHERE previous.user_id=excluded.user_id AND previous.kind='affiliation' AND previous.status='pembetulan'
    RETURNING id`;
  check(
    rows.length,
    409,
    "Pastikan kedua-dua profil tersedia dan tiada permintaan yang sedang diproses.",
  );
  return {
    id: rows[0].id,
    message: "Permintaan hubungan dihantar kepada institut.",
  };
}

export async function decideAffiliation(sql, user, body) {
  check(user.role === "institut", 403, "Akses wakil institut diperlukan.");
  check(
    uuid(body.id) && ["approve", "reject"].includes(body.action),
    400,
    "Pilih keputusan hubungan yang sah.",
  );
  const approve = body.action === "approve";
  const decision = approve ? "approved" : "rejected";
  const status = approve ? "semakan" : "pembetulan";
  const rows = await sql`
    UPDATE mylesenhub.submissions s
    SET payload=s.payload || jsonb_build_object('instituteDecision',${decision}::text),
      status=${status},note=${approve ? "" : "Institut menyatakan hubungan ini tidak berkaitan."},updated_at=now()
    WHERE s.id=${body.id} AND s.user_id=${user.id} AND s.kind='affiliation'
      AND s.status='semakan' AND s.payload->>'action'='link'
      AND s.payload ? 'requester' AND NOT (s.payload ? 'instituteDecision')
      AND EXISTS (SELECT 1 FROM mylesenhub.listings l
        WHERE l.user_id=${user.id} AND l.kind='institut' AND coalesce(l.payload->>'_hidden','false')<>'true')
    RETURNING id`;
  check(
    rows.length,
    409,
    "Permintaan hubungan tidak tersedia untuk tindakan ini.",
  );
  return {
    status,
    message: approve
      ? "Hubungan disahkan oleh institut dan dihantar kepada Admin."
      : "Keputusan tidak berkaitan disimpan.",
  };
}
