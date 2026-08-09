// ============================================
// PLAYOFFS + WEEK LOCK
// ============================================

function winPct(row) {
  const g = row.wins + row.losses + row.ties;
  if (g === 0) return 0;
  return (row.wins + 0.5 * row.ties) / g;
}

function compareTeams(a, b) {
  const pa = winPct(a), pb = winPct(b);
  if (pb !== pa) return pb - pa;
  const da = a.pf - a.pa, db = b.pf - b.pa;
  if (db !== da) return db - da;
  if (b.pf !== a.pf) return b.pf - a.pf;
  return teamName(a.team).localeCompare(teamName(b.team));
}

function isWeekComplete(week) {
  const games = (typeof schedule !== "undefined" ? schedule : []).filter(g => g.week === week);
  if (games.length === 0) return week < 1; // no games = nothing to finish (bye-only still ok if empty)
  return games.every(g => g.played);
}

/** Week N is playable only if week N-1 is fully finished (week 1 always open). */
function canPlayWeek(week) {
  if (week <= 1) return true;
  return isWeekComplete(week - 1);
}

function regularSeasonComplete() {
  for (let w = 1; w <= 18; w++) {
    if (!isWeekComplete(w)) return false;
  }
  return true;
}

/**
 * NFL-style: 7 seeds per conference.
 * Seeds 1–4 = division winners (sorted by record).
 * Seeds 5–7 = wild cards (best remaining records).
 */
function getConferenceSeeds(conference) {
  const rows = Object.values(standings).filter(r => r.team && r.team.conference === conference);
  const divisions = ["East", "North", "South", "West"];
  const winners = [];
  const rest = [];

  divisions.forEach(div => {
    const inDiv = rows.filter(r => r.team.division === div).sort(compareTeams);
    if (inDiv.length) {
      winners.push(inDiv[0]);
      rest.push(...inDiv.slice(1));
    }
  });

  winners.sort(compareTeams);
  rest.sort(compareTeams);

  const seeds = [];
  winners.forEach((row, i) => {
    seeds.push({
      seed: i + 1,
      team: row.team,
      record: `${row.wins}-${row.losses}-${row.ties}`,
      role: "Division winner",
      clinched: regularSeasonComplete()
    });
  });
  rest.slice(0, 3).forEach((row, i) => {
    seeds.push({
      seed: i + 5,
      team: row.team,
      record: `${row.wins}-${row.losses}-${row.ties}`,
      role: "Wild card",
      clinched: regularSeasonComplete()
    });
  });

  // Fill empty seeds if season hasn't produced enough rows yet
  while (seeds.length < 7) {
    seeds.push({
      seed: seeds.length + 1,
      team: null,
      record: "—",
      role: seeds.length < 4 ? "Division winner" : "Wild card",
      clinched: false
    });
  }
  return seeds;
}

function seedLabel(s) {
  if (!s || !s.team) return `TBD (#${s ? s.seed : "?"})`;
  return `#${s.seed} ${teamName(s.team)} (${s.record})`;
}

function buildBracketMatchups(seeds) {
  // seeds array index 0 = seed 1, … index 6 = seed 7
  const bySeed = {};
  seeds.forEach(s => { bySeed[s.seed] = s; });
  return {
    wildCard: [
      { label: "WC Game 1", home: bySeed[2], away: bySeed[7] },
      { label: "WC Game 2", home: bySeed[3], away: bySeed[6] },
      { label: "WC Game 3", home: bySeed[4], away: bySeed[5] }
    ],
    bye: bySeed[1],
    // Later rounds stay TBD until previous games are played — for projected view show placeholders
    divisional: [
      { label: "Divisional 1", home: bySeed[1], away: null, note: "Winner of WC (lowest remaining seed)" },
      { label: "Divisional 2", home: null, away: null, note: "WC winners re-seeded" }
    ],
    championship: { label: "Conference Championship", home: null, away: null, note: "Divisional winners" }
  };
}

