// ============================================
// NFL-STYLE SCHEDULE GENERATOR
// ============================================
//
// 17 games / team, 18 weeks, 1 bye each.
// Byes weeks 5–14: 2,4,4,4,6,4,4,2,2,0
// Games/week = (32 - byes) / 2  →  16 when no byes
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
  function add(home, away) { matchups.push({ home, away }); }

  Object.values(div).forEach(teams => {
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        add(teams[i], teams[j]);
        add(teams[j], teams[i]);
      }
    }
  });

  const intraFull = [
    ["AFC-East", "AFC-North"], ["AFC-South", "AFC-West"],
    ["NFC-East", "NFC-North"], ["NFC-South", "NFC-West"]
  ];
  intraFull.forEach(([keyA, keyB]) => {
    const A = div[keyA], B = div[keyB];
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
      if ((i + j) % 2 === 0) add(A[i], B[j]); else add(B[j], A[i]);
    }
  });

  const residualPairs = [
    ["AFC-East", "AFC-South"], ["AFC-East", "AFC-West"],
    ["AFC-North", "AFC-South"], ["AFC-North", "AFC-West"],
    ["NFC-East", "NFC-South"], ["NFC-East", "NFC-West"],
    ["NFC-North", "NFC-South"], ["NFC-North", "NFC-West"]
  ];
  residualPairs.forEach(([keyA, keyB]) => {
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

  const crossover = [
    ["AFC-East", "NFC-West"], ["AFC-North", "NFC-South"],
    ["AFC-South", "NFC-North"], ["AFC-West", "NFC-East"]
  ];
  crossover.forEach(([keyA, keyB]) => {
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

function weekCapacity(week, teamsOnByeByWeek) {
  const byes = (teamsOnByeByWeek[week] || []).length;
  return (32 - byes) / 2;
}

/**
 * Place every matchup into a week both teams can play,
 * always preferring the most under-filled valid week.
 * Retries with different shuffles until all 272 land
 * and every week is at capacity (or best effort).
 */
function assignMatchupsToWeeks(matchups) {
  const { byeWeeks, teamsOnByeByWeek } = assignByeWeeks();
  const TARGET = matchups.length;

  const capacity = {};
  for (let w = 1; w <= 18; w++) capacity[w] = weekCapacity(w, teamsOnByeByWeek);

  let bestGames = null;
  let bestScore = -1; // placed count * 1000 - underfill penalty

  for (let attempt = 0; attempt < 200; attempt++) {
    const rng = mulberry32(2000 + attempt * 131);
    const order = shuffleCopy(matchups, rng);

    // teamKey -> Set of weeks already used (starts with bye blocked)
    const used = {};
    TEAMS.forEach(t => {
      const k = teamKey(t);
      used[k] = new Set([byeWeeks[k]]);
    });

    const weekCount = {};
    for (let w = 1; w <= 18; w++) weekCount[w] = 0;

    const games = [];
    let failed = false;

    for (let mi = 0; mi < order.length; mi++) {
      const g = order[mi];
      const hk = teamKey(g.home);
      const ak = teamKey(g.away);

      // Candidate weeks: both free, week under capacity
      const candidates = [];
      for (let w = 1; w <= 18; w++) {
        if (used[hk].has(w) || used[ak].has(w)) continue;
        if (weekCount[w] >= capacity[w]) continue;
        candidates.push(w);
      }

      if (candidates.length === 0) {
        failed = true;
        break;
      }

      // Prefer most under-filled week (largest remaining capacity gap)
      // Tie-break: random among best
      candidates.sort((a, b) => {
        const gapA = capacity[a] - weekCount[a];
        const gapB = capacity[b] - weekCount[b];
        if (gapB !== gapA) return gapB - gapA;
        return rng() - 0.5;
      });

      const week = candidates[0];
      used[hk].add(week);
      used[ak].add(week);
      weekCount[week]++;
      games.push({
        week,
        home: g.home,
        away: g.away,
        played: false,
        homeScore: null,
        awayScore: null
      });
    }

    // Score this attempt
    let underfill = 0;
    for (let w = 1; w <= 18; w++) {
      underfill += capacity[w] - weekCount[w];
    }
    const score = games.length * 1000 - underfill;

    if (score > bestScore) {
      bestScore = score;
      bestGames = games;
    }

    // Perfect: all games placed, zero underfill
    if (!failed && games.length === TARGET && underfill === 0) {
      bestGames = games;
      break;
    }
  }

  // If still short, try to force-place missing matchups into any legal week
  // (may slightly overfill a week rather than drop a game)
  if (bestGames && bestGames.length < TARGET) {
    const placedSet = new Set(bestGames.map(g => teamKey(g.home) + "|" + teamKey(g.away)));
    const used = {};
    TEAMS.forEach(t => {
      used[teamKey(t)] = new Set([byeWeeks[teamKey(t)]]);
    });
    bestGames.forEach(g => {
      used[teamKey(g.home)].add(g.week);
      used[teamKey(g.away)].add(g.week);
    });

    matchups.forEach(g => {
      const id = teamKey(g.home) + "|" + teamKey(g.away);
      if (placedSet.has(id)) return;
      for (let w = 1; w <= 18; w++) {
        if (!used[teamKey(g.home)].has(w) && !used[teamKey(g.away)].has(w)) {
          used[teamKey(g.home)].add(w);
          used[teamKey(g.away)].add(w);
          bestGames.push({
            week: w,
            home: g.home,
            away: g.away,
            played: false,
            homeScore: null,
            awayScore: null
          });
          placedSet.add(id);
          return;
        }
      }
    });
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
