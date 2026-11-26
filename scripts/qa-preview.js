import { isPausedPromotionPage } from "../src/features.js";
import http from "node:http";
import { existsSync, createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { demoInstructors, demoInstitutes } from "../src/demo.js";
const root = path.resolve("public");
const port = Number(process.env.MLH_VISUAL_PORT || 4173);
const mime = {
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".css": "text/css",
  ".js": "text/javascript",
  ".woff2": "font/woff2",
  ".png": "image/png",
};
const sample = demoInstructors[2];
const submissions = [
  {
    id: "daniel",
    kind: "instructor",
    status: "pengesahan",
    payload: { ...sample, title: sample.name },
    note: "",
  },
  {
    id: "profil-im",
    kind: "institut",
    status: "semakan",
    payload: demoInstitutes[0],
  },
  {
    id: "taklimat",
    kind: "program",
    status: "draft",
    payload: {
      title: "Taklimat keselamatan jalan raya",
      type: "Program",
      description: "Program institut untuk bakal pemandu.",
    },
  },
  {
    id: "pembetulan",
    kind: "correction",
    status: "semakan",
    payload: { name: "Pembetulan lokasi institut" },
  },
].map((r) => ({
  ...r,
  user_id: r.kind === "instructor" ? "contoh-instructor" : "contoh-institut",
  created_at: "2026-11-25",
  updated_at: "2026-11-25",
}));
http
  .createServer(async (req, res) => {
    try {
      const url = new URL(req.url, "http://localhost:4173"),
        p = url.pathname;
      const asset = path.resolve(root, "." + p);
      if (
        asset.startsWith(root + path.sep) &&
        existsSync(asset) &&
        (await stat(asset)).isFile()
      ) {
        res.setHeader(
          "content-type",
          mime[path.extname(asset)] || "application/octet-stream",
        );
        return createReadStream(asset).pipe(res);
      }
      if (req.method !== "GET") {
        res.writeHead(405);
        return res.end("Read-only visual review");
      }
      const dash = p.startsWith("/dashboard"),
        role = p.split("/")[2] || "instructor";
      const user = {
        id: "contoh-" + role,
        role,
        name:
          role === "admin"
            ? "Admin MyLesenHub"
            : role === "institut"
              ? "Wakil Institut"
              : sample.name,
        email: "contoh@example.invalid",
      };
      const data = {
        instructors: demoInstructors,
        institutes: demoInstitutes,
        programs: [],
        submissions,
        users: [
          user,
          {
            id: "contoh-institut",
            name: "Wakil Institut",
            email: "institut@example.invalid",
            role: "institut",
            representative_verified: false,
          },
        ],
        demo: true,
        user: dash ? user : null,
        profile: role === "institut" ? demoInstitutes[0] : sample,
      };
      Object.assign(data, {
        availableInstructors: demoInstructors,
        messages: [
          {
            id: "contoh",
            name: "Aina",
            email: "contoh@example.invalid",
            subject: "Pembetulan lokasi",
            message: "Mohon semak daerah institut.",
            created_at: "2026-11-25",
          },
        ],
      });
      data.profile =
        role === "institut"
          ? {
              ...demoInstitutes[0],
              representative: "Wakil Institut (contoh)",
              position: "Penyelaras",
              classes: ["B2", "D", "DA"],
              bio: "Kenali kemudahan latihan dan instructor di Institut Memandu Contoh.",
              photo: "/media/institute-building.webp",
              galleryLogo: "/media/institute-logo.webp",
              gallery: [
                "/media/institute-car.webp",
                "/media/institute-pair.webp",
                "/media/institute-track.webp",
              ],
              galleryCaptions: {
                "/media/institute-car.webp":
                  "Sesi latihan memandu di litar institut.",
                "/media/institute-pair.webp": "Tenaga pengajar institut kami.",
                "/media/institute-track.webp":
                  "Litar latihan memandu yang lengkap.",
              },
            }
          : {
              ...sample,
              fullName: "Daniel (contoh)",
              instituteOwner: "contoh-institut",
              previewPhoto: "/media/daniel-dashboard.webp",
              gallery: [
                "/media/profile-lesson.webp",
                "/media/profile-car.webp",
                "/media/profile-coaching.webp",
              ],
              galleryCaptions: {
                "/media/profile-lesson.webp": "Bimbingan di dalam kereta",
                "/media/profile-car.webp": "Kenderaan latihan",
                "/media/profile-coaching.webp": "Penerangan bersama pelajar",
              },
            };
      data.submissions = submissions
        .filter((s) => role === "admin" || s.user_id === user.id)
        .map((s) =>
          s.kind === "program"
            ? {
                ...s,
                payload: { ...s.payload, poster: "/media/promo-road.webp" },
              }
            : s,
        );
      if (dash && role === "instructor") {
        data.submissions = data.submissions.map((s) => ({
          ...s,
          status: "semakan",
          payload: data.profile,
        }));
      }
      if (dash && role === "institut") {
        data.instructors = demoInstructors.filter(
          (item) => item.slug !== "cikgu-farah",
        );
        data.submissions.push({
          id: "link-farah",
          kind: "affiliation",
          user_id: user.id,
          status: "semakan",
          payload: {
            requester: "contoh-farah",
            action: "link",
            instructorId: "cikgu-farah",
          },
          created_at: "2026-11-24",
          updated_at: "2026-11-24",
        });
      }
      const mod = await import(
        "../src/" +
          (dash ? "dashboard" : "public") +
          ".js?rev=" +
          (await stat("src/" + (dash ? "dashboard" : "public") + ".js")).mtimeMs
      );
      const render = dash ? mod.renderDashboard : mod.renderPublic;
      const body = render(p, url, data);
      if (!body) {
        res.writeHead(404);
        return res.end("Not found");
      }
      if (isPausedPromotionPage(p)) res.statusCode = 404;
      const skin = dash ? "dashboard" : "public";
      res.setHeader("content-type", "text/html;charset=utf-8");
      res.end(
        '<!doctype html><html lang="ms"><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><link rel="stylesheet" href="/base.css"><link rel="stylesheet" href="/' +
          skin +
          '.css">' +
          (dash
            ? '<link rel="stylesheet" href="/dashboard-shell.css"><link rel="stylesheet" href="/dashboard-admin.css">'
            : mod.publicPageStyles(p)) +
          '<script defer src="/' +
          skin +
          '.js"></script><script defer src="/location-picker.js"></script></head><body>' +
          body +
          "</body></html>",
      );
    } catch (e) {
      res.writeHead(503);
      res.end("Preview not ready: " + e.message);
    }
  })
  .listen(port, "127.0.0.1", () =>
    console.log("Visual review fixtures at http://127.0.0.1:" + port),
  );
