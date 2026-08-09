// ============================================
// ESPN-STYLE FIELD
// Blue line of scrimmage + yellow first-down stick
// Left = AWAY goal | Right = HOME goal
// yardLine = yards from possessing team's own goal
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
    // end zones 8% each → playable 8% .. 92%
    return 8 + (clamped / 100) * 84;
  },

  ensureStructure() {
    const field = document.getElementById("game-field");
    if (!field) return null;
    if (field.dataset.built === "espn") return field;

    field.querySelectorAll(
      ".field-playable, .ball-marker, .first-down-marker, .play-trail, .los-marker, .drive-band"
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
      <div class="drive-band" id="drive-band"></div>
      <div class="first-down-marker" id="fd-marker" title="First down"></div>
      <div class="los-marker" id="los-marker" title="Line of scrimmage"></div>
    `;

    const overlay = field.querySelector(".field-overlay");
    field.insertBefore(grid, overlay || null);

    const nums = grid.querySelector(".field-yard-numbers");
    [10, 20, 30, 40, 50, 60, 70, 80, 90].forEach(y => {
      const label = y <= 50 ? String(y) : String(100 - y);
      const top = document.createElement("div");
      top.className = "yard-num";
      top.style.left = y + "%";
      top.textContent = label;
      nums.appendChild(top);

      const bot = document.createElement("div");
      bot.className = "yard-num bottom";
      bot.style.left = y + "%";
      bot.textContent = label;
      nums.appendChild(bot);
    });

    if (!document.getElementById("field-legend")) {
      const leg = document.createElement("div");
      leg.className = "field-legend";
      leg.id = "field-legend";
      leg.innerHTML =
        `<span><i class="lg-los"></i> Line of scrimmage</span>` +
        `<span><i class="lg-fd"></i> First down</span>`;
      field.insertAdjacentElement("afterend", leg);
    }

    field.dataset.built = "espn";
    return field;
  },

  update(game) {
    this.ensureStructure();
    const los = document.getElementById("los-marker");
    const fd = document.getElementById("fd-marker");
    const band = document.getElementById("drive-band");
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

    if (band) {
      const a = Math.min(losPct, fdPct);
      const b = Math.max(losPct, fdPct);
      band.style.left = a + "%";
      band.style.width = Math.max(0, b - a) + "%";
      band.style.display = game.gameOver ? "none" : "block";
    }

    const field = document.getElementById("game-field");
    if (field) field.classList.toggle("red-zone", game.yardLine >= 80);
  }
};
