import { escapeHtml as e } from "./security.js";

// Shared by the public registration and member profile forms.
export function locationPicker(p = {}) {
  return `<div class="map-picker" data-map-picker>
    <p>Cari alamat atau gunakan lokasi semasa, kemudian klik peta untuk melaraskan pin. Lokasi dan alamat yang dicari dihantar kepada penyedia peta.</p>
    <div class="map-picker-actions"><button type="button" data-find-address>Cari alamat pada peta</button><button type="button" data-detect-location>Gunakan lokasi semasa</button><a data-map-search target="_blank" rel="noopener">Cari alamat di Google Maps</a></div>
    <label>Koordinat atau pautan pin Google Maps <input type="text" data-map-paste placeholder="Contoh: 1.492700, 103.741400"></label>
    <button type="button" data-use-map-paste>Gunakan koordinat atau pautan</button>
    <div class="map-picker-coordinates"><label>Latitud <input name="latitude" type="number" min="-90" max="90" step="any" required value="${e(p.latitude || "")}"></label><label>Longitud <input name="longitude" type="number" min="-180" max="180" step="any" required value="${e(p.longitude || "")}"></label></div>
    <p data-map-status aria-live="polite"></p>
    <div data-map-canvas role="application" aria-label="Peta lokasi: klik untuk menetapkan pin"></div>
    <div class="map-picker-actions"><button type="button" data-map-zoom-in>Zum +</button><button type="button" data-map-zoom-out>Zum -</button><small>© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a> · Carian: Photon/Komoot</small></div>
    <iframe data-map-preview title="Pratonton pin Google Maps" loading="lazy"></iframe>
  </div>`;
}
