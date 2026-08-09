// ============================================
// NFL-STYLE SCHEDULE GENERATOR
// ============================================
//
// Structure (17 games per team, 18 weeks, 1 bye):
//   6  – division (home + away vs other 3)
//   4  – one intra-conference division (all 4 teams)
//   2  – remaining intra-conference (1 from each other division)
//   4  – one interconference division (all 4 teams)
//   1  – 17th game (interconference crossover)
//
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

  function add(home, away) {
    matchups.push({ home, away });
  }

  // ---- 1. Division games (6 per team): H+A vs other 3 ----
  Object.values(div).forEach(teams => {
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        add(teams[i], teams[j]);
        add(teams[j], teams[i]);
      }
    }
  });

  // ---- 2. Intra-conference full division (4 per team) ----
  // Pair divisions within each conference
  const intraFull = [
    ["AFC-East", "AFC-North"],
    ["AFC-South", "AFC-West"],
    ["NFC-East", "NFC-North"],
    ["NFC-South", "NFC-West"]
  ];
  intraFull.forEach(([keyA, keyB]) => {
    const A = div[keyA];
    const B = div[keyB];
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if ((i + j) % 2 === 0) add(A[i], B[j]);
        else add(B[j], A[i]);
      }
    }
  });

  // ---- 3. Intra-conference residual (2 per team) ----
  // Each team plays one club (same index) from each of the other two divisions
  const residualPairs = [
    ["AFC-East", "AFC-South"],
    ["AFC-East", "AFC-West"],
    ["AFC-North", "AFC-South"],
    ["AFC-North", "AFC-West"],
    ["NFC-East", "NFC-South"],
    ["NFC-East", "NFC-West"],
    ["NFC-North", "NFC-South"],
    ["NFC-North", "NFC-West"]
  ];
  residualPairs.forEach(([keyA, keyB]) => {
    const A = div[keyA];
    const B = div[keyB];
    for (let i = 0; i < 4; i++) {
      if (i % 2 === 0) add(A[i], B[i]);
      else add(B[i], A[i]);
    }
  });

  // ---- 4. Interconference full division (4 per team) ----
  ["East", "North", "South", "West"].forEach(d => {
    const A = div[`AFC-${d}`];
    const B = div[`NFC-${d}`];
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if ((i + j) % 2 === 0) add(A[i], B[j]);
        else add(B[j], A[i]);
      }
    }
  });

  // ---- 5. 17th game – interconference crossover (1 per team) ----
  const crossover = [
    ["AFC-East", "NFC-West"],
    ["AFC-North", "NFC-South"],
    ["AFC-South", "NFC-North"],
    ["AFC-West", "NFC-East"]
  ];
  crossover.forEach(([keyA, keyB]) => {
    const A = div[keyA];
    const B = div[keyB];
    for (let i = 0; i < 4; i++) {
      if (i % 2 === 0) add(A[i], B[i]);
      else add(B[i], A[i]);
    }
  });

  return matchups;
}

function assignMatchupsToWeeks(matchups) {
  const rng = mulberry32(42);
  // Shuffle so the schedule is not rigid
  const pool = matchups
    .map(m => ({ m, order: rng() }))
    .sort((a, b) => a.order - b.order)
    .map(x => x.m);

  const teamWeeks = {};
  TEAMS.forEach(t => { teamWeeks[teamKey(t)] = new Set(); });

  const result = [];
  const remaining = pool.slice();

  // Greedy multi-pass: fill weeks 1–18 without double-booking a team
  for (let pass = 0; pass < 30 && remaining.length > 0; pass++) {
    for (let week = 1; week <= 18; week++) {
      for (let i = remaining.length - 1; i >= 0; i--) {
        const g = remaining[i];
        const hk = teamKey(g.home);
        const ak = teamKey(g.away);
        if (teamWeeks[hk].has(week) || teamWeeks[ak].has(week)) continue;
        // Each team plays at most 17 games
        if (teamWeeks[hk].size >= 17 || teamWeeks[ak].size >= 17) continue;

        teamWeeks[hk].add(week);
        teamWeeks[ak].add(week);
        result.push({
          week,
          home: g.home,
          away: g.away,
          played: false,
          homeScore: null,
          awayScore: null
        });
        remaining.splice(i, 1);
      }
    }
  }

  // Safety: if anything left, place into any free week for both teams
  remaining.forEach(g => {
    const hk = teamKey(g.home);
    const ak = teamKey(g.away);
    for (let week = 1; week <= 18; week++) {
      if (!teamWeeks[hk].has(week) && !teamWeeks[ak].has(week)) {
        teamWeeks[hk].add(week);
        teamWeeks[ak].add(week);
        result.push({
          week,
          home: g.home,
          away: g.away,
          played: false,
          homeScore: null,
          awayScore: null
        });
        return;
      }
    }
  });

  return result;
}

function buildFullNFLSchedule() {
  const matchups = buildNFLMatchups();
  return assignMatchupsToWeeks(matchups);
}

// Expose for renderer.js
window.ScheduleGenerator = {
  buildFullNFLSchedule,
  buildNFLMatchups
};
