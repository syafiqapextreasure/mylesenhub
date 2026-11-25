import { escapeHtml as e } from "./security.js";
import { promotionsEnabled } from "./features.js";

const root = (role) => "/dashboard/" + role;
const stages = {
  draft: "Draf",
  semakan: "Dalam semakan",
  pengesahan: "Pengesahan",
  diterbitkan: "Diterbitkan",
  pembetulan: "Perlu pembetulan",
};
const kinds = {
  instructor: "Instructor",
  institut: "Institut",
  program: "Program",
  media: "Galeri",
  correction: "Pembetulan",
  affiliation: "Hubungan institut",
};
const arts = (name) => "/media/" + name + ".webp";
const icon = (name) =>
  `<span aria-hidden="true" class="d-icon" style="mask-image:url(${arts("icon-" + name)})"></span>`;
const image = (url, alt, cls = "") =>
  `<img class="${cls}" src="${e(url)}" alt="${e(alt)}" loading="lazy">`;
const link = (url, text, style = "outline") =>
  `<a class="d-btn ${style}" href="${e(url)}">${e(text)}</a>`;
const pill = (status) =>
  `<span class="d-pill d-${e(status)}">${e(stages[status] || status)}</span>`;
const displayDate = (value) =>
  value ? e(String(value).slice(0, 10)) : "Tarikh belum ditetapkan";
const rows = (data) => data.submissions || [];
const profile = (data) => data.profile?.payload || data.profile || {};
const titleOf = (row) =>
  row.payload?.title || row.payload?.name || kinds[row.kind] || "Permohonan";
