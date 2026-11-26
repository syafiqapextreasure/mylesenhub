import { locationPicker } from "./location-picker.js";
import { promotionsEnabled } from "./features.js";
import { licenceClasses as classes, teachingClasses } from "./licence-classes.js";
import { profileLanguages, registeredInstituteNames } from "./form-options.js";
import { instructorGallery, instituteLocation } from "./public-instructor.js";

const states = {
  Johor: [
    "Johor Bahru",
    "Batu Pahat",
    "Kluang",
    "Kota Tinggi",
    "Kulai",
    "Mersing",
    "Muar",
    "Pontian",
    "Segamat",
    "Tangkak",
  ],
  Melaka: ["Melaka Tengah", "Alor Gajah", "Jasin"],
};
const search = "/cari-instructor";
const join = "/sertai-kami";
const institute = "/daftar-institut";
const slogan = "Memandu dengan ilmu & ikhsan";
const demoLabel = "Profil contoh untuk pratonton";
const esc = (value = "") =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );
const art = (name) => "/media/" + name + ".webp";
const responsiveWidths = {
  "home-hero": 1280,
  "login-hero": 1694,
  "about-team": 1511,
  "join-team": 1585,
  "institute-team": 1575,
  "home-johor": 1748,
  "home-melaka": 1748,
};
const responsiveSizes = {
  "home-hero": "(max-width: 760px) 100vw, (min-width: 2350px) 1280px, 55vw",
  "about-team": "(max-width: 760px) 96vw, 56vw",
  "join-team": "(max-width: 460px) 94vw, (max-width: 760px) 46vw, 32vw",
  "institute-team": "(max-width: 460px) 94vw, (max-width: 760px) 46vw, 32vw",
};
const photo = (url, alt, className = "", eager = false) => {
  const key = String(url).match(/^\/media\/([a-z-]+)\.webp$/)?.[1];
  const sizes =
    responsiveSizes[key] || "(max-width: 760px) 96vw, 50vw";
  const variants =
    key in responsiveWidths
      ? ' srcset="/media/' +
        key +
        "-640.webp 640w, /media/" +
        key +
        "-1120.webp 1120w, " +
        url +
        " " +
        responsiveWidths[key] +
        'w" sizes="' +
        sizes +
        '"'
      : "";
  return (
    '<img src="' +
    esc(url) +
    '"' +
    variants +
    ' alt="' +
    esc(alt) +
    '" class="' +
    className +
    '" loading="' +
    (eager ? "eager" : "lazy") +
    '">'
  );
};
const iconPaths = {
  pin: '<path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
  map: '<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3zM9 3v15m6-12v15"/>',
  building:
    '<path d="M3 22h18M5 20V8h14v12M9 8V3h6v5m-7 4h1m3 0h1m3 0h1m-9 4h1m3 0h1m3 0h1m-5 4v-2"/>',
  temple: '<path d="m2 7 10-5 10 5M3 10h18M5 12v7m5-7v7m4-7v7m5-7v7M2 22h20"/>',
  people:
    '<circle cx="12" cy="7" r="3"/><path d="M6 21v-4a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v4zm-4-3v-2a4 4 0 0 1 3-4m17 6v-2a4 4 0 0 0-3-4M5 6a2.5 2.5 0 0 0 0 5m14-5a2.5 2.5 0 0 1 0 5"/>',
  person:
    '<circle cx="12" cy="7" r="4"/><path d="M4 22v-3a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v3z"/>',
  chat: '<path d="M22 11a9.5 9.5 0 0 1-10 9 13 13 0 0 1-4-.7L3 21l1.5-4A8 8 0 0 1 2 11a10 9 0 0 1 20 0Z"/><path d="M8 11h.2m3.7 0h.2m3.7 0h.2"/>',
  lens: '<circle cx="10.5" cy="10.5" r="7"/><path d="m16 16 6 6"/>',
  calendar:
    '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4m8-4v4m-8 7h1m3 0h1m3 0h1m-9 3h1m3 0h1"/>',
  car: '<path d="m5 10 2-5h10l2 5m-17 3 3-3h14l3 3v6h-3v-2H5v2H2zm4 1h2m8 0h2"/>',
  edit: '<path d="M11 21H4V3h13v8M7 7h7M7 11h5m1 9 1-4 6-6 3 3-6 6z"/>',
  arrow: '<path d="M3 12h17m-7-7 7 7-7 7"/>',
  back: '<path d="M21 12H4m7-7-7 7 7 7"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
  shield: '<path d="m12 2 9 4v6c0 5-6 9-9 10-3-1-9-5-9-10V6zm-4 10 3 3 5-6"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  send: '<path d="m2 10 20-8-6 20-4-9zm10 3L22 2"/>',
  image:
    '<rect x="2" y="3" width="20" height="18" rx="3"/><circle cx="8" cy="9" r="2"/><path d="m2 19 6-5 3 2 4-5 7 7"/>',
};
const icon = (name) =>
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  (iconPaths[name] || iconPaths.person) +
  "</svg>";
const brand = () =>
  '<a href="/" class="pub-brand" aria-label="MyLesenHub, Utama">' +
  '<img src="/media/brand.webp" alt="" width="723" height="204">' +
  "</a>";
const button = (label, href, variant = "") =>
  '<a class="pub-btn ' +
  variant +
  '" href="' +
  esc(href) +
  '">' +
  label +
  "</a>";
const pill = (label) => '<span class="pub-pill">' + label + "</span>";
const banner = (name, title, trail, lead = "", options = "") =>
  '<section class="pub-banner ' +
  options +
  '">' +
  '<div class="pub-vehicle pub-vehicle-' + name + '" aria-hidden="true"><img class="pub-banner-art" src="/media/branded-axia.webp" srcset="/media/branded-axia-640.webp 640w, /media/branded-axia.webp 907w" sizes="(max-width: 760px) 70vw, 36vw" width="907" height="593" alt=""><img class="pub-plate-pair" src="/media/learner-plates.webp" width="282" height="160" alt=""></div>' +
  '<div class="pub-banner-copy"><nav class="pub-breadcrumb" aria-label="Jejak halaman"><a href="/">Utama</a>' +
  trail
    .map(
      ([text, href]) =>
        '<span aria-hidden="true">/</span>' +
        (href
          ? '<a href="' + href + '">' + esc(text) + "</a>"
          : '<span aria-current="page">' + esc(text) + "</span>"),
    )
    .join("") +
  "</nav><h1>" +
  title +
  "</h1>" +
  (lead ? "<strong>" + lead + "</strong>" : "") +
  "<p>" +
  slogan +
  '</p><i aria-hidden="true"></i></div></section>';
