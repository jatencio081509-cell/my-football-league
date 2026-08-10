// ============================================
// LIVE GAME STATS — updates as plays happen
// ============================================

window.LiveStats = {
  empty() {
    return {
      passYds: 0, passTd: 0, interceptions: 0,
      rushYds: 0, rushTd: 0,
      recYds: 0, recTd: 0, receptions: 0,
      tackles: 0, sacks: 0, deflections: 0,
      fgMade: 0, fgMiss: 0,
      punts: 0, puntYds: 0,
      returnYds: 0, returnTd: 0,
      fumblesLost: 0, fumRecoveries: 0,
      kickRetYds: 0, puntRetYds: 0,
      plays: 0
    };
  },

  ensureGame(g) {
    if (!g) return;
    if (!g.liveStats) g.liveStats = {};
  },

  key(team, player) {
    return teamKey(team) + "::" + player.name;
  },

  add(g, team, player, patch) {
    if (!g || !team || !player || !patch) return;
    this.ensureGame(g);
    const id = this.key(team, player);
    if (!g.liveStats[id]) {
      g.liveStats[id] = {
        name: player.name,
        position: player.position,
        starter: !!player.starter,
        teamKey: teamKey(team),
        teamName: teamName(team),
        side: g.home && teamKey(team) === teamKey(g.home) ? "home" : "away",
        stats: this.empty()
      };
    }
    const row = g.liveStats[id];
    row.stats.plays += 1;
    Object.keys(patch).forEach(k => {
      row.stats[k] = (row.stats[k] || 0) + (patch[k] || 0);
    });
  },

  fromStep(g, step) {
    if (!step || !step.statPatches) return;
    step.statPatches.forEach(sp => {
      if (sp && sp.team && sp.player && sp.patch) {
        this.add(g, sp.team, sp.player, sp.patch);
      }
    });
  },

  formatLine(row) {
    const s = row.stats;
    const bits = [];
    if (s.passYds || s.passTd || (s.interceptions && row.position === "QB")) {
      bits.push(`${s.passYds} pass · ${s.passTd} TD · ${s.interceptions} INT`);
    }
    if (s.rushYds || s.rushTd) bits.push(`${s.rushYds} rush · ${s.rushTd} TD`);
    if (s.receptions || s.recYds || s.recTd) {
      bits.push(`${s.receptions} rec · ${s.recYds} yds · ${s.recTd} TD`);
    }
    if (s.tackles || s.sacks || s.deflections) {
      bits.push(`${s.tackles} tkl · ${s.sacks} sk · ${s.deflections} pbu`);
    }
    if (s.interceptions && row.position !== "QB") bits.push(`${s.interceptions} INT`);
    if (s.fgMade || s.fgMiss) bits.push(`FG ${s.fgMade}/${s.fgMade + s.fgMiss}`);
    if (s.punts) bits.push(`${s.punts} punt · ${s.puntYds} yds`);
    if (s.returnYds || s.returnTd || s.kickRetYds || s.puntRetYds) {
      const ry = (s.returnYds || 0) || ((s.kickRetYds || 0) + (s.puntRetYds || 0));
      bits.push(`${ry} ret yds${s.returnTd ? " · " + s.returnTd + " ret TD" : ""}`);
    }
    if (s.fumblesLost) bits.push(`${s.fumblesLost} fum lost`);
    if (s.fumRecoveries) bits.push(`${s.fumRecoveries} fum rec`);
    if (!bits.length) bits.push(`${s.plays} play${s.plays === 1 ? "" : "s"}`);
    return bits.join("  |  ");
  },

  rows(g) {
    if (!g || !g.liveStats) return [];
    return Object.values(g.liveStats).sort((a, b) => {
      if (a.side !== b.side) return a.side === "away" ? -1 : 1;
      const score = r =>
        (r.stats.passYds || 0) + (r.stats.rushYds || 0) * 1.2 + (r.stats.recYds || 0) +
        (r.stats.tackles || 0) * 8 + (r.stats.sacks || 0) * 20 +
        (r.stats.passTd || 0) * 40 + (r.stats.rushTd || 0) * 40 + (r.stats.recTd || 0) * 40 +
        (r.stats.returnTd || 0) * 50 + (r.stats.plays || 0);
      return score(b) - score(a);
    });
  },

  ensurePanel() {
    let panel = document.getElementById("live-stats-panel");
    if (panel) return panel;
    const gameScreen = document.getElementById("game-screen");
    if (!gameScreen) return null;
    panel = document.createElement("div");
    panel.id = "live-stats-panel";
    panel.className = "live-stats-panel";
    panel.innerHTML = `
      <div class="live-stats-header">
        <h3>Live Player Stats</h3>
        <span class="live-stats-sub">This game only · updates every play</span>
      </div>
      <div class="live-stats-cols">
        <div class="live-stats-team">
          <div class="live-stats-team-title" id="live-stats-away-title">Away</div>
          <div class="live-stats-list" id="live-stats-away-list"></div>
        </div>
        <div class="live-stats-team">
          <div class="live-stats-team-title" id="live-stats-home-title">Home</div>
          <div class="live-stats-list" id="live-stats-home-list"></div>
        </div>
      </div>
    `;
    const playLog = gameScreen.querySelector(".play-log");
    if (playLog) gameScreen.insertBefore(panel, playLog);
    else gameScreen.appendChild(panel);
    return panel;
  },

  render(g) {
    this.ensurePanel();
    const awayList = document.getElementById("live-stats-away-list");
    const homeList = document.getElementById("live-stats-home-list");
    const awayTitle = document.getElementById("live-stats-away-title");
    const homeTitle = document.getElementById("live-stats-home-title");
    if (!awayList || !homeList) return;

    if (g) {
      if (awayTitle) awayTitle.textContent = teamName(g.away);
      if (homeTitle) homeTitle.textContent = teamName(g.home);
    }

    const rows = this.rows(g);
    const away = rows.filter(r => r.side === "away");
    const home = rows.filter(r => r.side === "home");

    function paint(listEl, list) {
      if (!list.length) {
        listEl.innerHTML = `<div class="live-stats-empty">No stats yet — play will show here</div>`;
        return;
      }
      listEl.innerHTML = list.map(r => `
        <div class="live-stat-row">
          <div class="live-stat-name">
            <strong>${r.name}</strong>
            <span class="live-stat-pos">${r.position}</span>
            <span class="live-stat-role ${r.starter ? "is-starter" : ""}">${r.starter ? "STARTER" : "Bench"}</span>
          </div>
          <div class="live-stat-line">${window.LiveStats.formatLine(r)}</div>
        </div>`).join("");
    }

    paint(awayList, away);
    paint(homeList, home);
  }
};

