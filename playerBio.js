// ============================================
// PLAYER BIOS — college + full bio page
// ============================================

window.PlayerBio = {
  COLLEGES: [
    "Alabama", "Ohio State", "Georgia", "Michigan", "Clemson", "LSU",
    "Oklahoma", "Texas", "USC", "Notre Dame", "Penn State", "Florida",
    "Florida State", "Miami", "Oregon", "Washington", "Utah", "Texas A&M",
    "Auburn", "Tennessee", "Wisconsin", "Iowa", "Michigan State", "UCLA",
    "Stanford", "Ole Miss", "Mississippi State", "Kentucky", "Missouri",
    "Nebraska", "Colorado", "Arizona State", "BYU", "Boise State", "Cincinnati",
    "Louisville", "Pittsburgh", "Boston College", "Syracuse", "Virginia Tech",
    "North Carolina", "NC State", "Duke", "Wake Forest", "Maryland",
    "Purdue", "Indiana", "Illinois", "Northwestern", "Minnesota",
    "Arkansas", "South Carolina", "Vanderbilt", "Kansas State", "TCU",
    "Baylor", "Oklahoma State", "West Virginia", "Houston", "UCF",
    "Memphis", "SMU", "Tulane", "Army", "Navy", "Air Force",
    "San Diego State", "Fresno State", "Nevada", "Hawaii", "Appalachian State",
    "Coastal Carolina", "James Madison", "Toledo", "Western Michigan"
  ],

  CLASSES: ["Freshman", "Sophomore", "Junior", "Senior", "RS Senior"],

  hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  },

  /** Fill college / jersey / bio fields if missing (stable per name). */
  enrich(player, team) {
    if (!player) return player;
    const seed = this.hash(player.name + "|" + (player.position || "") + "|" + (team ? teamKey(team) : ""));
    if (!player.college) {
      player.college = this.COLLEGES[seed % this.COLLEGES.length];
    }
    if (player.jersey == null) {
      // Prefer realistic ranges by position
      const pos = player.position || "WR";
      let n;
      if (pos === "QB") n = 1 + (seed % 19);
      else if (pos === "RB") n = 20 + (seed % 30);
      else if (pos === "WR") n = 10 + (seed % 19);
      else if (pos === "TE") n = 80 + (seed % 9);
      else if (pos === "OL") n = 50 + (seed % 30);
      else if (pos === "DL") n = 90 + (seed % 10);
      else if (pos === "LB") n = 40 + (seed % 20);
      else if (pos === "CB" || pos === "S") n = 20 + (seed % 30);
      else if (pos === "K" || pos === "P") n = 1 + (seed % 9);
      else n = 1 + (seed % 99);
      player.jersey = n;
    }
    if (!player.experience) {
      // Years in league derived from age
      const age = player.age || 24;
      player.experience = Math.max(0, Math.min(12, age - 21 + (seed % 3)));
    }
    if (!player.draftYear) {
      const seasonYear = 2026;
      player.draftYear = seasonYear - (player.experience || 0);
    }
    if (!player.draftRound) {
      // Higher rating → earlier round
      const r = player.rating || 70;
      if (r >= 90) player.draftRound = 1;
      else if (r >= 82) player.draftRound = 1 + (seed % 2);
      else if (r >= 75) player.draftRound = 2 + (seed % 2);
      else if (r >= 68) player.draftRound = 3 + (seed % 3);
      else player.draftRound = 5 + (seed % 3);
      if (player.draftRound > 7) player.draftRound = "UDFA";
    }
    if (!player.collegeClass) {
      player.collegeClass = this.CLASSES[seed % this.CLASSES.length];
    }
    if (!player.hand) {
      player.hand = (seed % 10 === 0) ? "Left" : "Right";
    }
    return player;
  },

  enrichAll() {
    if (typeof ROSTERS === "undefined" || typeof TEAMS === "undefined") return;
    TEAMS.forEach(team => {
      const list = ROSTERS[teamKey(team)] || [];
      list.forEach(p => this.enrich(p, team));
    });
  },

  ensureScreen() {
    let screen = document.getElementById("player-bio-screen");
    if (screen) return screen;
    const main = document.querySelector("main.main");
    if (!main) return null;
    screen = document.createElement("div");
    screen.id = "player-bio-screen";
    screen.className = "screen hidden";
    screen.innerHTML = `
      <button type="button" id="player-bio-back" class="btn small back-btn">← Back</button>
      <div class="player-bio-card">
        <div class="player-bio-top">
          <div class="player-bio-jersey" id="bio-jersey">00</div>
          <div class="player-bio-identity">
            <h2 id="bio-name">Player</h2>
            <div class="player-bio-sub" id="bio-sub"></div>
            <div class="player-bio-team" id="bio-team"></div>
          </div>
          <div class="player-bio-rating" id="bio-rating">—</div>
        </div>
        <div class="player-bio-grid" id="bio-grid"></div>
        <div class="player-bio-section">
          <h3>Season Stats</h3>
          <div id="bio-stats" class="player-bio-stats"></div>
        </div>
        <div class="player-bio-section">
          <h3>Status</h3>
          <div id="bio-status"></div>
        </div>
      </div>
    `;
    main.appendChild(screen);

    const back = document.getElementById("player-bio-back");
    if (back) {
      back.addEventListener("click", () => {
        if (this._returnScreen && typeof showScreen === "function") {
          showScreen(this._returnScreen);
        } else if (typeof showScreen === "function") {
          showScreen("team-page-screen");
        }
      });
    }
    return screen;
  },

  open(team, player, returnScreen) {
    if (!team || !player) return;
    this.enrich(player, team);
    this._returnScreen = returnScreen || "team-page-screen";
    this.ensureScreen();

    // Hide other screens
    if (typeof showScreen === "function") {
      showScreen("player-bio-screen");
    } else {
      document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
      const sc = document.getElementById("player-bio-screen");
      if (sc) sc.classList.remove("hidden");
    }

    document.getElementById("bio-jersey").textContent = String(player.jersey).padStart(2, "0");
    document.getElementById("bio-name").textContent = player.name;
    document.getElementById("bio-sub").textContent =
      `${player.position} · ${player.age} yrs · ${player.height} · ${player.weight} lbs`;
    document.getElementById("bio-team").textContent = teamName(team);
    document.getElementById("bio-rating").textContent = player.rating;

    const draft =
      player.draftRound === "UDFA"
        ? `Undrafted free agent (${player.draftYear})`
        : `Round ${player.draftRound}, ${player.draftYear}`;

    const grid = document.getElementById("bio-grid");
    const cells = [
      ["College", player.college],
      ["College class", player.collegeClass],
      ["Jersey", "#" + player.jersey],
      ["Position", player.position],
      ["Age", player.age],
      ["Height", player.height],
      ["Weight", player.weight + " lbs"],
      ["Hand", player.hand],
      ["Experience", (player.experience || 0) + " season" + ((player.experience || 0) === 1 ? "" : "s")],
      ["Draft", draft],
      ["Role", player.starter ? "Starter" : "Bench"],
      ["Overall", player.rating]
    ];
    grid.innerHTML = cells.map(([k, v]) =>
      `<div class="bio-cell"><div class="bio-label">${k}</div><div class="bio-value">${v}</div></div>`
    ).join("");

    // Season stats
    const statsEl = document.getElementById("bio-stats");
    const PS = window.PlayerSystem;
    const s = PS ? PS.getStat(team, player) : null;
    if (!s) {
      statsEl.innerHTML = `<p class="empty-note">No season stats yet.</p>`;
    } else {
      const lines = [];
      if (player.position === "QB" || s.passYds || s.passTd) {
        lines.push(`Passing: ${s.passYds || 0} yds, ${s.passTd || 0} TD, ${s.interceptions || 0} INT`);
      }
      if (s.rushYds || s.rushTd) lines.push(`Rushing: ${s.rushYds || 0} yds, ${s.rushTd || 0} TD`);
      if (s.receptions || s.recYds) lines.push(`Receiving: ${s.receptions || 0} rec, ${s.recYds || 0} yds, ${s.recTd || 0} TD`);
      if (s.tackles || s.sacks || s.deflections) {
        lines.push(`Defense: ${s.tackles || 0} tkl, ${s.sacks || 0} sacks, ${s.deflections || 0} PBU, ${s.interceptions || 0} INT`);
      }
      if (s.fgMade || s.fgMiss) lines.push(`Field goals: ${s.fgMade || 0}/${(s.fgMade || 0) + (s.fgMiss || 0)}`);
      if (s.punts) lines.push(`Punting: ${s.punts} punts, ${s.puntYds || 0} yds`);
      if (s.returnYds || s.returnTd || s.kickRetYds || s.puntRetYds) {
        lines.push(`Returns: ${(s.returnYds || 0) + (s.kickRetYds || 0) + (s.puntRetYds || 0)} yds, ${s.returnTd || 0} TD`);
      }
      if (s.fumblesLost) lines.push(`Fumbles lost: ${s.fumblesLost}`);
      if (s.fumRecoveries) lines.push(`Fumble recoveries: ${s.fumRecoveries}`);
      statsEl.innerHTML = lines.length
        ? lines.map(l => `<div class="bio-stat-line">${l}</div>`).join("")
        : `<p class="empty-note">No season stats yet.</p>`;
    }

    // Status / injury
    const statusEl = document.getElementById("bio-status");
    const inj = PS ? PS.getInjury(team, player) : null;
    if (inj && inj.gamesLeft > 0) {
      statusEl.innerHTML = `<div class="bio-injury">OUT — ${inj.type} · ${inj.gamesLeft} game${inj.gamesLeft === 1 ? "" : "s"} remaining</div>`;
    } else {
      statusEl.innerHTML = `<div class="bio-healthy">Active / Healthy</div>`;
    }
  }
};