const header = (path, user, access, demo) =>
  '<header class="pub-head"><div class="pub-head-inner">' +
  brand() +
  (access
    ? '<a class="pub-back-home" href="/">' +
      icon("back") +
      " Kembali ke laman utama</a>"
    : '<button class="pub-menu" type="button" aria-expanded="false" aria-controls="pub-nav">Menu</button><nav id="pub-nav" aria-label="Navigasi utama">' +
      [
        [search, "Cari Instructor"],
        ["/tentang-kami", "Tentang Kami"],
        ["/hubungi", "Hubungi"],
      ]
        .map(
          ([href, label]) =>
            '<a href="' +
            href +
            (demo &&
            href === search &&
            (path === search || path.startsWith("/instructor/"))
              ? "?contoh=1"
              : "") +
            '"' +
            (path === href ||
            (href === search && path.startsWith("/instructor/"))
              ? ' aria-current="page"'
              : "") +
            ">" +
            label +
            "</a>",
        )
        .join("") +
      '<a class="pub-mobile-join" href="' +
      join +
      '">Sertai Komuniti</a></nav><div class="pub-head-actions">' +
      (user ? '<a href="/dashboard">Dashboard</a>' : "") +
      button("Sertai Komuniti", join) +
      "</div>") +
  "</div></header>";
const footer = (user) =>
  '<footer class="pub-footer pub-shell"><div>' + brand() + '<span>Johor &amp; Melaka</span></div><nav aria-label="Pautan kaki halaman"><a href="' +
  (user ? "/dashboard" : "/login") +
  '">' +
  (user ? "Dashboard" : "Log masuk") +
  '</a><a href="/privasi">Privasi</a><a href="/terma">Terma</a></nav></footer>';
const option = (value, selected) =>
  "<option" +
  (value === selected ? " selected" : "") +
  ">" +
  esc(value) +
  "</option>";
const select = (name, label, values, selected = "", extra = "") =>
  '<select name="' +
  name +
  '" ' +
  extra +
  '><option value="">' +
  label +
  "</option>" +
  values.map((value) => option(value, selected)).join("") +
  "</select>";
const field = (label, markup, full = false) =>
  '<label class="pub-field' +
  (full ? " pub-full" : "") +
  '"><span>' +
  label +
  "</span>" +
  markup +
  "</label>";
const input = (name, placeholder, type = "text", extra = "required") =>
  '<input name="' +
  name +
  '" type="' +
  type +
  '" placeholder="' +
  placeholder +
  '" ' +
  extra +
  ">";
const textArea = (name, placeholder, extra = "required") =>
  '<textarea name="' +
  name +
  '" placeholder="' +
  placeholder +
  '" ' +
  extra +
  "></textarea>";
const status = '<p class="pub-status" role="status" hidden></p>';
const locationFields = (state, district, required = false) =>
  field(
    "Negeri",
    select(
      "state",
      "Pilih negeri",
      Object.keys(states),
      state,
      "data-state " + (required ? "required" : ""),
    ),
  ) +
  field(
    "Daerah",
    select(
      "district",
      "Pilih daerah",
      states[state] || [],
      district,
      "data-district " +
        (!state ? "disabled " : "") +
        (required ? "required" : ""),
    ),
  );
const uniques = (values) =>
  [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, "ms"));
const activeInstitutes = (data, state, district) =>
  uniques(
    [...data.instructors, ...data.institutes]
      .filter(
        (item) =>
          (!state || item.state === state) &&
          (!district || item.district === district),
      )
      .map((item) => item.institute || item.name),
  );
const steps = () =>
  '<ol class="pub-steps">' +
  [
    ["pin", "Pilih negeri"],
    ["map", "Pilih daerah"],
    ["temple", "Pilih institut"],
    ["people", "Kenali instructor"],
  ]
    .map(
      ([name, label]) =>
        '<li><span class="pub-round">' +
        icon(name) +
        "</span><b>" +
        label +
        "</b></li>",
    )
    .join("") +
  "</ol>";
const card = (name, title, description, link = "", section = "") =>
  '<article class="pub-panel pub-info-card ' +
  section +
  '"><span class="pub-round">' +
  icon(name) +
  "</span><div><h3>" +
  title +
  "</h3><p>" +
  description +
  "</p>" +
  link +
  "</div></article>";
