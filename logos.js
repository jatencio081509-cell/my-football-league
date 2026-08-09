// ============================================
// LOGOS + LOADING SCREEN
// ============================================
// Drop files under assets/ — see assets/README.md
// ============================================

window.MFLLogos = {
  APP_LOGO: "assets/logos/app/logo.png",
  FIELD: "assets/field/field.png",
  LOADING_VIDEO: [
    { src: "assets/logos/app/loading.webm", type: "video/webm" },
    { src: "assets/logos/app/loading.mp4", type: "video/mp4" }
  ],
  LOADING_IMAGE_CANDIDATES: [
    "assets/logos/app/loading.gif",
    "assets/logos/app/loading.png",
    "assets/logos/app/loading.svg",
    "assets/logos/app/logo.png",
    "assets/logos/app/logo.svg"
  ],
  // .png first (your real logos); .svg are temporary placeholders
  TEAM_EXTS: [".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"],

  teamInitials(team) {
    if (!team) return "TM";
    const n = (team.name || "TM").replace(/[^A-Za-z]/g, "");
    return n.slice(0, 3).toUpperCase() || "TM";
  },

  teamSrc(team, ext) {
    return `assets/logos/teams/${teamKey(team)}${ext}`;
  },

  slotHTML(team, sizeClass) {
    if (!team) return "";
    const initials = this.teamInitials(team);
    const src = this.teamSrc(team, ".png");
    return `<div class="logo-slot ${sizeClass || "logo-slot-sm"}" data-team="${teamKey(team)}">
      <img class="logo-img" alt="${teamName(team)}" src="${src}"
        onload="this.parentElement.classList.add('has-logo')"
        onerror="window.MFLLogos._onTeamImgError(this)">
      <div class="logo-placeholder">${initials}</div>
    </div>`;
  },

  _onTeamImgError(img) {
    const slot = img.parentElement;
    const teamKeyAttr = slot && slot.getAttribute("data-team");
    if (!teamKeyAttr) {
      slot && slot.classList.remove("has-logo");
      return;
    }
    const current = img.getAttribute("src") || "";
    const exts = this.TEAM_EXTS;
    let idx = -1;
    for (let i = 0; i < exts.length; i++) {
      if (current.endsWith(exts[i])) { idx = i; break; }
    }
    if (idx >= 0 && idx < exts.length - 1) {
      img.src = `assets/logos/teams/${teamKeyAttr}${exts[idx + 1]}`;
      return;
    }
    slot.classList.remove("has-logo");
  },

  fillSlot(slotEl, opts) {
    if (!slotEl) return;
    const img = slotEl.querySelector(".logo-img");
    const ph = slotEl.querySelector(".logo-placeholder");
    if (opts && opts.initials && ph) ph.textContent = opts.initials;
    if (!img) return;

    const candidates = opts && opts.candidates ? opts.candidates.slice() : [];
    const tryNext = () => {
      if (!candidates.length) {
        slotEl.classList.remove("has-logo");
        return;
      }
      const next = candidates.shift();
      img.onload = () => slotEl.classList.add("has-logo");
      img.onerror = tryNext;
      img.src = next;
    };
    tryNext();
  },

  fillAppLogos() {
    document.querySelectorAll('.logo-slot[data-logo="app"]').forEach(slot => {
      this.fillSlot(slot, {
        initials: "MFL",
        candidates: [
          this.APP_LOGO,
          "assets/logos/app/logo.jpg",
          "assets/logos/app/logo.webp",
          "assets/logos/app/logo.svg"
        ]
      });
    });
  },

  fillTeamSlot(slotEl, team) {
    if (!slotEl || !team) return;
    const candidates = this.TEAM_EXTS.map(ext => this.teamSrc(team, ext));
    this.fillSlot(slotEl, {
      initials: this.teamInitials(team),
      candidates
    });
  },

  startLoadingScreen() {
    const screen = document.getElementById("loading-screen");
    if (!screen) return;

    const video = document.getElementById("loading-video");
    const image = document.getElementById("loading-image");
    const fallback = document.getElementById("loading-fallback");
    const bar = document.getElementById("loading-bar-fill");
    const DURATION_MS = 10000;
    let finished = false;
    const start = Date.now();

    const tickBar = () => {
      if (finished || !bar) return;
      const p = Math.min(100, ((Date.now() - start) / DURATION_MS) * 100);
      bar.style.width = p + "%";
      if (p < 100) requestAnimationFrame(tickBar);
    };
    requestAnimationFrame(tickBar);

    const finish = () => {
      if (finished) return;
      finished = true;
      screen.classList.add("is-done");
    };

    setTimeout(finish, DURATION_MS);

    if (video) {
      this.LOADING_VIDEO.forEach(s => {
        const source = document.createElement("source");
        source.src = s.src;
        source.type = s.type;
        video.appendChild(source);
      });
      video.load();
      video.addEventListener("loadeddata", () => {
        if (fallback) fallback.classList.add("is-hidden");
        video.classList.remove("hidden");
        video.play().catch(() => {});
      });
      video.addEventListener("error", () => {
        this._tryLoadingImage(image, fallback, video);
      });
      setTimeout(() => {
        if (video.readyState < 2) this._tryLoadingImage(image, fallback, video);
      }, 1500);
    } else {
      this._tryLoadingImage(image, fallback, null);
    }

    this.fillAppLogos();
  },

  _tryLoadingImage(image, fallback, video) {
    if (!image) return;
    const list = this.LOADING_IMAGE_CANDIDATES.slice();
    const tryNext = () => {
      if (!list.length) {
        if (fallback) fallback.classList.remove("is-hidden");
        if (video) video.classList.add("hidden");
        image.classList.add("hidden");
        return;
      }
      const src = list.shift();
      image.onload = () => {
        if (fallback) fallback.classList.add("is-hidden");
        if (video) video.classList.add("hidden");
        image.classList.remove("hidden");
      };
      image.onerror = tryNext;
      image.src = src;
    };
    tryNext();
  }
};
