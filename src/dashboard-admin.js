import { escapeHtml as e } from "./security.js";
import { promotionsEnabled } from "./features.js";
const labels = {
  instructor: "Instructor",
  institut: "Institut",
  program: "Program",
  media: "Galeri",
  affiliation: "Hubungan institut",
  correction: "Pembetulan",
  draft: "Draf",
  semakan: "Semakan",
  pengesahan: "Pengesahan",
  diterbitkan: "Diterbitkan",
  pembetulan: "Perlu pembetulan",
};
const val = (x) =>
  x == null || x === ""
    ? "—"
    : Array.isArray(x)
      ? x.join(", ")
      : typeof x === "object"
        ? JSON.stringify(x)
        : String(x);
const badge = (s) =>
  `<span class="d-pill d-${e(s)}">${e(labels[s] || s)}</span>`;
const btn = (href, text, style = "outline") =>
  `<a class="d-btn ${style}" href="${e(href)}">${e(text)}</a>`;
const avatar = (p = {}, kind = "instructor") =>
  p.photo
    ? `<img class="da-avatar" src="${e(p.photo)}" alt="">`
    : `<span class="da-avatar da-avatar-icon" aria-hidden="true"><span class="d-icon" style="mask-image:url(/media/icon-${kind === "institut" ? "institute" : "person"}.webp)"></span></span>`;
const row = (head, value) => `<td data-label="${e(head)}">${value}</td>`;
const card = (body) => `<section class="d-card">${body}</section>`;
const table = (heads, rows, empty = "Tiada rekod buat masa ini.") =>
  `<div class="da-table"><table><thead><tr>${heads.map((h) => `<th>${e(h)}</th>`).join("")}</tr></thead><tbody>${rows.length ? rows.join("") : `<tr><td colspan="${heads.length}">${empty}</td></tr>`}</tbody></table></div>`;
const params = (url, changes) => {
  let p = new URLSearchParams(url.searchParams);
  for (const [k, v] of Object.entries(changes)) {
    if (v) p.set(k, v);
    else p.delete(k);
  }
  return "?" + p.toString();
};
const qfilter = (rows, q) =>
  !q
    ? rows
    : rows.filter((x) =>
        JSON.stringify(x.payload || x)
          .toLowerCase()
          .includes(q.toLowerCase()),
      );