const contactLink = (item, className = "") => {
  const phone = String(item.phone || "")
    .replace(/\D/g, "")
    .replace(/^0/, "60");
  if (item.demo || !phone)
    return (
      '<button type="button" class="pub-btn ' +
      className +
      '" disabled>Hubungi instructor</button><small>' +
      (item.demo
        ? "Maklumat hubungan tidak tersedia untuk profil contoh."
        : "Instructor belum menyediakan nombor hubungan.") +
      "</small>"
    );
  return button(
    "Hubungi instructor",
    "https://wa.me/" +
      phone +
      "?text=" +
      encodeURIComponent(
        "Salam " +
          item.name +
          ", saya menemui profil anda melalui MyLesenHub dan ingin bertanya tentang pembelajaran memandu.",
      ),
    className,
  );
};
const mainHome = () =>
  '<div class="pub-home-page"><section class="pub-home-hero">' +
  photo(
    art("home-hero"),
    "Pasukan MyLesenHub bersama tiga kereta latihan putih dan dua motosikal di hadapan Perdana Putra, Putrajaya",
    "pub-home-art",
    true,
  ) +
  '<div class="pub-home-copy"><h1>Everyone<br>Can Drive</h1><strong>Carian instructor terbaik di lokasi anda</strong><p>' +
  slogan +
  '</p><i aria-hidden="true"></i><div class="pub-home-signs">' +
  pill("Direktori komuniti percuma") +
  '<img src="/media/learner-plates.webp" class="pub-home-plates" width="282" height="160" alt=""></div></div></section><div class="pub-shell"><section class="pub-panel pub-home-search"><h2>Mulakan carian anda</h2><form action="' +
  search +
  '" method="get" class="pub-filter pub-quick" data-location>' +
  locationFields("", "") +
  field(
    "Institut Memandu",
    select("institute", "Pilih institut", [], "", "data-institute disabled"),
  ) +
  field(
    "Instructor",
    select("name", "Pilih instructor", [], "", "data-instructor disabled"),
  ) +
  '<button class="pub-btn">Cari Instructor</button></form></section><section class="pub-explore"><h2>Terokai mengikut negeri</h2><div class="pub-regions">' +
  ["Johor", "Melaka"]
    .map(
      (state) =>
        '<a class="pub-region" href="' +
        search +
        "?state=" +
        state +
        '">' +
        photo(art("home-" + state.toLowerCase()), "") +
        "<div><h3>" +
        state +
        "</h3><span>Lihat direktori " +
        icon("arrow") +
        "</span></div></a>",
    )
    .join("") +
  "</div>" +
  steps() +
  '</section><section class="pub-strip pub-home-join"><div><h2>Anda seorang instructor?</h2><p>Sertai komuniti MyLesenHub dan bantu lebih ramai bakal pemandu menemui anda.</p></div><a href="' +
  join +
  '">Sertai Komuniti ' +
  icon("arrow") +
  "</a></section></div></div>";
