// Team page depth chart + stats; awards projections
(function () {
  function PS() { return window.PlayerSystem; }

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

  const _openTeamPage = window.openTeamPage;
  window.openTeamPage = function (teamIndex) {
    if (typeof _openTeamPage === "function") _openTeamPage(teamIndex);
    const team = TEAMS[teamIndex];
    if (!team) return;
    const key = teamKey(team);
    const players = (ROSTERS[key] || []).slice();

    // Re-render roster with starter/bench + stats
    const tbody = document.getElementById("team-page-roster");
    if (!tbody) return;
    tbody.innerHTML = "";

    // Sort: starters first by position group, then bench
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
      const stats = formatStats(p, team);
      const tr = document.createElement("tr");
      tr.innerHTML =
        `<td class="rank">${i + 1}</td>` +
        `<td class="team-cell">${p.name} <span class="${roleClass}">${role}</span></td>` +
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

    // Remove old projection block
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

  // Inject styles
  window.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("ui-enhance-style")) return;
    const s = document.createElement("style");
    s.id = "ui-enhance-style";
    s.textContent = `
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