export function applications(data, url, correction = false) {
  let rows = (data.submissions || []).filter(
    (x) =>
      (promotionsEnabled || x.kind !== "program") &&
      (!correction || x.kind === "correction" || x.status === "pembetulan"),
  );
  let q = url.searchParams.get("q") || "",
    kind = url.searchParams.get("kind") || "",
    state = url.searchParams.get("state") || "",
    status = url.searchParams.get("status") || "";
  let states = [
    ...new Set(rows.map((x) => x.payload?.state).filter(Boolean)),
  ].sort();
  rows = qfilter(rows, q).filter(
    (x) =>
      (!kind || x.kind === kind) &&
      (!state || x.payload?.state === state) &&
      (!status || x.status === status),
  );
  let page = Math.max(
      1,
      Math.min(
        Math.ceil(rows.length / 5) || 1,
        Number(url.searchParams.get("page")) || 1,
      ),
    ),
    pages = Math.ceil(rows.length / 5) || 1;
  let filter = `<form class="d-filter da-filter"><label><span>Cari</span><input name="q" value="${e(q)}" placeholder="Cari nama atau institut"></label><label><span>Jenis</span><select name="kind"><option value="">Semua</option>${["instructor", "institut", ...(promotionsEnabled ? ["program"] : []), "affiliation", "media", "correction"].map((k) => `<option value="${k}" ${k === kind ? "selected" : ""}>${labels[k]}</option>`).join("")}</select></label><label><span>Negeri</span><select name="state"><option value="">Semua</option>${states.map((x) => `<option ${x === state ? "selected" : ""}>${e(x)}</option>`).join("")}</select></label><label><span>Status</span><select name="status"><option value="">Semua</option>${["semakan", "pengesahan", "pembetulan"].map((x) => `<option value="${x}" ${x === status ? "selected" : ""}>${labels[x]}</option>`).join("")}</select></label><button class="d-btn outline">Cari</button></form>`;
  let tabs = `<nav class="d-tabs" aria-label="Status permohonan">${[
    ["", "Semua"],
    ["semakan", "Semakan"],
    ["pengesahan", "Pengesahan"],
    ["pembetulan", "Perlu pembetulan"],
  ]
    .map(([v, l]) =>
      btn(
        params(url, { status: v, page: "" }),
        l,
        status === v ? "red" : "outline",
      ),
    )
    .join("")}</nav>`;
  let heads = [
    "Pemohon / Tajuk",
    "Jenis",
    "Lokasi",
    "Dihantar",
    "Status",
    "Tindakan",
  ];
  let dataRows = rows.slice((page - 1) * 5, page * 5).map((x) => {
    let p = x.payload || {},
      name =
        p.name || p.displayName || p.title || labels[x.kind] || "Permohonan";
    return `<tr>${row(heads[0], `<div class="da-person">${avatar(p, x.kind)}<span><strong>${e(name)}</strong><small>${e(labels[x.kind] || x.kind)}</small></span></div>`)}${row(heads[1], e(labels[x.kind] || x.kind))}${row(heads[2], e([p.district, p.state].filter(Boolean).join(", ") || "—"))}${row(heads[3], e(String(x.created_at || "").slice(0, 10) || "—"))}${row(heads[4], badge(x.status))}${row(heads[5], btn("/dashboard/admin/semakan?id=" + encodeURIComponent(x.id), "Buka semakan", "red"))}</tr>`;
  });
  let pagination = `<div class="d-pagination"><span>Menunjukkan ${rows.length ? (page - 1) * 5 + 1 : 0}–${Math.min(page * 5, rows.length)} daripada ${rows.length}</span><nav aria-label="Halaman permohonan">${Array.from({ length: pages }, (_, i) => btn(params(url, { page: String(i + 1) }), String(i + 1), i + 1 === page ? "red" : "outline")).join(" ")}</nav></div>`;
  return (
    filter +
    tabs +
    card(table(heads, dataRows) + pagination) +
    `<div class="d-notice da-info">Semak maklumat, sahkan pemilik, kemudian terbitkan.</div>`
  );
}
const fieldNames = {
  name: "Nama",
  fullName: "Nama penuh",
  displayName: "Nama paparan",
  state: "Negeri",
  district: "Daerah",
  institute: "Institut",
  phone: "Telefon",
  email: "E-mel",
  languages: "Bahasa",
  spim: "Kelas SPIM",
  classes: "Kelas",
  experience: "Experience",
  other: "Other",
  bio: "Pengenalan",
  address: "Alamat",
  postcode: "Poskod",
  maps: "Pautan lokasi",
  representative: "Wakil",
  position: "Jawatan",
  title: "Tajuk",
  description: "Penerangan",
  type: "Jenis",
  start: "Tarikh mula",
  end: "Tarikh tamat",
};
export function reviewView(s, profile) {
  const prev = profile?.payload || profile || {},
    p = s.payload || {},
    keys = Object.keys(fieldNames).filter(
      (k) =>
        (k !== "title" || s.kind === "program") &&
        k in p &&
        JSON.stringify(prev[k] ?? null) !== JSON.stringify(p[k] ?? null),
    );
  let step =
    { semakan: 1, pengesahan: 2, diterbitkan: 3, pembetulan: 1 }[s.status] ??
    -1;
  let steps = ["Dihantar", "Semakan", "Pengesahan", "Diterbitkan"]
    .map(
      (label, i) =>
        `<div data-review-step="${i}" class="${i <= step ? "completed" : ""}" ${i === step ? 'aria-current="step"' : ""}><b>${i + 1}</b><strong>${label}</strong></div>`,
    )
    .join("");
  let rows = keys.map(
    (k) =>
      `<tr>${row("Medan", `<strong>${e(fieldNames[k])}</strong>`)}${row("Versi diterbitkan", e(val(prev[k])))}${row("Perubahan dihantar", `<strong>${e(val(p[k]))}</strong>`)}</tr>`,
  );
  let actions = `${["semakan", "pengesahan"].includes(s.status) ? '<button class="d-btn outline" name="action" value="return">Minta pembetulan</button>' : ""}${s.status === "semakan" ? '<button class="d-btn red" name="action" value="verify">Sahkan</button>' : ""}${s.status === "pengesahan" ? '<button class="d-btn red" name="action" value="publish">Terbitkan</button>' : ""}`;
  return `<div data-review-view data-status="${e(s.status)}"><div class="da-review-heading"><strong>${e(p.name || p.title || labels[s.kind] || "Permohonan")}</strong><span data-review-status>${badge(s.status)}</span></div><div class="d-steps" aria-label="Kemajuan semakan">${steps}</div><div class="d-columns"><div>${card(`<div class="da-review-head"><h2>Perbandingan perubahan</h2></div>${table(["Medan", "Versi diterbitkan", "Perubahan dihantar"], rows, "Tiada perubahan medan profil yang dapat dibandingkan.")}`)}${card(`<h2>Pratonton profil dihantar</h2><div class="da-preview">${avatar(p, s.kind)}<div><h3>${e(p.name || p.title || labels[s.kind])}</h3><p>${e([p.institute, p.district, p.state].filter(Boolean).join(" · ") || "—")}</p>${p.spim ? `<p>Kelas SPIM: ${e(val(p.spim))}</p>` : ""}${p.experience ? `<p>Experience: ${e(p.experience)}</p>` : ""}</div>${Array.isArray(p.gallery) && p.gallery[0] ? `<img class="da-gallery" src="${e(typeof p.gallery[0] === "string" ? p.gallery[0] : p.gallery[0]?.url || "")}" alt="Gambar galeri dihantar">` : ""}</div>`)}</div>${card(`<h2>Senarai semakan</h2><p>Semak maklumat dan sahkan pemilik sebelum menerbitkan.</p><ul class="da-checks"><li>Maklumat profil dan hubungan</li><li>Perbandingan dengan versi awam</li><li>Kebenaran paparan</li></ul><form data-review-note="${e(s.id)}"><label class="d-field"><b>Nota dalaman</b><textarea name="note" maxlength="3000">${e(s.internal_note || "")}</textarea></label><button class="d-btn outline">Simpan catatan</button><p class="d-feedback" aria-live="polite"></p></form><form data-review="${e(s.id)}"><label class="d-field"><b>Nota kepada pemohon</b><textarea name="note" maxlength="3000">${e(s.note || "")}</textarea></label><div class="d-actions left" data-review-actions>${actions}</div><p class="d-feedback" aria-live="polite" tabindex="-1"></p></form>`)}</div></div>`;
}
export function directory(data, url) {
  const kind =
      url.searchParams.get("kind") === "institut" ? "institut" : "instructor",
    q = url.searchParams.get("q") || "",
    state = url.searchParams.get("state") || "",
    district = url.searchParams.get("district") || "",
    status = url.searchParams.get("status") || "";
  const all =
      kind === "institut" ? data.institutes || [] : data.instructors || [],
    states = [...new Set(all.map((x) => x.state).filter(Boolean))],
    districts = [...new Set(all.map((x) => x.district).filter(Boolean))];
  const rows = qfilter(all, q).filter(
    (x) =>
      (!state || x.state === state) &&
      (!district || x.district === district) &&
      (!status || (status === "hidden") === !!x.hidden),
  );
  const page = Math.max(
      1,
      Math.min(
        Math.ceil(rows.length / 10) || 1,
        Number(url.searchParams.get("page")) || 1,
      ),
    ),
    pages = Math.ceil(rows.length / 10) || 1,
    heads = ["Nama", "Institut", "Lokasi", "Status", "Tindakan"];
  const filter = `<form class="d-filter da-filter"><input type="hidden" name="kind" value="${kind}"><label><span>Cari</span><input name="q" value="${e(q)}" placeholder="Cari nama, institut atau lokasi"></label>${[
    ["state", "Negeri", states, state],
    ["district", "Daerah", districts, district],
  ]
    .map(
      ([n, l, opts, v]) =>
        `<label><span>${l}</span><select name="${n}"><option value="">Semua</option>${opts.map((o) => `<option ${o === v ? "selected" : ""}>${e(o)}</option>`).join("")}</select></label>`,
    )
    .join(
      "",
    )}<label><span>Status</span><select name="status"><option value="">Semua</option><option value="visible" ${status === "visible" ? "selected" : ""}>Diterbitkan</option><option value="hidden" ${status === "hidden" ? "selected" : ""}>Disembunyikan</option></select></label><button class="d-btn outline">Cari</button></form>`;
  const result = rows
    .slice((page - 1) * 10, page * 10)
    .map(
      (x) =>
        `<tr>${row("Nama", `<div class="da-person">${avatar(x, kind)}<strong>${e(x.name || "—")}</strong></div>`)}${row("Institut", e(x.institute || "—"))}${row("Lokasi", e([x.district, x.state].filter(Boolean).join(", ") || "—"))}${row("Status", x.hidden ? '<span class="d-pill d-draft">Disembunyikan</span>' : badge("diterbitkan"))}${row("Tindakan", `<details class="da-menu"><summary aria-label="Tindakan untuk ${e(x.name || "profil")}">Tindakan ⋯</summary>${kind === "instructor" && !x.hidden ? btn("/instructor/" + encodeURIComponent(x.slug || x.id), "Lihat profil awam") : ""}<a href="${kind === "institut" ? "/daftar-institut" : "/sertai-kami"}">Pemilik kemas kini profil</a>${x.id ? `<form data-directory="${e(x.id)}" data-action="${x.hidden ? "publish" : "unpublish"}"><button class="d-btn outline">${x.hidden ? "Terbitkan semula" : "Nyahterbitkan"}</button><span class="d-feedback" aria-live="polite"></span></form>` : ""}</details>`)}</tr>`,
    );
  const pagination = `<div class="d-pagination"><span>${rows.length} profil · halaman ${page} daripada ${pages}</span><nav aria-label="Halaman direktori">${Array.from({ length: pages }, (_, i) => btn(params(url, { page: String(i + 1) }), String(i + 1), i + 1 === page ? "red" : "outline")).join(" ")}</nav></div>`;
  return `<div class="da-toolbar"><nav class="d-tabs">${btn(params(url, { kind: "instructor", page: "" }), "Instructor", kind === "instructor" ? "red" : "outline")}${btn(params(url, { kind: "institut", page: "" }), "Institut Memandu", kind === "institut" ? "red" : "outline")}</nav><details class="da-add"><summary>Tambah profil</summary><p>Profil baharu dihantar oleh pemilik dan melalui semakan.</p>${btn("/sertai-kami", "Daftar instructor")}${btn("/daftar-institut", "Daftar institut")}</details></div>${card(filter + table(heads, result) + `<p class="da-muted">Nyahterbit menyembunyikan profil daripada carian awam tanpa memadamkannya.</p>` + pagination)}`;
}
export function users(data, url) {
  const q = url.searchParams.get("q") || "",
    role = url.searchParams.get("role") || "",
    all = data.users || [],
    list = qfilter(all, q).filter((x) => !role || x.role === role),
    heads = ["Nama", "E-mel", "Peranan", "Status", "Tindakan"],
    reps = all.filter((x) => x.role === "institut"),
    selected =
      reps.find((x) => String(x.id) === url.searchParams.get("rep")) || reps[0];
  const tabs = `<nav class="d-tabs" aria-label="Peranan pengguna">${[
    ["", "Semua"],
    ["instructor", "Instructor"],
    ["institut", "Wakil institut"],
    ["admin", "Admin"],
  ]
    .map(([k, l]) =>
      btn(params(url, { role: k }), l, k === role ? "red" : "outline"),
    )
    .join("")}</nav>`;
  const rows = list.map(
    (x) =>
      `<tr>${row("Nama", `<strong>${e(x.name)}</strong>`)}${row("E-mel", e(x.email))}${row("Peranan", e(x.role))}${row("Status", x.role === "institut" ? (x.representative_verified ? '<span class="d-pill d-diterbitkan">Wakil disahkan</span>' : '<span class="d-pill d-semakan">Belum disahkan</span>') : "—")}${row("Tindakan", `<form data-access="${e(x.id)}"><select name="role" aria-label="Peranan ${e(x.name)}">${["instructor", "institut", "admin"].map((r) => `<option ${r === x.role ? "selected" : ""}>${r}</option>`).join("")}</select><button class="d-btn outline">Simpan</button><span class="d-feedback" aria-live="polite"></span></form>${x.role === "institut" ? btn(params(url, { rep: x.id }), "Semak wakil") : ""}`)}</tr>`,
  );
  let panel = selected
    ? `<h2>Pengesahan wakil institut</h2><p><strong>${e(selected.name)}</strong><br>${e(selected.email)}</p><p>${selected.representative_verified ? "Wakil disahkan" : "Belum disahkan"}</p><p>Pengesahan wakil tidak menerbitkan profil; permohonan tetap memerlukan semakan.</p><form data-representative="${e(selected.id)}" data-action="${selected.representative_verified ? "revoke" : "verify"}">${selected.representative_verified ? "" : `<fieldset class="da-confirm"><legend>Semak sebelum mengesahkan</legend><label><input type="checkbox" name="identityChecked" required> Identiti wakil telah disemak</label><label><input type="checkbox" name="authorityChecked" required> Kebenaran mewakili institut telah disemak</label></fieldset>`}<button class="d-btn ${selected.representative_verified ? "outline" : "red"}">${selected.representative_verified ? "Tarik balik pengesahan" : "Sahkan wakil"}</button><span class="d-feedback" aria-live="polite"></span></form>`
    : "<h2>Pengesahan wakil institut</h2><p>Tiada wakil institut untuk disemak.</p>";
  return `<div class="da-toolbar">${tabs}<details class="da-add"><summary>Jemput pengguna</summary><p>Kongsi pautan pendaftaran. Tiada e-mel dihantar secara automatik.</p><label class="d-field"><b>Pautan daftar instructor</b><input readonly value="/sertai-kami" data-invite-path="/sertai-kami"></label><button type="button" class="d-btn outline" data-copy-invite="/sertai-kami">Salin pautan instructor</button><label class="d-field"><b>Pautan daftar institut</b><input readonly value="/daftar-institut" data-invite-path="/daftar-institut"></label><button type="button" class="d-btn outline" data-copy-invite="/daftar-institut">Salin pautan institut</button><span class="d-feedback" aria-live="polite"></span></details></div><div class="d-columns da-users">${card(`<h2>Senarai pengguna</h2><form class="d-filter"><input type="hidden" name="role" value="${e(role)}"><label><span>Cari pengguna</span><input name="q" value="${e(q)}" placeholder="Nama atau e-mel"></label><button class="d-btn outline">Cari</button></form>${table(heads, rows)}`)}${card(panel)}</div>`;
}

export function adminMessages(data) {
  const heads = ["Nama / E-mel", "Subjek", "Mesej", "Tarikh"];
  const rows = (data.messages || []).map(
    (m) =>
      `<tr>${row(heads[0], `<strong>${e(m.name)}</strong><small>${e(m.email)}</small>`)}${row(heads[1], e(m.subject))}${row(heads[2], e(m.message))}${row(heads[3], e(String(m.created_at || "").slice(0, 10) || "—"))}</tr>`,
  );
  return card(
    `<h2>Mesej diterima</h2>${table(heads, rows, "Tiada mesej diterima.")}`,
  );
}