const mainSearch = (data, url) => {
  const params = url.searchParams;
  const sampleOnly =
    data.instructors.length > 0 && data.instructors.every((item) => item.demo);
  const demoSuffix = sampleOnly ? "?contoh=1" : "";
  const state = params.get("state") ?? (sampleOnly ? "Johor" : "");
  const district =
    params.get("district") ??
    (sampleOnly && !params.has("state") ? "Johor Bahru" : "");
  const school =
    params.get("institute") ??
    (sampleOnly && !params.has("state") ? "Institut Memandu Contoh" : "");
  const name = params.get("name") || "";
  const requestedClass = (params.get("kelas") || "").trim().toUpperCase();
  const licenceClass = classes.includes(requestedClass) ? requestedClass : "";
  const matches = data.instructors.filter(
    (item) =>
      (!state || item.state === state) &&
      (!district || item.district === district) &&
      (!school || item.institute === school) &&
      (!licenceClass || teachingClasses(item).includes(licenceClass)) &&
      (!name || item.name.toLowerCase().includes(name.toLowerCase())),
  );
  const pages = Math.ceil(matches.length / 6);
  const page = Math.min(
    Math.max(Number.parseInt(params.get("page"), 10) || 1, 1),
    pages || 1,
  );
  const pageUrl = (n) =>
    search +
    "?" +
    new URLSearchParams([
      ...Array.from(params).filter(([key]) => key !== "page"),
      ["page", n],
    ]);
  const cards = matches
    .slice((page - 1) * 6, page * 6)
    .map(
      (item) =>
        '<article class="pub-panel pub-instructor-card"><a href="/instructor/' +
        encodeURIComponent(item.slug) +
        demoSuffix +
        '" aria-label="Lihat profil ' +
        esc(item.name) +
        '">' +
        (item.photo
          ? photo(
              item.demo && item.slug === "cikgu-daniel"
                ? art("daniel-directory")
                : item.photo,
              "",
            )
          : '<span class="pub-placeholder">' + icon("person") + "</span>") +
        "</a><div><h3>" +
        esc(item.name) +
        "</h3><p>" +
        esc(item.institute) +
        '</p><p class="pub-with-icon">' +
        icon("pin") +
        esc([item.district, item.state].filter(Boolean).join(", ")) +
        "</p>" +
        (item.demo && !sampleOnly ? pill("Profil contoh") : "") +
        button(
          "Lihat profil",
          "/instructor/" + encodeURIComponent(item.slug) + demoSuffix,
          "pub-outline",
        ) +
        "</div></article>",
    )
    .join("");
  return (
    '<div class="pub-shell pub-directory-page">' +
    banner(
      "search",
      "Find the Best<br> Among the Great",
      [["Cari Instructor"]],
      "Carian instructor terbaik di lokasi anda",
      "pub-search-banner",
    ) +
    '<div class="pub-directory pub-section"><aside class="pub-panel pub-search-filter"><h2>Tapis carian</h2><form action="' +
    search +
    '" method="get" class="pub-filter" data-location>' +
    (sampleOnly ? '<input type="hidden" name="contoh" value="1">' : "") +
    locationFields(state, district) +
    field(
      "Institut Memandu",
      select(
        "institute",
        "Semua institut",
        activeInstitutes(data, state, district),
        school,
        "data-institute",
      ),
    ) +
    field("Kelas Lesen", select("kelas", "Semua kelas", classes, licenceClass)) +
    field(
      "Nama instructor",
      '<input name="name" type="search" placeholder="Cari nama instructor" value="' +
        esc(name) +
        '">',
    ) +
    '<button class="pub-btn">Cari Instructor</button><a class="pub-reset" href="' +
    search +
    "?state=" +
    (sampleOnly ? "&amp;contoh=1" : "") +
    '">Tetapkan semula</a></form><div class="pub-blue pub-filter-tip"><span class="pub-round">' +
    icon("pin") +
    "</span>Pilih lokasi, kemudian kenali instructor anda.</div></aside><section><h2>Instructor" +
    (district || state
      ? " di " + esc(district || state)
      : " di Johor &amp; Melaka") +
    '</h2><div class="pub-results-meta">' +
    (sampleOnly ? pill(demoLabel) : "") +
    "<b>" +
    matches.length +
    " " +
    (sampleOnly ? "profil contoh" : "profil") +
    "</b></div>" +
    (cards
      ? '<div class="pub-instructor-grid">' + cards + "</div>"
      : '<div class="pub-panel pub-empty"><h3>Tiada profil untuk carian ini</h3><p>Cuba kelas lesen, lokasi atau nama instructor yang lain.</p>' +
        button(
          "Lihat semua instructor",
          search + "?state=" + (sampleOnly ? "&contoh=1" : ""),
          "pub-outline",
        ) +
        "</div>") +
    (cards
      ? '<nav class="pub-pages" aria-label="Halaman hasil">' +
        (page > 1
          ? button("‹", pageUrl(page - 1), "pub-outline")
          : '<span aria-hidden="true">‹</span>') +
        '<b aria-current="page">' +
        page +
        "</b>" +
        (page < pages
          ? button("›", pageUrl(page + 1), "pub-outline")
          : '<span aria-hidden="true">›</span>') +
        "</nav>"
      : "") +
    "</section></div></div>"
  );
};
const profilePictures = (item) => {
  return instructorGallery(item)
    .map(({ url, alt, caption }, index) => {
      return (
        "<figure>" +
        photo(url, alt || caption || "Gambar pembelajaran " + (index + 1)) +
        (caption ? "<figcaption>" + esc(caption) + "</figcaption>" : "") +
        "</figure>"
      );
    });
};
const profile = (item, institutes) => {
  const location = [item.district, item.state].filter(Boolean).join(", ");
  const portrait = item.detailPhoto || item.photo;
  const backHref = search + (item.demo ? "?contoh=1" : "");
  const institute = instituteLocation(item, institutes);
  const resumeHref = "/instructor/" + encodeURIComponent(item.slug) +
    "/resume.pdf" + (item.demo ? "?contoh=1" : "");
  const instituteCard =
    '<section class="pub-panel pub-profile-institute" aria-labelledby="pub-profile-institute-title">' +
    '<span class="pub-round">' + icon("pin") + '</span><div>' +
    '<h3 id="pub-profile-institute-title">Lokasi institut memandu</h3>' +
    (institute.name ? '<strong>' + esc(institute.name) + '</strong>' : '') +
    (institute.address
      ? '<address>' + esc(institute.address) + '</address>'
      : '<p>' + (item.demo
        ? "Alamat sebenar tidak tersedia untuk profil contoh."
        : "Alamat institut belum tersedia.") + '</p>') +
    (institute.maps
      ? '<a class="pub-btn pub-outline" target="_blank" rel="noopener noreferrer" href="' +
        esc(institute.maps) + '">Buka di Google Maps ' + icon("arrow") + '</a>'
      : '') +
    '</div></section>';
  const help =
    "<h3>Hubungi " +
    esc(item.name) +
    "</h3><p>Kenali cara pembelajaran anda.</p>" +
    contactLink(item);
  const rows = [
    ["pin", "Negeri", item.state],
    ["map", "Daerah", item.district],
    ["building", "Institut Memandu", institute.name],
    ["chat", "Bahasa", item.languages],
    ["car", "Kelas SPIM", item.spim],
    [
      "calendar",
      "Pengalaman",
      item.experience != null && item.experience !== ""
        ? String(item.experience).replace(/(?: tahun)?$/, " tahun")
        : "",
    ],
    ["chat", "Maklumat tambahan", item.other],
  ].filter(([, , value]) => (Array.isArray(value) ? value.length : value));
  const images = profilePictures(item);
  const details = rows.map(([name, label, value]) =>
    "<div><dt>" +
    icon(name) +
    " <b>" +
    label +
    '</b><span aria-hidden="true">:</span></dt><dd>' +
    (Array.isArray(value) ? value.map((entry) => pill(esc(entry))).join(" ") : esc(value)) +
    "</dd></div>",
  ).join("");
  return (
    '<div class="pub-shell pub-profile-page">' +
    banner(
      "profile",
      "Profil Instructor",
      [["Cari Instructor", backHref], [item.name]],
      "",
      "pub-profile-banner",
    ) +
    '<div class="pub-profile pub-section"><aside><div class="pub-panel pub-profile-side">' +
    (portrait
      ? photo(portrait, item.name, "pub-profile-photo", true)
      : '<span class="pub-profile-photo pub-placeholder" aria-hidden="true">' +
        icon("person") +
        "</span>") +
    "<h2>" +
    esc(item.name) +
    "</h2>" +
    (institute.name
      ? '<p class="pub-with-icon">' + icon("building") + esc(institute.name) + "</p>"
      : "") +
    (location
      ? '<p class="pub-with-icon">' + icon("pin") + esc(location) + "</p>"
      : "") +
    "<hr>" +
    help +
    '<a class="pub-btn pub-outline pub-profile-resume" href="' + esc(resumeHref) +
    '" download>' + icon("download") + ' Muat turun résumé (PDF)</a>' +
    '<a class="pub-reset pub-with-icon" href="' +
    backHref +
    '">' +
    icon("back") +
    " Kembali ke carian</a></div>" +
    (item.demo
      ? '<div class="pub-side-pill">' + pill(demoLabel) + "</div>"
      : "") +
    "</aside><div><h2>Kenali instructor anda</h2>" +
    (item.bio ? '<p class="pub-profile-bio">' + esc(item.bio) + "</p>" : "") +
    '<section class="pub-panel pub-profile-details"><h3>Maklumat instructor</h3>' +
    (details ? "<dl>" + details + "</dl>" : "<p>Butiran belum tersedia.</p>") +
    "</section>" + instituteCard +
    (images.length
      ? '<section class="pub-gallery"><h2>Galeri pembelajaran</h2><div class="pub-panel"><div class="pub-gallery-grid">' +
        images.join("") +
        "</div>" +
        (item.demo ? "<small>Gambar contoh</small>" : "") +
        "</div></section>"
      : "") +
    '</div></div><section class="pub-strip"><span class="pub-round">' +
    icon("pin") +
    "</span><div><h3>Belajar memandu bermula dengan instructor yang sesuai.</h3>" +
    ([institute.name, location].some(Boolean)
      ? "<p>" + esc([institute.name, location].filter(Boolean).join(" · ")) + "</p>"
      : "") +
    "</div>" +
    button("Lihat carian lain", backHref, "pub-outline") +
    "</section></div>"
  );
};
const about = () =>
  '<div class="pub-shell">' +
  banner(
    "about",
    "Tentang Kami",
    [["Tentang Kami"]],
    "Find the Best Among the Great",
  ) +
  '<section class="pub-about-intro pub-section"><div>' +
  pill("Direktori komuniti percuma") +
  "<h2>Kenali MyLesenHub</h2><p>MyLesenHub membantu bakal pemandu mencari dan mengenali instructor memandu di Johor dan Melaka.</p><p>Terokai mengikut negeri, daerah dan institut untuk menemui profil instructor yang sesuai dengan lokasi anda.</p></div>" +
  photo(art("about-team"), "Instructor dan pelajar bersama kereta latihan") +
  '</section><section class="pub-section"><h2>Apa yang kami utamakan</h2><div class="pub-about-cards">' +
  card("lens", "Carian mudah", "Terokai mengikut lokasi dan institut.") +
  card("person", "Kenali instructor", "Lihat profil sebelum menghubungi.") +
  card("people", "Komuniti setempat", "Bermula di Johor dan Melaka.") +
  '</div></section><section class="pub-blue pub-about-steps"><h2>Empat langkah mudah</h2>' +
  steps() +
  '</section><section class="pub-panel pub-strip pub-about-cta"><div><h2>Mulakan langkah pertama anda</h2><p>Cari instructor berhampiran anda.</p></div>' +
  button("Cari Instructor", search) +
  button("Sertai Komuniti", join, "pub-outline") +
  "</section></div>";
