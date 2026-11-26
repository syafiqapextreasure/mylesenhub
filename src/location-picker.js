import { escapeHtml as e } from "./security.js";

// Shared by the public registration and member profile forms.
export function locationPicker(p = {}) {
  return `<section class="map-picker" data-map-picker aria-label="Lokasi institut">
    <div class="map-picker-heading">
      <img src="/media/icon-pin.webp" alt="" width="48" height="48">
      <div><h4>Lokasi institut</h4><p>Cari alamat institut, kemudian pilih titik pada peta untuk menetapkan pin.</p></div>
    </div>
    <div class="map-picker-body">
      <div class="map-picker-actions">
        <button type="button" data-find-address><img src="/media/icon-search.webp" alt="">Cari alamat</button>
        <button type="button" data-detect-location><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2.5"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/></svg>Lokasi saya</button>
        <a data-map-search target="_blank" rel="noopener noreferrer">Google Maps <span aria-hidden="true">↗</span></a>
      </div>
      <div class="map-picker-frame">
        <div data-map-canvas role="img" aria-label="Peta untuk memilih lokasi institut"></div>
        <div class="map-picker-zoom" role="group" aria-label="Zum peta">
          <button type="button" data-map-zoom-in aria-label="Zum masuk">+</button>
          <button type="button" data-map-zoom-out aria-label="Zum keluar">−</button>
        </div>
        <small class="map-picker-credit">© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a></small>
      </div>
      <p data-map-status aria-live="polite" aria-atomic="true"></p>
      <details class="map-picker-manual">
        <summary>Masukkan koordinat atau pautan Google Maps</summary>
        <div class="map-picker-manual-body">
          <label>Koordinat atau pautan pin Google Maps
            <input type="text" data-map-paste placeholder="1.492700, 103.741400">
          </label>
          <button type="button" data-use-map-paste>Gunakan pin ini</button>
          <div class="map-picker-coordinates">
            <label>Latitud<input name="latitude" type="number" min="-90" max="90" step="any" required value="${e(p.latitude ?? "")}"></label>
            <label>Longitud<input name="longitude" type="number" min="-180" max="180" step="any" required value="${e(p.longitude ?? "")}"></label>
          </div>
        </div>
      </details>
      <details class="map-picker-google" hidden>
        <summary>Pratonton pin di Google Maps</summary>
        <iframe data-map-preview title="Pratonton pin Google Maps" loading="lazy"></iframe>
      </details>
      <small class="map-picker-privacy">Carian alamat dan lokasi semasa menggunakan perkhidmatan Photon/Komoot.</small>
    </div>
  </section>`;
}
