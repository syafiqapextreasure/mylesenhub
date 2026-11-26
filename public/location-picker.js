for (const picker of document.querySelectorAll("[data-map-picker]")) {
  const form = picker.closest("form"),
    lat = picker.querySelector("[name=latitude]"),
    lng = picker.querySelector("[name=longitude]");
  const preview = picker.querySelector("[data-map-preview]"),
    status = picker.querySelector("[data-map-status]"),
    search = picker.querySelector("[data-map-search]"),
    canvas = picker.querySelector("[data-map-canvas]");
  let center = [1.4927, 103.7414],
    zoom = 14,
    revision = 0;
  const world = () => 256 * 2 ** zoom;
  function pixel(a, b) {
    const sin = Math.sin((Math.max(-85, Math.min(85, a)) * Math.PI) / 180);
    return [
      ((b + 180) / 360) * world(),
      (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * world(),
    ];
  }
  function coord(x, y) {
    return [
      (Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / world()))) * 180) / Math.PI,
      (x / world()) * 360 - 180,
    ];
  }
  function draw() {
    const [cx, cy] = pixel(...center),
      w = canvas.clientWidth,
      h = canvas.clientHeight;
    canvas.replaceChildren();
    const left = cx - w / 2,
      top = cy - h / 2;
    for (let x = Math.floor(left / 256); x <= Math.floor((left + w) / 256); x++)
      for (
        let y = Math.floor(top / 256);
        y <= Math.floor((top + h) / 256);
        y++
      ) {
        if (x < 0 || y < 0 || x >= 2 ** zoom || y >= 2 ** zoom) continue;
        const img = document.createElement("img");
        img.alt = "";
        img.draggable = false;
        img.src = `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`;
        Object.assign(img.style, {
          position: "absolute",
          width: "256px",
          height: "256px",
          left: x * 256 - left + "px",
          top: y * 256 - top + "px",
          maxWidth: "none",
        });
        canvas.append(img);
      }
    if (lat.value && lng.value && lat.validity.valid && lng.validity.valid) {
      const [x, y] = pixel(Number(lat.value), Number(lng.value));
      const pin = document.createElement("span");
      pin.textContent = "📍";
      Object.assign(pin.style, {
        position: "absolute",
        left: x - left - 12 + "px",
        top: y - top - 27 + "px",
        fontSize: "24px",
        pointerEvents: "none",
      });
      canvas.append(pin);
    }
  }
  function update(recenter = false) {
    search.href =
      "https://www.google.com/maps/search/?api=1&query=" +
      encodeURIComponent(form.elements.address?.value || "");
    const valid =
      lat.value !== "" &&
      lng.value !== "" &&
      lat.validity.valid &&
      lng.validity.valid;
    preview.hidden = !valid;
    if (valid) {
      if (recenter) center = [Number(lat.value), Number(lng.value)];
      preview.src =
        "https://maps.google.com/maps?q=" +
        encodeURIComponent(lat.value + "," + lng.value) +
        "&z=16&output=embed";
    }
    draw();
  }
  function setPoint(a, b) {
    lat.value = a.toFixed(6);
    lng.value = b.toFixed(6);
    center = [a, b];
    update();
  }
  canvas.addEventListener("click", (event) => {
    revision++;
    const box = canvas.getBoundingClientRect(),
      [x, y] = pixel(...center);
    const [a, b] = coord(
      x + event.clientX - box.left - box.width / 2,
      y + event.clientY - box.top - box.height / 2,
    );
    setPoint(a, b);
    status.textContent = "Pin telah ditetapkan. Semak alamat dan lokasi.";
  });
  picker.querySelector("[data-map-zoom-in]").onclick = () => {
    zoom = Math.min(19, zoom + 1);
    draw();
  };
  picker.querySelector("[data-map-zoom-out]").onclick = () => {
    zoom = Math.max(3, zoom - 1);
    draw();
  };
  lat.addEventListener("change", () => {
    revision++;
    update(true);
  });
  lng.addEventListener("change", () => {
    revision++;
    update(true);
  });
  form.elements.address?.addEventListener("input", () => {
    revision++;
    search.href =
      "https://www.google.com/maps/search/?api=1&query=" +
      encodeURIComponent(form.elements.address.value);
  });
  async function lookup(url) {
    const response = await fetch(url);
    if (!response.ok) throw Error();
    return (await response.json()).features?.[0];
  }
  picker.querySelector("[data-find-address]").onclick = async () => {
    const address = form.elements.address?.value.trim();
    if (!address) {
      status.textContent = "Masukkan alamat dahulu.";
      return;
    }
    status.textContent = "Mencari alamat…";
    const request = ++revision;
    try {
      const feature = await lookup(
        "https://photon.komoot.io/api/?limit=1&q=" +
          encodeURIComponent(address),
      );
      if (!feature) throw Error();
      if (request !== revision) return;
      const [b, a] = feature.geometry.coordinates;
      setPoint(a, b);
      zoom = 17;
      draw();
      status.textContent =
        "Lokasi anggaran ditemui. Klik peta untuk menetapkan pin tepat.";
    } catch {
      status.textContent =
        "Alamat tidak ditemui. Gunakan lokasi semasa atau masukkan koordinat secara manual.";
    }
  };
  picker.querySelector("[data-use-map-paste]").onclick = () => {
    const raw = picker.querySelector("[data-map-paste]").value.trim();
    let decoded = raw;
    try {
      decoded = decodeURIComponent(raw.replace(/\+/g, " "));
    } catch {}
    const match =
      decoded.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/i) ||
      decoded.match(
        /[?&](?:q|query|ll)=(-?\d+(?:\.\d+)?)[,\s]+(-?\d+(?:\.\d+)?)/i,
      ) ||
      decoded.match(/(?:@|^\s*)(-?\d+(?:\.\d+)?)[,\s]+(-?\d+(?:\.\d+)?)/i);
    if (
      !match ||
      Math.abs(Number(match[1])) > 90 ||
      Math.abs(Number(match[2])) > 180
    ) {
      status.textContent =
        "Koordinat tidak ditemui. Gunakan latitud, longitud atau pautan Google Maps lengkap yang mengandungi koordinat.";
      return;
    }
    revision++;
    setPoint(Number(match[1]), Number(match[2]));
    zoom = 17;
    draw();
    status.textContent = "Pin ditetapkan. Semak lokasi pada peta.";
  };
  picker.querySelector("[data-detect-location]").onclick = () => {
    if (!navigator.geolocation) {
      status.textContent =
        "Lokasi tidak tersedia. Masukkan koordinat secara manual.";
      return;
    }
    status.textContent = "Mencari lokasi semasa…";
    const request = ++revision;
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        if (request !== revision) return;
        const { latitude: a, longitude: b } = position.coords;
        setPoint(a, b);
        zoom = 17;
        draw();
        status.textContent = "Lokasi dikesan. Semak dan laraskan pin.";
        if (!form.elements.address.value.trim())
          try {
            const f = await lookup(
              `https://photon.komoot.io/reverse?lat=${a}&lon=${b}&limit=1`,
            );
            const p = f?.properties;
            if (
              request === revision &&
              p &&
              !form.elements.address.value.trim()
            ) {
              form.elements.address.value = [
                p.housenumber,
                p.street,
                p.postcode,
                p.city || p.district,
                p.state,
                p.country,
              ]
                .filter(Boolean)
                .join(", ");
              update();
              status.textContent =
                "Alamat anggaran dikesan. Sila semak dan lengkapkan alamat serta pin.";
            }
          } catch {
            status.textContent =
              "Lokasi dikesan. Masukkan alamat penuh secara manual.";
          }
      },
      () => {
        status.textContent =
          "Lokasi tidak dapat dikesan. Benarkan akses lokasi atau masukkan koordinat secara manual.";
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  };
  update(true);
}