const contact = () =>
  '<div class="pub-shell">' +
  banner(
    "contact",
    "Hubungi Kami",
    [["Hubungi"]],
    "Ada pertanyaan? Kami sedia membantu.",
  ) +
  '<div class="pub-contact pub-section"><aside><h2>Bagaimana kami boleh membantu?</h2>' +
  card("chat", "Pertanyaan umum", "Ketahui lebih lanjut tentang MyLesenHub.") +
  card(
    "edit",
    "Kemas kini direktori",
    "Maklumkan pembetulan atau permintaan pemadaman profil.",
  ) +
  card(
    "people",
    "Sertai komuniti",
    "Ketahui cara menyertai direktori instructor.",
    '<a href="' + join + '">Lihat panduan penyertaan ' + icon("arrow") + "</a>",
  ) +
  card(
    "car",
    "Mencari kelas memandu?",
    "Untuk pertanyaan kelas, hubungi instructor melalui halaman profil mereka.",
    '<a href="' + search + '">Cari Instructor ' + icon("arrow") + "</a>",
    "pub-blue",
  ) +
  '</aside><section class="pub-panel pub-contact-form"><h2>Hantar mesej</h2><p>Isikan maklumat di bawah untuk menghubungi pasukan kami.</p><form class="pub-fields" data-api="/api/contact">' +
  field(
    "Nama",
    input(
      "name",
      "Nama anda",
      "text",
      'required autocomplete="name" maxlength="100"',
    ),
  ) +
  field(
    "E-mel",
    input(
      "email",
      "Alamat e-mel anda",
      "email",
      'required autocomplete="email" maxlength="254"',
    ),
  ) +
  field(
    "Topik pertanyaan",
    select(
      "subject",
      "Pilih topik",
      [
        "Pertanyaan umum",
        "Kemas kini direktori",
        "Permintaan pemadaman profil",
        "Sertai komuniti",
      ],
      "",
      "required",
    ),
    true,
  ) +
  field(
    "Mesej",
    textArea(
      "message",
      "Bagaimana kami boleh membantu?",
      'required maxlength="4000"',
    ),
    true,
  ) +
  checkbox(
    "Saya bersetuju maklumat ini digunakan untuk menjawab pertanyaan saya.",
  ) +
  status +
  '<button class="pub-btn pub-full">' +
  icon("send") +
  ' Hantar mesej</button></form></section></div><section class="pub-strip pub-contact-quote"><span class="pub-round">“</span><div><h2>' +
  slogan +
  "</h2><p>Komuniti yang saling membantu bermula dengan komunikasi yang baik.</p></div></section></div>";
const checkbox = (text) =>
  '<div class="pub-full pub-consent"><label><input name="consent" type="checkbox" required> <span>' +
  text +
  '</span></label><a href="/privasi">Dasar Privasi</a></div>';
const classOptions = (label = "Kelas SPIM") =>
  '<fieldset class="pub-classes"><legend>' +
  label +
  '</legend><details class="pub-class-picker" aria-describedby="pub-spim-help"><summary><span data-class-summary>Pilih kelas</span></summary><div>' +
  classes
    .map(
      (entry) =>
        '<label><input type="checkbox" name="spim" value="' +
        entry +
        '"> ' +
        entry +
        "</label>",
    )
    .join("") +
  '</div></details><small class="pub-spim-help" id="pub-spim-help">Boleh pilih lebih daripada satu</small></fieldset>';
function registrationInstitute(data) {
  const schools = data.institutes.filter((item) => item.id && !item.demo && !item.hidden);
  const prompt = schools.length ? "Pilih institut" : "Tiada institut diterbitkan";
  const options = schools.map((school) =>
    '<option value="' + esc(school.id) + '">' + esc(school.name) + '</option>'
  ).join("");
  const help = schools.length ? "" : '<small>Institut perlu diterbitkan sebelum anda boleh menghantar permohonan.</small>';
  return field("Institut Memandu",
    '<select name="instituteId" required><option value="">' + prompt + '</option>' + options + '</select>' + help,
    true,
  );
}
const uploads = (name, label, multiple = false) =>
  '<div class="pub-field pub-upload-field"><span>' +
  label +
  '</span><div class="pub-upload" data-upload><div data-preview></div><span class="pub-upload-icon" aria-hidden="true">' +
  icon(name === "logo" ? "temple" : "image") +
  '</span><label class="pub-btn pub-outline">' +
  (multiple
    ? "Tambah gambar"
    : name === "logo"
      ? "Muat naik logo"
      : "Muat naik foto") +
  '<input type="file" name="' +
  name +
  '" accept="image/jpeg,image/png,image/webp" ' +
  (multiple ? "multiple" : "") +
  "></label></div></div>";
