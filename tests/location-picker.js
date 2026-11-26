import assert from "node:assert/strict";
import vm from "node:vm";
import { readFile } from "node:fs/promises";
const handlers = {};
const element = (extra = {}) => ({
  style: {},
  value: "",
  validity: { valid: true },
  addEventListener(type, fn) {
    this[type] = fn;
  },
  ...extra,
});
const lat = element(),
  lng = element(),
  status = element(),
  address = element(),
  preview = element(),
  search = element();
const canvas = element({
  clientWidth: 400,
  clientHeight: 260,
  children: [],
  replaceChildren() {
    this.children = [];
  },
  append(x) {
    this.children.push(x);
  },
  getBoundingClientRect() {
    return { left: 0, top: 0, width: 400, height: 260 };
  },
});
const nodes = {
  "[name=latitude]": lat,
  "[name=longitude]": lng,
  "[data-map-preview]": preview,
  "[data-map-status]": status,
  "[data-map-search]": search,
  "[data-map-canvas]": canvas,
  "[data-map-zoom-in]": element(),
  "[data-map-zoom-out]": element(),
  "[data-find-address]": element(),
  "[data-detect-location]": element(),
  "[data-use-map-paste]": element(),
  "[data-map-paste]": element(),
};
const form = { elements: { address } };
const picker = element({
  closest() {
    return form;
  },
  querySelector(s) {
    return nodes[s];
  },
});
const context = {
  document: {
    querySelectorAll() {
      return [picker];
    },
    createElement() {
      return element();
    },
  },
  navigator: {
    geolocation: {
      getCurrentPosition(ok) {
        ok({ coords: { latitude: 1.5, longitude: 103.7 } });
      },
    },
  },
  fetch: async () => ({
    ok: true,
    json: async () => ({
      features: [
        {
          geometry: { coordinates: [103.7, 1.5] },
          properties: {
            street: "Jalan Ujian",
            city: "Johor Bahru",
            country: "Malaysia",
          },
        },
      ],
    }),
  }),
  Math,
  encodeURIComponent,
};
vm.runInNewContext(
  await readFile("public/location-picker.js", "utf8"),
  context,
);
await nodes["[data-detect-location]"].onclick();
await new Promise((r) => setTimeout(r, 0));
assert.equal(lat.value, "1.500000");
assert.equal(lng.value, "103.700000");
assert.match(address.value, /Jalan Ujian/);
assert.match(preview.src, /1.500000/);
nodes["[data-map-paste]"].value =
  "https://www.google.com/maps/place/Test/@1.1,103.1,17z/data=!3d1.5201!4d103.7702";
nodes["[data-use-map-paste]"].onclick();
assert.equal(lat.value, "1.520100");
canvas.click({ clientX: 250, clientY: 130 });
assert.notEqual(lng.value, "103.770200");
address.value = "Ujian";
await nodes["[data-find-address]"].onclick();
assert.equal(lng.value, "103.700000");
context.navigator.geolocation.getCurrentPosition = (_ok, fail) => fail();
nodes["[data-detect-location]"].onclick();
assert.match(status.textContent, /manual/);
console.log(
  "PASS geolocation, reverse lookup, map pin adjustment, address search and denied-location fallback",
);
