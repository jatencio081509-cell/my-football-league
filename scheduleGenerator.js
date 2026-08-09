// ============================================
// NFL-STYLE SCHEDULE GENERATOR
// ============================================
//
// 17 games / team, 18 weeks, 1 bye each.
// Byes weeks 5–14: 2,4,4,4,6,4,4,2,2,0 teams
// Games/week = (32 - byes) / 2
//   → weeks with 0 byes always have 16 games
//
// Algorithm: pack most-constrained weeks first,
// each week takes a near-perfect matching from
// remaining matchups among teams not on bye.
// ============================================

function getDivisionMap() {
  const divisions = {};
  TEAMS.forEach(team => {
    const key = `${team.conference}-${team.division}`;
    if (!divisions[key]) divisions[key] = [];
    divisions[key].push(team);
  });
  Object.keys(divisions).forEach(key => {
    divisions[key].sort((a, b) => teamName(a).localeCompare(teamName(b)));
  });
  return divisions;
}

function buildNFLMatchups() {
  const matchups = [];
  const div = getDivisionMap();
  function add(home, away) { matchups.push({ home, away }); }

  Object.values(div).forEach(teams => {
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        add(teams[i], teams[j]);
        add(teams[j], teams[i]);
      }
    }
  });

  [
    ["AFC-East", "AFC-North"], ["AFC-South", "AFC-West"],
    ["NFC-East", "NFC-North"], ["NFC-South", "NFC-West"]
  ].forEach(([keyA, keyB]) => {
    const A = div[keyA], B = div[keyB];
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
      if ((i + j) % 2 === 0) add(A[i], B[j]); else add(B[j], A[i]);
    }
  });

  [
    ["AFC-East", "AFC-South"], ["AFC-East", "AFC-West"],
    ["AFC-North", "AFC-South"], ["AFC-North", "AFC-West"],
    ["NFC-East", "NFC-South"], ["NFC-East", "NFC-West"],
    ["NFC-North", "NFC-South"], ["NFC-North", "NFC-West"]
  ].forEach(([keyA, keyB]) => {
    const A = div[keyA], B = div[keyB];
    for (let i = 0; i < 4; i++) {
      if (i % 2 === 0) add(A[i], B[i]); else add(B[i], A[i]);
    }
  });

  ["East", "North", "South", "West"].forEach(d => {
    const A = div[`AFC-${d}`], B = div[`NFC-${d}`];
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
      if ((i + j) % 2 === 0) add(A[i], B[j]); else add(B[j], A[i]);
    }
  });

  [
    ["AFC-East", "NFC-West"], ["AFC-North", "NFC-South"],
    ["AFC-South", "NFC-North"], ["AFC-West", "NFC-East"]
  ].forEach(([keyA, keyB]) => {
    const A = div[keyA], B = div[keyB];
    for (let i = 0; i < 4; i++) {
      if (i % 2 === 0) add(A[i], B[i]); else add(B[i], A[i]);
    }
  });

  return matchups;
}

function assignByeWeeks() {
  const byeWeeks = {};
  const teamsOnByeByWeek = {};
  const byeSlotsByWeek = {
    5: 2, 6: 4, 7: 4, 8: 4, 9: 6,
    10: 4, 11: 4, 12: 2, 13: 2
  };
  Object.keys(byeSlotsByWeek).forEach(w => { teamsOnByeByWeek[Number(w)] = []; });

  const ordered = TEAMS.slice().sort((a, b) => teamName(a).localeCompare(teamName(b)));
  const weekQueue = [];
  Object.keys(byeSlotsByWeek).map(Number).sort((a, b) => a - b).forEach(week => {
    for (let i = 0; i < byeSlotsByWeek[week]; i++) weekQueue.push(week);
  });
  ordered.forEach((team, index) => {
    const week = weekQueue[index];
    const key = teamKey(team);
    byeWeeks[key] = week;
    teamsOnByeByWeek[week].push(key);
  });
  return { byeWeeks, teamsOnByeByWeek };
}

function shuffleCopy(arr, rng) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

/**
 * Best-effort maximum matching via many random greedy passes.
 * On this dense opponent graph it reliably finds a perfect matching.
 */
function maxMatching(available, edges, rng, tries) {
  let best = [];
  const target = available.size / 2;
  for (let t = 0; t < tries; t++) {
    const used = new Set();
    const matching = [];
    for (const e of shuffleCopy(edges, rng)) {
      const a = teamKey(e.home);
      const b = teamKey(e.away);
      if (!available.has(a) || !available.has(b)) continue;
      if (used.has(a) || used.has(b)) continue;
      used.add(a);
      used.add(b);
      matching.push(e);
    }
    if (matching.length > best.length) best = matching;
    if (best.length === target) break;
  }
  return best;
}

function assignMatchupsToWeeks(matchups) {
  const { byeWeeks, teamsOnByeByWeek } = assignByeWeeks();

  // Most constrained weeks first (most byes), then the rest
  const weekOrder = [9, 6, 7, 8, 10, 11, 5, 12, 13, 14, 1, 2, 3, 4, 15, 16, 17, 18];

  let bestGames = null;

  for (let attempt = 0; attempt < 60; attempt++) {
    const rng = mulberry32(9000 + attempt * 13);
    let remaining = matchups.slice();
    const games = [];
    let ok = true;

    for (const week of weekOrder) {
      const byeSet = new Set(teamsOnByeByWeek[week] || []);
      const available = new Set();
      TEAMS.forEach(t => {
        const k = teamKey(t);
        if (!byeSet.has(k)) available.add(k);
      });

      const target = available.size / 2;
      const edges = remaining.filter(e =>
        available.has(teamKey(e.home)) && available.has(teamKey(e.away))
      );

      const matching = maxMatching(available, edges, rng, 120);
      if (matching.length < target) {
        ok = false;
        // still take what we got and continue — may recover on another attempt
      }

      const matchedIds = new Set(
        matching.map(e => teamKey(e.home) + "|" + teamKey(e.away))
      );
      matching.forEach(e => {
        games.push({
          week,
          home: e.home,
          away: e.away,
          played: false,
          homeScore: null,
          awayScore: null
        });
      });
      remaining = remaining.filter(
        e => !matchedIds.has(teamKey(e.home) + "|" + teamKey(e.away))
      );
    }

    if (games.length === matchups.length && remaining.length === 0) {
      bestGames = games;
      break;
    }
    if (!bestGames || games.length > bestGames.length) {
      bestGames = games;
    }
  }

  bestGames = bestGames || [];
  bestGames._byeWeeks = byeWeeks;
  bestGames._teamsOnByeByWeek = teamsOnByeByWeek;
  return bestGames;
}

function buildFullNFLSchedule() {
  const matchups = buildNFLMatchups();
  const games = assignMatchupsToWeeks(matchups);
  return {
    games: games.filter(g => g && g.week),
    byeWeeks: games._byeWeeks || {},
    teamsOnByeByWeek: games._teamsOnByeByWeek || {}
  };
}

window.ScheduleGenerator = {
  buildFullNFLSchedule,
  buildNFLMatchups,
  assignByeWeeks
};