(function () {
  function currentGame() {
    try {
      if (typeof game !== "undefined" && game) return game;
    } catch (e) {}
    return window.game || null;
  }

  function hookAddStat() {
    const PS = window.PlayerSystem;
    if (!PS || PS.__liveStatsHooked) return;
    const orig = PS.addStat.bind(PS);
    PS.addStat = function (team, player, patch) {
      orig(team, player, patch);
      const g = currentGame();
      if (g && window.LiveStats) {
        window.LiveStats.add(g, team, player, patch);
        window.LiveStats.render(g);
      }
    };
    PS.__liveStatsHooked = true;
  }

  function hookUI() {
    const prev = window.updateUI;
    if (typeof prev !== "function" || prev.__liveStats) return;
    function wrapped() {
      prev.apply(this, arguments);
      const g = currentGame();
      if (g && window.LiveStats) window.LiveStats.render(g);
    }
    wrapped.__liveStats = true;
    window.updateUI = wrapped;
  }

  // Reset live board on new game
  function hookCreate() {
    const prev = window.createNewGame;
    if (typeof prev !== "function" || prev.__liveStats) return;
    function wrapped(home, away, scheduledGame) {
      const g = prev(home, away, scheduledGame);
      if (g) {
        g.liveStats = {};
        setTimeout(() => window.LiveStats && window.LiveStats.render(g), 0);
      }
      return g;
    }
    wrapped.__liveStats = true;
    window.createNewGame = wrapped;
  }

  window.__mflLiveStatFromStep = function (step) {
    const g = currentGame();
    if (g && window.LiveStats) window.LiveStats.fromStep(g, step);
  };

  window.addEventListener("DOMContentLoaded", () => {
    window.LiveStats.ensurePanel();
    hookAddStat();
    hookUI();
    hookCreate();
    setTimeout(hookAddStat, 50);
    setTimeout(hookUI, 50);
    setTimeout(hookCreate, 50);
    setTimeout(hookAddStat, 200);

    if (document.getElementById("live-stats-style")) return;
    const s = document.createElement("style");
    s.id = "live-stats-style";
    s.textContent = `
      .live-stats-panel {
        margin: 16px 0;
        background: #0d1a24;
        border: 2px solid var(--field-green, #1E7B44);
        border-radius: 12px;
        padding: 14px 16px;
      }
      .live-stats-header {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        margin-bottom: 12px;
        gap: 10px;
        flex-wrap: wrap;
      }
      .live-stats-header h3 {
        margin: 0;
        color: var(--gold, #FDB813);
        font-size: 1rem;
      }
      .live-stats-sub {
        color: #6b8499;
        font-size: 0.75rem;
        font-weight: 600;
      }
      .live-stats-cols {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 14px;
      }
      @media (max-width: 800px) {
        .live-stats-cols { grid-template-columns: 1fr; }
      }
      .live-stats-team-title {
        font-weight: 800;
        font-size: 0.85rem;
        color: #e8f1f8;
        margin-bottom: 8px;
        padding-bottom: 6px;
        border-bottom: 1px solid #1E7B44;
      }
      .live-stats-empty {
        color: #6b8499;
        font-size: 0.85rem;
        padding: 8px 0;
      }
      .live-stat-row {
        padding: 8px 0;
        border-bottom: 1px solid rgba(30, 123, 68, 0.25);
      }
      .live-stat-row:last-child { border-bottom: none; }
      .live-stat-name {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
        margin-bottom: 3px;
      }
      .live-stat-pos {
        color: #a8bdd0;
        font-size: 0.75rem;
        font-weight: 700;
      }
      .live-stat-role {
        font-size: 0.6rem;
        font-weight: 800;
        letter-spacing: 0.4px;
        color: #a8bdd0;
        border: 1px solid #6b8499;
        padding: 1px 5px;
        border-radius: 3px;
      }
      .live-stat-role.is-starter {
        color: #122438;
        background: #FDB813;
        border-color: #FDB813;
      }
      .live-stat-line {
        color: #a8bdd0;
        font-size: 0.8rem;
        line-height: 1.35;
      }
    `;
    document.head.appendChild(s);
  });
})();
