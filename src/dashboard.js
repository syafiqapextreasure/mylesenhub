import {
  overviewPanel,
  galleryPanel,
  promotionListPanel,
  promotionFormPanel,
} from "./dashboard-panels.js";
const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );

const configs = {
  instructor: [
    ["ringkasan", "Ringkasan", "home"],
    ["profil", "Profil saya", "person"],
    ["foto-galeri", "Foto & galeri", "image"],
    ["status-semakan", "Status semakan", "checklist"],
  ],
  institut: [
    ["ringkasan", "Ringkasan", "home"],
    ["profil", "Profil institut", "person"],
    ["foto-galeri", "Foto & galeri", "image"],
    ["instructor", "Instructor institut", "people"],
    ["promosi", "Promosi & program", "megaphone"],
    ["status-semakan", "Status semakan", "checklist"],
  ],
  admin: [
    ["ringkasan", "Ringkasan", "home"],
    ["permohonan", "Permohonan", "applications"],
    ["direktori", "Direktori", "book"],
    ["pengguna", "Pengguna & akses", "access"],
    ["pembetulan", "Pembetulan", "wrench"],
  ],
};

const titles = {
  instructor: {
    ringkasan: "Ringkasan",
    profil: "Profil saya",
    "foto-galeri": "Foto & galeri",
    "status-semakan": "Status semakan",
  },
  institut: {
    ringkasan: "Ringkasan",
    profil: "Profil institut",
    "foto-galeri": "Foto & galeri",
    instructor: "Instructor institut",
    promosi: "Promosi & program",
    "promosi-borang": "Borang promosi & program",
    "status-semakan": "Status semakan",
  },
  admin: {
    ringkasan: "Ringkasan",
    permohonan: "Permohonan & semakan",
    semakan: "Butiran semakan & pengesahan",
    direktori: "Pengurusan direktori",
    pengguna: "Pengguna & akses",
    pembetulan: "Pembetulan & permintaan pemadaman",
  },
};

const numbers = {
  instructor: {
    ringkasan: 1,
    profil: 2,
    "foto-galeri": 3,
    "status-semakan": 4,
  },
  institut: {
    ringkasan: 5,
    profil: 6,
    "foto-galeri": 7,
    instructor: 8,
    promosi: 9,
    "promosi-borang": 10,
    "status-semakan": 11,
  },
  admin: {
    ringkasan: 12,
    permohonan: 13,
    semakan: 14,
    direktori: 15,
    pengguna: 16,
    pembetulan: 17,
  },
};

const statusLabel = {
  draft: "Draf",
  semakan: "Menunggu semakan",
  pengesahan: "Pengesahan",
  diterbitkan: "Diterbitkan",
  pembetulan: "Perlu pembetulan",
};

const pill = (s) =>
  `<span class="d-pill d-${esc(s || "draft")}">${esc(statusLabel[s] || s || "Belum dihantar")}</span>`;

const link = (url, label, style = "outline") =>
  `<a class="d-btn ${style}" href="${url}">${label}</a>`;

const card = (content, cls = "") =>
  `<section class="d-card ${cls}">${content}</section>`;

const title = (heading, desc, role, slug) =>
  `<div class="d-hero"><div><h1>${heading}</h1><p>${desc}</p><i></i></div><img src="/media/dash-${String(numbers[role][slug]).padStart(2, "0")}.webp" alt=""></div>`;

const field = (name, label, value = "", type = "text", opts = {}) =>
  `<label class="d-field ${opts.wide ? "wide" : ""}"><b>${label}${opts.required ? " <em>*</em>" : ""}</b>${type === "textarea" ? `<textarea name="${name}" ${opts.required ? "required" : ""}>${esc(value)}</textarea>` : type === "select" ? `<select name="${name}" ${opts.required ? "required" : ""}>${["", ...(opts.options || [])].map((v) => `<option value="${esc(v)}" ${v === value ? "selected" : ""}>${esc(v || "Sila pilih")}</option>`).join("")}</select>` : `<input name="${name}" type="${type}" value="${esc(value)}" placeholder="${esc(opts.placeholder || "")}" ${opts.required ? "required" : ""}>`}</label>`;

const base = (r) => `/dashboard/${r}`;

