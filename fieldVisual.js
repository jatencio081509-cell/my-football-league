// ============================================
// ESPN-STYLE FIELD
// Blue LOS, yellow first down, white/orange drive line
// from where the drive began → current spot
// ============================================

window.FieldVisual = {
  absFromAway(game) {
    if (!game) return 25;
    if (game.possession === "home") return 100 - game.yardLine;
    return game.yardLine;
  },

  firstDownAbs(game) {
    if (!game) return 35;
    const need = game.distance || 10;
    if (game.possession === "home") return this.absFromAway(game) - need;
    return this.absFromAway(game) + need;
  },

  pct(absYard) {
    const clamped = Math.max(0, Math.min(100, absYard));
    return 8 + (clamped / 100) * 84;
  },

  ensureStructure() {
    const field = document.getElementById("game-field");
    if (!field) return null;
    if (field.dataset.built === "espn2") return field;

    field.querySelectorAll(
      ".field-playable, .ball-marker, .first-down-marker, .play-trail, .los-marker, .drive-band, .drive-progress, .drive-start-marker"
    ).forEach(n => n.remove());

    const grid = document.createElement("div");
    grid.className = "field-playable";
    grid.innerHTML = `
      <div class="field-endzone field-endzone-away"></div>
      <div class="field-mid">
        <div class="field-yard-numbers"></div>
        <div class="field-hashes field-hashes-top"></div>
        <div class="field-hashes field-hashes-bot"></div>
      </div>
      <div class="field-endzone field-endzone-home"></div>
      <div class="drive-progress" id="drive-progress" title="This drive"></div>
      <div class="drive-start-marker" id="drive-start-marker" title="Drive start"></div>
      <div class="drive-band" id="drive-band"></div>
      <div class="first-down-marker" id="fd-marker" title="First down"></div>
      <div class="los-marker" id="los-marker" title="Line of scrimmage"></div>
    `;

    const overlay = field.querySelector(".field-overlay");
    field.insertBefore(grid, overlay || null);

    const nums = grid.querySelector(".field-yard-numbers");
    [10, 20, 30, 40, 50, 60, 70, 80, 90].forEach(y => {
      const label = y <= 50 ? String(y) : String(100 - y);
      ["", " bottom"].forEach(cls => {
        const el = document.createElement("div");
        el.className = "yard-num" + cls;
        el.style.left = y + "%";
        el.textContent = label;
        nums.appendChild(el);
      });
    });

    const leg = document.getElementById("field-legend");
    if (leg) {
      leg.innerHTML =
        `<span><i class="lg-drive"></i> Drive so far</span>` +
        `<span><i class="lg-los"></i> Line of scrimmage</span>` +
        `<span><i class="lg-fd"></i> First down</span>`;
    } else {
      const n = document.createElement("div");
      n.className = "field-legend";
      n.id = "field-legend";
      n.innerHTML =
        `<span><i class="lg-drive"></i> Drive so far</span>` +
        `<span><i class="lg-los"></i> Line of scrimmage</span>` +
        `<span><i class="lg-fd"></i> First down</span>`;
      field.insertAdjacentElement("afterend", n);
    }

    field.dataset.built = "espn2";
    return field;
  },

  update(game) {
    this.ensureStructure();
    const los = document.getElementById("los-marker");
    const fd = document.getElementById("fd-marker");
    const band = document.getElementById("drive-band");
    const progress = document.getElementById("drive-progress");
    const startMk = document.getElementById("drive-start-marker");
    if (!los || !game) return;

    const abs = this.absFromAway(game);
    let fdAbs = this.firstDownAbs(game);
    fdAbs = Math.max(0, Math.min(100, fdAbs));

    const losPct = this.pct(abs);
    const fdPct = this.pct(fdAbs);

    los.style.left = losPct + "%";
    if (fd) {
      fd.style.left = fdPct + "%";
      fd.style.display = game.gameOver ? "none" : "block";
    }

    // Yards-to-go band (LOS → first down)
    if (band) {
      const a = Math.min(losPct, fdPct);
      const b = Math.max(losPct, fdPct);
      band.style.left = a + "%";
      band.style.width = Math.max(0, b - a) + "%";
      band.style.display = game.gameOver ? "none" : "block";
    }

    // Drive progress: from drive start → current LOS
    let startAbs = game.driveStartAbs;
    if (startAbs == null) {
      // Derive from driveStartYard if set
      if (game.driveStartYard != null) {
        const fake = { possession: game.possession, yardLine: game.driveStartYard };
        startAbs = this.absFromAway(fake);
      } else {
        startAbs = abs;
      }
      game.driveStartAbs = startAbs;
    }

    const startPct = this.pct(startAbs);
    if (progress) {
      const a = Math.min(startPct, losPct);
      const b = Math.max(startPct, losPct);
      progress.style.left = a + "%";
      progress.style.width = Math.max(2, b - a) + "%";
      progress.style.display = game.gameOver ? "none" : "block";
    }
    if (startMk) {
      startMk.style.left = startPct + "%";
      startMk.style.display = game.gameOver ? "none" : "block";
    }

    const field = document.getElementById("game-field");
    if (field) field.classList.toggle("red-zone", game.yardLine >= 80);
  }
};