function hero(title, subtitle, action = "") {
  return `<div class="d-hero dp-hero"><div><h1>${e(title)}</h1><p>${e(subtitle)}</p><i></i></div><img src="/media/branded-axia.webp" alt="" fetchpriority="high">${action}</div>`;
}
function stat(ic, label, value) {
  return `<article class="d-card dp-stat"><span class="dp-icon">${icon(ic)}</span><div><strong>${e(label)}</strong><b>${value}</b></div></article>`;
}
function quicklinks(role, items) {
  return `<nav class="d-quicklinks">${items.map(([href, label, ic]) => `<a class="d-card" href="${root(role)}/${href}">${icon(ic)}<strong>${label}</strong><span aria-hidden="true">›</span></a>`).join("")}</nav>`;
}
function activity(items) {
  return `<ul class="dp-activity">${
    items.length
      ? items
          .slice(0, 4)
          .map(
            (s) =>
              `<li>${icon("applications")}<div>${e(titleOf(s))}<small>${e(stages[s.status] || "")}</small></div><time>${displayDate(s.updated_at || s.created_at)}</time></li>`,
          )
          .join("")
      : "<li>Aktiviti akan dipaparkan selepas penghantaran pertama.</li>"
  }</ul>`;
}
function cardPhoto(url, ic) {
  return url
    ? image(url, "", "dp-wide-photo")
    : `<div class="dp-empty-photo">${icon(ic)}</div>`;
}
function profileCard(role, data) {
  const p = profile(data),
    institute = role === "institut",
    src =
      data.demo && !institute && (p.photo === arts("daniel") || !p.photo)
        ? arts("daniel-dashboard")
        : p.photo || (data.demo ? arts("institute-building") : "");
  const chosen = data.instructors?.find(
    (x) => x.id === "instructor-" + data.user?.id || x.slug === p.slug,
  );
  return `<section class="d-card dp-profile">${institute ? "<h2>Profil institut</h2>" : ""}${cardPhoto(src, institute ? "institute" : "person")}<h2>${e(p.name || data.user?.name || "Profil anda")}</h2>${!institute && p.institute ? `<p>${icon("institute")} ${e(p.institute)}</p>` : ""}${p.state || p.district ? `<p>${icon("pin")} ${e([p.district, p.state].filter(Boolean).join(", "))}</p>` : ""}${
    institute
      ? pill(data.profile && !p._hidden ? "diterbitkan" : "draft")
      : `<dl>${[
          [
            "Kelas SPIM",
            Array.isArray(p.spim || p.classes)
              ? (p.spim || p.classes).join(", ")
              : "",
          ],
          ["Experience", p.experience],
          ["Other", p.other],
        ]
          .filter((x) => x[1])
          .map(([k, v]) => `<div><dt>${k}</dt><dd>${e(v)}</dd></div>`)
          .join("")}</dl>`
  }${link(chosen ? "/instructor/" + encodeURIComponent(chosen.slug) : root(role) + "/profil", chosen ? "Lihat profil awam" : "Lihat profil")}</section>`;
}
function adminOverview(data) {
  const submissions = rows(data).filter(
      (x) => promotionsEnabled || x.kind !== "program",
    ),
    pending = submissions.filter((x) =>
      ["semakan", "pengesahan"].includes(x.status),
    );
  const metrics = [
    [
      "applications",
      "Permohonan baharu",
      submissions.filter((x) => x.status === "semakan").length,
    ],
    [
      "clock",
      "Menunggu pengesahan",
      submissions.filter((x) => x.status === "pengesahan").length,
    ],
    [
      "edit",
      "Permintaan pembetulan",
      submissions.filter(
        (x) => x.kind === "correction" && x.status !== "diterbitkan",
      ).length,
    ],
    [
      "access",
      "Wakil perlu disahkan",
      data.pendingRepresentatives ??
        (data.users || []).filter(
          (u) => u.role === "institut" && !u.representative_verified,
        ).length,
    ],
  ];
  return `<h2 class="dp-section-title">Ringkasan pentadbiran</h2>${hero("Selamat kembali, Admin", "Urus permohonan, semakan dan direktori MyLesenHub.")}<div class="dp-stats dp-four">${metrics.map(([i, l, v]) => stat(i, l, e(v))).join("")}</div><div class="dp-columns"><div><section class="d-card"><div class="dp-row"><h2>Perlu tindakan</h2><a href="/dashboard/admin/permohonan">Lihat semua</a></div><div class="dp-admin-table"><table><thead><tr><th>Permohonan</th><th>Jenis</th><th>Status</th><th>Tindakan</th></tr></thead><tbody>${
    pending
      .slice(0, 4)
      .map(
        (s) =>
          `<tr><td data-label="Permohonan">${e(titleOf(s))}</td><td data-label="Jenis">${e(kinds[s.kind])}</td><td data-label="Status">${pill(s.status)}</td><td data-label="Tindakan">${link("/dashboard/admin/semakan?id=" + encodeURIComponent(s.id), "Semak", "red")}</td></tr>`,
      )
      .join("") ||
    '<tr><td colspan="4">Tiada permohonan menunggu tindakan.</td></tr>'
  }</tbody></table></div></section><section class="d-card"><h2>Aktiviti pentadbiran</h2>${activity(submissions)}</section></div><div><section class="d-card"><h2>Aliran penerbitan</h2><ol class="dp-workflow">${[
    [
      "send",
      "Hantar maklumat",
      "Instructor atau institut menghantar permohonan.",
    ],
    ["search", "Semakan", "Maklumat disemak oleh pasukan admin."],
    ["shield", "Pengesahan", "Pengesahan untuk penerbitan di direktori."],
    [
      "checklist",
      "Profile diterbitkan",
      "Profil diluluskan dan dipaparkan di laman awam.",
    ],
  ]
    .map(
      ([ic, t, desc]) =>
        `<li><span class="dp-icon">${icon(ic)}</span><div><strong>${t}</strong><small>${desc}</small></div></li>`,
    )
    .join("")}</ol></section>${quicklinks("admin", [
    ["direktori", "Urus direktori", "book"],
    ["pengguna", "Pengguna & akses", "access"],
  ])}</div></div>`;
}
export function overviewPanel(role, data) {
  if (role === "admin") return adminOverview(data);
  const inst = role === "institut",
    p = profile(data),
    s = rows(data),
    latest = s[0],
    pending = s.filter((r) => ["semakan", "pengesahan"].includes(r.status));
  const metrics = inst
    ? [
        ["people", "Instructor", e((data.instructors || []).length)],
        ...(promotionsEnabled
          ? [
              [
                "megaphone",
                "Promosi & program",
                e(s.filter((r) => r.kind === "program").length),
              ],
            ]
          : [["image", "Galeri", e((p.gallery || []).length) + " gambar"]]),
        [
          "applications",
          "Perubahan profil",
          pill(
            s.find((r) => r.kind === "institut")?.status ||
              "Tiada penghantaran",
          ),
        ],
      ]
    : [
        [
          "person",
          "Profil awam",
          pill(data.profile && !p._hidden ? "diterbitkan" : "draft"),
        ],
        [
          "applications",
          "Perubahan terkini",
          pill(latest?.status || "Tiada penghantaran"),
        ],
        ["image", "Galeri", e((p.gallery || []).length) + " gambar"],
      ];
  const quick = inst
    ? [
        ["profil", "Kemas kini profil", "edit"],
        ...(promotionsEnabled
          ? [["promosi-borang", "Tambah promosi / program", "megaphone"]]
          : []),
        ["foto-galeri", "Urus foto & galeri", "image"],
      ]
    : [
        ["foto-galeri", "Urus foto & galeri", "image"],
        ["profil", "Semak maklumat hubungan", "person"],
      ];
  return `<h2 class="dp-section-title">${inst ? "Ringkasan institut" : "Ringkasan"}</h2>${hero(inst ? p.name || "Institut Memandu" : "Selamat kembali, " + (data.user?.name || "Instructor"), inst ? "Urus profil dan instructor institut anda." : "Urus profil dan perkembangan permohonan anda.")}<div class="dp-stats">${metrics.map(([ic, l, v]) => stat(ic, l, v)).join("")}</div><div class="dp-columns"><section class="d-card"><h2>${inst ? "Tindakan diperlukan" : "Tindakan anda"}</h2><div class="d-notice">${pending.length ? "Permohonan anda sedang disemak." : p._hidden ? "Profil awam anda disembunyikan." : data.profile ? "Profil awam anda telah diterbitkan." : "Lengkapkan profil anda untuk semakan."}</div><div class="d-actions left">${link(root(role) + "/" + (inst ? "instructor" : "profil"), inst ? "Semak instructor" : "Kemas kini profil", "red")}${link(root(role) + "/status-semakan", "Lihat status")}</div><hr><h2>Aktiviti terkini</h2>${activity(s)}</section>${profileCard(role, data)}</div>${quicklinks(role, quick)}`;
}
function chooser(label, type, multiple = false, style = "outline") {
  return `<label class="d-btn ${style} dp-choose">${e(label)}<input aria-label="${e(label)}" type="file" data-media="${type}" accept="image/jpeg,image/png,image/webp" ${multiple ? "multiple" : ""}></label>`;
}