const table = (heads, rows, empty = "Tiada rekod buat masa ini.") =>
  `<div class="d-table-wrap"><table><thead><tr>${heads.map((x) => `<th>${x}</th>`).join("")}</tr></thead><tbody>${rows.length ? rows.join("") : `<tr><td colspan="${heads.length}" class="d-empty">${empty}</td></tr>`}</tbody></table></div>`;

const detail = (s) =>
  `<strong>${esc(s.payload?.name || s.payload?.title || s.kind)}</strong><small>${esc(s.kind)}</small>`;

const icon = (name) =>
  `<span class="d-icon" aria-hidden="true" style="mask-image:url(/media/icon-${name}.webp)"></span>`;

const photo = (p, role) =>
  p.photo
    ? `<img src="${esc(p.photo)}" alt="">`
    : icon(
        role === "institut"
          ? "institute"
          : role === "admin"
            ? "access"
            : "person",
      );

const shortDate = (s) => (s ? esc(String(s).slice(0, 10)) : "—");

function shell(role, slug, data, content) {
  const user = data.user || {},
    root = base(role),
    active =
      slug === "promosi-borang"
        ? "promosi"
        : slug === "semakan"
          ? "permohonan"
          : slug;
  return `<div class="dashboard"><aside class="d-sidebar"><a class="d-logo" href="/">mylesen<span>Hub</span></a><div class="d-role"><span class="d-icon" style="mask-image:url(/media/icon-${role === "institut" ? "institute" : "person"}.webp)"></span> &nbsp; ${role === "institut" ? "Institut Memandu" : role === "admin" ? "Admin" : "Instructor"}</div><div class="d-person"><div class="d-avatar">${esc((user.name || "A").slice(0, 1).toUpperCase())}</div><strong>${esc(user.name || "Akaun saya")}</strong></div><nav>${configs[role].map(([s, l, i]) => `<a class="${active === s ? "active" : ""}" href="${root}/${s}"><span class="d-icon" style="mask-image:url(/media/icon-${i}.webp)"></span>${l}</a>`).join("")}</nav><div class="d-sidebottom"><a href="/">↗ &nbsp; Lihat laman awam</a><button type="button" data-logout>⇥ &nbsp; Log keluar</button><a href="/hubungi">ⓘ &nbsp; Perlukan bantuan?</a></div></aside><div class="d-main"><header class="d-top"><div>Utama <span>/</span> ${esc(role === "institut" ? "Institut Memandu" : role === "admin" ? "Admin" : "Instructor")} <span>/</span> ${esc(titles[role][slug])} ${data.demo ? '<b class="d-demo">Data contoh</b>' : ""}</div><strong>${esc(user.name || "Akaun saya")} ﹀</strong></header><main class="d-content">${content}</main><footer><strong>MyLesenHub</strong>　 •　 Johor & Melaka <div><a href="/privasi">Privasi</a>　 |　 <a href="/terma">Terma</a></div></footer></div></div>`;
}

function profileForm(role, data) {
  let p = data.profile?.payload || data.profile || {},
    inst = role === "institut";
  let fields = inst
    ? [
        ["name", "Nama Institut Memandu"],
        ["state", "Negeri"],
        ["district", "Daerah"],
        ["postcode", "Poskod"],
        ["address", "Alamat institut", "textarea"],
        ["classes", "Kelas ditawarkan"],
        ["maps", "Pautan lokasi"],
        ["representative", "Nama wakil"],
        ["position", "Jawatan"],
        ["email", "E-mel rasmi", "email"],
        ["phone", "Nombor telefon"],
        ["bio", "Pengenalan ringkas", "textarea"],
      ]
    : [
        ["fullName", "Nama penuh"],
        ["name", "Nama paparan"],
        ["email", "E-mel", "email"],
        ["phone", "Nombor untuk dihubungi"],
        ["state", "Negeri"],
        ["district", "Daerah"],
        ["institute", "Institut Memandu"],
        ["languages", "Bahasa"],
        ["spim", "Kelas SPIM"],
        ["experience", "Experience"],
        ["other", "Other"],
        ["bio", "Pengenalan ringkas", "textarea"],
      ];
  return `<div class="d-columns"><form class="d-card d-form" data-submit-kind="${role}"><div class="d-notice">ⓘ &nbsp; Perubahan dihantar untuk semakan sebelum diterbitkan.</div><h2>${inst ? "Maklumat institut" : "Maklumat asas"}</h2><div class="d-fields">${fields.map(([n, l, t]) => (["classes", "spim"].includes(n) ? `<fieldset class="d-field d-class-field"><legend><b>${l}</b></legend><div>${["B", "B2", "D", "DA", "QTI"].map((c) => `<label><input type="checkbox" name="${n}" value="${c}" ${(Array.isArray(p[n]) ? p[n] : String(p[n] || "").split(/[, ]+/)).includes(c) ? "checked" : ""}> ${c}</label>`).join("")}</div></fieldset>` : field(n, l, p[n] || "", t || "text", { wide: t === "textarea", required: ["name"].includes(n) }))).join("")}</div><div class="d-actions"><button class="d-btn outline" name="status" value="draft">Simpan draf</button><button class="d-btn red" name="status" value="semakan">Hantar untuk semakan</button></div><p class="d-feedback" aria-live="polite"></p></form>${card(`<h2>Profil awam</h2><div class="d-image-placeholder">${photo(p, role)}</div><h2>${esc(p.name || "Profil anda")}</h2>${pill(data.profile ? "diterbitkan" : "draft")}<p>Versi yang diluluskan kekal dipaparkan semasa semakan.</p>${link(base(role) + "/foto-galeri", "Urus foto & galeri")}`)}</div>`;
}

