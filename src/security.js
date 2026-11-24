export function fail(status, message) {
  throw Object.assign(new Error(message), { status });
}
export function check(condition, status, message) {
  if (!condition) fail(status, message);
}
export async function bytes(request, limit) {
  check(
    Number(request.headers.get("content-length") || 0) <= limit,
    413,
    "Fail terlalu besar.",
  );
  const stream = request.body?.getReader();
  if (!stream) return new Uint8Array();
  const parts = [];
  let total = 0;
  while (true) {
    const { done, value } = await stream.read();
    if (done) break;
    total += value.length;
    if (total > limit) {
      await stream.cancel();
      fail(413, "Fail terlalu besar.");
    }
    parts.push(value);
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const p of parts) {
    out.set(p, offset);
    offset += p.length;
  }
  return out;
}
export async function input(req) {
  check(
    (req.headers.get("content-type") || "").includes("application/json"),
    415,
    "Gunakan format JSON.",
  );
  try {
    const o = JSON.parse(new TextDecoder().decode(await bytes(req, 64000)));
    check(
      o && typeof o === "object" && !Array.isArray(o),
      400,
      "Maklumat tidak sah.",
    );
    return o;
  } catch (e) {
    if (e.status) throw e;
    fail(400, "Maklumat tidak sah.");
  }
}
export const clean = (s, max = 300) =>
  String(s ?? "")
    .trim()
    .slice(0, max);
export function json(obj, status = 200, extra = {}) {
  return Response.json(obj, {
    status,
    headers: {
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      ...extra,
    },
  });
}
export const uuid = (s) =>
  typeof s === "string" &&
  /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(s);
export const escapeHtml = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
