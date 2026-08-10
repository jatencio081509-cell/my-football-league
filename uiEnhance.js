// Team page depth chart + stats + injuries; awards; latest play under field
(function () {
  function PS() { return window.PlayerSystem; }

  function getGame() {
    try {
      if (typeof game !== "undefined" && game) return game;
    } catch (e) {}
    return window.game || null;
  }

  function ensureLatestPlayEl() {
    let el = document.getElementById("latest-play");
    if (el) return el;
    const poss = document.getElementById("possession-text");
    if (!poss || !poss.parentNode) return null;
    el = document.createElement("div");
    el.id = "latest-play";
    el.className = "latest-play";
    el.innerHTML = '<span class="latest-play-label">LAST PLAY</span><span class="latest-play-text">—</span>';
    poss.parentNode.insertBefore(el, poss.nextSibling);
    return el;
  }

  function isRealPlayLine(line) {
    if (!line || typeof line !== "string") return false;
    const t = line.trim();
    if (!t) return false;
    if (/^———/.test(t)) return false;
    if (/^---/.test(t)) return false;
    if (/^Matchup:/i.test(t)) return false;
    if (/^Dice(\s+rolled|:)/i.test(t)) return false;
    if (/^Drive underway/i.test(t)) return false;
    if (/^Kickoff:/i.test(t) && /Weather note/i.test(t)) return false;
    if (/^Weather note:/i.test(t)) return false;
    if (/^Game started:/i.test(t)) return false;
    if (/^\*\*\*/.test(t)) return false;
    return true;
  }

  function refreshLatestPlay() {
    const el = ensureLatestPlayEl();
    if (!el) return;
    const textEl = el.querySelector(".latest-play-text");
    if (!textEl) return;
    const g = getGame();
    if (!g || !g.playLog || !g.playLog.length) {
      textEl.textContent = "—";
      return;
    }
    let latest = null;
    for (let i = g.playLog.length - 1; i >= 0; i--) {
      const line = g.playLog[i];
      if (!isRealPlayLine(line)) continue;
      latest = line;
      break;
    }
    textEl.textContent = latest || "—";
  }

  function hookUpdateUI() {
    const prev = window.updateUI;
    if (typeof prev !== "function") return;
    if (prev.__mflLatestPlay) return;
    function wrapped() {
      prev.apply(this, arguments);
      refreshLatestPlay();
    }
    wrapped.__mflLatestPlay = true;
    window.updateUI = wrapped;
  }

  function formatStats(p, team) {
    if (!PS()) return "";
    const s = PS().getStat(team, p);
    const bits = [];
    if (p.position === "QB") {
      if (s.passYds || s.passTd || s.interceptions) {
        bits.push(s.passYds + ' pass yds, ' + s.passTd + ' TD, ' + s.interceptions + ' INT');
      }
    } else if (p.position === "RB") {
      if (s.rushYds || s.rushTd || s.recYds) {
        bits.push(s.rushYds + ' rush, ' + s.rushTd + ' TD, ' + s.recYds + ' rec yds');
      }
    } else if (p.position === "WR" || p.position === "TE") {
      if (s.recYds || s.recTd || s.receptions) {
        bits.push(s.receptions + ' rec, ' + s.recYds + ' yds, ' + s.recTd + ' TD');
      }
    } else if (["DL", "LB", "CB", "S"].includes(p.position)) {
      if (s.tackles || s.sacks || s.interceptions) {
        bits.push(s.tackles + ' tkl, ' + s.sacks + ' sk, ' + s.interceptions + ' INT');
      }
    } else if (p.position === "K") {
      if (s.fgMade || s.fgMiss) bits.push(s.fgMade + '/' + (s.fgMade + s.fgMiss) + ' FG');
    } else if (p.position === "P") {
      if (s.punts) bits.push(s.punts + ' punts, ' + s.puntYds + ' yds');
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
    section.innerHTML = '<h3>Injuries</h3><div id="team-page-injuries" class="injury-box"></div>';
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
        injBox.innerHTML = '<p class="empty-note">No current injuries.</p>';
      } else {
        injBox.innerHTML = injured.map(({ p, inj }) => {
          const role = p.starter ? "Starter" : "Bench";
          return '<div class="injury-card">' +
            '<div class="injury-name">' + p.name + ' <span class="role-out">OUT</span></div>' +
            '<div class="injury-meta">' + p.position + ' · ' + role + '</div>' +
            '<div class="injury-type"><strong>Injury:</strong> ' + inj.type + '</div>' +
            '<div class="injury-games"><strong>Out:</strong> ' + inj.gamesLeft + ' more game' + (inj.gamesLeft === 1 ? "" : "s") + '</div>' +
          '</div>';
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
      if (window.PlayerBio) window.PlayerBio.enrich(p, team);
      let ratingClass = "rating-low";
      if (p.rating >= 85) ratingClass = "rating-high";
      else if (p.rating >= 70) ratingClass = "rating-mid";
      const role = p.starter ? "STARTER" : "Bench";
      const roleClass = p.starter ? "role-starter" : "role-bench";
      const inj = PS() ? PS().getInjury(team, p) : null;
      const outBadge = inj
        ? ' <span class="role-out" title="' + inj.type + '">OUT</span> <span class="injury-inline">' + inj.type + ' · ' + inj.gamesLeft + 'g</span>'
        : "";
      const stats = formatStats(p, team);
      const college = p.college ? ' <span class="roster-college">' + p.college + '</span>' : "";
      const tr = document.createElement("tr");
      if (inj) tr.classList.add("injured-row");
      tr.innerHTML =
        '<td class="rank">' + (i + 1) + '</td>' +
        '<td class="team-cell player-link" data-player-name="' + p.name.replace(/"/g, "") + '">' + p.name + ' <span class="' + roleClass + '">' + role + '</span>' + outBadge + college + '</td>' +
        '<td>' + p.position + '</td>' +
        '<td>' + p.age + '</td>' +
        '<td>' + p.height + '</td>' +
        '<td>' + p.weight + '</td>' +
        '<td class="' + ratingClass + '">' + p.rating + '</td>';
      tbody.appendChild(tr);
      const nameCell = tr.querySelector(".team-cell");
      if (nameCell) {
        nameCell.style.cursor = "pointer";
        nameCell.title = "View bio";
        nameCell.addEventListener("click", () => {
          if (window.PlayerBio) window.PlayerBio.open(team, p, "team-page-screen");
        });
      }
      if (stats) {
        const tr2 = document.createElement("tr");
        tr2.className = "stats-row";
        tr2.innerHTML = '<td></td><td colspan="6" class="player-stats-cell">' + stats + '</td>';
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
    container.querySelectorAll(".award-projections").forEach(el => el.remove());

    AWARD_DEFINITIONS.forEach(def => {
      const card = container.querySelector('.award-card[data-award="' + def.id + '"]');
      if (!card) return;
      const projections = document.createElement("div");
      projections.className = "award-projections";
      projections.innerHTML = '<h4>Projections</h4>';

      const candidates = [];
      TEAMS.forEach(team => {
        const key = teamKey(team);
        const roster = ROSTERS[key] || [];
        roster.forEach(p => {
          if (def.positions && !def.positions.includes(p.position)) return;
          const s = PS().getStat(team, p);
          let score = p.rating || 70;
          if (p.position === "QB") {
            score += (s.passYds || 0) / 1000;
            score += (s.passTd || 0) * 2;
            score -= (s.interceptions || 0) * 3;
          } else if (p.position === "RB") {
            score += (s.rushYds || 0) / 500;
            score += (s.rushTd || 0) * 3;
            score += (s.recYds || 0) / 1000;
          } else if (p.position === "WR") {
            score += (s.recYds || 0) / 500;
            score += (s.recTd || 0) * 3;
            score += (s.receptions || 0) / 20;
          } else if (["DL", "LB", "CB", "S"].includes(p.position)) {
            score += (s.tackles || 0) / 10;
            score += (s.sacks || 0) * 5;
            score += (s.deflections || 0) / 5;
          }
          candidates.push({ team, player: p, score });
        });
      });
      candidates.sort((a, b) => b.score - a.score);
      const top5 = candidates.slice(0, 5);
      top5.forEach((c, i) => {
        const line = document.createElement("div");
        line.className = "proj-line";
        line.textContent = (i + 1) + ". " + c.player.name + " (" + c.player.position + ") — " + teamName(c.team);
        projections.appendChild(line);
      });
      card.appendChild(projections);
    });
  };

  window.addEventListener("DOMContentLoaded", () => {
    hookUpdateUI();
    setTimeout(hookUpdateUI, 100);
  });
})();