(function () {
  // Enrich rosters when ready
  function boot() {
    if (window.PlayerBio) window.PlayerBio.enrichAll();
  }

  // Make roster rows open bio
  function patchTeamPage() {
    const prev = window.openTeamPage;
    if (typeof prev !== "function" || prev.__bio) return;
    window.openTeamPage = function (teamIndex) {
      prev.apply(this, arguments);
      const team = TEAMS[teamIndex];
      if (!team) return;
      const tbody = document.getElementById("team-page-roster");
      if (!tbody) return;
      const players = ROSTERS[teamKey(team)] || [];
      // Rebuild with clickable names — hook clicks on rows after uiEnhance fills table
      setTimeout(() => {
        tbody.querySelectorAll("tr").forEach(tr => {
          if (tr.classList.contains("stats-row")) return;
          const nameCell = tr.querySelector(".team-cell");
          if (!nameCell) return;
          // Extract name before badges
          const raw = nameCell.childNodes[0] ? nameCell.childNodes[0].textContent.trim() : nameCell.textContent.trim();
          const name = raw.split(" STARTER")[0].split(" Bench")[0].trim();
          const player = players.find(p => p.name === name);
          if (!player) return;
          nameCell.classList.add("player-link");
          nameCell.style.cursor = "pointer";
          nameCell.title = "View bio";
          nameCell.addEventListener("click", (e) => {
            e.stopPropagation();
            window.PlayerBio.open(team, player, "team-page-screen");
          });
        });
      }, 0);
    };
    window.openTeamPage.__bio = true;
  }

  // Live stats names clickable
  function patchLiveStats() {
    const LS = window.LiveStats;
    if (!LS || LS.__bioPatched) return;
    const origRender = LS.render.bind(LS);
    LS.render = function (g) {
      origRender(g);
      if (!g) return;
      ["live-stats-away-list", "live-stats-home-list"].forEach(id => {
        const list = document.getElementById(id);
        if (!list) return;
        list.querySelectorAll(".live-stat-row").forEach(row => {
          const strong = row.querySelector(".live-stat-name strong");
          if (!strong || strong.__bioBound) return;
          strong.__bioBound = true;
          strong.classList.add("player-link");
          strong.style.cursor = "pointer";
          strong.title = "View bio";
          strong.addEventListener("click", () => {
            const name = strong.textContent.trim();
            const side = list.id.includes("away") ? "away" : "home";
            const team = side === "away" ? g.away : g.home;
            const player = (ROSTERS[teamKey(team)] || []).find(p => p.name === name);
            if (player) window.PlayerBio.open(team, player, "game-screen");
          });
        });
      });
    };
    LS.__bioPatched = true;
  }

  // showScreen support for bio screen
  function patchShowScreen() {
    const prev = window.showScreen;
    if (typeof prev !== "function") return;
    // already works if it toggles .screen by id
  }

  window.addEventListener("DOMContentLoaded", () => {
    boot();
    patchTeamPage();
    patchLiveStats();
    setTimeout(boot, 50);
    setTimeout(patchTeamPage, 50);
    setTimeout(patchLiveStats, 100);
    setTimeout(patchLiveStats, 300);

    if (document.getElementById("player-bio-style")) return;
    const s = document.createElement("style");
    s.id = "player-bio-style";
    s.textContent = `
      .player-link {
        color: #e8f1f8;
        text-decoration: underline;
        text-decoration-color: rgba(253, 184, 19, 0.45);
        text-underline-offset: 2px;
      }
      .player-link:hover {
        color: #FDB813;
      }
      .player-bio-card {
        margin-top: 12px;
        background: #0d1a24;
        border: 2px solid #1E7B44;
        border-radius: 14px;
        padding: 20px 22px;
      }
      .player-bio-top {
        display: flex;
        align-items: center;
        gap: 18px;
        flex-wrap: wrap;
        margin-bottom: 20px;
        padding-bottom: 16px;
        border-bottom: 1px solid rgba(30,123,68,0.4);
      }
      .player-bio-jersey {
        width: 72px;
        height: 72px;
        border-radius: 12px;
        background: linear-gradient(135deg, #1E7B44, #122438);
        border: 2px solid #FDB813;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.6rem;
        font-weight: 900;
        color: #FDB813;
      }
      .player-bio-identity h2 {
        margin: 0 0 4px;
        color: #e8f1f8;
      }
      .player-bio-sub {
        color: #a8bdd0;
        font-size: 0.92rem;
      }
      .player-bio-team {
        margin-top: 4px;
        color: #FDB813;
        font-weight: 700;
        font-size: 0.9rem;
      }
      .player-bio-rating {
        margin-left: auto;
        font-size: 2rem;
        font-weight: 900;
        color: #FDB813;
        min-width: 56px;
        text-align: center;
      }
      .player-bio-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
        gap: 12px;
        margin-bottom: 20px;
      }
      .bio-cell {
        background: #122438;
        border-radius: 10px;
        padding: 10px 12px;
        border: 1px solid rgba(30,123,68,0.35);
      }
      .bio-label {
        font-size: 0.68rem;
        font-weight: 800;
        letter-spacing: 0.6px;
        color: #6b8499;
        text-transform: uppercase;
        margin-bottom: 4px;
      }
      .bio-value {
        font-weight: 700;
        color: #e8f1f8;
        font-size: 0.95rem;
      }
      .player-bio-section {
        margin-top: 8px;
        margin-bottom: 14px;
      }
      .player-bio-section h3 {
        color: #FDB813;
        font-size: 0.95rem;
        margin-bottom: 8px;
      }
      .bio-stat-line {
        color: #a8bdd0;
        padding: 6px 0;
        border-bottom: 1px solid rgba(30,123,68,0.2);
        font-size: 0.9rem;
      }
      .bio-healthy {
        color: #4ade80;
        font-weight: 700;
      }
      .bio-injury {
        color: #fca5a5;
        font-weight: 700;
        background: #1a0f0f;
        border: 1px solid #b91c1c;
        border-radius: 8px;
        padding: 10px 12px;
      }
    `;
    document.head.appendChild(s);
  });
})();
