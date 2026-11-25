(() => {
  const dashboard = document.querySelector(".dashboard");
  const drawer = dashboard?.querySelector(".d-sidebar");
  const openMenu = dashboard?.querySelector(".d-open-drawer");
  if (drawer && openMenu) {
    const main = dashboard.querySelector(".d-main");
    const closeMenu = drawer.querySelector(".d-close-drawer");
    const mobile = matchMedia("(max-width:1000px)");
    function toggle(open) {
      dashboard.classList.toggle("drawer-open", open);
      openMenu.setAttribute("aria-expanded", String(open));
      if (open) {
        drawer.setAttribute("role", "dialog");
        drawer.setAttribute("aria-modal", "true");
        main.inert = true;
        requestAnimationFrame(() => {
          if (dashboard.classList.contains("drawer-open")) closeMenu.focus();
        });
      } else {
        main.inert = false;
        drawer.removeAttribute("role");
        drawer.removeAttribute("aria-modal");
        if (mobile.matches) openMenu.focus();
      }
    }
    openMenu.addEventListener("click", () => toggle(true));
    closeMenu.addEventListener("click", () => toggle(false));
    dashboard
      .querySelector(".d-scrim")
      .addEventListener("click", () => toggle(false));
    mobile.addEventListener("change", () => {
      if (dashboard.classList.contains("drawer-open")) toggle(false);
    });
    document.addEventListener("keydown", (event) => {
      if (!dashboard.classList.contains("drawer-open")) return;
      if (event.key === "Escape") {
        event.preventDefault();
        toggle(false);
      }
      if (event.key !== "Tab") return;
      const controls = [
        ...drawer.querySelectorAll("a[href], button:not(:disabled)"),
      ];
      if (event.shiftKey && document.activeElement === controls[0]) {
        event.preventDefault();
        controls.at(-1).focus();
      }
      if (!event.shiftKey && document.activeElement === controls.at(-1)) {
        event.preventDefault();
        controls[0].focus();
      }
    });
  }
  const post = async (url, body) => {
    let r = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    let j = await r.json();
    if (!r.ok || !j.ok) {
      const error = Error(j.message || "Tindakan tidak berjaya.");
      error.status = r.status;
      throw error;
    }
    return j;
  };
  const show = (el, msg) => {
    let n = el.querySelector(".d-feedback");
    if (n) n.textContent = msg;
  };
  const reviewStates = {
    semakan: { label: "Menunggu semakan", step: 1 },
    pengesahan: { label: "Pengesahan", step: 2 },
    diterbitkan: { label: "Diterbitkan", step: 3 },
    pembetulan: { label: "Perlu pembetulan", step: 1 },
  };
  function setReviewState(form, state) {
    const view = form.closest("[data-review-view]");
    const stateInfo = reviewStates[state];
    if (!view || !stateInfo)
      throw Error(
        "Status terkini tidak dapat dipaparkan. Muat semula halaman.",
      );
    view.dataset.status = state;
    const badge = view.querySelector("[data-review-status] .d-pill");
    badge.className = `d-pill d-${state}`;
    badge.textContent = stateInfo.label;
    view.querySelectorAll("[data-review-step]").forEach((step) => {
      const complete = Number(step.dataset.reviewStep) <= stateInfo.step;
      step.classList.toggle("completed", complete);
      if (Number(step.dataset.reviewStep) === stateInfo.step)
        step.setAttribute("aria-current", "step");
      else step.removeAttribute("aria-current");
    });
    const actions = form.querySelector("[data-review-actions]");
    actions.replaceChildren();
    const add = (action, label, style) => {
      const button = document.createElement("button");
      button.type = "submit";
      button.name = "action";
      button.value = action;
      button.className = `d-btn ${style}`;
      button.textContent = label;
      actions.append(button);
      return button;
    };
    if (state === "semakan" || state === "pengesahan")
      add("return", "Minta pembetulan", "outline");
    if (state === "semakan") return add("verify", "Sahkan", "red");
    if (state === "pengesahan") return add("publish", "Terbitkan", "red");
    return null;
  }
  document.addEventListener("submit", async (e) => {
    let f = e.target;
    if (
      !f.matches(
        "[data-submit-kind],[data-review],[data-access],[data-affiliation],[data-instructor-affiliation],[data-affiliation-decision],[data-directory],[data-review-note],[data-representative]",
      )
    )
      return;
    e.preventDefault();
    let btn = e.submitter;
    try {
      if (f.dataset.submitKind) {
        let formData = new FormData(f),
          payload = Object.fromEntries(formData);
        for (let key of ["classes", "spim"])
          if (f.querySelector(`[name=${key}][type=checkbox]`))
            payload[key] = formData.getAll(key);
        delete payload.status;
        if (
          f.hasAttribute("data-member-profile") &&
          btn?.value === "semakan" &&
          !(payload.spim || payload.classes || []).length
        ) {
          f.querySelector(".dm-class-toggle").focus();
          throw Error("Pilih sekurang-kurangnya satu kelas.");
        }
        let result = await post("/api/submissions", {
          kind: f.dataset.submitKind,
          payload,
          status: btn?.value || "draft",
          ...(f.dataset.id ? { id: f.dataset.id } : {}),
        });
        show(f, result.message || "Maklumat berjaya disimpan.");
        if (f.hasAttribute("data-member-profile")) {
          if (btn?.value === "draft" && result.id) f.dataset.id = result.id;
          else if (btn?.value === "semakan") delete f.dataset.id;
        }
        if (result.redirect) location.href = result.redirect;
      } else if (f.dataset.review) {
        if (f.dataset.pending === "true") return;
        const action = btn?.value;
        const note = new FormData(f).get("note");
        if (action === "return" && !String(note || "").trim()) {
          show(f, "Nyatakan pembetulan yang diperlukan.");
          f.elements.note.focus();
          return;
        }
        f.dataset.pending = "true";
        f.querySelectorAll("button").forEach((button) => {
          button.disabled = true;
        });
        try {
          const result = await post("/api/review", {
            id: f.dataset.review,
            action,
            note,
          });
          const next =
            result.status ||
            {
              verify: "pengesahan",
              publish: "diterbitkan",
              return: "pembetulan",
            }[action];
          const nextButton = setReviewState(f, next);
          show(f, result.message || "Semakan dikemas kini.");
          (nextButton || f.querySelector(".d-feedback"))?.focus();
        } catch (error) {
          const message =
            error.status === 409
              ? `${error.message} Muat semula halaman untuk melihat status terkini.`
              : error.status
                ? error.message
                : "Sambungan gagal. Muat semula halaman untuk menyemak status sebelum mencuba lagi.";
          show(f, message);
          f.querySelectorAll("button").forEach((button) => {
            button.disabled = false;
          });
          f.querySelector(".d-feedback")?.focus();
        } finally {
          delete f.dataset.pending;
        }
      } else if (f.hasAttribute("data-affiliation")) {
        let payload = Object.fromEntries(new FormData(f));
        let result = await post("/api/submissions", {
          kind: "affiliation",
          payload,
          status: "semakan",
        });
        show(f, result.message || "Permintaan dihantar untuk semakan.");
        f.querySelector("button").disabled = true;
      } else if (f.hasAttribute("data-instructor-affiliation")) {
        const result = await post(
          "/api/affiliation/request",
          Object.fromEntries(new FormData(f)),
        );
        show(f, result.message);
        f.querySelector("button").disabled = true;
      } else if (f.hasAttribute("data-affiliation-decision")) {
        await post("/api/affiliation/decision", {
          id: f.dataset.affiliationDecision,
          action: btn?.value,
        });
        location.reload();
      } else if (f.hasAttribute("data-directory")) {
        const action = f.dataset.action || "unpublish";
        if (
          !confirm(
            action === "publish"
              ? "Terbitkan semula profil ini?"
              : "Sembunyikan profil ini daripada direktori awam?",
          )
        )
          return;
        const result = await post("/api/directory", {
          id: f.dataset.directory,
          action,
        });
        show(f, result.message || "Direktori dikemas kini.");
        location.reload();
      } else if (f.hasAttribute("data-review-note")) {
        const result = await post("/api/review-note", {
          id: f.dataset.reviewNote,
          note: new FormData(f).get("note"),
        });
        show(f, result.message || "Nota dalaman disimpan.");
      } else if (f.hasAttribute("data-representative")) {
        const checks = new FormData(f);
        const result = await post("/api/representative", {
          userId: f.dataset.representative,
          action: f.dataset.action,
          identityChecked: checks.has("identityChecked"),
          authorityChecked: checks.has("authorityChecked"),
        });
        show(f, result.message || "Pengesahan dikemas kini.");
        location.reload();
      } else {
        let result = await post("/api/access", {
          userId: f.dataset.access,
          role: new FormData(f).get("role"),
        });
        show(f, result.message || "Akses dikemas kini.");
      }
    } catch (err) {
      show(f, err.message);
    }
  });
  const gallery = document.querySelector("[data-gallery-panel]");
  let galleryPortrait = gallery?.dataset.priorPhoto;
  let activeUploads = 0;
  function updateGallery() {
    const items = [...gallery.querySelectorAll(".d-gallery-item")];
    items.forEach((item, index) => {
      item.querySelector("[data-move-media=up]").disabled = index === 0;
      item.querySelector("[data-move-media=down]").disabled =
        index === items.length - 1;
    });
    gallery.querySelector("[data-gallery-count]").textContent =
      items.length + " gambar";
    const first = items[0]?.querySelector("img");
    const cover = gallery.querySelector("[data-gallery-primary]");
    if (cover) {
      if (first) {
        const preview = first.cloneNode();
        preview.alt = "Gambar utama";
        cover.replaceChildren(preview);
      } else cover.replaceChildren();
    }
  }
  async function uploadGallery(files, type, control) {
    activeUploads++;
    try {
      for (const file of files) {
        if (
          !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
          file.size > 2 * 1024 * 1024
        )
          throw Error("Gunakan gambar JPG, PNG atau WebP sehingga 2 MB.");
        const grid = gallery.querySelector(".d-gallery-preview");
        let item =
          type === "replace"
            ? control.closest(".d-gallery-item")
            : type === "replace_primary"
              ? grid.firstElementChild
              : null;
        if (type !== "profile_photo" && !item && grid.childElementCount >= 12)
          throw Error("Galeri terhad kepada 12 gambar.");
        const response = await fetch("/api/media", {
          method: "POST",
          headers: { "content-type": file.type },
          body: file,
        });
        const result = await response.json();
        if (!response.ok || !result.url)
          throw Error(result.message || "Muat naik gagal.");
        if (type === "profile_photo") {
          galleryPortrait = result.url;
          const image = document.createElement("img");
          image.src = result.url;
          image.alt = "Pratonton foto profil";
          gallery.querySelector("[data-profile-photo]").replaceChildren(image);
        } else {
          if (!item) {
            item = gallery
              .querySelector("[data-gallery-template]")
              .content.firstElementChild.cloneNode(true);
            grid.append(item);
          }
          item.dataset.existingUrl = result.url;
          item.querySelector("img").src = result.url;
          updateGallery();
        }
      }
      show(gallery, "Gambar tersedia untuk disemak sebelum dihantar.");
    } catch (error) {
      show(gallery, error.message);
    } finally {
      activeUploads--;
    }
  }
  if (gallery) {
    updateGallery();
    const drop = gallery.querySelector(".dm-gallery-drop");
    drop.addEventListener("dragover", (event) => event.preventDefault());
    drop.addEventListener("drop", (event) => {
      event.preventDefault();
      uploadGallery([...event.dataTransfer.files], "gallery", null);
    });
  }
  function syncMemberLocations(form) {
    const state = form.elements.state.value;
    const district = form.elements.district;
    district.disabled = !state;
    for (const option of district.options)
      option.disabled = option.hidden = Boolean(
        option.dataset.state && option.dataset.state !== state,
      );
    if (district.selectedOptions[0]?.disabled) district.value = "";
  }
  for (const form of document.querySelectorAll("[data-member-profile]"))
    syncMemberLocations(form);
  for (const picker of document.querySelectorAll("[data-dm-institute-picker]")) {
    const name = picker.querySelector('[name="institute"]');
    const directory = picker.querySelector("[data-registered-institute]");
    directory.addEventListener("change", () => {
      if (directory.value) name.value = directory.value;
    });
    name.addEventListener("input", () => {
      directory.value = [...directory.options].some(option => option.value === name.value)
        ? name.value
        : "";
    });
  }
  function refreshClassChips(picker) {
    const selected = picker.querySelectorAll("input:checked");
    const children = Array.from(selected, (input) => {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.dmRemoveClass = input.value;
      button.setAttribute("aria-label", "Buang kelas " + input.value);
      const mark = document.createElement("span");
      mark.setAttribute("aria-hidden", "true");
      mark.textContent = "×";
      button.append(input.value + " ", mark);
      return button;
    });
    picker.querySelector("[data-dm-chips]").replaceChildren(...children);
  }
  function closeClassPicker(picker) {
    picker.querySelector(".dm-class-options").hidden = true;
    picker
      .querySelector(".dm-class-toggle")
      .setAttribute("aria-expanded", "false");
  }
  document.addEventListener("keydown", (event) => {
    const picker = event.target.closest("[data-dm-classes]");
    if (picker && event.key === "Escape") {
      closeClassPicker(picker);
      picker.querySelector(".dm-class-toggle").focus();
    }
  });
  document.addEventListener("change", async (e) => {
    if (e.target.matches("[data-poster]")) {
      let input = e.target,
        file = input.files[0];
      if (!file) return;
      if (file.size > 2 * 1024 * 1024) {
        alert("Saiz gambar maksimum ialah 2 MB.");
        return;
      }
      try {
        let r = await fetch("/api/media", {
            method: "POST",
            headers: { "content-type": file.type },
            body: file,
          }),
          j = await r.json();
        if (!r.ok || !j.url) throw Error(j.message || "Muat naik gagal.");
        let form = input.closest("form");
        form.querySelector("[name=poster]").value = j.url;
        let img = form.querySelector("[data-poster-preview]");
        if (img) {
          img.src = j.url;
          img.hidden = false;
        }
      } catch (err) {
        alert(err.message);
      }
      return;
    }
    const control = e.target;
    const member = control.closest("[data-member-profile]");
    if (member && control.matches("[data-dm-state],[data-dm-district]")) {
      if (control.matches("[data-dm-state]"))
        member.elements.district.value = "";
      syncMemberLocations(member);
    }
    if (control.matches("[data-dm-classes] input"))
      refreshClassChips(control.closest("[data-dm-classes]"));
    if (!control.matches("[data-media]") || !gallery) return;
    await uploadGallery([...control.files], control.dataset.media, control);
    control.value = "";
  });
  document.addEventListener("click", async (e) => {
    const invite = e.target.closest("[data-copy-invite]");
    if (invite) {
      const panel = invite.closest("details");
      const text = new URL(invite.dataset.copyInvite, location.origin).href;
      try {
        await navigator.clipboard.writeText(text);
        show(panel, "Pautan disalin.");
      } catch {
        const input = panel.querySelector(
          `[data-invite-path="${invite.dataset.copyInvite}"]`,
        );
        input.value = text;
        input.focus();
        input.select();
        show(panel, "Salin pautan yang dipilih.");
      }
    }
    let out = e.target.closest("[data-logout]");
    if (out) {
      try {
        let r = await post("/api/logout", {});
        location.href = r.redirect || "/login";
      } catch (err) {
        alert(err.message);
      }
    }
    const picker = e.target.closest("[data-dm-classes]");
    for (const open of document.querySelectorAll("[data-dm-classes]"))
      if (open !== picker) closeClassPicker(open);
    if (picker) {
      const toggle = e.target.closest(".dm-class-toggle");
      const removeChip = e.target.closest("[data-dm-remove-class]");
      if (toggle) {
        const options = picker.querySelector(".dm-class-options");
        options.hidden = !options.hidden;
        toggle.setAttribute("aria-expanded", String(!options.hidden));
      }
      if (removeChip) {
        const input = Array.from(picker.querySelectorAll("input")).find(
          (option) => option.value === removeChip.dataset.dmRemoveClass,
        );
        if (input) input.checked = false;
        refreshClassChips(picker);
        picker.querySelector(".dm-class-toggle").focus();
      }
    }
    const move = e.target.closest("[data-move-media]");
    if (move) {
      const item = move.closest(".d-gallery-item");
      if (move.dataset.moveMedia === "up" && item.previousElementSibling)
        item.parentElement.insertBefore(item, item.previousElementSibling);
      if (move.dataset.moveMedia === "down" && item.nextElementSibling)
        item.parentElement.insertBefore(item.nextElementSibling, item);
      updateGallery();
      if (move.disabled)
        item.querySelector("[data-move-media]:not(:disabled)")?.focus();
    }
    const remove = e.target.closest("[data-remove-media]");
    if (remove) {
      const item = remove.closest(".d-gallery-item");
      const next = item.nextElementSibling || item.previousElementSibling;
      item.remove();
      updateGallery();
      (
        next?.querySelector("[data-remove-media]") ||
        gallery.querySelector("#muat-naik-galeri input")
      )?.focus();
    }
    const save = e.target.closest("[data-save-media]");
    if (save && !gallery.dataset.saving) {
      if (activeUploads) {
        show(gallery, "Tunggu sehingga gambar selesai dimuat naik.");
        return;
      }
      gallery.dataset.saving = "true";
      const controls = gallery.querySelectorAll("[data-save-media]");
      controls.forEach((button) => (button.disabled = true));
      try {
        const galleryOrder = [
          ...gallery.querySelectorAll(".d-gallery-item"),
        ].map((item) => ({
          url: item.dataset.existingUrl,
          caption: item.querySelector("[data-gallery-caption]").value,
        }));
        const result = await post("/api/submissions", {
          kind: "media",
          payload: {
            images: galleryPortrait
              ? [{ type: "profile_photo", url: galleryPortrait }]
              : [],
            galleryOrder,
          },
          status: save.dataset.status,
          ...(gallery.dataset.id ? { id: gallery.dataset.id } : {}),
        });
        if (save.dataset.status === "draft" && result.id)
          gallery.dataset.id = result.id;
        else if (save.dataset.status === "semakan") delete gallery.dataset.id;
        show(gallery, result.message || "Gambar dihantar untuk semakan.");
      } catch (error) {
        show(gallery, error.message);
      } finally {
        controls.forEach((button) => (button.disabled = false));
        delete gallery.dataset.saving;
      }
    }
  });
})();
