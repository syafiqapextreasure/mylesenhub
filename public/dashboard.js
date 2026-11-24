(() => {
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
        "[data-submit-kind],[data-review],[data-access],[data-affiliation],[data-directory]",
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
        let result = await post("/api/submissions", {
          kind: f.dataset.submitKind,
          payload,
          status: btn?.value || "draft",
          ...(f.dataset.id ? { id: f.dataset.id } : {}),
        });
        show(f, result.message || "Maklumat berjaya disimpan.");
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
      } else if (f.hasAttribute("data-directory")) {
        if (!confirm("Tarik balik profil ini daripada direktori awam?")) return;
        let result = await post("/api/directory", {
          id: f.dataset.directory,
          action: "unpublish",
        });
        show(f, result.message || "Profil ditarik balik.");
        if (result.redirect) location.href = result.redirect;
        else location.reload();
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
  let media = [],
    removed = [];
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
    if (!e.target.matches("[data-media]")) return;
    let target = e.target;
    for (const file of target.files) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Saiz gambar maksimum ialah 2 MB.");
        continue;
      }
      try {
        let r = await fetch("/api/media", {
            method: "POST",
            headers: { "content-type": file.type },
            body: file,
          }),
          j = await r.json();
        if (!r.ok || !j.url) throw Error(j.message || "Muat naik gagal.");
        media.push({ type: target.dataset.media, url: j.url });
        let preview = document.querySelector(".d-gallery-preview");
        if (target.dataset.media === "profile_photo") {
          let current = target
            .closest(".dp-gallery-head")
            ?.querySelector("img");
          if (current) current.src = j.url;
        } else if (preview) {
          let item = document.createElement("div");
          item.className = "d-gallery-item";
          item.dataset.newUrl = j.url;
          let img = document.createElement("img");
          img.src = j.url;
          img.alt = "Pratonton gambar";
          let remove = document.createElement("button");
          remove.type = "button";
          remove.className = "d-btn outline";
          remove.textContent = "Buang gambar";
          remove.dataset.removeMedia = "";
          let label = document.createElement("label");
          label.className = "d-field";
          label.textContent = "Kapsyen gambar";
          let caption = document.createElement("input");
          caption.dataset.galleryCaption = "";
          label.append(caption);
          let up = document.createElement("button");
          up.type = "button";
          up.className = "d-btn outline";
          up.textContent = "←";
          up.dataset.moveMedia = "up";
          up.setAttribute("aria-label", "Alih gambar ke kiri");
          let down = document.createElement("button");
          down.type = "button";
          down.className = "d-btn outline";
          down.textContent = "→";
          down.dataset.moveMedia = "down";
          down.setAttribute("aria-label", "Alih gambar ke kanan");
          item.append(img, label, up, down, remove);
          preview.append(item);
        }
      } catch (err) {
        alert(err.message);
      }
    }
  });
  document.addEventListener("click", async (e) => {
    let out = e.target.closest("[data-logout]");
    if (out) {
      try {
        let r = await post("/api/logout", {});
        location.href = r.redirect || "/login";
      } catch (err) {
        alert(err.message);
      }
    }
    let move = e.target.closest("[data-move-media]");
    if (move) {
      let item = move.closest(".d-gallery-item");
      if (move.dataset.moveMedia === "up" && item.previousElementSibling)
        item.parentElement.insertBefore(item, item.previousElementSibling);
      if (move.dataset.moveMedia === "down" && item.nextElementSibling)
        item.parentElement.insertBefore(item.nextElementSibling, item);
    }
    let remove = e.target.closest("[data-remove-media]");
    if (remove) {
      let item = remove.closest(".d-gallery-item");
      if (item.dataset.existingUrl) removed.push(item.dataset.existingUrl);
      if (item.dataset.newUrl)
        media = media.filter((x) => x.url !== item.dataset.newUrl);
      item.remove();
    }
    let save = e.target.closest("[data-save-media]");
    if (save) {
      try {
        let panel = save.closest("[data-gallery-panel]"),
          galleryOrder = [...(panel?.querySelectorAll(".d-gallery-item") || [])]
            .map((item) => ({
              url: item.dataset.existingUrl || item.dataset.newUrl,
              caption:
                item.querySelector("[data-gallery-caption]")?.value || "",
            }))
            .filter((x) => x.url);
        let r = await post("/api/submissions", {
          kind: "media",
          payload: { images: media, remove: removed, galleryOrder },
          status: save.dataset.status || "semakan",
        });
        show(
          save.closest("[data-gallery-panel]") || save.parentElement,
          r.message || "Gambar dihantar untuk semakan.",
        );
      } catch (err) {
        show(
          save.closest("[data-gallery-panel]") || save.parentElement,
          err.message,
        );
      }
    }
  });
})();
