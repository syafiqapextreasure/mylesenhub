import { escapeHtml as e } from "./security.js";
import { profileLanguages, registeredInstituteNames } from "./form-options.js";
import { promotionsEnabled } from "./features.js";
import { licenceClasses as classNames, teachingClasses as spreadClasses } from "./licence-classes.js";

const districts = {
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
const labels = {
  draft: "Draf",
  semakan: "Menunggu semakan",
  pengesahan: "Pengesahan",
  diterbitkan: "Diterbitkan",
  pembetulan: "Perlu pembetulan",
};
const icons = {
  instructor: "person",
  institut: "institute",
  program: "megaphone",
  media: "image",
  affiliation: "people",
  correction: "edit",
};
const root = (role) => "/dashboard/" + role;
const icon = (name) =>
  '<span class="d-icon" aria-hidden="true" style="mask-image:url(/media/icon-' +
  name +
  '.webp)"></span>';
const button = (href, label, style = "outline") =>
  '<a class="d-btn ' + style + '" href="' + e(href) + '">' + e(label) + "</a>";
const badge = (status) =>
  '<span class="d-pill d-' +
  e(status || "draft") +
  '">' +
  e(labels[status] || "Belum dihantar") +
  "</span>";
const card = (markup, extra = "") =>
  '<section class="d-card ' + extra + '">' + markup + "</section>";
const photo = (record, alternate, decorative = false) =>
  record.photo
    ? '<img src="' +
      e(record.photo) +
      '" alt="' +
      e(decorative ? "" : alternate) +
      '">'
    : '<span class="dm-placeholder">' + icon("image") + "</span>";
const profile = (data) => data.profile?.payload || data.profile || {};
const hiddenProfile = (data) => [true, "true"].includes(profile(data)._hidden);
const profileIsPublic = (data) => Boolean(data.profile && !hiddenProfile(data));
const profileBadge = (data) =>
  hiddenProfile(data)
    ? '<span class="d-pill d-pembetulan">Disembunyikan</span>'
    : badge(profileIsPublic(data) ? "diterbitkan" : "draft");
const recordDate = (raw) => {
  const date = new Date(raw || "");
  if (Number.isNaN(date.valueOf())) return "—";
  return new Intl.DateTimeFormat("ms-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kuala_Lumpur",
  }).format(date);
};
const owned = (data) =>
  (data.submissions || []).filter(
    (s) =>
      !s.user_id ||
      s.user_id === data.user?.id ||
      (data.user?.role === "instructor" &&
        s.kind === "affiliation" &&
        s.payload?.requester === data.user.id),
  );
const chips = (values) =>
  '<span class="dm-chips">' +
  values
    .filter(Boolean)
    .map((v) => "<span>" + e(v) + "</span>")
    .join("") +
  "</span>";

function field(label, control, { wide = false, required = false } = {}) {
  return (
    '<label class="d-field' +
    (wide ? " wide" : "") +
    '"><b>' +
    label +
    (required ? ' <em aria-hidden="true">*</em>' : "") +
    "</b>" +
    control +
    "</label>"
  );
}
function input(name, label, value, opts = {}) {
  const {
    required = false,
    wide = false,
    placeholder = "",
    type = "text",
    attrs = "",
  } = opts;
  const control =
    type === "textarea"
      ? '<textarea name="' +
        name +
        '" placeholder="' +
        e(placeholder) +
        '" ' +
        attrs +
        (required ? " required" : "") +
        ">" +
        e(value) +
        "</textarea>"
      : '<input name="' +
        name +
        '" type="' +
        type +
        '" value="' +
        e(value) +
        '" placeholder="' +
        e(placeholder) +
        '" ' +
        attrs +
        (required ? " required" : "") +
        ">";
  return field(label, control, opts);
}
const choices = (values, current) => [
  ...new Set([...values, ...(current ? [current] : [])]),
];
function option(value, label, current, meta = "") {
  return (
    '<option value="' +
    e(value) +
    '"' +
    (value === current ? " selected" : "") +
    meta +
    ">" +
    e(label) +
    "</option>"
  );
}
function select(name, label, current, values, opts = {}) {
  const { prompt = "Sila pilih", required = false, attrs = "" } = opts;
  return field(
    label,
    '<select name="' +
      name +
      '" ' +
      attrs +
      (required ? " required" : "") +
      ">" +
      option("", prompt, current) +
      values
        .map((value) =>
          Array.isArray(value)
            ? option(value[0], value[2] || value[0], current, value[1])
            : option(value, value, current),
        )
        .join("") +
      "</select>",
    opts,
  );
}
const detailSection = (title, img, fields) =>
  '<section class="dm-form-section"><h2>' +
  icon(img) +
  e(title) +
  '</h2><div class="d-fields">' +
  fields +
  "</div></section>";
