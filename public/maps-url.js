export function googleMapsUrl(value) {
  if (!value) return "";
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || url.port)
      return "";
    const host = url.hostname;
    const mapsPath = /^\/maps(?:\/|$)/.test(url.pathname);
    if (
      ([
        "www.google.com",
        "google.com",
        "www.google.com.my",
        "google.com.my",
      ].includes(host) &&
        mapsPath) ||
      (host === "maps.google.com" && (mapsPath || url.pathname === "/")) ||
      (host === "maps.app.goo.gl" && /^\/[a-z0-9]+\/?$/i.test(url.pathname)) ||
      (host === "goo.gl" && /^\/maps\/[a-z0-9]+\/?$/i.test(url.pathname))
    )
      return url.href;
  } catch {
    // Coordinate pairs and older records might not contain a URL.
  }
  return "";
}

export function googlePlaceUrl(value) {
  const href = googleMapsUrl(value);
  if (!href) return "";
  const url = new URL(href);
  if (
    url.hostname === "maps.app.goo.gl" ||
    url.hostname === "goo.gl" ||
    (/^\/maps\/place\//.test(url.pathname) &&
      /!(?:1s|19s|16s)[^!/?]+/.test(url.pathname)) ||
    (/^\/maps\/search\/?$/.test(url.pathname) &&
      url.searchParams.get("query") &&
      /^[\w-]+$/.test(url.searchParams.get("query_place_id") || "")) ||
    (/^\/(?:maps\/?)?$/.test(url.pathname) &&
      (/^\d+$/.test(url.searchParams.get("cid") || "") ||
        /^place_id:[\w-]+$/.test(url.searchParams.get("q") || "")))
  )
    return href;
  return "";
}
