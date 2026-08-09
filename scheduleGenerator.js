// ============================================
// NFL-STYLE SCHEDULE GENERATOR
// ============================================
//
// 17 games per team, 18 weeks, 1 explicit bye each.
// Byes only in weeks 5–14:
//   3 weeks × 2 teams, 5 weeks × 4, 1 week × 6
// Expected games per week = (32 - byes) / 2
//   Weeks with 0 byes → 16 games
//   Weeks with 2 byes → 15 games
//   Weeks with 4 byes → 14 games
//   Weeks with 6 byes → 13 games
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
 *   Week  5: 2 | 6: 4 | 7: 4 | 8: 4 | 9: 6
 *   Week 10: 4 | 11: 4 | 12: 2 | 13: 2 | 14: 0
 */
function assignByeWeeks() {
  const byeWeeks = {};
  const teamsOnByeByWeek = {};

  const byeSlotsByWeek = {
    5: 2, 6: 4, 7: 4, 8: 4, 9: 6,
    10: 4, 11: 4, 12: 2, 13: 2
  };

  Object.keys(byeSlotsByWeek).forEach(w => {
    teamsOnByeByWeek[Number(w)] = [];
  });

  const ordered = TEAMS
    .slice()
    .sort((a, b) => teamName(a).localeCompare(teamName(b)));

  const weekQueue = [];
  Object.keys(byeSlotsByWeek)
    .map(Number)
    .sort((a, b) => a - b)
    .forEach(week => {
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
    const tmp = a[i]; a[i] = a[j]; a[j] = tmp;
  }
  return a;
}

/**
 * Pack one week: greedily take matchups where both teams are free
 * (not on bye, not already playing this week).
 * Returns { placed, leftover }
 */
function packWeek(week, remaining, byeWeeks, rng) {
  const used = new Set();
  const placed = [];
  const leftover = [];

  // Teams on bye this week cannot play
  TEAMS.forEach(t => {
    if (byeWeeks[teamKey(t)] === week) used.add(teamKey(t));
  });

  const ordered = shuffleCopy(remaining, rng);

  ordered.forEach(g => {
    const hk = teamKey(g.home);
    const ak = teamKey(g.away);
    if (!used.has(hk) && !used.has(ak)) {
      used.add(hk);
      used.add(ak);
      placed.push({
        week,
        home: g.home,
        away: g.away,
        played: false,
        homeScore: null,
        awayScore: null
      });
    } else {
      leftover.push(g);
    }
  });

  return { placed, leftover };
}

/**
 * Assign all matchups to weeks.
 * Strategy: for each attempt, walk weeks 1→18 packing each week full,
 * then extra passes for leftovers. Retry with different shuffles until
 * every matchup is placed (272 games).
 */
function assignMatchupsToWeeks(matchups) {
  const { byeWeeks, teamsOnByeByWeek } = assignByeWeeks();
  const TARGET = matchups.length; // 272

  let best = null;
  let bestCount = -1;

  for (let attempt = 0; attempt < 80; attempt++) {
    const rng = mulberry32(1000 + attempt * 97);
    let remaining = shuffleCopy(matchups, rng);
    const result = [];

    // Pass 1: pack each week once in order
    for (let week = 1; week <= 18; week++) {
      const { placed, leftover } = packWeek(week, remaining, byeWeeks, rng);
      result.push(...placed);
      remaining = leftover;
    }

    // Passes 2–6: revisit weeks for leftovers
    for (let pass = 0; pass < 6 && remaining.length > 0; pass++) {
      for (let week = 1; week <= 18; week++) {
        if (remaining.length === 0) break;

        // Who is already booked this week?
        const booked = new Set();
        TEAMS.forEach(t => {
          if (byeWeeks[teamKey(t)] === week) booked.add(teamKey(t));
        });
        result.forEach(g => {
          if (g.week === week) {
            booked.add(teamKey(g.home));
            booked.add(teamKey(g.away));
          }
        });

        const still = [];
        shuffleCopy(remaining, rng).forEach(g => {
          const hk = teamKey(g.home);
          const ak = teamKey(g.away);
          // Also skip if team already has 17 games scheduled
          const homeGames = result.filter(x => teamKey(x.home) === hk || teamKey(x.away) === hk).length;
          const awayGames = result.filter(x => teamKey(x.home) === ak || teamKey(x.away) === ak).length;
          if (!booked.has(hk) && !booked.has(ak) && homeGames < 17 && awayGames < 17) {
            booked.add(hk);
            booked.add(ak);
            result.push({
              week,
              home: g.home,
              away: g.away,
              played: false,
              homeScore: null,
              awayScore: null
            });
          } else {
            still.push(g);
          }
        });
        remaining = still;
      }
    }

    if (result.length > bestCount) {
      bestCount = result.length;
      best = result;
    }
    if (result.length === TARGET && remaining.length === 0) {
      best = result;
      break;
    }
  }

  const finalGames = best || [];
  finalGames._byeWeeks = byeWeeks;
  finalGames._teamsOnByeByWeek = teamsOnByeByWeek;
  return finalGames;
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
