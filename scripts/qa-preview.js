import http from "node:http";
import { existsSync, createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { demoInstructors, demoInstitutes } from "../src/demo.js";
const root = path.resolve("public");
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
  user_id: "contoh",
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
        id: "contoh",
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
        users: [user],
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
              photo: "/media/institute-building.webp",
              gallery: [
                "/media/institute-car.webp",
                "/media/institute-pair.webp",
                "/media/institute-track.webp",
              ],
            }
          : {
              ...sample,
              gallery: [
                "/media/profile-lesson.webp",
                "/media/profile-car.webp",
                "/media/profile-coaching.webp",
              ],
            };
      data.submissions = submissions.map((s) =>
        s.kind === "program"
          ? {
              ...s,
              payload: { ...s.payload, poster: "/media/promo-road.webp" },
            }
          : s,
      );
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
      const skin = dash ? "dashboard" : "public";
      res.setHeader("content-type", "text/html;charset=utf-8");
      res.end(
        '<!doctype html><html lang="ms"><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><link rel="stylesheet" href="/base.css"><link rel="stylesheet" href="/' +
          skin +
          '.css"><script defer src="/' +
          skin +
          '.js"></script></head><body>' +
          body +
          "</body></html>",
      );
    } catch (e) {
      res.writeHead(503);
      res.end("Preview not ready: " + e.message);
    }
  })
  .listen(4173, "127.0.0.1", () =>
    console.log("Visual review fixtures at http://127.0.0.1:4173"),
  );