function galleryItem(url, caption = "") {
  return `<figure class="d-card d-gallery-item" data-existing-url="${e(url)}">
    <div class="dm-gallery-media">${url ? image(url, "Gambar galeri") : '<img alt="Gambar galeri">'}
      <div class="dm-gallery-order" aria-label="Susun gambar">
        <button type="button" data-move-media="up" aria-label="Alih gambar ke kiri">←</button>
        <button type="button" data-move-media="down" aria-label="Alih gambar ke kanan">→</button>
      </div>
    </div>
    <label class="d-field"><b>Kapsyen gambar</b><input data-gallery-caption maxlength="240" value="${e(caption)}" placeholder="Kapsyen gambar"></label>
    <div class="dm-gallery-item-actions">${chooser("Ganti gambar", "replace", false, "dm-gallery-replace")}
      <button class="d-btn dm-gallery-delete" type="button" data-remove-media aria-label="Buang gambar">✕</button>
    </div>
  </figure>`;
}

export function galleryPanel(role, data) {
  const institute = role === "institut",
    p = profile(data);
  const latest = rows(data).find(
    (row) =>
      row.kind === "media" && (!row.user_id || row.user_id === data.user?.id),
  );
  const edit =
    latest && ["draft", "pembetulan"].includes(latest.status) ? latest : null;
  const photos =
    edit?.payload?.galleryOrder || (Array.isArray(p.gallery) ? p.gallery : []);
  const priorPhoto = edit?.payload?.images?.findLast(
    (item) => item.type === "profile_photo",
  )?.url;
  const src =
    priorPhoto || (data.demo && institute ? p.galleryLogo || p.photo : p.photo);
  const first = photos[0];
  const firstUrl = typeof first === "string" ? first : first?.url;
  const label = institute ? "Galeri institut" : "Galeri pembelajaran";
  const title = institute ? "Logo, foto & galeri" : "Foto & galeri";
  const feature = (heading, text, url, control, attr) =>
    `<section class="d-card dm-gallery-feature"><h2>${heading}</h2><div ${attr} class="dm-gallery-feature-art">${url ? image(url, heading) : icon(institute ? "institute" : "person")}</div><div><p>${text}</p>${control}</div></section>`;
  return `<div data-gallery-panel class="dm-gallery-panel ${institute ? "dm-gallery-institute" : "dm-gallery-instructor"}" ${edit ? 'data-id="' + e(edit.id) + '"' : ""} ${priorPhoto ? 'data-prior-photo="' + e(priorPhoto) + '"' : ""}>
    <div class="d-hero dp-hero"><div><h1>${title}</h1><p>${institute ? "Perkenalkan suasana dan kemudahan institut anda." : "Urus gambar yang dipaparkan pada profil anda."}</p><i></i></div><img src="/media/branded-axia.webp" alt="">${!institute ? '<a class="d-btn red" href="#muat-naik-galeri">＋ Tambah gambar</a>' : ""}</div>
    <div class="dm-gallery-features">${feature(institute ? "Logo institut" : "Foto profil", institute ? "Logo institut anda dipaparkan pada profil awam institut." : "Gambar utama profil anda.", src, chooser(institute ? "Tukar logo" : "Tukar foto", "profile_photo", false, institute ? "red" : "outline"), "data-profile-photo")}
    ${institute ? feature("Gambar utama", "Gambar utama mewakili institut anda pada profil awam.", firstUrl, chooser("Tukar gambar", "replace_primary", false, "red"), "data-gallery-primary") : ""}</div>
    <section class="dm-gallery-section ${institute ? "d-card" : ""}"><div class="dm-gallery-heading"><h2>${label}</h2><span class="dm-chips"><span data-gallery-count>${photos.length} gambar</span></span></div>
    <div class="d-gallery-preview dp-gallery">${photos
      .map((record) => {
        const url = typeof record === "string" ? record : record.url;
        const caption =
          (typeof record === "object" && record.caption) ||
          p.galleryCaptions?.[url] ||
          "";
        return galleryItem(url, caption);
      })
      .join("")}</div>
    <template data-gallery-template>${galleryItem("")}</template>
    <div id="muat-naik-galeri" class="d-upload dm-gallery-drop">${icon("image")}<div><strong>${institute ? "Tambah gambar institut" : "Seret gambar ke sini"}</strong><small>JPG, PNG atau WebP, maksimum 2 MB setiap gambar.</small></div>${chooser("Pilih gambar", "gallery", true, institute ? "red" : "outline")}</div>
    <div class="dm-gallery-footer"><div class="d-actions"><button class="d-btn outline" data-save-media data-status="draft">Simpan draf</button><button class="d-btn red" data-save-media data-status="semakan">${institute ? "Hantar perubahan" : "Hantar perubahan untuk semakan"}</button></div><p class="dm-soft-note">${icon("help")} ${[true, "true"].includes(p._hidden) ? "Profil ini disembunyikan daripada direktori awam." : "Gambar baharu dipaparkan selepas semakan."}</p></div>
    <p class="d-feedback" aria-live="polite"></p></section></div>`;
}
function programList(data) {
  const programs = rows(data).filter((x) => x.kind === "program");
  if (!data.demo) return programs;
  return [
    "Promosi pengambilan baharu",
    "Taklimat keselamatan jalan raya",
    "Program pengenalan institut",
  ].map((title, i) => ({
    id: programs[i]?.id || "contoh-" + i,
    status: ["draft", "semakan", "diterbitkan"][i],
    payload: {
      title,
      type: i ? "Program institut" : "Promosi IM",
      poster: arts(["promo-intake", "promo-road", "promo-institute"][i]),
    },
  }));
}
export function promotionListPanel(
  data,
  url = new URL("https://example.invalid/"),
) {
  const filter = url.searchParams.get("status") || "",
    items = programList(data).filter((x) => !filter || x.status === filter);
  return `${hero("Promosi & program", "Urus hebahan institut dan program anda.")}<div class="dp-toolbar"><nav class="d-tabs" aria-label="Status promosi">${[
    ["", "Semua"],
    ["draft", "Draf"],
    ["semakan", "Dalam semakan"],
    ["diterbitkan", "Diterbitkan"],
  ]
    .map(([s, l]) => link("?status=" + s, l, s === filter ? "red" : "outline"))
    .join(
      "",
    )}</nav>${link("/dashboard/institut/promosi-borang", "Tambah promosi / program", "red")}</div><div class="dp-posters">${items.map((s) => `<article class="d-card">${cardPhoto(s.payload?.poster, "megaphone")}<h2>${e(titleOf(s))}</h2><div class="dp-row"><span>${e(s.payload?.type || "Program")}</span>${pill(s.status)}</div><p>${icon("clock")} ${displayDate(s.payload?.start || s.payload?.date)}</p>${["draft", "diterbitkan", "pembetulan"].includes(s.status) ? link("/dashboard/institut/promosi-borang?id=" + encodeURIComponent(s.id), s.status === "draft" ? "Sambung sunting" : "Kemas kini") : link("/dashboard/institut/status-semakan", "Lihat status")}</article>`).join("") || '<section class="d-card">Tiada promosi atau program untuk status ini.</section>'}</div><div class="d-card dp-tip">${icon("megaphone")} <span>Lengkapkan tajuk, penerangan, tempoh dan poster sebelum menghantar untuk semakan.</span></div>`;
}
export function promotionFormPanel(data, url) {
  const id = url.searchParams.get("id"),
    record = programList(data).find((x) => x.id === id),
    p = record?.payload || {};
  const input = (name, label, type = "text", wide = false) =>
    `<label class="d-field ${wide ? "wide" : ""}"><b>${label}</b><input name="${name}" type="${type}" value="${e(p[name] || "")}" ${name === "title" ? "required" : ""}></label>`;
  const art =
    data.demo && (!p.poster || p.poster === arts("promo-intake"))
      ? arts("promo-cover")
      : p.poster || "";
  return `${hero("Tambah promosi / program", "Cipta atau kemas kini hebahan institut anda.")}<div class="dp-columns"><form class="d-card d-form" data-submit-kind="program" ${record ? `data-id="${e(record.id)}"` : ""}><div class="d-fields">${input("title", "Tajuk", "text", true)}<label class="d-field wide"><b>Kategori</b><select name="type">${["Promosi IM", "Program institut", "Program khas kerajaan"].map((v) => `<option ${v === p.type ? "selected" : ""}>${v}</option>`).join("")}</select></label><label class="d-field wide"><b>Penerangan</b><textarea name="description">${e(p.description || "")}</textarea></label>${input("start", "Tarikh mula", "date")}${input("end", "Tarikh tamat", "date")}${input("location", "Lokasi / kaedah", "text", true)}${input("reference", "Pautan rujukan", "url", true)}${input("contact", "Maklumat hubungan", "text", true)}<label class="d-field wide"><b>Poster</b><input type="file" accept="image/png,image/jpeg,image/webp" data-poster></label><input type="hidden" name="poster" value="${e(p.poster || "")}"></div><div class="d-actions"><button class="d-btn outline" name="status" value="draft">Simpan draf</button><button class="d-btn red" name="status" value="semakan">Hantar untuk semakan</button></div><p class="d-feedback" aria-live="polite"></p></form><section class="d-card dp-poster-preview"><h2>Pratonton hebahan</h2><img data-poster-preview alt="Poster promosi atau program" ${art ? `src="${e(art)}"` : "hidden"}><strong>${e(p.title || "")}</strong></section></div>`;
}