function gallery(role, data) {
  const p = data.profile?.payload || data.profile || {},
    items = Array.isArray(p.gallery) ? p.gallery : [];
  return `<div class="d-notice">${icon("shield")} &nbsp; Foto yang dihantar akan disemak sebelum diterbitkan.</div><div class="d-gallery-top">${card(`<h2>${role === "institut" ? "Logo / foto utama" : "Foto profil"}</h2><div class="d-gallery-feature"><div class="d-image-placeholder">${photo(p, role)}</div><div><p>Gambar utama untuk profil awam anda.</p><label class="d-btn outline">Tukar foto <input class="d-file" type="file" accept="image/jpeg,image/png,image/webp" data-media="profile_photo"></label></div></div>`)}${card(`<h2>Tambah gambar</h2><p>Tambah gambar untuk memaparkan aktiviti dan kemudahan anda.</p><div class="d-upload">${icon("image")}<strong>Pilih gambar untuk galeri</strong><small>JPG, PNG atau WebP, maksimum 2 MB setiap gambar</small><input type="file" accept="image/jpeg,image/png,image/webp" multiple data-media="gallery"></div>`)}</div>${card(
    `<h2>Galeri ${role === "institut" ? "institut" : "pembelajaran"}</h2><div class="d-gallery-preview">${items
      .map((img) => {
        let u = typeof img === "string" ? img : img.url;
        return `<div class="d-gallery-item" data-existing-url="${esc(u)}"><img src="${esc(u)}" alt="Gambar galeri"><button type="button" class="d-btn outline" data-remove-media>Buang gambar</button></div>`;
      })
      .join(
        "",
      )}</div><div class="d-actions"><button class="d-btn outline" data-save-media data-status="draft">Simpan draf</button><button class="d-btn red" data-save-media data-status="semakan">Hantar untuk semakan</button></div><p class="d-feedback" aria-live="polite"></p>`,
  )}`;
}

