const normalize = (value) =>
  String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

function googleMapsUrl(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || url.port)
      return "";
    const host = url.hostname;
    const mapsPath = /^\/maps(?:\/|$)/.test(url.pathname);
    if (
      ((host === "www.google.com" ||
        host === "google.com" ||
        host === "www.google.com.my" ||
        host === "google.com.my") &&
        mapsPath) ||
      (host === "maps.google.com" && (mapsPath || url.pathname === "/")) ||
      (host === "maps.app.goo.gl" && /^\/[a-z0-9]+\/?$/i.test(url.pathname)) ||
      (host === "goo.gl" && /^\/maps\/[a-z0-9]+\/?$/i.test(url.pathname))
    )
      return url.href;
  } catch {
    // Older profiles may have an empty or malformed link.
  }
  return "";
}

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
  const maps = person.demo
    ? ""
    : googleMapsUrl(institute?.maps) ||
      (search
        ? "https://www.google.com/maps/search/?api=1&query=" +
          encodeURIComponent(search)
        : "");
  return { name, address: addressText, maps };
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
