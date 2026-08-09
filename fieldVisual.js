// ============================================
// LIVE FIELD VISUAL
// yardLine = yards from the possessing team's own goal (0–100)
// Field draws left = AWAY end zone, right = HOME end zone
// ============================================

window.FieldVisual = {
  /** Absolute position 0–100 from the AWAY goal line (left). */
  absFromAway(game) {
    if (!game) return 25;
    // Possession team measures from their own goal.
    // Home own-goal is on the RIGHT (100), away own-goal on the LEFT (0).
    if (game.possession === "home") {
      // Home drives toward away (left): abs = 100 - yardLine
      return 100 - game.yardLine;
    }
    // Away drives toward home (right): abs = yardLine
    return game.yardLine;
  },

  /** First-down line absolute position from away goal. */
  firstDownAbs(game) {
    if (!game) return 35;
    const need = game.distance || 10;
    if (game.possession === "home") {
      // Home moves left (decreasing abs): first down is further left
      return this.absFromAway(game) - need;
    }
    // Away moves right (increasing abs)
    return this.absFromAway(game) + need;
  },

  pct(absYard) {
    // Map 0–100 onto the playable field between end zones (~10%–90%)
    const clamped = Math.max(0, Math.min(100, absYard));
    return 10 + (clamped / 100) * 80;
  },

  ensureStructure() {
    const field = document.getElementById("game-field");
    if (!field || field.dataset.built === "1") return field;

    // Build yard grid + markers once
    const grid = document.createElement("div");
    grid.className = "field-playable";
    grid.innerHTML = `
      <div class="field-endzone field-endzone-away"></div>
      <div class="field-mid">
        <div class="field-yard-lines"></div>
        <div class="field-yard-numbers"></div>
        <div class="field-hashes field-hashes-top"></div>
        <div class="field-hashes field-hashes-bot"></div>
      </div>
      <div class="field-endzone field-endzone-home"></div>
      <div class="ball-marker" id="ball-marker" title="Ball"></div>
      <div class="first-down-marker" id="fd-marker" title="First down"></div>
      <div class="play-trail" id="play-trail"></div>
    `;

    // Keep existing overlay labels on top
    const overlay = field.querySelector(".field-overlay");
    field.insertBefore(grid, overlay || null);

    const lines = grid.querySelector(".field-yard-lines");
    const nums = grid.querySelector(".field-yard-numbers");
    for (let y = 10; y <= 90; y += 10) {
      const line = document.createElement("div");
      line.className = "yard-tick";
      line.style.left = `${y}%`;
      lines.appendChild(line);
      if (y === 50 || y === 10 || y === 20 || y === 30 || y === 40 || y === 60 || y === 70 || y === 80 || y === 90) {
        const n = document.createElement("div");
        n.className = "yard-num";
        n.style.left = `${y}%`;
        const label = y <= 50 ? y : 100 - y;
        n.textContent = label === 50 ? "50" : String(label);
        nums.appendChild(n);
      }
    }

    field.dataset.built = "1";
    return field;
  },

  update(game) {
    this.ensureStructure();
    const ball = document.getElementById("ball-marker");
    const fd = document.getElementById("fd-marker");
    const trail = document.getElementById("play-trail");
    if (!ball || !game) return;

    const abs = this.absFromAway(game);
    const left = this.pct(abs);
    const prev = parseFloat(ball.dataset.abs || String(abs));

    // Trail from previous spot to new spot
    if (trail && Math.abs(prev - abs) > 0.5) {
      const a = this.pct(prev);
      const b = left;
      const lo = Math.min(a, b);
      const hi = Math.max(a, b);
      trail.style.left = lo + "%";
      trail.style.width = (hi - lo) + "%";
      trail.classList.remove("flash");
      // reflow for animation restart
      void trail.offsetWidth;
      trail.classList.add("flash");
    }

    ball.style.left = left + "%";
    ball.dataset.abs = String(abs);
    ball.classList.toggle("drive-left", game.possession === "home");
    ball.classList.toggle("drive-right", game.possession === "away");

    if (fd) {
      let fdAbs = this.firstDownAbs(game);
      fdAbs = Math.max(0, Math.min(100, fdAbs));
      fd.style.left = this.pct(fdAbs) + "%";
      fd.style.display = game.gameOver ? "none" : "block";
    }

    // Red zone glow
    const field = document.getElementById("game-field");
    if (field) {
      field.classList.toggle("red-zone", game.yardLine >= 80);
    }
  }
};
