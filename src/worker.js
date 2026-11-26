import { isPausedPromotionPage } from "./features.js";
import { neon } from "@neondatabase/serverless";
import { publicPageStyles, renderPublic } from "./public.js";
import { renderDashboard } from "./dashboard.js";
import { getUser } from "./auth.js";
import { catalog, dashboardData } from "./store.js";
import { api } from "./api.js";
import { escapeHtml as e, json, check } from "./security.js";
import { demoInstructors, demoInstitutes } from "./demo.js";
import { instructorResume } from "./instructor-resume.js";
const pages = {
  "/": [
    "Cari instructor memandu di Johor & Melaka",
    "Cari instructor memandu mengikut negeri, daerah dan institut. Kenali pengajar dan hubungi mereka melalui direktori komuniti MyLesenHub.",
  ],
  "/cari-instructor": [
    "Direktori instructor memandu Johor & Melaka",
    "Cari pengajar memandu mengikut lokasi dan institut. Semak bahasa, pengalaman dan kelas SPIM pada profil instructor.",
  ],
  "/tentang-kami": [
    "Tentang Kami",
    "Kenali direktori komuniti MyLesenHub untuk bakal pemandu di Johor dan Melaka.",
  ],
  "/hubungi": [
    "Hubungi Kami",
    "Hubungi pasukan MyLesenHub untuk pertanyaan, pembetulan profil dan maklum balas.",
  ],
  "/sertai-kami": [
    "Join Us",
    "Sertai direktori MyLesenHub sebagai instructor atau wakil institut memandu.",
  ],
  "/daftar-instructor": [
    "Daftar Instructor",
    "Hantar maklumat instructor untuk semakan MyLesenHub.",
  ],
  "/daftar-institut": [
    "Daftar Institut Memandu",
    "Daftarkan nama dan alamat institut memandu anda. Tetapkan pin lokasi untuk memudahkan bakal pemandu mencari institut.",
  ],
  "/login": ["Log masuk", "Akses dashboard MyLesenHub anda."],
  "/signup": ["Daftar akaun", "Buka akaun MyLesenHub."],
  "/reset-password": ["Tetapkan kata laluan", "Pulihkan akses akaun anda."],
  "/privasi": [
    "Privasi",
    "Ketahui bagaimana maklumat profil dan permohonan digunakan.",
  ],
  "/terma": ["Terma", "Terma penggunaan direktori MyLesenHub."],
};
pages["/lupa-kata-laluan"] = [
  "Lupa kata laluan",
  "Minta pautan untuk menetapkan semula kata laluan.",
];
const xmlHeaders = { "content-type": "application/xml; charset=utf-8" };
function document(body, options) {
  const {
    path,
    origin,
    title,
    description,
    privatePage,
    dash,
    jsonld,
    canonical,
  } = options;
  const css = dash ? "dashboard" : "public";
  return (
    '<!doctype html><html lang="ms-MY"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#101a44"><title>' +
    e(title) +
    ' | MyLesenHub</title><meta name="description" content="' +
    e(description) +
    '"><meta name="robots" content="' +
    (privatePage ? "noindex,nofollow" : "index,follow") +
    '"><link rel="canonical" href="' +
    e(canonical || origin + path) +
    '"><meta property="og:title" content="' +
    e(title) +
    ' | MyLesenHub"><meta property="og:type" content="website"><meta property="og:locale" content="ms_MY"><meta property="og:description" content="' +
    e(description) +
    '"><meta property="og:url" content="' +
    e(canonical || origin + path) +
    '"><meta property="og:image" content="' +
    e(origin) +
    '/media/social-share.webp"><meta name="twitter:card" content="summary_large_image"><link rel="icon" href="/media/icon-car.webp"><link rel="preload" href="/font/dm-sans.woff2" as="font" type="font/woff2" crossorigin><link rel="stylesheet" href="/base.css"><link rel="stylesheet" href="/' +
    css +
    '.css">' +
    (dash ? '<link rel="stylesheet" href="/dashboard-shell.css"><link rel="stylesheet" href="/dashboard-admin.css">' : publicPageStyles(path)) +
    '<script src="/' +
    css +
    '.js" defer></script><script src="/location-picker.js" defer></script>' +
    (jsonld
      ? '<script type="application/ld+json">' +
        JSON.stringify(jsonld).replace(/</g, "\\u003c") +
        "</script>"
      : "") +
    "</head><body>" +
    body +
    "</body></html>"
  );
}
function pageHeaders() {
  return {
    "content-type": "text/html; charset=utf-8",
    "cache-control": "private, no-store",
    "referrer-policy": "strict-origin-when-cross-origin",
    "permissions-policy": "geolocation=(self)",
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
    "content-security-policy":
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://tile.openstreetmap.org; connect-src 'self' https://photon.komoot.io; frame-src https://maps.google.com https://www.google.com; font-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
  };
}
async function serve(req, env) {
  const url = new URL(req.url),
    path = url.pathname,
    origin = url.origin;
  if (path.startsWith("/api/")) return api(req, env, path);
  if (!["GET", "HEAD"].includes(req.method))
    return new Response(null, { status: 405 });
  if (path.endsWith(".html")) {
    url.pathname = path === "/index.html" ? "/" : path.slice(0, -5);
    return Response.redirect(url, 308);
  }
  if (path !== "/" && path.endsWith("/")) {
    url.pathname = path.replace(/\/+$/, "");
    return Response.redirect(url, 308);
  }
  if (path === "/robots.txt")
    return new Response(
      "User-agent: *\nDisallow: /dashboard\nDisallow: /api/\nDisallow: /login\nDisallow: /signup\nSitemap: " +
        origin +
        "/sitemap.xml\n",
    );
  if (path === "/sitemap.xml") {
    check(env.DATABASE_URL, 503, "Direktori belum tersedia. Cuba sebentar lagi.");
    const listing = await catalog(neon(env.DATABASE_URL));
    const paths = [
      ...Object.keys(pages).filter(
        (p) =>
          ![
            "/signup",
            "/login",
            "/reset-password",
            "/lupa-kata-laluan",
          ].includes(p),
      ),
      ...listing.instructors
        .filter((item) => !item.stakeholderPreview)
        .map((item) => "/instructor/" + item.slug),
    ];
    return new Response(
      '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
        paths
          .map((p) => "<url><loc>" + e(origin + p) + "</loc></url>")
          .join("") +
        "</urlset>",
      { headers: xmlHeaders },
    );
  }
  const sql = env.DATABASE_URL ? neon(env.DATABASE_URL) : null;
  const example = url.searchParams.get("contoh") === "1";
  const resumeRoute = path.match(/^\/instructor\/([^/]+)\/resume\.pdf$/);
  if (resumeRoute) {
    check(example || sql, 503, "Direktori belum tersedia. Cuba sebentar lagi.");
    const directory = example
      ? { instructors: demoInstructors, institutes: demoInstitutes }
      : await catalog(sql);
    const person = directory.instructors.find(
      (entry) => encodeURIComponent(entry.slug) === resumeRoute[1],
    );
    if (!person) return new Response(req.method === "HEAD" ? null : "Profil tidak ditemui.", {
      status: 404,
      headers: { "cache-control": "no-store" },
    });
    return new Response(
      req.method === "HEAD" ? null : await instructorResume(person, directory.institutes, origin, env),
      { headers: {
        "content-type": "application/pdf",
        "content-disposition": 'attachment; filename="mylesenhub-resume-' + encodeURIComponent(person.slug) + '.pdf"',
        "cache-control": "private, no-store",
        "x-content-type-options": "nosniff",
        "x-robots-tag": "noindex",
      } },
    );
  }
  const user = sql ? await getUser(req, env, sql) : null,
    dash = path === "/dashboard" || path.startsWith("/dashboard/");
  let data = { user, instructors: [], institutes: [], programs: [] },
    body,
    title = pages[path]?.[0] || "MyLesenHub",
    description = pages[path]?.[1] || "",
    schema, previewProfile = false;
  if (dash) {
    if (!user)
      return Response.redirect(
        origin + "/login?return=" + encodeURIComponent(path + url.search),
        302,
      );
    if (path === "/dashboard")
      return Response.redirect(
        origin + "/dashboard/" + user.role + "/ringkasan",
        302,
      );
    if (path.split("/")[2] !== user.role)
      return new Response("Akses terhad", {
        status: 403,
        headers: { "cache-control": "no-store" },
      });
    data = await dashboardData(sql, user, url);
    body = renderDashboard(path, url, data);
    title = "Dashboard " + user.role;
  } else {
    if (
      path === "/" ||
      path === "/cari-instructor" ||
      path.startsWith("/instructor/") ||
      path.includes("daftar") ||
      path === "/sertai-kami"
    ) {
      if (example)
        Object.assign(data, {
          demo: true,
          instructors: demoInstructors,
          institutes: demoInstitutes,
        });
      else {
        check(sql, 503, "Direktori belum tersedia. Cuba sebentar lagi.");
        Object.assign(data, await catalog(sql));
      }
    }
    const person = /^\/instructor\/[^/]+$/.test(path)
      ? data.instructors.find((i) => i.slug === path.split("/")[2])
      : null;
    body =
      path.startsWith("/instructor/") && !person
        ? null
        : renderPublic(path, url, data);
    if (person) {
      previewProfile = person.stakeholderPreview === true;
      title = person.name + " • Instructor memandu " + person.district;
      description = person.bio || title;
    }
    if (body && !example && !previewProfile) {
      const organization = {
        "@type": "Organization",
        name: "MyLesenHub",
        url: origin,
        areaServed: ["Johor", "Melaka"],
      };
      schema = {
        "@context": "https://schema.org",
        "@type": person
          ? "ProfilePage"
          : path === "/cari-instructor"
            ? "CollectionPage"
            : path === "/tentang-kami"
              ? "AboutPage"
              : path === "/hubungi"
                ? "ContactPage"
                : "WebPage",
        name: title,
        url: origin + path,
        description,
        inLanguage: "ms-MY",
        publisher: organization,
      };
      if (person)
        schema.mainEntity = {
          "@type": "Person",
          name: person.name,
          jobTitle: "Instructor memandu",
          workLocation: person.district,
        };
    }
  }
  const found = typeof body === "string" && !!body;
  if (!found) {
    title = "Halaman tidak ditemui";
    body =
      '<main style="max-width:40rem;margin:12vh auto;padding:2rem"><h1>Halaman tidak ditemui</h1><p>Semak pautan atau mulakan carian baharu.</p><a href="/cari-instructor">Cari instructor</a></main>';
  }
  return new Response(
    req.method === "HEAD"
      ? null
      : document(body, {
          path,
          origin,
          title,
          description,
          dash,
          privatePage:
            !found ||
            dash ||
            example ||
            previewProfile ||
            [
              "/login",
              "/signup",
              "/reset-password",
              "/lupa-kata-laluan",
            ].includes(path),
          jsonld: schema,
        }),
    { status: found && !isPausedPromotionPage(path) ? 200 : 404, headers: pageHeaders() },
  );
}
export default {
  async fetch(req, env) {
    try {
      return await serve(req, env);
    } catch (error) {
      const status = Number(error.status) || 503;
      const message = error.status
        ? error.message
        : "Perkhidmatan belum tersedia. Cuba sebentar lagi.";
      console.error(
        "MyLesenHub request failed",
        new URL(req.url).pathname,
        status,
        error.name,
        error.code || "",
      );
      return new URL(req.url).pathname.startsWith("/api/")
        ? json({ ok: false, message }, status)
        : new Response(
            '<!doctype html><html lang="ms"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>MyLesenHub</title><main><h1>' +
              e(message) +
              '</h1><a href="/">Kembali ke laman utama</a></main></html>',
            { status, headers: pageHeaders() },
          );
    }
  },
};