function classPicker(p, inst) {
  const selected = spreadClasses(p),
    name = inst ? "classes" : "spim",
    label = inst ? "Kelas ditawarkan" : "Kelas SPIM";
  return (
    '<div class="d-field dm-class-field"><b id="dm-classes-label">' +
    label +
    ' <em aria-hidden="true">*</em></b><div class="dm-class-control" data-dm-classes><div class="dm-class-chips" data-dm-chips>' +
    selected
      .filter((v) => classNames.includes(v))
      .map(
        (v) =>
          '<button type="button" data-dm-remove-class="' +
          v +
          '" aria-label="Buang kelas ' +
          v +
          '">' +
          v +
          ' <span aria-hidden="true">×</span></button>',
      )
      .join("") +
    '</div><button type="button" class="dm-class-toggle" aria-label="Pilih ' +
    label +
    '" aria-expanded="false" aria-controls="dm-class-options"></button><div id="dm-class-options" class="dm-class-options" role="group" aria-labelledby="dm-classes-label" hidden>' +
    classNames
      .map(
        (v) =>
          '<label><input name="' +
          name +
          '" type="checkbox" value="' +
          v +
          '"' +
          (selected.includes(v) ? " checked" : "") +
          "> <span>" +
          v +
          "</span></label>",
      )
      .join("") +
    "</div></div><small>Pilihan: B, B2, D, DA, QTI</small></div>"
  );
}
function locationFields(p) {
  return (
    select("state", "Negeri", p.state, Object.keys(districts), {
      required: true,
      prompt: "Pilih negeri",
      attrs: "data-dm-state",
    }) +
    select(
      "district",
      "Daerah",
      p.district,
      Object.entries(districts).flatMap(([state, values]) =>
        values.map((v) => [
          v,
          ' data-state="' +
            state +
            '"' +
            (state !== p.state ? " hidden disabled" : ""),
        ]),
      ),
      {
        required: true,
        prompt: "Pilih daerah",
        attrs: "data-dm-district" + (!p.state ? " disabled" : ""),
      },
    )
  );
}
function profilePreview(role, data) {
  if (!profileIsPublic(data) || role === "institut") return "";
  const id = data.demo
    ? profile(data).slug || "cikgu-daniel"
    : "instructor-" + data.user?.id;
  return (
    "/instructor/" + encodeURIComponent(id) + (data.demo ? "?contoh=1" : "")
  );
}
export function memberProfileAction(role, data) {
  return data.profile
    ? button(
        profilePreview(role, data) || "#pratonton-profil",
        "Pratonton profil",
      )
    : "";
}
function instituteFields(p, institutes) {
  const registered = registeredInstituteNames(institutes);
  return '<div class="d-field wide dm-institute-picker" data-dm-institute-picker>' +
    input("institute", "Institut Memandu", p.institute, {
      required: true, placeholder: "Taip nama institut memandu", attrs: 'maxlength="300"',
    }) +
    field("Pilih institut berdaftar",
      '<select data-registered-institute>' +
      option("", registered.length ? "Pilih institut" : "Tiada institut berdaftar", p.institute) +
      registered.map(name => option(name, name, p.institute)).join("") +
      "</select>") +
    "</div>";
}
export function memberProfile(role, data) {
  const inst = role === "institut",
    approved = profile(data);
  const latest = owned(data).find((row) => row.kind === role);
  const editable =
    latest && ["draft", "pembetulan"].includes(latest.status) ? latest : null;
  const p = { ...approved, ...editable?.payload };
  const published = profileIsPublic(data);
  const required = { required: true };
  const language = select(
    "languages",
    "Bahasa",
    p.languages,
    choices(profileLanguages, p.languages),
    { required: true, prompt: "Pilih bahasa" },
  );
  const email = input("email", inst ? "E-mel rasmi" : "E-mel", p.email, {
    ...required,
    type: "email",
    placeholder: inst ? "Masukkan e-mel rasmi" : "Alamat e-mel anda",
  });
  const phone = input(
    "phone",
    inst ? "Nombor telefon" : "Nombor untuk dihubungi",
    p.phone,
    { ...required, type: "tel", placeholder: "Masukkan nombor telefon" },
  );
  const editingFields = inst
    ? detailSection(
        "Maklumat institut",
        "institute",
        input("name", "Nama Institut Memandu", p.name, required) +
          locationFields(p) +
          input("postcode", "Poskod", p.postcode, {
            ...required,
            placeholder: "Masukkan poskod",
            attrs: 'inputmode="numeric" pattern="[0-9]{5}" maxlength="5"',
          }) +
          input("address", "Alamat institut", p.address, {
            ...required,
            type: "textarea",
            wide: true,
            placeholder: "Alamat penuh institut",
          }) +
          classPicker(p, true) +
          input("maps", "Pautan lokasi", p.maps, {
            type: "url",
            placeholder: "Pautan Google Maps",
          }),
      ) +
      detailSection(
        "Wakil & hubungan",
        "person",
        input("representative", "Nama wakil", p.representative, required) +
          select(
            "position",
            "Jawatan",
            p.position,
            choices(
              [
                "Penyelaras",
                "Pengurus",
                "Pentadbir",
                "Wakil institut",
                "Lain-lain",
              ],
              p.position,
            ),
            required,
          ) +
          email +
          phone,
      ) +
      detailSection(
        "Pengenalan institut",
        "book",
        input("bio", "Pengenalan ringkas", p.bio, {
          ...required,
          wide: true,
          type: "textarea",
        }),
      )
    : detailSection(
        "Maklumat asas",
        "person",
        input("fullName", "Nama penuh", p.fullName || p.name, required) +
          input(
            "displayName",
            "Nama paparan",
            p.displayName || p.name,
            required,
          ) +
          email +
          phone +
          locationFields(p) +
          instituteFields(p, data.institutes || []) +
          language,
      ) +
      detailSection(
        "Maklumat pengajaran",
        "car",
        classPicker(p, false) +
          field(
            "Experience",
            '<span class="dm-unit"><input name="experience" type="number" min="0" max="80" required value="' +
              e(String(p.experience ?? "").replace(/\s*tahun$/i, "")) +
              '"><span>tahun</span></span>',
            required,
          ) +
          input("other", "Other", p.other, { wide: true }),
      ) +
      detailSection(
        "Pengenalan ringkas",
        "book",
        input("bio", "Pengenalan ringkas", p.bio, {
          ...required,
          wide: true,
          type: "textarea",
        }),
      );
  const location = [approved.district, approved.state]
    .filter(Boolean)
    .join(", ");
  const details = [
    ["Kelas SPIM", chips(spreadClasses(approved))],
    ["Bahasa", e(approved.languages)],
    [
      "Experience",
      approved.experience
        ? e(String(approved.experience).replace(/(?: tahun)?$/, " tahun"))
        : "",
    ],
    ["Other", e(approved.other)],
  ].filter(([, value]) => value && value !== '<span class="dm-chips"></span>');
  const previewPhoto =
    data.demo && approved.previewPhoto
      ? { ...approved, photo: approved.previewPhoto }
      : approved;
  const preview = card(
    '<div id="pratonton-profil" class="dm-preview-photo">' +
      photo(previewPhoto, inst ? "Gambar institut" : "Foto profil") +
      "</div>" +
      '<div class="dm-preview-title"><h2>' +
      e(approved.name || "Profil anda") +
      "</h2>" +
      profileBadge(data) +
      "</div>" +
      (!inst && approved.institute
        ? "<p>" + icon("institute") + e(approved.institute) + "</p>"
        : "") +
      (location ? "<p>" + icon("pin") + e(location) + "</p>" : "") +
      (inst
        ? "<p>" +
          (published
            ? "Profil institut diluluskan dan diterbitkan di laman awam."
            : hiddenProfile(data)
              ? "Profil institut disembunyikan daripada direktori awam."
              : "Profil institut belum diterbitkan.") +
          "</p>"
        : details.length
          ? "<dl>" +
            details
              .map(
                ([l, v]) => "<div><dt>" + l + "</dt><dd>" + v + "</dd></div>",
              )
              .join("") +
            "</dl>"
          : "") +
      '<div class="dm-preview-links">' +
      button(
        root(role) + "/foto-galeri",
        inst ? "Urus logo & galeri" : "Urus foto & galeri",
      ) +
      (inst && promotionsEnabled
        ? button(root(role) + "/promosi", "Urus promosi & program")
        : "") +
      "</div>",
    "dm-profile-preview",
  );
  const instituteRequest =
    !inst &&
    published &&
    !approved.instituteOwner &&
    (data.institutes || []).length
      ? card(
          "<h2>Hubungan institut</h2><p>Mohon hubungan dengan institut yang telah diterbitkan.</p><form data-instructor-affiliation>" +
            field(
              "Institut Memandu",
              '<select name="instituteId" required><option value="">Pilih institut</option>' +
                data.institutes
                  .map((row) => option(row.id || row.slug, row.name, ""))
                  .join("") +
                "</select>",
            ) +
            '<button class="d-btn outline">Mohon hubungan</button><p class="d-feedback" aria-live="polite"></p></form>',
        )
      : "";
  return (
    '<div class="dm-profile-page ' +
    (inst ? "dm-inst" : "dm-trainer") +
    '">' +
    '<div class="d-notice dm-review-notice">' +
    icon("help") +
    (inst
      ? "Perubahan memerlukan semakan dan pengesahan."
      : "Perubahan dihantar untuk semakan sebelum diterbitkan.") +
    "</div>" +
    '<div class="dm-profile-columns"><form class="d-card d-form dm-profile-form" data-submit-kind="' +
    role +
    '" data-member-profile' +
    (editable ? ' data-id="' + e(editable.id) + '"' : "") +
    ">" +
    editingFields +
    '<div class="d-actions"><button class="d-btn outline" name="status" value="draft" formnovalidate>Simpan draf</button><button class="d-btn red" name="status" value="semakan">Hantar untuk semakan</button></div>' +
    '<p class="d-feedback" aria-live="polite"></p></form><aside>' +
    preview +
    (!inst
      ? card(
          '<div class="dm-publication-note">' +
            icon("help") +
            "<div><h2>Penerbitan profil</h2><p>" +
            (hiddenProfile(data)
              ? "Profil ini disembunyikan daripada direktori awam."
              : "Versi yang diluluskan kekal dipaparkan semasa semakan.") +
            "</p></div></div>",
        )
      : "") +
    instituteRequest +
    "</aside></div></div>"
  );
}