function renderPlayoffs() {
  const container = document.getElementById("playoffs-container");
  if (!container) return;

  const locked = regularSeasonComplete();
  const statusText = locked
    ? "Regular season complete — bracket is locked. Playoff matchups are set."
    : "Projected bracket from current standings. Seeds lock when every Week 18 game has a final result.";

  const afc = getConferenceSeeds("AFC");
  const nfc = getConferenceSeeds("NFC");

  function seedsTable(seeds, conf) {
    return `
      <div class="playoff-seeds">
        <h3>${conf} Seeds</h3>
        <table class="standings-table">
          <thead><tr><th>#</th><th>Team</th><th>Record</th><th>Path</th><th>Status</th></tr></thead>
          <tbody>
            ${seeds.map(s => `
              <tr>
                <td>${s.seed}</td>
                <td class="team-name-cell">${s.team ? teamName(s.team) : "TBD"}</td>
                <td>${s.record}</td>
                <td>${s.role}</td>
                <td>${s.clinched ? "<span class=\"seed-locked\">LOCKED</span>" : "<span class=\"seed-projected\">Projected</span>"}</td>
              </tr>`).join("")}
          </tbody>
        </table>
      </div>`;
  }

  function matchupCard(m) {
    const home = m.home && m.home.team ? seedLabel(m.home) : (m.note || "TBD");
    const away = m.away && m.away.team ? seedLabel(m.away) : (m.away === null && m.note ? "TBD" : (m.away ? seedLabel(m.away) : "TBD"));
    return `
      <div class="bracket-game">
        <div class="bracket-game-label">${m.label}</div>
        <div class="bracket-team">${away}</div>
        <div class="bracket-at">@</div>
        <div class="bracket-team">${home}</div>
      </div>`;
  }

  function confBracket(seeds, conf) {
    const b = buildBracketMatchups(seeds);
    const byeName = b.bye && b.bye.team ? seedLabel(b.bye) : "TBD (#1)";
    return `
      <div class="playoff-conference-bracket">
        <h3>${conf} Bracket</h3>
        <div class="bracket-round">
          <div class="bracket-round-title">Wild Card</div>
          ${b.wildCard.map(matchupCard).join("")}
          <div class="bracket-bye">#1 seed bye: <strong>${byeName}</strong></div>
        </div>
        <div class="bracket-round">
          <div class="bracket-round-title">Divisional</div>
          ${b.divisional.map(m => `
            <div class="bracket-game bracket-tbd">
              <div class="bracket-game-label">${m.label}</div>
              <div class="empty-note">${locked ? m.note : "TBD — seeds not locked yet"}</div>
            </div>`).join("")}
        </div>
        <div class="bracket-round">
          <div class="bracket-round-title">Conference Championship</div>
          <div class="bracket-game bracket-tbd">
            <div class="bracket-game-label">${b.championship.label}</div>
            <div class="empty-note">${locked ? b.championship.note : "TBD — seeds not locked yet"}</div>
          </div>
        </div>
      </div>`;
  }

  container.innerHTML = `
    <div class="playoff-status ${locked ? "locked" : "projected"}">${statusText}</div>

    <div class="playoff-weeks">
      <h3>Playoff weeks</h3>
      <ul>
        <li><strong>Wild Card</strong> — ${locked ? "Set after Week 18" : "TBD until seeds are locked"}</li>
        <li><strong>Divisional</strong> — ${locked ? "After Wild Card results" : "TBD until seeds are locked"}</li>
        <li><strong>Conference Championship</strong> — ${locked ? "After Divisional results" : "TBD until seeds are locked"}</li>
        <li><strong>League Championship</strong> — ${locked ? "AFC champ vs NFC champ" : "TBD until seeds are locked"}</li>
      </ul>
      <p class="empty-note">Playoff games cannot be scheduled until every regular-season seed has secured its spot (end of Week 18).</p>
    </div>

    <div class="playoff-grid">
      ${seedsTable(afc, "AFC")}
      ${seedsTable(nfc, "NFC")}
    </div>

    <div class="playoff-brackets">
      ${confBracket(afc, "AFC")}
      ${confBracket(nfc, "NFC")}
    </div>

    <div class="playoff-super">
      <h3>League Championship</h3>
      <div class="bracket-game bracket-tbd">
        <div class="bracket-game-label">Championship Game</div>
        <div class="empty-note">${locked ? "AFC Champion vs NFC Champion" : "TBD — available after both conference champions are decided"}</div>
      </div>
    </div>
  `;
}

window.Playoffs = {
  isWeekComplete,
  canPlayWeek,
  regularSeasonComplete,
  getConferenceSeeds,
  renderPlayoffs
};
