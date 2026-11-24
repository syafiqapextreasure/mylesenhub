import { escapeHtml as e } from "./security.js";

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
function hero(asset, title, subtitle, action = "") {
  return `<div class="d-hero dp-hero"><div><h1>${e(title)}</h1><p>${e(subtitle)}</p><i></i></div><img src="${arts(asset)}" alt="" fetchpriority="high">${action}</div>`;
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
      ? pill(data.profile ? "diterbitkan" : "draft")
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
  const submissions = rows(data),
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
      "Hubungan untuk disahkan",
      pending.filter((x) => x.kind === "affiliation").length,
    ],
  ];
  return `<h2 class="dp-section-title">Ringkasan pentadbiran</h2>${hero("dash-12", "Selamat kembali, Admin", "Urus permohonan, semakan dan direktori MyLesenHub.")}<div class="dp-stats dp-four">${metrics.map(([i, l, v]) => stat(i, l, e(v))).join("")}</div><div class="dp-columns"><div><section class="d-card"><div class="dp-row"><h2>Perlu tindakan</h2><a href="/dashboard/admin/permohonan">Lihat semua</a></div><div class="dp-admin-table"><table><thead><tr><th>Permohonan</th><th>Jenis</th><th>Status</th><th>Tindakan</th></tr></thead><tbody>${
    pending
      .slice(0, 4)
      .map(
        (s) =>
          `<tr><td>${e(titleOf(s))}</td><td>${e(kinds[s.kind])}</td><td>${pill(s.status)}</td><td>${link("/dashboard/admin/semakan?id=" + encodeURIComponent(s.id), "Semak", "red")}</td></tr>`,
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
        [
          "megaphone",
          "Promosi & program",
          e(s.filter((r) => r.kind === "program").length),
        ],
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
        ["person", "Profil awam", pill(data.profile ? "diterbitkan" : "draft")],
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
        ["promosi-borang", "Tambah promosi / program", "megaphone"],
        ["foto-galeri", "Urus foto & galeri", "image"],
      ]
    : [
        ["foto-galeri", "Urus foto & galeri", "image"],
        ["profil", "Semak maklumat hubungan", "person"],
      ];
  return `<h2 class="dp-section-title">${inst ? "Ringkasan institut" : "Ringkasan"}</h2>${hero(inst ? "dash-05" : "dash-01", inst ? p.name || "Institut Memandu" : "Selamat kembali, " + (data.user?.name || "Instructor"), inst ? "Urus profil, instructor dan program institut anda." : "Urus profil dan perkembangan permohonan anda.")}<div class="dp-stats">${metrics.map(([ic, l, v]) => stat(ic, l, v)).join("")}</div><div class="dp-columns"><section class="d-card"><h2>${inst ? "Tindakan diperlukan" : "Tindakan anda"}</h2><div class="d-notice">${pending.length ? "Permohonan anda sedang disemak." : data.profile ? "Profil awam anda telah diterbitkan." : "Lengkapkan profil anda untuk semakan."}</div><div class="d-actions left">${link(root(role) + "/" + (inst ? "instructor" : "profil"), inst ? "Semak instructor" : "Kemas kini profil", "red")}${link(root(role) + "/status-semakan", "Lihat status")}</div><hr><h2>Aktiviti terkini</h2>${activity(s)}</section>${profileCard(role, data)}</div>${quicklinks(role, quick)}`;
}
function chooser(label, type, multiple = false) {
  return `<label class="d-btn outline dp-choose">${e(label)}<input type="file" data-media="${type}" accept="image/jpeg,image/png,image/webp" ${multiple ? "multiple" : ""}></label>`;
}
export function galleryPanel(role, data) {
  const inst = role === "institut",
    p = profile(data),
    existing = Array.isArray(p.gallery) ? p.gallery : [],
    demo = data.demo;
  const label = inst ? "Galeri institut" : "Galeri pembelajaran",
    sample = inst
      ? ["institute-car", "institute-pair", "institute-track"]
      : ["profile-lesson", "profile-car", "profile-coaching"];
  const photos = existing.length ? existing : demo ? sample.map(arts) : [];
  const src = p.photo || (demo ? arts(inst ? "institute-logo" : "daniel") : "");
  const top = `<section class="d-card dp-gallery-head"><div>${src ? image(src, inst ? "Logo institut" : "Foto profil", "dp-thumb") : icon(inst ? "institute" : "person")}</div><div><h2>${inst ? "Logo institut" : "Foto profil"}</h2><p>Gambar yang dipaparkan pada profil anda.</p>${chooser(inst ? "Tukar logo" : "Tukar foto", "profile_photo")}</div></section>`;
  const secondary = inst
    ? `<section class="d-card dp-gallery-head"><div>${photos[0] ? image(typeof photos[0] === "string" ? photos[0] : photos[0].url, "Gambar utama institut", "dp-thumb") : icon("image")}</div><div><h2>Gambar utama</h2><p>Gambar yang mewakili aktiviti institut anda.</p><a class="d-btn outline" href="#muat-naik-galeri">Tambah gambar</a></div></section>`
    : "";
  return `<div data-gallery-panel>${hero(inst ? "dash-07" : "dash-03", inst ? "Logo, foto & galeri" : "Foto & galeri", inst ? "Perkenalkan suasana dan kemudahan institut anda." : "Urus gambar yang dipaparkan pada profil anda.")}<div class="dp-gallery-heads ${inst ? "dp-two" : ""}">${top}${secondary}</div><section class="d-card"><h2>${label}</h2><div class="d-gallery-preview dp-gallery">${photos
    .map((record, i) => {
      const url = typeof record === "string" ? record : record.url;
      return `<figure class="d-gallery-item" data-existing-url="${e(url)}">${image(url, "Gambar galeri " + (i + 1))}<label class="d-field"><b>Kapsyen gambar</b><input data-gallery-caption value="${e((typeof record === "object" && record.caption) || p.galleryCaptions?.[url] || "")}" placeholder="Kapsyen gambar"></label><div class="dp-gallery-actions"><button type="button" class="d-btn outline" data-move-media="up" aria-label="Alih gambar ke kiri">←</button><button type="button" class="d-btn outline" data-move-media="down" aria-label="Alih gambar ke kanan">→</button></div><button class="d-btn outline" type="button" data-remove-media>Buang gambar</button></figure>`;
    })
    .join(
      "",
    )}</div><div id="muat-naik-galeri" class="d-upload">${icon("image")}<strong>Tambah gambar ke galeri</strong><small>JPG, PNG atau WebP, maksimum 2 MB setiap gambar.</small>${chooser("Pilih gambar", "gallery", true)}</div><div class="d-actions"><p class="d-feedback" aria-live="polite"></p><button class="d-btn outline" data-save-media data-status="draft">Simpan draf</button><button class="d-btn red" data-save-media data-status="semakan">Hantar untuk semakan</button></div></section></div>`;
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
  return `${hero("dash-09", "Promosi & program", "Urus hebahan institut dan program anda.")}<div class="dp-toolbar"><nav class="d-tabs" aria-label="Status promosi">${[
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
  return `${hero("dash-10", "Tambah promosi / program", "Cipta atau kemas kini hebahan institut anda.")}<div class="dp-columns"><form class="d-card d-form" data-submit-kind="program" ${record ? `data-id="${e(record.id)}"` : ""}><div class="d-fields">${input("title", "Tajuk", "text", true)}<label class="d-field wide"><b>Kategori</b><select name="type">${["Promosi IM", "Program institut", "Program khas kerajaan"].map((v) => `<option ${v === p.type ? "selected" : ""}>${v}</option>`).join("")}</select></label><label class="d-field wide"><b>Penerangan</b><textarea name="description">${e(p.description || "")}</textarea></label>${input("start", "Tarikh mula", "date")}${input("end", "Tarikh tamat", "date")}${input("location", "Lokasi / kaedah", "text", true)}${input("reference", "Pautan rujukan", "url", true)}${input("contact", "Maklumat hubungan", "text", true)}<label class="d-field wide"><b>Poster</b><input type="file" accept="image/png,image/jpeg,image/webp" data-poster></label><input type="hidden" name="poster" value="${e(p.poster || "")}"></div><div class="d-actions"><button class="d-btn outline" name="status" value="draft">Simpan draf</button><button class="d-btn red" name="status" value="semakan">Hantar untuk semakan</button></div><p class="d-feedback" aria-live="polite"></p></form><section class="d-card dp-poster-preview"><h2>Pratonton hebahan</h2><img data-poster-preview alt="Poster promosi atau program" ${art ? `src="${e(art)}"` : "hidden"}><strong>${e(p.title || "")}</strong></section></div>`;
}