function titleOf(s, role) {
  const conventional = {
    instructor: "Permohonan kemas kini profil",
    institut: "Kemas kini profil institut",
    media: "Kemas kini foto & galeri",
    affiliation: "Permintaan hubungan instructor",
    correction: "Permintaan pembetulan",
  };
  return (
    s.payload?.title || conventional[s.kind] || s.payload?.name || "Permohonan"
  );
}
function timeline(status) {
  const step =
    { draft: -1, semakan: 1, pengesahan: 2, diterbitkan: 3, pembetulan: 1 }[
      status
    ] ?? -1;
  const labels = [
    "Hantar maklumat",
    "Semakan",
    "Pengesahan",
    "Profil diterbitkan",
  ];
  return (
    '<ol class="dm-timeline" aria-label="Kemajuan permohonan">' +
    labels
      .map((label, index) => {
        const done =
          index < step || (status === "diterbitkan" && index === step);
        return (
          '<li class="' +
          (done ? "done" : index === step ? "current" : "") +
          '"' +
          (index === step ? ' aria-current="step"' : "") +
          '><span aria-hidden="true">' +
          (done ? "✓" : index + 1) +
          "</span><strong>" +
          label +
          "</strong></li>"
        );
      })
      .join("") +
    "</ol>"
  );
}
function submittedSummary(row, inst) {
  const p = row.payload || {};
  if (inst) {
    const keys = [];
    if (p.bio) keys.push("Pengenalan");
    if (p.gallery?.length || p.galleryOrder?.length) keys.push("Galeri");
    if (p.address) keys.push("Alamat institut");
    if (p.representative) keys.push("Maklumat wakil");
    return (
      '<p class="dm-change-summary">' +
      icon("image") +
      (keys.length
        ? e(keys.join(" · "))
        : e(p.description || p.name || titleOf(row))) +
      "</p>"
    );
  }
  const entries = [
    ["car", "Kelas SPIM", chips(spreadClasses(p))],
    [
      "clock",
      "Experience",
      p.experience
        ? e(String(p.experience).replace(/(?: tahun)?$/, " tahun"))
        : "",
    ],
    ["help", "Other", e(p.other)],
    [
      "image",
      "Galeri",
      p.gallery?.length ? chips([p.gallery.length + " gambar"]) : "",
    ],
  ].filter(([, , v]) => v && v !== '<span class="dm-chips"></span>');
  return entries.length
    ? "<dl>" +
        entries
          .map(
            ([ic, l, v]) =>
              "<div><dt>" + icon(ic) + l + "</dt><dd>" + v + "</dd></div>",
          )
          .join("") +
        "</dl>"
    : "<p>" + e(p.name || p.title || titleOf(row)) + "</p>";
}
export function memberStatus(role, data, url) {
  const inst = role === "institut",
    kind = url.searchParams.get("kind") || "",
    id = url.searchParams.get("id");
  const records = owned(data).filter(
    (row) => promotionsEnabled || row.kind !== "program",
  );
  const items = records.filter((row) => !kind || row.kind === kind);
  const selected = items.find((r) => String(r.id) === id) || items[0];
  const query = (k, i = "") =>
    "?" +
    new URLSearchParams({ ...(k ? { kind: k } : {}), ...(i ? { id: i } : {}) });
  const history = card(
    (inst
      ? '<nav class="dm-status-tabs" aria-label="Jenis permohonan">' +
        [
          ["", "Semua"],
          ["institut", "Profil institut"],
          ...(promotionsEnabled ? [["program", "Promosi & program"]] : []),
          ["affiliation", "Hubungan instructor"],
          ["media", "Foto & galeri"],
        ]
          .map(([k, l]) => button(query(k), l, k === kind ? "red" : "outline"))
          .join("") +
        "</nav>"
      : "<h2>Sejarah penghantaran</h2>") +
      '<div class="d-table-wrap"><table><thead><tr><th>Permohonan</th><th>Tarikh dihantar</th><th>Status</th><th>Tindakan</th></tr></thead><tbody>' +
      (items
        .map(
          (row) =>
            "<tr" +
            (selected === row ? ' class="dm-selected"' : "") +
            '><td><span class="dm-table-name"><span class="dm-round">' +
            icon(icons[row.kind] || "book") +
            "</span>" +
            e(titleOf(row, role)) +
            "</span></td><td>" +
            recordDate(row.created_at) +
            "</td><td>" +
            badge(row.status) +
            "</td><td>" +
            button(query(kind, row.id), "Lihat butiran") +
            "</td></tr>",
        )
        .join("") || '<tr><td colspan="4">Tiada permohonan.</td></tr>') +
      "</tbody></table></div>",
    "dm-status-history",
  );
  const summary = !inst
    ? '<div class="dm-status-summary">' +
      card("<b>Profil awam</b>" + profileBadge(data)) +
      card("<b>Perubahan terkini</b>" + badge(records[0]?.status)) +
      "</div>"
    : "";
  if (!selected)
    return '<div class="dm-status">' + summary + history + "</div>";
  const href = profilePreview(role, data);
  const creation = recordDate(selected.created_at),
    recent = recordDate(selected.updated_at);
  const activity = !inst
    ? card(
        '<h3>Aktiviti permohonan</h3><ol class="dm-activity-list">' +
          (selected.status !== "semakan" &&
          selected.updated_at !== selected.created_at
            ? "<li><b>" +
              recent +
              "</b> " +
              e(labels[selected.status] || "Status dikemas kini") +
              "</li>"
            : "") +
          "<li><b>" +
          creation +
          "</b> " +
          (selected.status === "draft"
            ? "Draf disimpan"
            : "Perubahan dihantar") +
          "</li></ol>",
      )
    : "";
  const detail = card(
    "<h2>" +
      e(titleOf(selected, role)) +
      '</h2><p class="dm-record-heading">ID: ' +
      e(selected.id) +
      " <span>Tarikh: " +
      creation +
      "</span></p>" +
      timeline(selected.status) +
      '<div class="dm-status-panels">' +
      card(
        "<h3>" +
          (inst ? "Perubahan" : "Maklumat dihantar") +
          "</h3>" +
          submittedSummary(selected, inst),
        "dm-submitted",
      ) +
      card(
        '<h3>Nota pasukan</h3><div class="dm-team-note">' +
          icon("message") +
          "<p>" +
          e(selected.note || "Belum ada maklum balas baharu.") +
          "</p></div>",
      ) +
      "</div>" +
      activity +
      '<div class="dm-status-foot"><span>' +
      icon("help") +
      (profileIsPublic(data)
        ? "Profil yang diluluskan masih boleh dilihat oleh pengunjung."
        : hiddenProfile(data)
          ? "Profil disembunyikan daripada direktori awam."
          : "Profil akan dipaparkan selepas diluluskan.") +
      "</span>" +
      (href ? button(href, "Lihat profil awam") : "") +
      button(root(role) + "/ringkasan", "Kembali ke ringkasan") +
      "</div>",
    "dm-status-detail",
  );
  return (
    '<div class="dm-status ' +
    (inst ? "dm-inst-status" : "dm-trainer-status") +
    '">' +
    summary +
    (inst ? history + detail : detail + (items.length > 1 ? history : "")) +
    "</div>"
  );
}
export function memberAffiliations(data, url) {
  const linked = data.instructors || [];
  const sources = new Map(
    [...(data.availableInstructors || []), ...linked].map((item) => [
      String(item.id),
      item,
    ]),
  );
  const requests = owned(data).filter((row) => row.kind === "affiliation");
  const listed = linked.map((item) => ({ item, status: "linked" }));
  const linkIds = new Set(listed.map(({ item }) => item.id));
  const activeRequests = new Set();
  for (const row of requests) {
    const item = sources.get(String(row.payload?.instructorId));
    if (
      !item ||
      activeRequests.has(item.id) ||
      linkIds.has(item.id) ||
      row.status === "diterbitkan"
    )
      continue;
    activeRequests.add(item.id);
    listed.push({
      item,
      row,
      status:
        row.payload.instituteDecision === "rejected"
          ? "rejected"
          : row.payload.instituteDecision === "approved"
            ? "confirmed"
            : "pending",
    });
  }
  const state = url.searchParams.get("status") || "";
  const name = url.searchParams.get("q") || "";
  const filter = (row) =>
    (!state || state === row.status) &&
    (!name || row.item.name.toLowerCase().includes(name.toLowerCase()));
  const selectedId = url.searchParams.get("id");
  const selected =
    listed.find(({ row }) => row && String(row.id) === selectedId) ||
    listed.find(
      ({ row, status }) => row?.payload?.requester && status === "pending",
    );
  const selectedRow = selected?.row,
    selectedItem = selected?.item;
  const names = {
    linked: "Disahkan",
    pending: "Menunggu pengesahan",
    confirmed: "Disahkan oleh institut",
    rejected: "Tidak berkaitan",
  };
  const metrics =
    '<div class="dm-aff-metrics">' +
    [
      ["people", listed.length, "instructor"],
      ["checklist", linked.length, "disahkan"],
      [
        "clock",
        listed.filter((row) => row.status === "pending").length,
        "menunggu pengesahan",
      ],
    ]
      .map(([ic, n, l]) =>
        card(
          '<span class="dm-round">' +
            icon(ic) +
            "</span><b>" +
            n +
            " " +
            l +
            "</b>",
        ),
      )
      .join("") +
    "</div>";
  const linkTo = (item) =>
    "/instructor/" +
    encodeURIComponent(item.slug || item.id) +
    (item.demo ? "?contoh=1" : "");
  const rows = listed
    .filter(filter)
    .map(({ item, row, status }) => {
      const action = row
        ? button(
            "?" + new URLSearchParams({ q: name, status: state, id: row.id }),
            "Semak",
            status === "pending" ? "red" : "outline",
          )
        : button(linkTo(item), "Lihat profil");
      return (
        "<tr" +
        (row && row === selectedRow ? ' class="dm-selected"' : "") +
        '><td><span class="dm-instructor-name">' +
        photo(item, "", true) +
        "<strong>" +
        e(item.name) +
        "</strong></span></td><td>" +
        chips(spreadClasses(item)) +
        '</td><td><span class="d-pill d-' +
        (status === "linked" || status === "confirmed"
          ? "diterbitkan"
          : status === "rejected"
            ? "pembetulan"
            : "semakan") +
        '">' +
        names[status] +
        "</span></td><td>" +
        action +
        "</td></tr>"
      );
    })
    .join("");
  const listing = card(
    '<form class="dm-aff-filter" method="get"><label class="d-field"><b>Cari nama instructor</b><input type="search" name="q" value="' +
      e(name) +
      '" placeholder="Cari nama instructor"></label>' +
      select(
        "status",
        "Status",
        state,
        Object.entries(names).map(([key, title]) => [key, "", title]),
        { prompt: "Semua status" },
      ) +
      '<button class="d-btn outline">Tapis</button></form><div class="d-table-wrap"><table><thead><tr><th>Instructor</th><th>Kelas SPIM</th><th>Hubungan institut</th><th>Tindakan</th></tr></thead><tbody>' +
      (rows ||
        '<tr><td colspan="4">Tiada hubungan instructor untuk dipaparkan.</td></tr>') +
      "</tbody></table></div>",
  );
  const candidates = [...sources.values()].filter(
    (item) =>
      !linkIds.has(item.id) &&
      !listed.some(
        (row) =>
          row.item.id === item.id &&
          ["pending", "confirmed"].includes(row.status),
      ),
  );
  const invite = card(
    '<h2 id="dm-invite">Jemput instructor</h2><p>Permintaan akan dihantar kepada admin untuk semakan.</p>' +
      (candidates.length
        ? '<form data-affiliation><input type="hidden" name="action" value="link">' +
          field(
            "Instructor",
            '<select name="instructorId" required><option value="">Sila pilih</option>' +
              candidates
                .map((item) => option(item.id, item.name, ""))
                .join("") +
              "</select>",
          ) +
          '<button class="d-btn red">Hantar permintaan</button><p class="d-feedback" aria-live="polite"></p></form>'
        : "<p>Tiada instructor tersedia untuk dijemput.</p>") +
      (linked.length
        ? '<details><summary>Mohon buang hubungan</summary><form data-affiliation><input type="hidden" name="action" value="unlink">' +
          field(
            "Instructor",
            '<select name="instructorId" required><option value="">Sila pilih</option>' +
              linked.map((item) => option(item.id, item.name, "")).join("") +
              "</select>",
          ) +
          '<button class="d-btn outline">Mohon buang hubungan</button><p class="d-feedback" aria-live="polite"></p></form></details>'
        : ""),
    "dm-aff-invite",
  );
  const decision = selectedItem
    ? card(
        '<h2>Pengesahan hubungan</h2><div class="dm-aff-person">' +
          photo(selectedItem, "Foto " + selectedItem.name) +
          "<div><h3>" +
          e(selectedItem.name) +
          "</h3><p>" +
          icon("institute") +
          e(selectedItem.institute || profile(data).name) +
          "</p><p>" +
          icon("pin") +
          e(
            [selectedItem.district, selectedItem.state]
              .filter(Boolean)
              .join(", "),
          ) +
          "</p></div></div>" +
          "<p>" +
          (selectedRow.payload.requester
            ? "Memohon pautan kepada institut anda."
            : "Permintaan hubungan dihantar oleh institut.") +
          "</p>" +
          (selected.status === "pending" && selectedRow.payload.requester
            ? '<form data-affiliation-decision="' +
              e(selectedRow.id) +
              '"><button class="d-btn red" name="action" value="approve">Sahkan hubungan</button><button class="d-btn outline" name="action" value="reject">Tidak berkaitan</button><p class="d-feedback" aria-live="polite"></p></form>'
            : "<p>" + badge(selectedRow.status) + "</p>") +
          '<div class="dm-soft-note">' +
          icon("help") +
          "Pengesahan ini hanya mengesahkan hubungan dengan institut.</div>",
        "dm-aff-decision",
      )
    : "";
  return (
    '<div class="dm-affiliations">' +
    metrics +
    '<div class="dm-aff-columns">' +
    listing +
    "<aside>" +
    decision +
    invite +
    '</aside></div><div class="dm-soft-note">' +
    icon("megaphone") +
    "Penerbitan profil dikendalikan oleh Admin MyLesenHub.</div></div>"
  );
}
