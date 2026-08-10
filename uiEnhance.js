// Team page depth chart + stats + injuries; awards; latest play under field
(function () {
  function PS() { return window.PlayerSystem; }

  function ensureLatestPlayEl() {
    let el = document.getElementById("latest-play");
    if (el) return el;
    const poss = document.getElementById("possession-text");
    if (!poss || !poss.parentNode) return null;
    el = document.createElement("div");
    el.id = "latest-play";
    el.className = "latest-play";
    el.innerHTML = `<span class="latest-play-label">LAST PLAY</span><span class="latest-play-text">—</span>`;
    poss.parentNode.insertBefore(el, poss.nextSibling);
    return el;
  }

  function refreshLatestPlay() {
    const el = ensureLatestPlayEl();
    if (!el) return;
    const textEl = el.querySelector(".latest-play-text");
    if (!textEl) return;
    if (!window.game || !game.playLog || !game.playLog.length) {
      textEl.textContent = "—";
      return;
    }
    // Prefer real plays over separators / dice lines
    const skip = /^(———|Dice:|\*\*\*|--- End)/;
    let latest = null;
    for (let i = game.playLog.length - 1; i >= 0; i--) {
      const line = game.playLog[i];
      if (!line || skip.test(line)) continue;
      latest = line;
      break;
    }
    textEl.textContent = latest || game.playLog[game.playLog.length - 1] || "—";
  }

  // Hook updateUI so latest play stays in sync
  function hookUpdateUI() {
    if (window.__mflLatestPlayHooked) return;
    const prev = window.updateUI;
    if (typeof prev !== "function") return;
    window.__mflLatestPlayHooked = true;
    window.updateUI = function () {
      prev.apply(this, arguments);
      refreshLatestPlay();
    };
  }

  function formatStats(p, team) {
    if (!PS()) return "";
    const s = PS().getStat(team, p);
    const bits = [];
    if (p.position === "QB") {
      if (s.passYds || s.passTd || s.interceptions) {
        bits.push(`${s.passYds} pass yds, ${s.passTd} TD, ${s.interceptions} INT`);
      }
    } else if (p.position === "RB") {
      if (s.rushYds || s.rushTd || s.recYds) {
        bits.push(`${s.rushYds} rush, ${s.rushTd} TD, ${s.recYds} rec yds`);
      }
    } else if (p.position === "WR" || p.position === "TE") {
      if (s.recYds || s.recTd || s.receptions) {
        bits.push(`${s.receptions} rec, ${s.recYds} yds, ${s.recTd} TD`);
      }
    } else if (["DL", "LB", "CB", "S"].includes(p.position)) {
      if (s.tackles || s.sacks || s.interceptions) {
        bits.push(`${s.tackles} tkl, ${s.sacks} sk, ${s.interceptions} INT`);
      }
    } else if (p.position === "K") {
      if (s.fgMade || s.fgMiss) bits.push(`${s.fgMade}/${s.fgMade + s.fgMiss} FG`);
    } else if (p.position === "P") {
      if (s.punts) bits.push(`${s.punts} punts, ${s.puntYds} yds`);
    }
    return bits.join(" · ");
  }

  function ensureInjurySection() {
    let box = document.getElementById("team-page-injuries");
    if (box) return box;
    const parent = document.getElementById("team-page-screen");
    if (!parent) return null;
    const section = document.createElement("div");
    section.className = "team-page-section";
    section.innerHTML = `<h3>Injuries</h3><div id="team-page-injuries" class="injury-box"></div>`;
    const rosterH = Array.from(parent.querySelectorAll(".team-page-section h3")).find(h => h.textContent === "Roster");
    if (rosterH && rosterH.parentNode) {
      parent.insertBefore(section, rosterH.parentNode);
    } else {
      parent.appendChild(section);
    }
    return document.getElementById("team-page-injuries");
  }

  const _openTeamPage = window.openTeamPage;
  window.openTeamPage = function (teamIndex) {
    if (typeof _openTeamPage === "function") _openTeamPage(teamIndex);
    const team = TEAMS[teamIndex];
    if (!team) return;
    const key = teamKey(team);
    const players = (ROSTERS[key] || []).slice();

    const injBox = ensureInjurySection();
    if (injBox && PS()) {
      const injured = players
        .map(p => ({ p, inj: PS().getInjury(team, p) }))
        .filter(x => x.inj && x.inj.gamesLeft > 0);
      if (!injured.length) {
        injBox.innerHTML = `<p class="empty-note">No current injuries.</p>`;
      } else {
        injBox.innerHTML = injured.map(({ p, inj }) => {
          const role = p.starter ? "Starter" : "Bench";
          return `<div class="injury-card">
            <div class="injury-name">${p.name} <span class="role-out">OUT</span></div>
            <div class="injury-meta">${p.position} · ${role}</div>
            <div class="injury-type"><strong>Injury:</strong> ${inj.type}</div>
            <div class="injury-games"><strong>Out:</strong> ${inj.gamesLeft} more game${inj.gamesLeft === 1 ? "" : "s"}</div>
          </div>`;
        }).join("");
      }
    }

    const tbody = document.getElementById("team-page-roster");
    if (!tbody) return;
    tbody.innerHTML = "";

    const order = ["QB", "RB", "WR", "TE", "OL", "DL", "LB", "CB", "S", "K", "P"];
    players.sort((a, b) => {
      if (a.starter !== b.starter) return a.starter ? -1 : 1;
      const ia = order.indexOf(a.position);
      const ib = order.indexOf(b.position);
      if (ia !== ib) return ia - ib;
      return b.rating - a.rating;
    });

    players.forEach((p, i) => {
      let ratingClass = "rating-low";
      if (p.rating >= 85) ratingClass = "rating-high";
      else if (p.rating >= 70) ratingClass = "rating-mid";
      const role = p.starter ? "STARTER" : "Bench";
      const roleClass = p.starter ? "role-starter" : "role-bench";
      const inj = PS() ? PS().getInjury(team, p) : null;
      const outBadge = inj
        ? ` <span class="role-out" title="${inj.type}">OUT</span> <span class="injury-inline">${inj.type} · ${inj.gamesLeft}g</span>`
        : "";
      const stats = formatStats(p, team);
      const tr = document.createElement("tr");
      if (inj) tr.classList.add("injured-row");
      tr.innerHTML =
        `<td class="rank">${i + 1}</td>` +
        `<td class="team-cell">${p.name} <span class="${roleClass}">${role}</span>${outBadge}</td>` +
        `<td>${p.position}</td>` +
        `<td>${p.age}</td>` +
        `<td>${p.height}</td>` +
        `<td>${p.weight}</td>` +
        `<td class="${ratingClass}">${p.rating}</td>`;
      tbody.appendChild(tr);
      if (stats) {
        const tr2 = document.createElement("tr");
        tr2.className = "stats-row";
        tr2.innerHTML = `<td></td><td colspan="6" class="player-stats-cell">${stats}</td>`;
        tbody.appendChild(tr2);
      }
    });
  };

  const _renderAwards = window.renderAwards;
  window.renderAwards = function () {
    if (typeof _renderAwards === "function") _renderAwards();
    if (!PS()) return;

    const container = document.getElementById("awards-list");
    if (!container) return;

    const old = document.getElementById("award-projections");
    if (old) old.remove();

    const proj = PS().projections();
    const block = document.createElement("div");
    block.id = "award-projections";
    block.className = "award-projections";

    function line(label, row) {
      if (!row) return `<div class="proj-line"><strong>${label}:</strong> <span class="empty-note">No stats yet</span></div>`;
      return `<div class="proj-line"><strong>${label}:</strong> ${row.player.name} (${row.player.position}) — ${teamName(row.team)}</div>`;
    }

    block.innerHTML =
      `<h3>Season projections (from stats)</h3>` +
      line("MVP", proj.mvp) +
      line("Offensive POY", proj.offensive_poy) +
      line("Defensive POY", proj.defensive_poy) +
      line("Best QB", proj.best_qb) +
      line("Best RB", proj.best_rb) +
      line("Best WR/TE", proj.best_wr);

    container.parentNode.insertBefore(block, container);
  };

  window.addEventListener("DOMContentLoaded", () => {
    ensureLatestPlayEl();
    hookUpdateUI();
    // Re-hook after other scripts may wrap updateUI
    setTimeout(hookUpdateUI, 0);
    setTimeout(hookUpdateUI, 100);

    if (document.getElementById("ui-enhance-style")) return;
    const s = document.createElement("style");
    s.id = "ui-enhance-style";
    s.textContent = `
      .latest-play {
        margin: 8px 0 14px;
        padding: 10px 14px;
        background: #0d1a24;
        border: 1px solid var(--field-green, #1E7B44);
        border-left: 4px solid var(--gold, #FDB813);
        border-radius: 8px;
        display: flex;
        gap: 12px;
        align-items: baseline;
        flex-wrap: wrap;
      }
      .latest-play-label {
        font-size: 0.7rem;
        font-weight: 800;
        letter-spacing: 1px;
        color: var(--gold, #FDB813);
        flex-shrink: 0;
      }
      .latest-play-text {
        color: #e8f1f8;
        font-size: 0.95rem;
        font-weight: 600;
        line-height: 1.35;
      }
      .role-starter {
        display: inline-block;
        margin-left: 6px;
        font-size: 0.65rem;
        font-weight: 800;
        letter-spacing: 0.5px;
        color: #122438;
        background: #FDB813;
        padding: 1px 6px;
        border-radius: 4px;
        vertical-align: middle;
      }
      .role-bench {
        display: inline-block;
        margin-left: 6px;
        font-size: 0.65rem;
        font-weight: 700;
        color: #a8bdd0;
        border: 1px solid #6b8499;
        padding: 1px 6px;
        border-radius: 4px;
        vertical-align: middle;
      }
      .role-out {
        display: inline-block;
        margin-left: 6px;
        font-size: 0.65rem;
        font-weight: 800;
        letter-spacing: 0.4px;
        color: #fff;
        background: #b91c1c;
        padding: 1px 6px;
        border-radius: 4px;
        vertical-align: middle;
      }
      .injury-inline {
        margin-left: 4px;
        font-size: 0.75rem;
        color: #fca5a5;
        font-weight: 600;
      }
      .injured-row { opacity: 0.72; }
      .injury-box { display: grid; gap: 10px; }
      .injury-card {
        background: #1a0f0f;
        border: 1px solid #b91c1c;
        border-radius: 10px;
        padding: 12px 14px;
      }
      .injury-name { font-weight: 700; margin-bottom: 4px; }
      .injury-meta { color: #a8bdd0; font-size: 0.85rem; margin-bottom: 6px; }
      .injury-type, .injury-games { font-size: 0.9rem; margin-top: 2px; }
      .injury-type strong, .injury-games strong { color: #FDB813; }
      .player-stats-cell {
        color: #a8bdd0;
        font-size: 0.82rem;
        padding-top: 0 !important;
        padding-bottom: 10px !important;
      }
      .stats-row:hover { background: transparent !important; }
      .award-projections {
        background: var(--navy, #122438);
        border: 2px solid var(--field-green, #1E7B44);
        border-radius: 12px;
        padding: 16px 18px;
        margin-bottom: 18px;
      }
      .award-projections h3 {
        color: var(--gold, #FDB813);
        margin-bottom: 10px;
      }
      .proj-line { margin: 6px 0; }
    `;
    document.head.appendChild(s);
  });
})();
