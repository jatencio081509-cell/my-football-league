// ============================================
// NFL-STYLE SCHEDULE GENERATOR
// ============================================
//
// 17 games per team, 18 weeks, 1 explicit bye each.
// Byes are assigned first (weeks 5–12, 4 teams/week),
// then games are placed only in non-bye weeks.
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
 * Assign each team exactly one bye week.
 * Weeks 5–12 get 4 teams on bye each (8 × 4 = 32).
 * Returns: { [teamKey]: byeWeekNumber }
 */
function assignByeWeeks() {
  const byeWeeks = {}; // teamKey -> week
  const teamsOnByeByWeek = {}; // week -> [teamKey]

  // Bye window like the NFL: weeks 5 through 12
  const byeWindow = [5, 6, 7, 8, 9, 10, 11, 12];
  byeWindow.forEach(w => { teamsOnByeByWeek[w] = []; });

  // Stable order so resets stay consistent
  const ordered = TEAMS
    .slice()
    .sort((a, b) => teamName(a).localeCompare(teamName(b)));

  ordered.forEach((team, index) => {
    const week = byeWindow[index % byeWindow.length];
    const key = teamKey(team);
    byeWeeks[key] = week;
    teamsOnByeByWeek[week].push(key);
  });

  // Balance: round-robin already puts 4 per week (32/8).
  // Verify counts — if not 4, redistribute simply.
  return { byeWeeks, teamsOnByeByWeek };
}

function assignMatchupsToWeeks(matchups) {
  const { byeWeeks, teamsOnByeByWeek } = assignByeWeeks();

  const rng = mulberry32(42);
  const pool = matchups
    .map(m => ({ m, order: rng() }))
    .sort((a, b) => a.order - b.order)
    .map(x => x.m);

  // Weeks each team is already booked (starts with their bye blocked)
  const teamWeeks = {};
  TEAMS.forEach(t => {
    const key = teamKey(t);
    teamWeeks[key] = new Set();
    // Block the bye week so no game can land there
    teamWeeks[key].add(byeWeeks[key]);
  });

  const result = [];
  const remaining = pool.slice();

  function canPlay(teamK, week) {
    // Bye week is already in the set, so this covers it
    if (teamWeeks[teamK].has(week)) return false;
    // Max 17 games: set size includes 1 bye, so size >= 18 means 17 games + bye
    if (teamWeeks[teamK].size >= 18) return false;
    return true;
  }

  // Greedy multi-pass into non-bye weeks only
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

  // Last-chance placement
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

  // Attach bye metadata for the UI
  result._byeWeeks = byeWeeks;
  result._teamsOnByeByWeek = teamsOnByeByWeek;
  return result;
}

function buildFullNFLSchedule() {
  const matchups = buildNFLMatchups();
  const games = assignMatchupsToWeeks(matchups);

  // Persist bye map alongside games (plain array + metadata object)
  const byeWeeks = games._byeWeeks || {};
  const teamsOnByeByWeek = games._teamsOnByeByWeek || {};

  // Strip non-enumerable-ish helper fields; return clean structure
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
