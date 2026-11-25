import {
  applications as adminApplications,
  reviewView as adminReview,
  directory as adminDirectory,
  users as adminUsers,
  adminMessages,
} from "./dashboard-admin.js";
import { promotionsEnabled, isPausedPromotionPage } from "./features.js";
import {
  overviewPanel,
  galleryPanel,
  promotionListPanel,
  promotionFormPanel,
} from "./dashboard-panels.js";
import {
  memberProfile,
  memberProfileAction,
  memberStatus,
  memberAffiliations,
} from "./dashboard-members.js";
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
    ...(promotionsEnabled
      ? [["promosi", "Promosi & program", "megaphone"]]
      : []),
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

const link = (url, label, style = "outline") =>
  `<a class="d-btn ${style}" href="${url}">${label}</a>`;

const card = (content, cls = "") =>
  `<section class="d-card ${cls}">${content}</section>`;

const title = (heading, desc, action = "") =>
  `<div class="d-hero"><div><h1>${heading}</h1><p>${desc}</p><i></i></div><img src="/media/branded-axia.webp" alt="">${action}</div>`;

const base = (r) => `/dashboard/${r}`;

const icon = (name) =>
  `<span class="d-icon" aria-hidden="true" style="mask-image:url(/media/icon-${name}.webp)"></span>`;

function shell(role, slug, data, content) {
  const user = data.user || {},
    root = base(role),
    active =
      slug === "promosi-borang"
        ? "promosi"
        : slug === "semakan"
          ? "permohonan"
          : slug;
  const roleLabel = {
    institut: "Institut Memandu",
    instructor: "Instructor",
    admin: "Admin",
  }[role];
  const name = esc(user.name || "Akaun saya");
  const accountProfile =
    data.accountProfile ||
    (role === "admin" ? {} : data.profile?.payload || data.profile || {});
  const avatar = accountProfile.photo
    ? `<img class="d-account-photo" src="${esc(accountProfile.photo)}" alt="">`
    : icon(
        role === "admin"
          ? "access"
          : role === "institut"
            ? "institute"
            : "person",
      );
  const logo =
    '<a class="d-logo" href="/" aria-label="MyLesenHub, Utama"><img src="/media/brand.webp" alt="MyLesenHub"></a>';
  const menu = configs[role]
    .map(
      ([s, label, glyph]) =>
        `<a ${s === active ? 'class="active" aria-current="page"' : ""} href="${root}/${s}">${icon(glyph)}${label}</a>`,
    )
    .join("");
  return `<div class="dashboard">
    <aside id="d-navigation" class="d-sidebar" aria-label="Menu dashboard">
      <div class="d-brand-row">${logo}<button class="d-close-drawer d-mobile-control" type="button" aria-label="Tutup menu">×</button></div>
      <div class="d-role">${icon(role === "institut" ? "institute" : "person")}${roleLabel}</div>
      <div class="d-person"><div class="d-avatar">${avatar}</div><strong>${name}</strong></div>
      <nav aria-label="Menu ${roleLabel}">${menu}</nav>
      <div class="d-sidebottom"><a href="/">${icon("external")} Lihat laman awam</a><button type="button" data-logout>${icon("logout")} Log keluar</button><a href="/hubungi">${icon("help")} Perlukan bantuan?</a></div>
    </aside>
    <div class="d-scrim" aria-hidden="true"></div>
    <div class="d-main"><header class="d-mobile-head">
      <button class="d-open-drawer d-mobile-control" aria-expanded="false" aria-controls="d-navigation" aria-label="Buka menu" type="button"><span></span><span></span><span></span></button>
      ${logo}<span class="d-avatar">${avatar}</span>
    </header><header class="d-top"><nav aria-label="Jejak navigasi"><a href="/">Utama</a> <span>/</span> <a href="${root}/ringkasan">${roleLabel}</a> <span>/</span> ${esc(titles[role][slug])}</nav><strong><a class="d-status-link" href="${root}/${role === "admin" ? "permohonan" : "status-semakan"}" aria-label="Lihat perkembangan permohonan">${icon("bell")}</a><span class="d-avatar">${avatar}</span>${name}</strong></header>
    <main class="d-content">${content}</main><footer><div><strong>MyLesenHub</strong>　•　Johor &amp; Melaka</div><div><a href="/privasi">Privasi</a>　 |　 <a href="/terma">Terma</a></div></footer></div></div>`;
}

function renderDashboard(path, url, data = {}) {
  const match = path.match(
    /^\/dashboard\/(instructor|institut|admin)(?:\/([^/]+))?\/?$/,
  );
  if (!match) return null;
  const role = match[1],
    slug = match[2] || "ringkasan";
  if (!Object.hasOwn(titles[role], slug)) return null;
  if (isPausedPromotionPage(path)) {
    return shell(
      role,
      slug,
      data,
      `<section class="d-card d-paused"><h1>Promosi dan program ditutup sementara</h1><p>Anda boleh mengurus profil, galeri dan instructor institut melalui dashboard.</p>${link(base(role) + "/ringkasan", "Kembali ke ringkasan", "red")}</section>`,
    );
  }
  if (!promotionsEnabled)
    data = {
      ...data,
      programs: [],
      submissions: (data.submissions || []).filter(
        (row) => row.kind !== "program",
      ),
    };
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
    const action =
      slug === "profil"
        ? memberProfileAction(role, data)
        : slug === "instructor"
          ? link("#dm-invite", "Jemput instructor", "red")
          : "";
    content = title(heading, desc, action);
    if (slug === "profil") content += memberProfile(role, data);
    else if (slug === "status-semakan")
      content += memberStatus(role, data, url);
    else if (role === "admin" && ["permohonan", "pembetulan"].includes(slug)) {
      content += adminApplications(data, url, slug === "pembetulan");
      if (slug === "pembetulan") content += adminMessages(data);
    } else if (slug === "semakan") {
      let s = (data.submissions || []).find(
        (x) => String(x.id) === url.searchParams.get("id"),
      );
      if (s) {
        const label =
          {
            instructor: "Semakan profil instructor",
            institut: "Semakan profil institut",
            affiliation: "Semakan hubungan institut",
            media: "Semakan galeri",
            correction: "Semakan pembetulan",
          }[s.kind] || heading;
        const subject = [
          s.payload?.displayName || s.payload?.name || s.payload?.title,
          s.payload?.institute,
        ]
          .filter(Boolean)
          .map(esc)
          .join(" · ");
        content = title(label, subject || desc) + adminReview(s, data.profile);
      } else content += card("<p>Permohonan tidak ditemui.</p>");
    } else if (slug === "direktori") {
      content =
        '<h2 class="dp-section-title">Pengurusan direktori</h2>' +
        title(
          "Urus profil instructor dan institut memandu.",
          "Penyenaraian, semakan dan penerbitan profil dalam direktori MyLesenHub.",
        ) +
        adminDirectory(data, url);
    } else if (slug === "pengguna") {
      content =
        '<h2 class="dp-section-title">Pengguna &amp; akses</h2>' +
        title(
          "Urus akaun dan sahkan wakil institut.",
          "Semak peranan pengguna dan status pengesahan wakil.",
        ) +
        adminUsers(data, url);
    } else if (slug === "instructor") content += memberAffiliations(data, url);
  }

  return shell(role, slug, data, content);
}

export { renderDashboard };
