// ============================================
// NFL-STYLE SCHEDULE GENERATOR
// ============================================
//
// 17 games per team, 18 weeks, 1 explicit bye each.
// Byes only in weeks 5–14 with this distribution:
//   3 weeks × 2 teams on bye
//   5 weeks × 4 teams on bye
//   1 week  × 6 teams on bye
//   (1 week in 5–14 has 0 byes)
// Total: 3*2 + 5*4 + 1*6 = 32
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

  // 1. Division (6): home + away vs other 3
  Object.values(div).forEach(teams => {
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        add(teams[i], teams[j]);
        add(teams[j], teams[i]);
      }
    }
  });

  // 2. Intra-conference full division (4)
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

  // 3. Intra-conference residual (2)
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

  // 4. Interconference full division (4)
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

  // 5. 17th game – interconference crossover (1)
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

/**
 * Bye distribution (weeks 5–14 only):
 *   Week  5: 2 teams
 *   Week  6: 4 teams
 *   Week  7: 4 teams
 *   Week  8: 4 teams
 *   Week  9: 6 teams
 *   Week 10: 4 teams
 *   Week 11: 4 teams
 *   Week 12: 2 teams
 *   Week 13: 2 teams
 *   Week 14: 0 teams
 *
 * 3 weeks × 2 + 5 weeks × 4 + 1 week × 6 = 32 byes
 */
function assignByeWeeks() {
  const byeWeeks = {};
  const teamsOnByeByWeek = {};

  const byeSlotsByWeek = {
    5: 2,
    6: 4,
    7: 4,
    8: 4,
    9: 6,
    10: 4,
    11: 4,
    12: 2,
    13: 2
    // week 14: 0 byes
  };

  Object.keys(byeSlotsByWeek).forEach(w => {
    teamsOnByeByWeek[Number(w)] = [];
  });

  const ordered = TEAMS
    .slice()
    .sort((a, b) => teamName(a).localeCompare(teamName(b)));

  // Build flat list of week slots: [5,5, 6,6,6,6, ...]
  const weekQueue = [];
  Object.keys(byeSlotsByWeek)
    .map(Number)
    .sort((a, b) => a - b)
    .forEach(week => {
      const count = byeSlotsByWeek[week];
      for (let i = 0; i < count; i++) weekQueue.push(week);
    });

  // 32 slots for 32 teams
  ordered.forEach((team, index) => {
    const week = weekQueue[index];
    const key = teamKey(team);
    byeWeeks[key] = week;
    teamsOnByeByWeek[week].push(key);
  });

  return { byeWeeks, teamsOnByeByWeek };
}

function assignMatchupsToWeeks(matchups) {
  const { byeWeeks, teamsOnByeByWeek } = assignByeWeeks();

  const rng = mulberry32(42);
  const pool = matchups
    .map(m => ({ m, order: rng() }))
    .sort((a, b) => a.order - b.order)
    .map(x => x.m);

  const teamWeeks = {};
  TEAMS.forEach(t => {
    const key = teamKey(t);
    teamWeeks[key] = new Set();
    teamWeeks[key].add(byeWeeks[key]);
  });

  const result = [];
  const remaining = pool.slice();

  function canPlay(teamK, week) {
    if (teamWeeks[teamK].has(week)) return false;
    // size includes 1 bye → max 18 means 17 games + bye
    if (teamWeeks[teamK].size >= 18) return false;
    return true;
  }

  for (let pass = 0; pass < 40 && remaining.length > 0; pass++) {
    for (let week = 1; week <= 18; week++) {
      for (let i = remaining.length - 1; i >= 0; i--) {
        const g = remaining[i];
        const hk = teamKey(g.home);
        const ak = teamKey(g.away);

        if (!canPlay(hk, week) || !canPlay(ak, week)) continue;

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

  remaining.forEach(g => {
    const hk = teamKey(g.home);
    const ak = teamKey(g.away);
    for (let week = 1; week <= 18; week++) {
      if (canPlay(hk, week) && canPlay(ak, week)) {
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

  result._byeWeeks = byeWeeks;
  result._teamsOnByeByWeek = teamsOnByeByWeek;
  return result;
}

function buildFullNFLSchedule() {
  const matchups = buildNFLMatchups();
  const games = assignMatchupsToWeeks(matchups);
  const byeWeeks = games._byeWeeks || {};
  const teamsOnByeByWeek = games._teamsOnByeByWeek || {};
  const cleanGames = games.filter(g => g && g.week);

  return {
    games: cleanGames,
    byeWeeks,
    teamsOnByeByWeek
  };
}

window.ScheduleGenerator = {
  buildFullNFLSchedule,
  buildNFLMatchups,
  assignByeWeeks
};
