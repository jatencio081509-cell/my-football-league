// Draft board + sim UI + reset season stats
(function () {
  function DS() { return window.DraftSystem; }

  function ensureDraftScreen() {
    let screen = document.getElementById("draft-screen");
    if (screen) return screen;
    const main = document.querySelector("main.main");
    if (!main) return null;
    screen = document.createElement("div");
    screen.id = "draft-screen";
    screen.className = "screen hidden";
    screen.innerHTML = `
      <div class="standings-header">
        <div>
          <h2 id="draft-title">Draft</h2>
          <p class="empty-note" id="draft-subtitle">Prospect pipeline & annual draft</p>
        </div>
        <div class="draft-header-actions">
          <button type="button" id="reset-player-stats-btn" class="btn danger small">Reset Season Stats</button>
        </div>
      </div>

      <div class="draft-tabs">
        <button type="button" class="draft-tab active" data-tab="pipeline">Prospect Pipeline</button>
        <button type="button" class="draft-tab" data-tab="board">Draft Board</button>
        <button type="button" class="draft-tab" data-tab="retire">Retirement Rules</button>
      </div>

      <div id="draft-tab-pipeline" class="draft-tab-panel">
        <div class="draft-year-filters" id="draft-year-filters"></div>
        <div class="table-wrapper">
          <table class="standings-table">
            <thead>
              <tr>
                <th>#</th><th>Name</th><th>Pos</th><th>Age</th><th>Level</th><th>School</th>
                <th>Ht</th><th>Wt</th><th>Rating</th><th>Draft Year</th><th>Proj</th>
              </tr>
            </thead>
            <tbody id="draft-prospect-body"></tbody>
          </table>
        </div>
      </div>

      <div id="draft-tab-board" class="draft-tab-panel hidden">
        <div id="draft-lock-msg" class="week-lock-banner"></div>
        <div class="draft-controls">
          <button type="button" id="draft-start-btn" class="btn primary">Start Draft</button>
          <button type="button" id="draft-next-btn" class="btn" disabled>Next Pick</button>
          <button type="button" id="draft-sim-round-btn" class="btn" disabled>Sim Round</button>
          <button type="button" id="draft-end-btn" class="btn danger" disabled>End of Draft</button>
        </div>
        <div id="draft-status" class="draft-status">—</div>
        <div class="draft-board-grid">
          <div>
            <h3>On the clock</h3>
            <div id="draft-on-clock" class="draft-on-clock">—</div>
            <h3>Recent picks</h3>
            <div id="draft-recent" class="draft-recent"></div>
          </div>
          <div>
            <h3>Best available</h3>
            <div id="draft-best" class="draft-best"></div>
          </div>
        </div>
      </div>

      <div id="draft-tab-retire" class="draft-tab-panel hidden">
        <div class="award-projections">
          <h3>When players retire</h3>
          <p>After the League Championship, the offseason runs automatically when you finish the draft (or you can process rules here).</p>
          <ul class="draft-rules">
            <li><strong>Age 30–31:</strong> small chance (~4%)</li>
            <li><strong>Age 32–33:</strong> moderate (~10%)</li>
            <li><strong>Age 34–35:</strong> higher (~22%)</li>
            <li><strong>Age 36–37:</strong> high (~45%)</li>
            <li><strong>Age 38+:</strong> very high (~75%)</li>
            <li><strong>Elite players (90+ OVR)</strong> stick around longer; low-rated vets leave sooner.</li>
          </ul>
          <h3>Career-ending injuries</h3>
          <p>Yes. A small share of injuries (especially knee / concussion / big hits) can end a career immediately. Those players are removed in the offseason.</p>
          <button type="button" id="run-offseason-btn" class="btn primary">Run offseason (retirements + age prospects)</button>
          <div id="offseason-log" class="offseason-log"></div>
        </div>
      </div>
    `;
    main.appendChild(screen);
    return screen;
  }

  function ensureSidebarBtn() {
    const nav = document.querySelector(".sidebar-nav");
    if (!nav || document.querySelector('[data-screen="draft-screen"]')) return;
    const btn = document.createElement("button");
    btn.className = "sidebar-btn";
    btn.setAttribute("data-screen", "draft-screen");
    btn.textContent = "Draft";
    nav.appendChild(btn);
    btn.addEventListener("click", () => {
      if (typeof showScreen === "function") showScreen("draft-screen");
      renderAll();
    });
  }

  let filterYear = null;

  function renderPipeline() {
    const DS = window.DraftSystem;
    if (!DS) return;
    const all = DS.generateProspects(false);
    const year = DS.seasonYear();
    const years = [];
    for (let y = year; y <= year + 6; y++) years.push(y);
    if (filterYear == null) filterYear = year;

    const filters = document.getElementById("draft-year-filters");
    if (filters) {
      filters.innerHTML = years.map(y =>
        `<button type="button" class="draft-year-btn ${y === filterYear ? "active" : ""}" data-year="${y}">${y}${y === year ? " (this year)" : ""}</button>`
      ).join("");
      filters.querySelectorAll(".draft-year-btn").forEach(b => {
        b.addEventListener("click", () => {
          filterYear = parseInt(b.getAttribute("data-year"), 10);
          renderPipeline();
        });
      });
    }

    const body = document.getElementById("draft-prospect-body");
    if (!body) return;
    const list = all.filter(p => p.draftYear === filterYear).sort((a, b) => b.rating - a.rating);
    body.innerHTML = list.slice(0, 80).map((p, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${p.name}</td>
        <td>${p.position}</td>
        <td>${p.age}</td>
        <td>${p.level}</td>
        <td>${p.school}</td>
        <td>${p.height}</td>
        <td>${p.weight}</td>
        <td class="${p.rating >= 85 ? "rating-high" : p.rating >= 70 ? "rating-mid" : "rating-low"}">${p.rating}</td>
        <td>${p.draftYear}</td>
        <td>R${p.projectedRound}</td>
      </tr>`).join("") || `<tr><td colspan="11">No prospects</td></tr>`;

    const title = document.getElementById("draft-title");
    if (title) title.textContent = `${year} Draft Hub`;
  }

  function renderBoard() {
    const DS = window.DraftSystem;
    if (!DS) return;
    const year = DS.seasonYear();
    const locked = DS.championshipDone();
    const msg = document.getElementById("draft-lock-msg");
    if (msg) {
      msg.classList.remove("hidden");
      msg.textContent = locked
        ? `League Championship complete — ${year} Draft is unlocked.`
        : `Draft unlocks after the League Championship (Super Bowl). Prospect lists are viewable anytime.`;
      msg.className = "week-lock-banner " + (locked ? "" : "");
    }

    let state = DS.getState();
    const startBtn = document.getElementById("draft-start-btn");
    const nextBtn = document.getElementById("draft-next-btn");
    const simBtn = document.getElementById("draft-sim-round-btn");
    const endBtn = document.getElementById("draft-end-btn");

    const canRun = locked && state && !state.done;
    if (startBtn) startBtn.disabled = !locked || (state && !state.done);
    if (nextBtn) nextBtn.disabled = !canRun;
    if (simBtn) simBtn.disabled = !canRun;
    if (endBtn) endBtn.disabled = !canRun;

    const status = document.getElementById("draft-status");
    const onClock = document.getElementById("draft-on-clock");
    const recent = document.getElementById("draft-recent");
    const best = document.getElementById("draft-best");

    if (!state) {
      if (status) status.textContent = locked ? "Ready to start the draft." : "Waiting for championship.";
      if (onClock) onClock.textContent = "—";
      if (recent) recent.innerHTML = "";
      if (best) {
        const pool = DS.prospectsForYear(year).slice(0, 15);
        best.innerHTML = pool.map((p, i) =>
          `<div class="draft-pick-line"><strong>${i + 1}.</strong> ${p.name} (${p.position}) · ${p.rating} · ${p.school}</div>`
        ).join("");
      }
      return;
    }

    if (status) {
      status.textContent = state.done
        ? `${state.year} Draft complete — ${state.picks.length} picks made.`
        : `Round ${state.round}, Pick ${state.pickInRound + 1} · Overall ${state.overall + 1}`;
    }
    const team = DS.currentTeam(state);
    if (onClock) {
      onClock.textContent = state.done ? "Draft over" : (team ? teamName(team) + " is on the clock" : "—");
    }
    if (recent) {
      const last = state.picks.slice(-12).reverse();
      recent.innerHTML = last.map(pk =>
        `<div class="draft-pick-line"><span class="draft-ov">${pk.overall}.</span> ${pk.teamName} select <strong>${pk.prospect.name}</strong> (${pk.prospect.position}) — ${pk.prospect.rating}</div>`
      ).join("") || `<p class="empty-note">No picks yet</p>`;
    }
    if (best) {
      best.innerHTML = state.remaining.slice(0, 15).map((p, i) =>
        `<div class="draft-pick-line"><strong>${i + 1}.</strong> ${p.name} (${p.position}) · ${p.rating}</div>`
      ).join("");
    }
  }

  function renderAll() {
    ensureDraftScreen();
    renderPipeline();
    renderBoard();
  }

  function bind() {
    ensureDraftScreen();
    ensureSidebarBtn();

    document.querySelectorAll(".draft-tab").forEach(tab => {
      tab.addEventListener("click", () => {
        document.querySelectorAll(".draft-tab").forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        const id = tab.getAttribute("data-tab");
        ["pipeline", "board", "retire"].forEach(name => {
          const el = document.getElementById("draft-tab-" + name);
          if (el) el.classList.toggle("hidden", name !== id);
        });
      });
    });

    const resetBtn = document.getElementById("reset-player-stats-btn");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        if (!confirm("Clear all season player stats (passing, rushing, etc.)?")) return;
        localStorage.removeItem("mfl-player-stats");
        if (confirm("Also clear injuries?")) localStorage.removeItem("mfl-injuries");
        alert("Season player stats reset.");
        if (typeof renderAwards === "function") renderAwards();
      });
    }

    const start = document.getElementById("draft-start-btn");
    if (start) start.addEventListener("click", () => {
      const st = DS().startDraft();
      if (st) renderBoard();
    });
    const next = document.getElementById("draft-next-btn");
    if (next) next.addEventListener("click", () => {
      let st = DS().getState();
      if (!st) return;
      DS().nextPick(st);
      renderBoard();
    });
    const sim = document.getElementById("draft-sim-round-btn");
    if (sim) sim.addEventListener("click", () => {
      let st = DS().getState();
      if (!st) return;
      DS().simRound(st);
      renderBoard();
    });
    const end = document.getElementById("draft-end-btn");
    if (end) end.addEventListener("click", () => {
      let st = DS().getState();
      if (!st) return;
      DS().endDraft(st);
      renderBoard();
      // auto offseason after full draft
      const retired = DS().processOffseason();
      DS().ageProspects();
      DS().clearChampionshipFlag();
      const log = document.getElementById("offseason-log");
      if (log) {
        log.innerHTML = `<p><strong>Offseason complete.</strong> ${retired.length} players left the league.</p>` +
          retired.slice(0, 30).map(r =>
            `<div>${teamName(r.team)} — ${r.player.name} (${r.player.position}, ${r.player.age}) · ${r.reason}</div>`
          ).join("");
      }
      alert(`Draft complete. ${retired.length} players retired or left due to career-ending injuries.`);
    });

    const off = document.getElementById("run-offseason-btn");
    if (off) off.addEventListener("click", () => {
      if (!confirm("Process retirements and age prospects now?")) return;
      const retired = DS().processOffseason();
      DS().ageProspects();
      const log = document.getElementById("offseason-log");
      if (log) {
        log.innerHTML = retired.map(r =>
          `<div>${teamName(r.team)} — ${r.player.name} (${r.player.position}, age ${r.player.age}) · ${r.reason}</div>`
        ).join("") || "<p>No retirements.</p>";
      }
    });

    // Hook showScreen for draft
    const prevShow = window.showScreen;
    if (typeof prevShow === "function" && !prevShow.__draft) {
      window.showScreen = function (id) {
        prevShow.apply(this, arguments);
        if (id === "draft-screen") renderAll();
      };
      window.showScreen.__draft = true;
    }
  }

  // When championship is recorded — mark unlock
  // Expose helper for playoffs/game end
  window.markLeagueChampionshipComplete = function () {
    if (window.DraftSystem) window.DraftSystem.markChampionshipDone();
  };

  window.addEventListener("DOMContentLoaded", () => {
    bind();
    setTimeout(bind, 100);

    if (document.getElementById("draft-ui-style")) return;
    const s = document.createElement("style");
    s.id = "draft-ui-style";
    s.textContent = `
      .draft-tabs { display: flex; gap: 8px; margin: 12px 0 16px; flex-wrap: wrap; }
      .draft-tab {
        background: #122438; border: 1px solid #1E7B44; color: #a8bdd0;
        font-weight: 800; font-size: 0.8rem; padding: 8px 14px; border-radius: 999px; cursor: pointer;
      }
      .draft-tab.active {
        background: linear-gradient(135deg, #1E7B44, #1D70B8); color: #fff; border-color: transparent;
      }
      .draft-year-filters { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
      .draft-year-btn {
        background: #0d1a24; border: 1px solid #6b8499; color: #a8bdd0;
        padding: 6px 12px; border-radius: 8px; cursor: pointer; font-weight: 700; font-size: 0.8rem;
      }
      .draft-year-btn.active { border-color: #FDB813; color: #FDB813; }
      .draft-controls { display: flex; flex-wrap: wrap; gap: 10px; margin: 12px 0; }
      .draft-status { color: #FDB813; font-weight: 700; margin-bottom: 12px; }
      .draft-board-grid {
        display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
      }
      @media (max-width: 800px) { .draft-board-grid { grid-template-columns: 1fr; } }
      .draft-on-clock {
        background: #122438; border: 2px solid #FDB813; border-radius: 10px;
        padding: 14px; font-weight: 800; margin-bottom: 14px;
      }
      .draft-pick-line { padding: 6px 0; border-bottom: 1px solid rgba(30,123,68,0.25); font-size: 0.88rem; color: #a8bdd0; }
      .draft-ov { color: #FDB813; font-weight: 800; margin-right: 6px; }
      .draft-rules { color: #a8bdd0; line-height: 1.5; }
      .offseason-log { margin-top: 12px; max-height: 240px; overflow: auto; font-size: 0.85rem; color: #a8bdd0; }
      .draft-header-actions { display: flex; gap: 8px; }
    `;
    document.head.appendChild(s);
  });
})();
