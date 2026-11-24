const locationData = JSON.parse(
  document.querySelector("#pub-location-data")?.textContent || "{}",
);
const locationForms = [...document.querySelectorAll("[data-location]")];

const profileSectionLinks = [...document.querySelectorAll(".pub-aina-nav a")];
if (profileSectionLinks.length) {
  const updateProfileSection = () => {
    const current =
      profileSectionLinks.find((link) => link.hash === window.location.hash) ||
      profileSectionLinks[0];
    for (const link of profileSectionLinks)
      link.removeAttribute("aria-current");
    current.setAttribute("aria-current", "location");
  };
  window.addEventListener("hashchange", updateProfileSection);
  updateProfileSection();
}

function syncLocations(form, changed = "") {
  const state = form.elements.state;
  const district = form.elements.district;
  const institute = form.elements.institute;
  const instructor = form.querySelector("[data-instructor]");
  const fill = (select, values, keep = true) => {
    const selected = keep ? select.value : "";
    select.replaceChildren(
      select.options[0],
      ...values.map((value) => new Option(value, value)),
    );
    select.value = values.includes(selected) ? selected : "";
  };
  const unique = (values) =>
    [...new Set(values.filter(Boolean))].sort((a, b) =>
      a.localeCompare(b, "ms"),
    );
  fill(district, locationData.states[state.value] || [], changed !== "state");
  district.disabled = !state.value;
  const local = locationData.locations.filter(
    (item) =>
      (!state.value || item.state === state.value) &&
      (!district.value || item.district === district.value),
  );
  if (institute?.matches("select")) {
    fill(
      institute,
      unique(local.map((item) => item.institute)),
      !["state", "district"].includes(changed),
    );
    institute.disabled =
      form.classList.contains("pub-quick") && !district.value;
  } else if (institute?.list) {
    institute.list.replaceChildren(
      ...unique(local.map((item) => item.institute)).map(
        (value) => new Option(value),
      ),
    );
  }
  if (instructor) {
    fill(
      instructor,
      unique(
        local
          .filter((item) => item.institute === institute.value)
          .map((item) => item.name),
      ),
      !changed,
    );
    instructor.disabled = !institute.value;
  }
}

for (const form of locationForms) {
  syncLocations(form);
  form.addEventListener("change", (event) => {
    if (event.target.matches("[data-state],[data-district],[data-institute]"))
      syncLocations(form, event.target.name);
  });
}

const menu = document.querySelector(".pub-menu");
menu?.addEventListener("click", () =>
  menu.setAttribute(
    "aria-expanded",
    String(menu.getAttribute("aria-expanded") !== "true"),
  ),
);
document
  .querySelector("[data-password]")
  ?.addEventListener("click", (event) => {
    const button = event.currentTarget;
    const input = button.previousElementSibling;
    const show = input.type === "password";
    input.type = show ? "text" : "password";
    button.setAttribute(
      "aria-label",
      show ? "Sembunyikan kata laluan" : "Tunjukkan kata laluan",
    );
    button.setAttribute("aria-pressed", String(show));
  });

const currentFiles = new WeakMap();
const uploadedFiles = new WeakMap();
function setPreviews(input, files) {
  currentFiles.set(input, files);
  const preview = input
    .closest("[data-upload]")
    .querySelector("[data-preview]");
  for (const image of preview.querySelectorAll("img"))
    URL.revokeObjectURL(image.src);
  preview.replaceChildren(
    ...files.map((file) => {
      const image = document.createElement("img");
      image.src = URL.createObjectURL(file);
      image.alt = file.name;
      return image;
    }),
  );
}

function showStatus(form, text, error = false) {
  const status = form.querySelector(".pub-status");
  status.textContent = text;
  status.dataset.state = error ? "error" : "ok";
  status.hidden = false;
}

for (const input of document.querySelectorAll("[data-upload] input")) {
  input.addEventListener("change", () => {
    const files = Array.from(input.files);
    const problem =
      files.length > 6 ||
      files.some(
        (file) =>
          file.size > 2 * 1024 * 1024 ||
          !["image/jpeg", "image/png", "image/webp"].includes(file.type),
      );
    if (problem) {
      input.value = "";
      showStatus(
        input.form,
        "Pilih sehingga 6 gambar JPEG, PNG atau WebP, dengan saiz maksimum 2 MB setiap gambar.",
        true,
      );
      setPreviews(input, []);
      input.form
        .querySelector(".pub-status")
        .scrollIntoView({ block: "nearest" });
      return;
    }
    setPreviews(input, files);
    input.form.querySelector(".pub-status").hidden = true;
  });
}

const openDrafts = () =>
  new Promise((resolve, reject) => {
    const open = indexedDB.open("mylesenhub-public", 1);
    open.onupgradeneeded = () => open.result.createObjectStore("drafts");
    open.onsuccess = () => resolve(open.result);
    open.onerror = () => reject(open.error);
  });
