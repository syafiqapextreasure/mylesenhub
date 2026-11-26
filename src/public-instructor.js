import { googleMapsUrl, googlePlaceUrl } from "../public/maps-url.js";

const normalize = (value) =>
  String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

export function instituteLocation(person, institutes) {
  let institute;
  if (person.instituteId) {
    institute = institutes.find((entry) => entry.id === person.instituteId);
  } else if (normalize(person.institute)) {
    const matches = institutes.filter(
      (entry) => normalize(entry.name) === normalize(person.institute),
    );
    if (matches.length === 1) [institute] = matches;
  }

  const address = String(institute?.address || "").trim();
  const postcode = String(institute?.postcode || "").trim();
  const name = institute?.name || person.institute || "";
  const addressText =
    address && postcode && !normalize(address).includes(normalize(postcode))
      ? address + ", " + postcode
      : address;
  const lat = String(institute?.latitude ?? "").trim();
  const lng = String(institute?.longitude ?? "").trim();
  const hasPin =
    lat && lng && Math.abs(Number(lat)) <= 90 && Math.abs(Number(lng)) <= 180;
  const search = hasPin
    ? Number(lat) + "," + Number(lng)
    : addressText
      ? [name, addressText, "Malaysia"].filter(Boolean).join(", ")
      : "";
  const place = googlePlaceUrl(institute?.maps);
  const queryUrl = search
    ? "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(search)
    : "";
  const fallback = hasPin ? queryUrl : googleMapsUrl(institute?.maps) || queryUrl;
  const maps = person.demo ? "" : place || fallback;
  const mapsLabel = place ? "Buka di Google Maps" :
    hasPin ? "Lihat pin di Google Maps" : "Cari alamat di Google Maps";
  return { name, address: addressText, maps, mapsLabel };
}

export function instructorGallery(person) {
  return (person.gallery || [])
    .map((entry) => (typeof entry === "string" ? { url: entry } : entry))
    .filter((entry) => entry?.url)
    .map(({ url, alt, caption }) => ({
      url,
      alt,
      caption: caption || person.galleryCaptions?.[url] || "",
    }));
}