function statusPage(data, role, url) {
  let all = data.submissions || [],
    kind = url.searchParams.get("kind") || "",
    s = kind ? all.filter((x) => x.kind === kind) : all,
    latest = s.find((x) => String(x.id) === url.searchParams.get("id")) || s[0],
    step =
      { draft: 0, semakan: 1, pengesahan: 2, diterbitkan: 3, pembetulan: 1 }[
        latest?.status
      ] ?? -1;
  return `<div class="d-notice">${icon("shield")} &nbsp; Versi yang diluluskan kekal dipaparkan sementara perubahan disemak.</div>${
    role === "institut"
      ? `<div class="d-tabs">${[
          ["", "Semua"],
          ["institut", "Profil institut"],
          ["program", "Promosi & program"],
        ]
          .map(([v, l]) =>
            link("?kind=" + v, l, kind === v ? "red" : "outline"),
          )
          .join("")}</div>`
      : ""
  }${card(
    `<h2>Sejarah penghantaran</h2>${table(
      ["Perkara", "Dihantar", "Status", "Tindakan"],
      s.map(
        (x) =>
          `<tr><td>${detail(x)}</td><td>${shortDate(x.created_at)}</td><td>${pill(x.status)}</td><td>${link("?kind=" + encodeURIComponent(kind) + "&id=" + encodeURIComponent(x.id), "Lihat butiran")}</td></tr>`,
      ),
    )}`,
  )}${latest ? card(`<h2>Perkembangan permohonan</h2><p>${detail(latest)}</p><div class="d-steps">${["Dihantar", "Semakan", "Pengesahan", "Diterbitkan"].map((x, i) => `<div class="${i <= step ? "completed" : ""}"><b>${i + 1}</b><strong>${x}</strong></div>`).join("")}</div><div class="d-columns"><div><h3>Maklumat dihantar</h3><p>${esc(latest.payload?.title || latest.payload?.name || latest.kind)}</p></div><div><h3>Nota pasukan</h3><p>${esc(latest.note || "Belum ada maklum balas baharu.")}</p></div></div>`) : ""}`;
}
function dashboardHome(role, data) {
  let s = data.submissions || [],
    latest = s[0],
    p = data.profile?.payload || data.profile || {},
    name = data.user?.name || "anda";
  return `${title("Selamat kembali, " + esc(name), "Urus profil dan perkembangan permohonan anda.", role, "ringkasan")}<div class="d-stats">${[
    ["Profil awam", data.profile ? "Diterbitkan" : "Belum diterbitkan"],
    ["Perubahan terkini", statusLabel[latest?.status] || "Tiada penghantaran"],
    [role === "admin" ? "Permohonan" : "Aktiviti", String(s.length)],
  ]
    .map(([a, b]) =>
      card(
        `<span class="d-stat-icon">▤</span><div><strong>${a}</strong><p>${esc(b)}</p></div>`,
      ),
    )
    .join("")}</div><div class="d-columns">${card(
    `<h2>${role === "admin" ? "Tindakan pentadbiran" : "Tindakan anda"}</h2><div class="d-notice">ⓘ &nbsp; ${latest ? "Status terkini: " + esc(statusLabel[latest.status] || latest.status) : "Mulakan dengan melengkapkan maklumat anda."}</div><div class="d-actions left">${link(base(role) + "/" + (role === "admin" ? "permohonan" : "profil"), role === "admin" ? "Lihat permohonan" : "Kemas kini profil", "red")}${link(base(role) + "/" + (role === "admin" ? "direktori" : "status-semakan"), "Lihat status")}</div><hr><h2>Aktiviti terkini</h2>${
      s.length
        ? s
            .slice(0, 4)
            .map(
              (x) =>
                `<div class="d-activity">▤ <strong>${esc(x.payload?.title || x.kind)}</strong> ${pill(x.status)} <span>${shortDate(x.updated_at || x.created_at)}</span></div>`,
            )
            .join("")
        : "<p>Tiada aktiviti terkini.</p>"
    }`,
  )}${card(`<div class="d-image-placeholder">${role === "institut" ? "▥" : role === "admin" ? "⚙" : "♙"}</div><h2>${esc(p.name || name)}</h2><p>${esc(p.district || "")} ${esc(p.state || "")}</p>${pill(data.profile ? "diterbitkan" : "draft")}<p>Maklumat akaun dan profil anda.</p>${link(base(role) + "/" + (role === "admin" ? "pengguna" : "profil"), "Lihat maklumat")}`)}</div><div class="d-quicklinks">${(role ===
  "admin"
    ? [
        ["permohonan", "Semak permohonan", "applications"],
        ["direktori", "Urus direktori", "book"],
        ["pembetulan", "Permintaan pembetulan", "wrench"],
      ]
    : role === "institut"
      ? [
          ["profil", "Kemas kini profil", "edit"],
          ["promosi-borang", "Tambah promosi / program", "megaphone"],
          ["foto-galeri", "Urus foto & galeri", "image"],
        ]
      : [
          ["foto-galeri", "Urus foto & galeri", "image"],
          ["profil", "Semak maklumat hubungan", "person"],
        ]
  )
    .map(
      ([path, label, ic]) =>
        `<a class="d-card" href="${base(role)}/${path}">${icon(ic)}<strong>${label}</strong><span>></span></a>`,
    )
    .join("")}</div>`;
}