async function draftStorage(key, mode, value) {
  const db = await openDrafts();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(
        "drafts",
        mode === "get" ? "readonly" : "readwrite",
      );
      const store = tx.objectStore("drafts");
      const request =
        mode === "get"
          ? store.get(key)
          : mode === "delete"
            ? store.delete(key)
            : store.put(value, key);
      tx.oncomplete = () => resolve(request.result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}
function formValues(form) {
  const entries = Array.from(new FormData(form)).filter(
    ([, value]) => typeof value === "string",
  );
  const result = Object.fromEntries(entries);
  if (form.querySelector('[name="spim"]'))
    result.spim = entries
      .filter(([name]) => name === "spim")
      .map(([, value]) => value);
  if (form.elements.consent) result.consent = form.elements.consent.checked;
  if (form.elements.rememberMe)
    result.rememberMe = form.elements.rememberMe.checked;
  return result;
}
function refreshClassSummary(picker) {
  const selected = [...picker.querySelectorAll("input:checked")];
  const summary = picker.querySelector("[data-class-summary]");
  summary.replaceChildren(
    ...selected.map((input) => {
      const chip = document.createElement("span");
      chip.textContent = input.value;
      return chip;
    }),
  );
  if (!selected.length) summary.textContent = "Pilih kelas";
  picker
    .querySelector("summary")
    .setAttribute(
      "aria-label",
      selected.length
        ? "Kelas dipilih: " + selected.map((input) => input.value).join(", ")
        : "Pilih kelas",
    );
}
for (const picker of document.querySelectorAll(".pub-class-picker")) {
  picker.addEventListener("change", () => refreshClassSummary(picker));
  picker.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && picker.open) {
      picker.open = false;
      picker.querySelector("summary").focus();
    }
  });
  picker.closest("form").addEventListener("reset", () => {
    picker.open = false;
    queueMicrotask(() => refreshClassSummary(picker));
  });
}
const draftKey = (form) => form.dataset.draft;
async function saveDraft(form) {
  const files = Object.fromEntries(
    [...form.querySelectorAll("input[type=file]")].map((input) => [
      input.name,
      currentFiles.get(input) || [],
    ]),
  );
  await draftStorage(draftKey(form), "put", {
    values: formValues(form),
    files,
  });
}
async function restoreDraft(form) {
  const draft = await draftStorage(draftKey(form), "get");
  if (!draft) return;
  for (const name of ["state", "district", "institute"]) {
    const input = form.querySelector('[name="' + name + '"]');
    if (input && draft.values[name]) {
      input.value = draft.values[name];
      syncLocations(form);
    }
  }
  for (const input of form.elements) {
    const value = draft.values[input.name];
    if (input.type === "file")
      setPreviews(input, draft.files[input.name] || []);
    else if (input.type === "checkbox")
      input.checked = Array.isArray(value)
        ? value.includes(input.value)
        : Boolean(value);
    else if (
      typeof value === "string" &&
      !["state", "district", "institute"].includes(input.name)
    )
      input.value = value;
  }
  refreshClassSummary(form.querySelector(".pub-class-picker"));
  if (
    draft.values.promotionTitle &&
    form.querySelector(".pub-promotion details")
  )
    form.querySelector(".pub-promotion details").open = true;
  showStatus(form, "Draf pada peranti ini dimuatkan.");
}
for (const form of document.querySelectorAll("[data-draft]")) {
  restoreDraft(form).catch(() => {});
  form.querySelector("[data-save]").addEventListener("click", async () => {
    try {
      await saveDraft(form);
      showStatus(form, "Draf disimpan pada peranti ini.");
    } catch {
      showStatus(form, "Draf tidak dapat disimpan pada peranti ini.", true);
    }
  });
}

async function request(url, options) {
  const response = await fetch(url, options);
  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error("Permintaan tidak dapat diproses. Sila cuba lagi.");
  }
  if (!response.ok || result.ok === false)
    throw new Error(
      result.message ||
        result.error ||
        "Permintaan tidak dapat diproses. Sila cuba lagi.",
    );
  return result;
}

async function addUploads(form, values) {
  for (const input of form.querySelectorAll("input[type=file]")) {
    const urls = [];
    for (const file of currentFiles.get(input) || []) {
      let url = uploadedFiles.get(file);
      if (!url) {
        const result = await request("/api/media", {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });
        url = result.url;
        uploadedFiles.set(file, url);
      }
      urls.push(url);
    }
    if (urls.length) values[input.name] = input.multiple ? urls : urls[0];
  }
}

for (const form of document.querySelectorAll("[data-api]")) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = form.querySelector("button:not([type=button])");
    button.disabled = true;
    const values = formValues(form);
    try {
      if (form.dataset.draft && !values.spim.length) {
        const picker = form.querySelector(".pub-class-picker");
        picker.open = true;
        picker.querySelector("input").focus();
        throw new Error("Pilih sekurang-kurangnya satu Kelas SPIM.");
      }
      if (form.dataset.guest === "true") {
        await saveDraft(form);
        const params = new URLSearchParams({
          return: form.dataset.return,
          type: form.dataset.draft,
        });
        window.location.assign("/signup?" + params);
        return;
      }
      if (form.dataset.draft) {
        if (values.experience !== undefined)
          values.experience = Number(values.experience);
        await addUploads(form, values);
      }
      if (form.dataset.return) values.return = form.dataset.return;
      const result = await request(form.dataset.api, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      showStatus(form, result.message || "Maklumat anda berjaya dihantar.");
      if (form.dataset.draft)
        await draftStorage(draftKey(form), "delete").catch(() => {});
      if (
        ["login", "signup"].includes(form.dataset.access) &&
        result.redirect &&
        form.dataset.return
      ) {
        window.location.assign(form.dataset.return);
        return;
      }
      if (
        result.redirect?.startsWith("/") &&
        !result.redirect.startsWith("//")
      ) {
        window.location.assign(result.redirect);
        return;
      }
      if (form.dataset.api === "/api/contact") form.reset();
      if (form.dataset.draft) {
        form.reset();
        syncLocations(form);
        for (const input of form.querySelectorAll("input[type=file]"))
          setPreviews(input, []);
        const dashboard = document.createElement("a");
        dashboard.href = "/dashboard";
        dashboard.textContent = "Lihat status di dashboard";
        form.querySelector(".pub-status").append(" ", dashboard);
      }
    } catch (error) {
      showStatus(
        form,
        error.message || "Permintaan tidak dapat diproses. Sila cuba lagi.",
        true,
      );
    } finally {
      button.disabled = false;
    }
  });
}