const formSection = (title, fields) =>
  '<section class="pub-form-section"><h3>' +
  title +
  '</h3><div class="pub-fields">' +
  fields +
  "</div></section>";
const joinAside = (isInstitute) => {
  const advantages = isInstitute
    ? [
        "Profil institut yang lengkap",
        ...(promotionsEnabled ? ["Promosi yang mudah ditemui", "Maklumat program terkini"] : ["Carian mengikut lokasi", "Maklumat hubungan institut"]),
      ]
    : [
        "Profil yang mudah ditemui",
        "Carian mengikut lokasi",
        "Hubungan terus dengan bakal pelajar",
      ];
  const details = isInstitute
    ? [
        "Maklumat institut",
        "Alamat dan pin lokasi",
        ...(promotionsEnabled ? ["Promosi atau program"] : []),
      ]
    : [
        "Foto dan pengenalan",
        "Lokasi dan institut",
        "Bahasa dan Kelas SPIM",
        "Experience dan Other",
        "Galeri pembelajaran",
      ];
  return (
    '<aside class="pub-join-aside"><section class="pub-panel"><h2>' +
    (isInstitute ? "Bina profil institut anda" : "Anda seorang instructor?") +
    "</h2><p>" +
    (isInstitute
      ? "Perkenalkan Institut Memandu anda kepada bakal pemandu di Johor dan Melaka."
      : "Sertai direktori MyLesenHub untuk memperkenalkan profil anda kepada bakal pemandu di Johor dan Melaka.") +
    "</p><ul>" +
    advantages
      .map(
        (text, i) =>
          '<li><span class="pub-round">' +
          icon(["person", "pin", isInstitute ? "calendar" : "people"][i]) +
          "</span><b>" +
          text +
          "</b></li>",
      )
      .join("") +
    '</ul></section><section class="pub-blue"><h2>Cara penyertaan</h2><ol>' +
    ["Hantar maklumat", "Semakan", "Pengesahan", "Profile diterbitkan"]
      .map(
        (text, i) => "<li><span>" + (i + 1) + "</span><b>" + text + "</b></li>",
      )
      .join("") +
    '</ol><hr><p>Maklumat disemak dan disahkan sebelum diterbitkan.</p></section><section class="pub-blue"><h2>' +
    (isInstitute ? "Sediakan maklumat ini" : "Maklumat yang dipaparkan") +
    '</h2><ul class="pub-check-list">' +
    details
      .map((text) => '<li><span aria-hidden="true">✓</span>' + text + "</li>")
      .join("") +
    "</ul></section>" +
    photo(
      art(isInstitute ? "institute-team" : "join-team"),
      "Dua instructor bersama kereta latihan",
    ) +
    "</aside>"
  );
};
const register = (data, isInstitute) => {
  const here = isInstitute ? institute : join;
  const logged = Boolean(data.user);
  const role = isInstitute ? "institut" : "instructor";
  const sections = isInstitute
    ? [formSection("Maklumat institut",
        field("Nama Institut Memandu", input("name", "Nama rasmi institut"), true) +
        field("Alamat institut", textArea("address", "Alamat penuh institut"), true) +
        locationPicker(),
      )]
    : [
        formSection(
          "Maklumat asas",
          field("Nama penuh", input("fullName", "Nama penuh anda")) +
            field(
              "Nama paparan",
              input("displayName", "Nama untuk dipaparkan"),
            ) +
            field("E-mel", input("email", "Alamat e-mel anda", "email")) +
            field(
              "Nombor untuk dihubungi",
              input("phone", "Nombor telefon anda", "tel"),
            ) +
            locationFields("", "", true) +
            registrationInstitute(data) +
            field(
              "Bahasa",
              select("languages", "Pilih bahasa", profileLanguages, "", "required"),
              true,
            ),
        ),
        formSection(
          "Maklumat pengajaran",
          classOptions() +
            field(
              "Experience",
              '<span class="pub-input-unit">' +
                input(
                  "experience",
                  "Contoh: 5",
                  "number",
                  'required min="0" max="80" step="1" aria-describedby="experience-unit"',
                ) +
                '<span id="experience-unit">tahun</span></span>',
            ) +
            field(
              "Other",
              input("other", "Contoh: Bimbingan berperingkat", "text", ""),
              true,
            ),
        ),
        formSection(
          "Profil awam",
          field(
            "Pengenalan ringkas",
            textArea("bio", "Ceritakan tentang pendekatan pembelajaran anda."),
            true,
          ) +
            uploads("photo", "Foto profil") +
            uploads("gallery", "Galeri pembelajaran", true),
        ),
      ];
  return (
    '<div class="pub-shell">' +
    (isInstitute
      ? banner(
          "institute",
          "Daftar Institut<br> Memandu",
          [["Join Us", join], ["Daftar Institut Memandu"]],
          promotionsEnabled ? "Perkenalkan institut, promosi dan program anda." : "Perkenalkan institut anda kepada bakal pemandu.",
        )
      : banner(
          "join",
          "Join Us",
          [["Join Us"]],
          promotionsEnabled ? "Untuk lebih menyakinkan kepada bakal-bakal pemandu baru &amp; promosi-promosi menarik terkini dari IM jugak program2 khas kerajaan" : "Bantu bakal pemandu mengenali instructor dan institut memandu di lokasi mereka.",
          "pub-join-banner",
        )) +
    (isInstitute
      ? '<nav class="pub-panel pub-registration-tabs" aria-label="Jenis pendaftaran">' +
        button(icon("person") + " Daftar Instructor", join, "pub-neutral") +
        button(
          icon("building") + " Daftar Institut Memandu",
          institute,
          "pub-outline",
        ) +
        "</nav>"
      : '<section class="pub-panel pub-strip pub-join-institute"><span class="pub-round">' +
        icon("temple") +
        "</span><div><h3>Anda mewakili Institut Memandu?</h3><p>Daftarkan profil institut memandu anda.</p></div>" +
        button("Daftar Institut Memandu " + icon("arrow"), institute) +
        "</section>") +
    '<div class="pub-register pub-section">' +
    joinAside(isInstitute) +
    '<section class="pub-panel pub-register-form"><h2>' +
    (isInstitute ? "Borang pendaftaran institut" : "Borang profil instructor") +
    "</h2><p>" +
    (isInstitute
      ? "Lengkapkan maklumat untuk semakan dan pengesahan."
      : "Lengkapkan maklumat untuk paparan profil anda.") +
    "</p>" +
    (!isInstitute
      ? '<div class="pub-register-actions"><span class="pub-btn pub-neutral">Profil baharu</span>' +
        button(
          "Kemas kini profil",
          logged ? "/dashboard" : "/login?return=%2Fdashboard",
        ) +
        "</div>"
      : "") +
    '<form data-location data-api="/api/register/' +
    role +
    '" data-draft="' +
    role +
    '" data-guest="' +
    !logged +
    '" data-account-id="' +
    esc(data.user?.id || "") +
    '" data-account-role="' +
    esc(data.user?.role || "") +
    '" data-return="' +
    here +
    '">' +
    sections.join("") +
    checkbox(
      isInstitute
        ? "Saya mengesahkan maklumat ini benar dan saya diberi kuasa mewakili institut ini."
        : "Saya mengesahkan maklumat ini benar dan membenarkan penerbitan profil selepas semakan.",
    ) +
    status +
    '<div class="pub-register-actions"><button class="pub-btn pub-outline" type="button" data-save>Simpan draf</button><button class="pub-btn">Hantar untuk semakan</button></div><small>' +
    (isInstitute
      ? "Maklumat disemak dan disahkan sebelum diterbitkan."
      : "Profil baharu dan perubahan disemak serta disahkan sebelum diterbitkan.") +
    '</small></form></section></div><section class="pub-strip pub-support-strip"><span class="pub-round">' +
    icon("chat") +
    "</span><h3>Perlukan bantuan" +
    (isInstitute ? "" : " untuk menyertai") +
    '?</h3><a href="/hubungi">Hubungi kami ' +
    icon("arrow") +
    "</a></section></div>"
  );
};
const sanitizeReturn = (value) => {
  if (["/dashboard", join, institute, "/daftar-instructor"].includes(value))
    return value;
  return typeof value === "string" &&
    /^\/dashboard\/(instructor|institut|admin)\/[a-z-]+(?:\?id=[a-z0-9-]+)?$/i.test(
      value,
    )
    ? value
    : "";
};
const access = (path, url) => {
  const mode =
    path === "/signup"
      ? "signup"
      : path === "/lupa-kata-laluan"
        ? "forgot"
        : path === "/reset-password"
          ? "reset"
          : "login";
  const next = sanitizeReturn(url.searchParams.get("return"));
  const type =
    url.searchParams.get("type") === "institut" ? "institut" : "instructor";
  const navParams = next ? "?return=" + encodeURIComponent(next) : "";
  const titles = {
    login: "Log masuk",
    signup: "Daftar akaun",
    forgot: "Lupa kata laluan?",
    reset: "Tetapkan kata laluan",
  };
  const descriptions = {
    login: "Gunakan akaun MyLesenHub anda.",
    signup: "Cipta akaun untuk menghantar profil anda.",
    forgot: "Masukkan e-mel yang digunakan untuk akaun anda.",
    reset: "Masukkan kata laluan baharu untuk akaun anda.",
  };
  const emailField = field(
    "E-mel",
    input(
      "email",
      "Alamat e-mel anda",
      "email",
      'required autocomplete="email"',
    ),
  );
  const passwordField =
    mode === "forgot"
      ? ""
      : field(
          "Kata laluan",
          '<span class="pub-password">' +
            input(
              "password",
              "••••••••",
              "password",
              "required " +
                (mode === "login"
                  ? 'autocomplete="current-password"'
                  : 'autocomplete="new-password" minlength="8"'),
            ) +
            '<button type="button" aria-label="Tunjukkan kata laluan" aria-pressed="false" data-password>' +
            icon("eye") +
            "</button></span>",
        );
  return (
    '<div class="pub-access-bg"><div class="pub-shell pub-access"><section class="pub-access-hero">' +
    photo(art("login-hero"), "Kereta latihan di litar memandu", "", true) +
    "<div><h1>Selamat kembali</h1><p>Urus profil dan komuniti MyLesenHub anda.</p><strong>" +
    slogan +
    '</strong><i aria-hidden="true"></i><div class="pub-access-roles">' +
    [
      ["person", "Instructor"],
      ["building", "Institut Memandu"],
      ["shield", "Admin"],
    ]
      .map(([name, label]) => "<span>" + icon(name) + label + "</span>")
      .join("") +
    '</div></div></section><section class="pub-panel pub-access-form"><h2>' +
    titles[mode] +
    "</h2><p>" +
    descriptions[mode] +
    '</p><form data-access="' +
    mode +
    '" data-api="/api/' +
    mode +
    '" data-return="' +
    esc(next) +
    '">' +
    (mode === "signup"
      ? field(
          "Nama",
          input("name", "Nama anda", "text", 'required autocomplete="name"'),
        ) +
        field(
          "Jenis akaun",
          '<select name="accountType"><option value="instructor"' +
            (type === "instructor" ? " selected" : "") +
            '>Instructor</option><option value="institut"' +
            (type === "institut" ? " selected" : "") +
            ">Institut Memandu</option></select>",
        )
      : "") +
    (mode !== "reset"
      ? emailField
      : '<input type="hidden" name="token" value="' +
        esc(url.searchParams.get("token") || "") +
        '">') +
    passwordField +
    (mode === "login"
      ? '<div class="pub-access-options"><label><input type="checkbox" name="rememberMe"> Ingat saya</label><a href="/lupa-kata-laluan">Lupa kata laluan?</a></div>'
      : "") +
    status +
    '<button class="pub-btn">' +
    (mode === "forgot" ? "Hantar pautan" : titles[mode]) +
    "</button></form>" +
    (mode === "login"
      ? '<small>Dashboard dibuka mengikut akses akaun anda.</small><h3 class="pub-divider">Belum mempunyai akaun?</h3>' +
        button(icon("person") + " Daftar Instructor", join, "pub-outline") +
        button(
          icon("building") + " Daftar Institut Memandu",
          institute,
          "pub-outline",
        )
      : '<a href="/login' +
        navParams +
        '" class="pub-reset">Kembali ke log masuk</a>') +
    "</section></div></div>"
  );
};
const terms = (path) => {
  const privacy = path === "/privasi";
  const title = privacy ? "Dasar Privasi" : "Terma Penggunaan";
  const content = privacy
    ? [
        [
          "Maklumat yang anda berikan",
          "Kami menggunakan maklumat yang anda hantar untuk menjawab pertanyaan, mengurus akaun, dan menyemak profil atau kandungan yang anda serahkan.",
        ],
        [
          "Maklumat dalam direktori",
          "Maklumat yang anda setuju untuk diterbitkan, termasuk nama paparan, lokasi dan maklumat hubungan yang diberikan untuk direktori, boleh dilihat oleh pelawat selepas semakan.",
        ],
        [
          "Pembetulan dan pemadaman",
          "Hubungi kami jika anda mahu membetulkan atau meminta pemadaman maklumat profil anda.",
        ],
      ]
    : [
        [
          "Penggunaan direktori",
          "MyLesenHub menyediakan direktori komuniti untuk mencari instructor dan institut memandu. Hubungi pihak yang disenaraikan untuk mengesahkan butiran pembelajaran dan yuran.",
        ],
        [
          "Maklumat profil",
          "Berikan maklumat yang tepat dan gunakan gambar yang anda mempunyai hak untuk kongsi. Maklumat baharu dan perubahan tertakluk pada semakan sebelum diterbitkan.",
        ],
        [
          "Pertanyaan dan maklum balas",
          "Gunakan halaman Hubungi untuk melaporkan butiran profil yang perlu dibetulkan atau untuk mendapatkan bantuan.",
        ],
      ];
  return (
    '<div class="pub-shell">' +
    banner("about", title, [[title]]) +
    '<article class="pub-panel pub-policy">' +
    content
      .map(([heading, body]) => "<h2>" + heading + "</h2><p>" + body + "</p>")
      .join("") +
    button("Hubungi kami", "/hubungi", "pub-outline") +
    "</article></div>"
  );
};
const programDirectory = (data) => {
  if (!promotionsEnabled) return "";
  const records = [
    ...data.programs,
    ...data.institutes
      .filter((item) => item.promotionTitle)
      .map((item) => ({
        title: item.promotionTitle,
        description: item.promotionDescription,
        start: item.promotionStart,
        end: item.promotionEnd,
        poster: item.promotionPoster,
        name: item.name,
      })),
  ];
  const today = new Date().toISOString().slice(0, 10);
  const current = records.filter((item) => !item.end || item.end >= today);
  const date = (value) => {
    const parsed = new Date(value + "T00:00:00Z");
    return /^\d{4}-\d{2}-\d{2}$/.test(value || "") &&
      Number.isFinite(parsed.getTime())
      ? new Intl.DateTimeFormat("ms-MY", {
          dateStyle: "medium",
          timeZone: "UTC",
        }).format(parsed)
      : esc(value);
  };
  return current.length
    ? '<section class="pub-shell"><h2>Promosi &amp; program</h2><div class="pub-programs">' +
        current
          .map((item) => {
            const timing = [item.start || item.date, item.end]
              .filter(Boolean)
              .map(date)
              .join(" – ");
            return (
              '<article class="pub-panel">' +
              (item.poster ? photo(item.poster, "") : "") +
              "<h3>" +
              esc(item.title) +
              "</h3>" +
              (item.name ? "<p>" + esc(item.name) + "</p>" : "") +
              (timing ? "<p>" + timing + "</p>" : "") +
              "<p>" +
              esc(item.description) +
              "</p></article>"
            );
          })
          .join("") +
        "</div></section>"
    : "";
};
export function publicPageStyles(path) {
  const sheet =
    path === "/" || path === search || path.startsWith("/instructor/")
      ? "public-profiles"
      : "public-support";
  return '<link rel="stylesheet" href="/' + sheet + '.css">';
}
export function renderPublic(path, url, data = {}) {
  const contentData = {
    instructors: [],
    institutes: [],
    programs: [],
    ...data,
  };
  const accessPage = [
    "/login",
    "/signup",
    "/lupa-kata-laluan",
    "/reset-password",
  ].includes(path);
  let content;
  if (path === "/") content = mainHome() + programDirectory(contentData);
  else if (path === search) content = mainSearch(contentData, url);
  else if (path.startsWith("/instructor/")) {
    const item = contentData.instructors.find(
      (entry) => "/instructor/" + encodeURIComponent(entry.slug) === path,
    );
    if (!item) return null;
    content = profile(item, contentData.institutes);
  } else if (path === "/tentang-kami") content = about();
  else if (path === "/hubungi") content = contact();
  else if (path === join || path === "/daftar-instructor")
    content = register(contentData, false);
  else if (path === institute || path === "/daftar-institut-memandu")
    content = register(contentData, true);
  else if (accessPage) content = access(path, url);
  else if (path === "/privasi" || path === "/terma") content = terms(path);
  else return null;
  const locations = [
    ...contentData.instructors,
    ...contentData.institutes.map((item) => ({
      ...item,
      institute: item.name,
      name: "",
    })),
  ].map(({ state, district, institute, name }) => ({
    state,
    district,
    institute,
    name,
  }));
  return (
    '<div class="pub-site"><a class="pub-skip" href="#pub-main">Langkau ke kandungan</a>' +
    header(path, contentData.user, accessPage, contentData.demo) +
    '<main id="pub-main">' +
    content +
    "</main>" +
    footer(contentData.user) +
    '<script type="application/json" id="pub-location-data">' +
    JSON.stringify({ states, locations }).replace(/</g, "\\u003c") +
    "</script></div>"
  );
}
