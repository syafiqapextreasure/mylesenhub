import decodeWebp, { init } from "@jsquash/webp/decode.js";
import webpModule from "@jsquash/webp/codec/dec/webp_dec.wasm";
import jpeg from "jpeg-js";
import { api } from "./api.js";
import { bytes, uuid } from "./security.js";

const maxImageBytes = 2 * 1024 * 1024;
const maxPixels = 8_000_000;
let decoder;

function webpSize(data) {
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  if (data.length < 30) return [];
  switch (view.getUint32(12)) {
    case 0x56503858: // VP8X
      return [
        1 + (data[24] | (data[25] << 8) | (data[26] << 16)),
        1 + (data[27] | (data[28] << 8) | (data[29] << 16)),
      ];
    case 0x56503820: // VP8
      return [
        view.getUint16(26, true) & 0x3fff,
        view.getUint16(28, true) & 0x3fff,
      ];
    case 0x5650384c: {
      // VP8L
      const bits = view.getUint32(21, true);
      return [1 + (bits & 0x3fff), 1 + ((bits >>> 14) & 0x3fff)];
    }
    default:
      return [];
  }
}

const acceptable = ([width, height]) =>
  width > 0 && height > 0 && width * height <= maxPixels;

function shrink(image) {
  const ratio = Math.min(1, 820 / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * ratio));
  const height = Math.max(1, Math.round(image.height * ratio));
  const data = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const offset =
        (Math.floor(y / ratio) * image.width + Math.floor(x / ratio)) * 4;
      const dest = (y * width + x) * 4;
      const alpha = image.data[offset + 3] / 255;
      data[dest] = image.data[offset] * alpha + 255 * (1 - alpha);
      data[dest + 1] = image.data[offset + 1] * alpha + 255 * (1 - alpha);
      data[dest + 2] = image.data[offset + 2] * alpha + 255 * (1 - alpha);
      data[dest + 3] = 255;
    }
  }
  return { width, height, data };
}

export async function resumeImage(pdf, path, origin, env, demo) {
  if (typeof path !== "string") return null;
  try {
    const url = new URL(path, origin);
    if (url.origin !== origin || url.href !== origin + path) return null;
    let response;
    if (/^\/media\/[a-z0-9-]+\.(?:webp|jpg|png)$/i.test(path)) {
      response = await env.ASSETS?.fetch(url.href);
    } else if (
      !demo &&
      path.startsWith("/api/media/") &&
      uuid(path.slice(11))
    ) {
      // A fresh request supplies no session, so the media route enforces its public listing check.
      response = await api(new Request(url), env, path);
    }
    if (!response?.ok) return null;
    const data = await bytes(response, maxImageBytes);
    const type = response.headers.get("content-type")?.split(";")[0];
    if (type === "image/jpeg") return await pdf.embedJpg(data);
    if (type === "image/png" && data.length >= 24) {
      const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
      if (acceptable([view.getUint32(16), view.getUint32(20)]))
        return await pdf.embedPng(data);
    }
    if (type === "image/webp" && acceptable(webpSize(data))) {
      decoder ||= init(webpModule);
      await decoder;
      const raster = await decodeWebp(data);
      if (acceptable([raster.width, raster.height])) {
        const encoded = jpeg.encode(shrink(raster), 82).data;
        return await pdf.embedJpg(encoded);
      }
    }
  } catch {
    // One unavailable or unsupported photo must not prevent the download.
  }
  return null;
}