function adminTable(slug, data, url) {
  let rows = data.submissions || [];
  if (slug === "pembetulan")
    rows = rows.filter(
      (x) => x.kind === "correction" || x.status === "pembetulan",
    );
  let q = (url.searchParams.get("q") || "").toLowerCase(),
    st = url.searchParams.get("status") || "",
    kind = url.searchParams.get("kind") || "",
    state = url.searchParams.get("state") || "";
  const states = [
    ...new Set(rows.map((x) => x.payload?.state).filter(Boolean)),
  ].sort();
  rows = rows.filter(
    (x) =>
      (!q ||
        JSON.stringify(x.payload || {})
          .toLowerCase()
          .includes(q)) &&
      (!st || x.status === st) &&
      (!kind || x.kind === kind) &&
      (!state || x.payload?.state === state),
  );
  let page = Math.max(
      1,
      Math.min(
        Math.ceil(rows.length / 5) || 1,
        Number(url.searchParams.get("page")) || 1,
      ),
    ),
    pages = Math.ceil(rows.length / 5) || 1;
  let pageLink = (n) => {
    let p = new URLSearchParams(url.searchParams);
    p.set("page", n);
    return "?" + p;
  };
  return `<form class="d-filter"><input name="q" placeholder="Cari nama atau institut" value="${esc(url.searchParams.get("q") || "")}"><select name="kind"><option value="">Jenis: Semua</option>${["instructor", "institut", "program", "affiliation", "correction", "media"].map((k) => `<option value="${k}" ${kind === k ? "selected" : ""}>${k}</option>`).join("")}</select><select name="state"><option value="">Negeri: Semua</option>${states.map((x) => `<option value="${esc(x)}" ${state === x ? "selected" : ""}>${esc(x)}</option>`).join("")}</select><select name="status"><option value="">Status: Semua</option>${Object.entries(
    statusLabel,
  )
    .map(
      ([k, v]) =>
        `<option value="${k}" ${k === st ? "selected" : ""}>${v}</option>`,
    )
    .join(
      "",
    )}</select><button class="d-btn outline">Cari</button></form><div class="d-tabs">${[
    ["", "Semua"],
    ["semakan", "Semakan"],
    ["pengesahan", "Pengesahan"],
    ["pembetulan", "Perlu pembetulan"],
  ]
    .map(([v, l]) => {
      let p = new URLSearchParams(url.searchParams);
      p.set("status", v);
      p.delete("page");
      return link("?" + p, l, st === v ? "red" : "outline");
    })
    .join("")}</div>${card(
    table(
      ["Pemohon / Tajuk", "Jenis", "Dihantar", "Status", "Tindakan"],
      rows
        .slice((page - 1) * 5, page * 5)
        .map(
          (x) =>
            `<tr><td>${detail(x)}</td><td>${esc(x.kind)}</td><td>${shortDate(x.created_at)}</td><td>${pill(x.status)}</td><td>${link(base("admin") + "/semakan?id=" + encodeURIComponent(x.id), "Buka semakan", "red")}</td></tr>`,
        ),
    ) +
      `<div class="d-pagination"><span>Menunjukkan ${rows.length ? (page - 1) * 5 + 1 : 0}–${Math.min(page * 5, rows.length)} daripada ${rows.length}</span><nav aria-label="Halaman permohonan">${Array.from({ length: pages }, (_, i) => link(pageLink(i + 1), String(i + 1), page === i + 1 ? "red" : "outline")).join(" ")}</nav></div>`,
  )}`;
}
function renderDashboard(path, url, data = {}) {
  const match = path.match(
    /^\/dashboard\/(instructor|institut|admin)(?:\/([^/]+))?\/?$/,
  );
  if (!match) return null;
  const role = match[1],
    slug = match[2] || "ringkasan";
  if (!titles[role][slug]) return null;
  url =
    url instanceof URL
      ? url
      : new URL(url || "http://localhost" + path, "http://localhost");
  let heading = titles[role][slug],
    desc =
      {
        profil: "Kemas kini maklumat untuk profil awam anda.",
        "foto-galeri": "Urus foto dan galeri anda.",
        "status-semakan": "Jejak perkembangan semakan dan penerbitan.",
        instructor: "Urus hubungan instructor dengan institut anda.",
        promosi: "Urus promosi dan program institut anda.",
        "promosi-borang": "Tambah atau kemas kini promosi dan program.",
        permohonan: "Semak profil baharu dan permohonan perubahan.",
        semakan: "Semak maklumat sebelum pengesahan dan penerbitan.",
        direktori: "Urus profil dalam direktori awam.",
        pengguna: "Urus peranan dan akses pengguna.",
        pembetulan: "Semak permintaan pembetulan dan pemadaman.",
      }[slug] || "";
  let content = "";
  if (slug === "ringkasan") content = overviewPanel(role, data);
  else if (slug === "foto-galeri") content = galleryPanel(role, data);
  else if (slug === "promosi") content = promotionListPanel(data, url);
  else if (slug === "promosi-borang") content = promotionFormPanel(data, url);
  else {
    content = title(heading, desc, role, slug);
    if (slug === "profil") content += profileForm(role, data);
    else if (slug === "foto-galeri") content += gallery(role, data);
    else if (slug === "status-semakan") content += statusPage(data, role, url);
    else if (role === "admin" && ["permohonan", "pembetulan"].includes(slug)) {
      content += adminTable(slug, data, url);
      if (slug === "pembetulan")
        content += card(
          `<h2>Mesej diterima</h2>${table(
            ["Nama / E-mel", "Subjek", "Mesej", "Tarikh"],
            (data.messages || []).map(
              (m) =>
                `<tr><td><strong>${esc(m.name)}</strong><small>${esc(m.email)}</small></td><td>${esc(m.subject)}</td><td>${esc(m.message)}</td><td>${shortDate(m.created_at)}</td></tr>`,
            ),
            "Tiada mesej diterima.",
          )}`,
        );
    } else if (slug === "semakan") {
      let s = (data.submissions || []).find(
        (x) => String(x.id) === url.searchParams.get("id"),
      );
      content += s
        ? `<div class="d-steps">${["Dihantar", "Semakan", "Pengesahan", "Diterbitkan"].map((label, i) => `<div><b>${i + 1}</b><strong>${label}</strong></div>`).join("")}</div><div class="d-columns">${card(
            `<h2>Perbandingan maklumat</h2>${(data.profile?.payload || data.profile || {}).photo ? `<div class="d-review-photo"><img src="${esc((data.profile?.payload || data.profile).photo)}" alt="Foto profil awam"></div>` : ""}<p>${detail(s)}</p>${pill(s.status)}<div class="d-table-wrap d-comparison"><table><thead><tr><th>Maklumat</th><th>Versi awam</th><th>Perubahan dihantar</th></tr></thead><tbody>${Object.entries(
              s.payload || {},
            )
              .map(
                ([key, value]) =>
                  `<tr><td>${esc(key.replaceAll("_", " "))}</td><td>${esc((data.profile?.payload || data.profile || {})[key] ?? "—")}</td><td>${esc(Array.isArray(value) ? value.join(", ") : value)}</td></tr>`,
              )
              .join("")}</tbody></table></div>`,
          )}${card(`<h2>Senarai semakan</h2><p>Semak maklumat dan sahkan pemilik sebelum menerbitkan.</p><ul class="d-checklist"><li>Maklumat profil dan butiran hubungan</li><li>Perbandingan dengan versi awam</li><li>Pengesahan pemilik dan kandungan</li></ul><h2>Tindakan semakan</h2><form data-review="${esc(s.id)}"><label class="d-field"><b>Nota semakan</b><textarea name="note"></textarea></label><div class="d-actions left">${["semakan", "pengesahan"].includes(s.status) ? '<button class="d-btn outline" name="action" value="return">Minta pembetulan</button>' : ""}${s.status === "semakan" ? '<button class="d-btn red" name="action" value="verify">Sahkan</button>' : ""}${s.status === "pengesahan" ? '<button class="d-btn red" name="action" value="publish">Terbitkan</button>' : ""}</div><p class="d-feedback" aria-live="polite"></p></form>`)}</div>`
        : card("<p>Permohonan tidak ditemui.</p>");
    } else if (slug === "direktori") {
      let rows = [
        ...(data.instructors || []).map((x) => ({ ...x, _type: "Instructor" })),
        ...(data.institutes || []).map((x) => ({ ...x, _type: "Institut" })),
      ];
      content += card(
        `<h2>Direktori awam</h2><p>Profil yang diterbitkan dalam direktori.</p>${table(
          ["Nama", "Jenis", "Lokasi", "Tindakan"],
          rows.map(
            (x) =>
              `<tr><td>${esc(x.name || x.display_name || "—")}</td><td>${x._type}</td><td>${esc(x.district || x.state || "—")}</td><td>${x.id ? `<form data-directory="${esc(x.id)}"><button class="d-btn outline">Tarik balik</button><span class="d-feedback"></span></form>` : "—"}</td></tr>`,
          ),
        )}`,
      );
    } else if (slug === "pengguna")
      content += `<div class="d-columns">${card(
        `<h2>Senarai pengguna</h2>${table(
          ["Nama", "E-mel", "Peranan", "Tindakan"],
          (data.users || []).map(
            (x) =>
              `<tr><td>${esc(x.name)}</td><td>${esc(x.email)}</td><td>${esc(x.role)}</td><td><form data-access="${esc(x.id)}"><select name="role">${["instructor", "institut", "admin"].map((r) => `<option ${r === x.role ? "selected" : ""}>${r}</option>`).join("")}</select> <button class="d-btn outline">Simpan</button><span class="d-feedback"></span></form></td></tr>`,
          ),
        )}`,
      )}${card(`<h2>Peranan & akses</h2><p>Pilih peranan yang sesuai untuk setiap pengguna.</p><ul class="d-checklist"><li>Instructor mengurus profil sendiri.</li><li>Wakil institut mengurus institut sendiri.</li><li>Admin menyemak dan menerbitkan kandungan.</li></ul>`)}</div>`;
    else if (slug === "instructor")
      content += `<div class="d-columns">${card(
        `<h2>Instructor institut</h2><p>Hubungan instructor dengan institut anda.</p>${table(
          ["Nama", "Lokasi", "Tindakan"],
          (data.instructors || []).map(
            (x) =>
              `<tr><td>${esc(x.name || x.display_name)}</td><td>${esc(x.district || "—")}</td><td>${x.id ? `<form data-affiliation><input type="hidden" name="instructorId" value="${esc(x.id)}"><input type="hidden" name="action" value="unlink"><button class="d-btn outline">Mohon buang hubungan</button><span class="d-feedback"></span></form>` : "—"}</td></tr>`,
          ),
        )}`,
      )}${card(
        `<h2>Tambah hubungan instructor</h2><p>Permintaan akan dihantar kepada admin untuk semakan.</p><form data-affiliation><label class="d-field"><b>Instructor</b><select name="instructorId" required><option value="">Sila pilih</option>${(data.availableInstructors || []).map((x) => `<option value="${esc(x.id)}">${esc(x.name || x.display_name)}</option>`).join("")}</select></label><input type="hidden" name="action" value="link"><button class="d-btn red">Hantar permintaan</button><p class="d-feedback" aria-live="polite"></p></form><h3>Permintaan hubungan</h3>${
          (data.submissions || [])
            .filter((x) => x.kind === "affiliation")
            .map(
              (x) => `<p>${esc(x.payload?.instructorId)} ${pill(x.status)}</p>`,
            )
            .join("") || "<p>Tiada permintaan.</p>"
        }`,
      )}</div>`;
    else if (slug === "promosi")
      content += `<div class="d-actions">${link(base(role) + "/promosi-borang", "＋ Tambah promosi / program", "red")}</div>${card(
        `<h2>Senarai promosi & program</h2>${table(
          ["Tajuk", "Status", "Tindakan"],
          (data.submissions || [])
            .filter((x) => x.kind === "program")
            .map(
              (x) =>
                `<tr><td>${detail(x)}</td><td>${pill(x.status)}</td><td>${link(base(role) + "/promosi-borang?id=" + encodeURIComponent(x.id), "Kemas kini")}</td></tr>`,
            ),
        )}`,
      )}`;
    else if (slug === "promosi-borang") {
      let s = (data.submissions || []).find(
          (x) =>
            String(x.id) === url.searchParams.get("id") && x.kind === "program",
        ),
        p = s?.payload || {};
      content += `<form class="d-card d-form" data-submit-kind="program" ${s ? `data-id="${esc(s.id)}"` : ""}><h2>Maklumat promosi & program</h2><div class="d-fields">${field("title", "Tajuk", p.title, "text", { required: true, wide: true })}${field("type", "Jenis", p.type, "select", { options: ["Promosi", "Program"] })}${field("date", "Tarikh", p.date, "date")}${field("description", "Penerangan", p.description, "textarea", { wide: true })}${field("contact", "Maklumat hubungan", p.contact, "text", { wide: true })}</div><div class="d-actions"><button class="d-btn outline" name="status" value="draft">Simpan draf</button><button class="d-btn red" name="status" value="semakan">Hantar untuk semakan</button></div><p class="d-feedback" aria-live="polite"></p></form>`;
    }
  }

  return shell(role, slug, data, content);
}

export { renderDashboard };
