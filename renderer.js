// ============================================
// TEAM DATA
// ============================================
const TEAMS = [
  { city: "Boston", name: "Oceans", state: "MA", conference: "AFC", division: "East" },
  { city: "Denver", name: "Mountaineers", state: "CO", conference: "AFC", division: "West" },
  { city: "Louisville", name: "Chickens", state: "KY", conference: "NFC", division: "East" },
  { city: "Honolulu", name: "Stars", state: "HI", conference: "NFC", division: "South" },
  { city: "Austin", name: "Bullriders", state: "TX", conference: "AFC", division: "South" },
  { city: "New York", name: "Emperors", state: "NY", conference: "NFC", division: "East" },
  { city: "Buffalo", name: "Beavers", state: "NY", conference: "AFC", division: "East" },
  { city: "Portland", name: "Wildcats", state: "OR", conference: "NFC", division: "North" },
  { city: "Oklahoma City", name: "Brawlers", state: "OK", conference: "NFC", division: "South" },
  { city: "Detroit", name: "Wolverines", state: "MI", conference: "NFC", division: "North" },
  { city: "Minneapolis", name: "Lakers", state: "MN", conference: "AFC", division: "North" },
  { city: "Washington", name: "Presidents", state: "DC", conference: "NFC", division: "East" },
  { city: "Huntsville", name: "Rockets", state: "AL", conference: "AFC", division: "South" },
  { city: "Anchorage", name: "Snowcaps", state: "AK", conference: "AFC", division: "North" },
  { city: "New Orleans", name: "Pelicans", state: "LA", conference: "NFC", division: "South" },
  { city: "Salt Lake City", name: "Bees", state: "UT", conference: "NFC", division: "West" },
  { city: "Burlington", name: "Foresters", state: "VT", conference: "AFC", division: "East" },
  { city: "Sacramento", name: "Goldnuggets", state: "CA", conference: "AFC", division: "South" },
  { city: "Los Angeles", name: "Rangers", state: "CA", conference: "NFC", division: "West" },
  { city: "Miami", name: "Billionaires", state: "FL", conference: "AFC", division: "West" },
  { city: "Houston", name: "Flyers", state: "TX", conference: "NFC", division: "South" },
  { city: "Billings", name: "Pirates", state: "MT", conference: "NFC", division: "North" },
  { city: "Lincoln", name: "Cornhusks", state: "NE", conference: "AFC", division: "West" },
  { city: "Madison", name: "Badgers", state: "WI", conference: "NFC", division: "North" },
  { city: "Cheyenne", name: "Towers", state: "WY", conference: "NFC", division: "West" },
  { city: "Las Vegas", name: "Bluejays", state: "NV", conference: "AFC", division: "West" },
  { city: "Manchester", name: "Finches", state: "NH", conference: "AFC", division: "North" },
  { city: "Jackson", name: "Magnolias", state: "MS", conference: "AFC", division: "South" },
  { city: "Kansas City", name: "Borders", state: "MO", conference: "NFC", division: "West" },
  { city: "Indianapolis", name: "Racers", state: "IN", conference: "NFC", division: "East" },
  { city: "Seattle", name: "Tree Bearers", state: "WA", conference: "AFC", division: "North" },
  { city: "Charleston", name: "Cardinals", state: "WV", conference: "AFC", division: "East" },
];
function teamName(team) { return `${team.city} ${team.name}`; }
function teamKey(team) { return `${team.city}-${team.name}`; }
function mulberry32(a) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const FIRST_NAMES = ["James","John","Robert","Michael","David","William","Richard","Joseph","Thomas","Christopher","Charles","Daniel","Matthew","Anthony","Mark","Donald","Steven","Paul","Andrew","Joshua","Kenneth","Kevin","Brian","George","Timothy","Ronald","Edward","Jason","Jeffrey","Ryan","Jacob","Gary","Nicholas","Eric","Jonathan","Stephen","Larry","Justin","Scott","Brandon","Benjamin","Samuel","Raymond","Gregory","Frank","Alexander","Patrick","Jack","Dennis","Jerry","Tyler","Aaron","Jose","Adam","Nathan","Henry","Douglas","Zachary","Peter","Kyle","Noah","Ethan","Jeremy","Walter","Christian","Keith","Roger","Terry","Austin","Sean","Gerald","Carl","Harold","Dylan","Jesse","Bryan","Billy","Jordan","Albert","Bruce","Gabriel","Logan","Alan","Juan","Wayne","Ralph","Roy","Eugene","Randy","Vincent","Russell","Louis","Philip","Bobby","Johnny","Bradley"];
const LAST_NAMES = ["Smith","Johnson","Williams","Brown","Jones","Garcia","Miller","Davis","Rodriguez","Martinez","Hernandez","Lopez","Gonzalez","Wilson","Anderson","Thomas","Taylor","Moore","Jackson","Martin","Lee","Perez","Thompson","White","Harris","Sanchez","Clark","Ramirez","Lewis","Robinson","Walker","Young","Allen","King","Wright","Scott","Torres","Nguyen","Hill","Flores","Green","Adams","Nelson","Baker","Hall","Rivera","Campbell","Mitchell","Carter","Roberts","Gomez","Phillips","Evans","Turner","Diaz","Parker","Cruz","Edwards","Collins","Reyes","Stewart","Morris","Morales","Murphy","Cook","Rogers","Gutierrez","Ortiz","Morgan","Cooper","Peterson","Bailey","Reed","Kelly","Howard","Ramos","Kim","Cox","Ward","Richardson","Watson","Brooks","Chavez","Wood","James","Bennett","Gray","Mendoza","Ruiz","Hughes","Price","Alvarez","Castillo","Sanders","Patel","Myers","Long","Ross","Foster","Jimenez"];
const POSITIONS = [
  { pos: "QB", count: 3, hMin: 72, hMax: 77, wMin: 200, wMax: 240 },
  { pos: "RB", count: 4, hMin: 68, hMax: 73, wMin: 195, wMax: 230 },
  { pos: "WR", count: 6, hMin: 69, hMax: 76, wMin: 175, wMax: 220 },
  { pos: "TE", count: 3, hMin: 74, hMax: 78, wMin: 240, wMax: 270 },
  { pos: "OL", count: 9, hMin: 74, hMax: 79, wMin: 290, wMax: 340 },
  { pos: "DL", count: 7, hMin: 73, hMax: 78, wMin: 270, wMax: 330 },
  { pos: "LB", count: 7, hMin: 71, hMax: 76, wMin: 225, wMax: 260 },
  { pos: "CB", count: 5, hMin: 69, hMax: 74, wMin: 175, wMax: 205 },
  { pos: "S", count: 4, hMin: 70, hMax: 75, wMin: 190, wMax: 220 },
  { pos: "K", count: 1, hMin: 70, hMax: 75, wMin: 180, wMax: 220 },
  { pos: "P", count: 1, hMin: 71, hMax: 76, wMin: 190, wMax: 230 },
];
function inchesToHeight(inches) {
  return `${Math.floor(inches / 12)}'${inches % 12}`;
}
function generateRosters() {
  const allRosters = {};
  TEAMS.forEach((team, teamIndex) => {
    const rng = mulberry32(1000 + teamIndex * 97);
    const players = [];
    POSITIONS.forEach(slot => {
      for (let i = 0; i < slot.count; i++) {
        const first = FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)];
        const last = LAST_NAMES[Math.floor(rng() * LAST_NAMES.length)];
        const age = 21 + Math.floor(rng() * 14);
        const heightIn = slot.hMin + Math.floor(rng() * (slot.hMax - slot.hMin + 1));
        const weight = slot.wMin + Math.floor(rng() * (slot.wMax - slot.wMin + 1));
        let rating = 55 + Math.floor(rng() * 35);
        if (rng() > 0.85) rating = 80 + Math.floor(rng() * 15);
        if (rng() > 0.95) rating = 92 + Math.floor(rng() * 7);
        players.push({ name: `${first} ${last}`, position: slot.pos, age, height: inchesToHeight(heightIn), weight, rating });
      }
    });
    players.sort((a, b) => b.rating - a.rating);
    allRosters[teamKey(team)] = players;
  });
  return allRosters;
}
const ROSTERS = generateRosters();
function getTeamOverall(team) {
  const players = ROSTERS[teamKey(team)] || [];
  if (!players.length) return 0;
  return Math.round(players.reduce((s, p) => s + p.rating, 0) / players.length);
}
function createEmptyStandings() {
  const s = {};
  TEAMS.forEach(team => { s[teamKey(team)] = { team, wins: 0, losses: 0, ties: 0, pf: 0, pa: 0 }; });
  return s;
}
function loadStandings() {
  const saved = localStorage.getItem("mfl-standings");
  if (saved) { try { return JSON.parse(saved); } catch (e) { return createEmptyStandings(); } }
  return createEmptyStandings();
}
function saveStandings(s) { localStorage.setItem("mfl-standings", JSON.stringify(s)); }
let standings = loadStandings();

// ---- Schedule + byes ----
let schedule = [];
let byeWeeks = {};
let teamsOnByeByWeek = {};
let currentWeek = 1;

function saveSchedule() {
  localStorage.setItem("mfl-schedule", JSON.stringify({
    games: schedule,
    byeWeeks,
    teamsOnByeByWeek
  }));
}
function loadScheduleData() {
  const saved = localStorage.getItem("mfl-schedule");
  if (!saved) return { games: [], byeWeeks: {}, teamsOnByeByWeek: {} };
  try {
    const data = JSON.parse(saved);
    if (Array.isArray(data)) return { games: data, byeWeeks: {}, teamsOnByeByWeek: {} };
    return {
      games: data.games || [],
      byeWeeks: data.byeWeeks || {},
      teamsOnByeByWeek: data.teamsOnByeByWeek || {}
    };
  } catch (e) {
    return { games: [], byeWeeks: {}, teamsOnByeByWeek: {} };
  }
}
(function initSchedule() {
  const data = loadScheduleData();
  schedule = data.games;
  byeWeeks = data.byeWeeks;
  teamsOnByeByWeek = data.teamsOnByeByWeek;
})();

function generateSchedule(force = false) {
  if (schedule.length > 0 && !force) return;
  if (window.ScheduleGenerator && window.ScheduleGenerator.buildFullNFLSchedule) {
    const result = window.ScheduleGenerator.buildFullNFLSchedule();
    schedule = result.games || [];
    byeWeeks = result.byeWeeks || {};
    teamsOnByeByWeek = result.teamsOnByeByWeek || {};
  } else {
    schedule = [];
    byeWeeks = {};
    teamsOnByeByWeek = {};
  }
  saveSchedule();
}
function resetSchedule() {
  if (!confirm("Reset the entire schedule? This clears all scheduled games and results.")) return;
  schedule = [];
  byeWeeks = {};
  teamsOnByeByWeek = {};
  currentWeek = 1;
  localStorage.setItem("mfl-current-week", "1");
  generateSchedule(true);
  renderSchedule();
  renderWeeklyGames();
}

function recordGameResult(homeTeam, awayTeam, homeScore, awayScore) {
  const homeKey = teamKey(homeTeam);
  const awayKey = teamKey(awayTeam);
  if (!standings[homeKey]) standings[homeKey] = { team: homeTeam, wins: 0, losses: 0, ties: 0, pf: 0, pa: 0 };
  if (!standings[awayKey]) standings[awayKey] = { team: awayTeam, wins: 0, losses: 0, ties: 0, pf: 0, pa: 0 };
  standings[homeKey].pf += homeScore; standings[homeKey].pa += awayScore;
  standings[awayKey].pf += awayScore; standings[awayKey].pa += homeScore;
  if (homeScore > awayScore) { standings[homeKey].wins++; standings[awayKey].losses++; }
  else if (awayScore > homeScore) { standings[awayKey].wins++; standings[homeKey].losses++; }
  else { standings[homeKey].ties++; standings[awayKey].ties++; }
  saveStandings(standings);
}
function getSortedStandings() {
  return Object.values(standings).sort((a, b) => {
    const gamesA = a.wins + a.losses + a.ties;
    const gamesB = b.wins + b.losses + b.ties;
    if (gamesA === 0 && gamesB === 0) {
      const oA = getTeamOverall(a.team), oB = getTeamOverall(b.team);
      if (oB !== oA) return oB - oA;
      return teamName(a.team).localeCompare(teamName(b.team));
    }
    if (gamesA === 0 && gamesB > 0) return 1;
    if (gamesB === 0 && gamesA > 0) return -1;
    const pctA = a.wins / gamesA, pctB = b.wins / gamesB;
    if (pctB !== pctA) return pctB - pctA;
    const diffA = a.pf - a.pa, diffB = b.pf - b.pa;
    if (diffB !== diffA) return diffB - diffA;
    if (b.pf !== a.pf) return b.pf - a.pf;
    return teamName(a.team).localeCompare(teamName(b.team));
  });
}

function teamNameFromKey(key) {
  const t = TEAMS.find(tm => teamKey(tm) === key);
  return t ? teamName(t) : key;
}

function renderWeeklyGames() {
  const container = $("weekly-games");
  if (!container) return;
  container.innerHTML = "";
  $("current-week-label").textContent = currentWeek;

  const weekGames = schedule.filter(g => g.week === currentWeek);
  const byeKeys = teamsOnByeByWeek[String(currentWeek)] || teamsOnByeByWeek[currentWeek] || [];

  if (weekGames.length === 0 && byeKeys.length === 0) {
    container.innerHTML = `<div class="empty-note">No games scheduled for Week ${currentWeek}.</div>`;
    return;
  }

  weekGames.forEach(scheduledGame => {
    const card = document.createElement("div");
    card.className = "week-game-card";
    const awayName = teamName(scheduledGame.away);
    const homeName = teamName(scheduledGame.home);
    if (scheduledGame.played) {
      card.innerHTML = `<div class="game-teams"><strong>${awayName}</strong><span class="game-score">${scheduledGame.awayScore}</span></div><div class="game-final">FINAL</div><div class="game-teams"><strong>${homeName}</strong><span class="game-score">${scheduledGame.homeScore}</span></div>`;
    } else {
      card.innerHTML = `<div class="game-teams"><strong>${awayName}</strong></div><div class="game-vs">@</div><div class="game-teams"><strong>${homeName}</strong></div><button class="btn primary play-scheduled-game">Play Game</button>`;
      card.querySelector(".play-scheduled-game").addEventListener("click", () => {
        window.currentScheduledGame = scheduledGame;
        game = createNewGame(scheduledGame.home, scheduledGame.away, scheduledGame);
        updateUI();
        showScreen("game-screen");
      });
    }
    container.appendChild(card);
  });

  if (byeKeys.length > 0) {
    const byeBox = document.createElement("div");
    byeBox.className = "week-game-card";
    byeBox.style.borderColor = "#475569";
    byeBox.innerHTML = `<div style="color:#94a3b8;font-weight:600;margin-bottom:6px">BYE WEEK</div>
      <div style="color:#e2e8f0">${byeKeys.map(teamNameFromKey).join(" · ")}</div>`;
    container.appendChild(byeBox);
  }
}

function renderSchedule() {
  const container = $("schedule-container");
  if (!container) return;
  container.innerHTML = "";
  const weeks = {};
  schedule.forEach(g => {
    if (!weeks[g.week]) weeks[g.week] = [];
    weeks[g.week].push(g);
  });
  for (let week = 1; week <= 18; week++) {
    const weekBox = document.createElement("div");
    weekBox.className = "schedule-week";
    const games = weeks[week] || [];
    const byeKeys = teamsOnByeByWeek[String(week)] || teamsOnByeByWeek[week] || [];
    weekBox.innerHTML = `<div class="schedule-week-header">WEEK ${week} <span style="color:#64748b;font-weight:400;font-size:0.85rem">(${games.length} games${byeKeys.length ? `, ${byeKeys.length} on bye` : ""})</span></div>`;
    games.forEach(g => {
      const gameCard = document.createElement("div");
      gameCard.className = "schedule-game";
      const result = g.played ? ` ${g.awayScore}-${g.homeScore}` : "";
      gameCard.innerHTML = `<div class="schedule-team away-team"><span>${teamName(g.away)}</span></div><div class="schedule-at">@</div><div class="schedule-team home-team"><span>${teamName(g.home)}</span></div>${result ? `<div class="game-final" style="margin-left:8px">${result}</div>` : ""}`;
      weekBox.appendChild(gameCard);
    });
    if (byeKeys.length) {
      const byeLine = document.createElement("div");
      byeLine.className = "schedule-game";
      byeLine.style.opacity = "0.85";
      byeLine.innerHTML = `<div style="color:#94a3b8"><strong>BYE:</strong> ${byeKeys.map(teamNameFromKey).join(", ")}</div>`;
      weekBox.appendChild(byeLine);
    }
    container.appendChild(weekBox);
  }
}

function renderStandings() {
  const container = $("standings-container");
  if (!container) return;
  container.innerHTML = "";
  const view = $("standings-view-select") ? $("standings-view-select").value : "league";
  const sorted = getSortedStandings();
  function makeRow(row, cols) {
    const tr = document.createElement("tr");
    tr.className = "standings-team-row";
    tr.innerHTML = cols;
    tr.addEventListener("click", () => openTeamPage(TEAMS.findIndex(t => teamKey(t) === teamKey(row.team))));
    return tr;
  }
  if (view === "league") {
    const box = document.createElement("div");
    box.className = "standings-section";
    box.innerHTML = `<div class="standings-section-header"><h3>League</h3></div><div class="standings-table-wrapper"><table class="standings-table"><thead><tr><th>Rank</th><th>Team</th><th>Conference</th><th>Division</th><th>W</th><th>L</th><th>T</th><th>OVR</th></tr></thead><tbody></tbody></table></div>`;
    const tbody = box.querySelector("tbody");
    sorted.forEach((row, i) => tbody.appendChild(makeRow(row, `<td>${i+1}</td><td class="team-name-cell">${teamName(row.team)}</td><td>${row.team.conference}</td><td>${row.team.division}</td><td>${row.wins}</td><td>${row.losses}</td><td>${row.ties}</td><td class="team-overall-cell">${getTeamOverall(row.team)}</td>`)));
    container.appendChild(box);
    return;
  }
  if (view === "conference") {
    ["AFC", "NFC"].forEach(conf => {
      const box = document.createElement("div");
      box.className = "conference-box";
      box.innerHTML = `<div class="standings-section-header"><h3>${conf}</h3></div><div class="standings-table-wrapper"><table class="standings-table"><thead><tr><th>Rank</th><th>Team</th><th>Division</th><th>W</th><th>L</th><th>T</th><th>OVR</th></tr></thead><tbody></tbody></table></div>`;
      const tbody = box.querySelector("tbody");
      sorted.filter(r => r.team.conference === conf).forEach((row, i) => tbody.appendChild(makeRow(row, `<td>${i+1}</td><td class="team-name-cell">${teamName(row.team)}</td><td>${row.team.division}</td><td>${row.wins}</td><td>${row.losses}</td><td>${row.ties}</td><td class="team-overall-cell">${getTeamOverall(row.team)}</td>`)));
      container.appendChild(box);
    });
    return;
  }
  if (view === "division") {
    ["AFC", "NFC"].forEach(conf => {
      const h = document.createElement("div");
      h.className = "conference-heading";
      h.innerHTML = `<h2>${conf}</h2>`;
      container.appendChild(h);
      ["East", "North", "South", "West"].forEach(div => {
        const box = document.createElement("div");
        box.className = "division-box";
        box.innerHTML = `<div class="standings-section-header"><h3>${conf} ${div}</h3></div><div class="standings-table-wrapper"><table class="standings-table"><thead><tr><th>Rank</th><th>Team</th><th>W</th><th>L</th><th>T</th><th>OVR</th></tr></thead><tbody></tbody></table></div>`;
        const tbody = box.querySelector("tbody");
        sorted.filter(r => r.team.conference === conf && r.team.division === div).forEach((row, i) => tbody.appendChild(makeRow(row, `<td>${i+1}</td><td class="team-name-cell">${teamName(row.team)}</td><td>${row.wins}</td><td>${row.losses}</td><td>${row.ties}</td><td class="team-overall-cell">${getTeamOverall(row.team)}</td>`)));
        container.appendChild(box);
      });
    });
  }
}

const AWARD_DEFINITIONS = [
  { id: "mvp", title: "League MVP", positions: ["QB", "RB", "WR", "TE"] },
  { id: "offensive_poy", title: "Offensive Player of the Year", positions: ["QB", "RB", "WR", "TE", "OL"] },
  { id: "defensive_poy", title: "Defensive Player of the Year", positions: ["DL", "LB", "CB", "S"] },
  { id: "rookie", title: "Rookie of the Year", positions: ["QB", "RB", "WR", "TE", "DL", "LB", "CB", "S"] },
  { id: "coach", title: "Coach of the Year", isTeamAward: true },
  { id: "comeback", title: "Comeback Player of the Year", positions: ["QB", "RB", "WR", "TE"] },
  { id: "most_improved", title: "Most Improved Player", positions: ["QB", "RB", "WR", "TE", "DL", "LB", "CB", "S"] },
  { id: "best_qb", title: "Best Quarterback", positions: ["QB"] },
  { id: "best_rb", title: "Best Running Back", positions: ["RB"] },
  { id: "best_wr", title: "Best Wide Receiver", positions: ["WR"] },
  { id: "best_defense", title: "Best Defense", isTeamAward: true },
];
function createEmptyAwards() {
  const a = {};
  AWARD_DEFINITIONS.forEach(d => { a[d.id] = { player: "", teamKey: "" }; });
  return a;
}
function loadAwards() {
  const saved = localStorage.getItem("mfl-awards");
  if (saved) { try { return JSON.parse(saved); } catch (e) { return createEmptyAwards(); } }
  return createEmptyAwards();
}
function saveAwards(a) { localStorage.setItem("mfl-awards", JSON.stringify(a)); }
let awards = loadAwards();
function getTopCandidatesForAward(awardDef) {
  if (awardDef.isTeamAward) {
    // For team awards, return top teams by record with enhanced metrics
    const standings = typeof loadStandings === "function" ? loadStandings() : {};
    const teamRecords = TEAMS.map(team => {
      const s = standings[teamKey(team)] || { wins: 0, losses: 0, ties: 0, pf: 0, pa: 0 };
      const games = (s.wins || 0) + (s.losses || 0) + (s.ties || 0);
      const pct = games ? (s.wins + 0.5 * (s.ties || 0)) / games : 0;
      const pointDiff = (s.pf || 0) - (s.pa || 0);
      // Enhanced team scoring: win pct + point differential bonus
      const score = (pct * 100) + (pointDiff / 10);
      return { team, winPct: pct, wins: s.wins || 0, pointDiff, score };
    }).sort((a, b) => b.score - a.score || b.winPct - a.winPct || b.wins - a.wins);

    return teamRecords.slice(0, 5).map((t, i) => ({
      rank: i + 1,
      name: teamName(t.team),
      teamKey: teamKey(t.team),
      value: t.score.toFixed(1)
    }));
  }

  // For player awards, get top players by position and stats
  const candidates = [];
  const positions = awardDef.positions || [];
  const standings = typeof loadStandings === "function" ? loadStandings() : {};

  TEAMS.forEach(team => {
    const key = teamKey(team);
    const roster = ROSTERS[key] || [];
    const teamStats = standings[key] || { wins: 0, losses: 0, ties: 0, pf: 0, pa: 0 };
    const games = (teamStats.wins || 0) + (teamStats.losses || 0) + (teamStats.ties || 0);
    const teamWinPct = games ? (teamStats.wins + 0.5 * (teamStats.ties || 0)) / games : 0;
    const teamPointDiff = (teamStats.pf || 0) - (teamStats.pa || 0);

    roster.forEach(player => {
      if (!positions.includes(player.position)) return;

      // Get player stats for the season
      const stats = window.PlayerSystem ? window.PlayerSystem.getStat(team, player) : {};
      let score = player.rating || 70;

      // Calculate derived stats
      const passAttempts = stats.passAttempts || 0;
      const passCompletions = stats.passCompletions || 0;
      const compPct = passAttempts > 0 ? (passCompletions / passAttempts) * 100 : 0;
      const ydsPerAttempt = passAttempts > 0 ? (stats.passYds || 0) / passAttempts : 0;
      const passRating = passAttempts > 0 ? ((compPct * 0.5) + (ydsPerAttempt * 4) + ((stats.passTd || 0) * 20) - ((stats.interceptions || 0) * 25)) : 0;
      
      const receptions = stats.receptions || 0;
      const ydsPerRec = receptions > 0 ? (stats.recYds || 0) / receptions : 0;
      const recYdsPerGame = games > 0 ? (stats.recYds || 0) / games : 0;
      
      const rushYds = stats.rushYds || 0;
      const rushYdsPerGame = games > 0 ? rushYds / games : 0;
      
      // Position-specific scoring with NFL-like factors
      if (player.position === "QB") {
        // Base stats
        score += (stats.passYds || 0) / 1000;
        score += (stats.passTd || 0) * 2;
        score -= (stats.interceptions || 0) * 3;
        // Advanced metrics
        score += (compPct / 100) * 5; // Completion % bonus
        score += (ydsPerAttempt / 10) * 3; // YPA bonus
        score += (passRating / 100) * 2; // Passer rating bonus
        // Team success (heavier for MVP)
        if (awardDef.id === "mvp") {
          score += teamWinPct * 30;
          score += (teamPointDiff / 100) * 10;
        } else {
          score += teamWinPct * 15;
        }
        // Negative factors
        score -= (stats.sacksTaken || 0) * 0.5;
      } else if (player.position === "RB") {
        // Base stats
        score += (stats.rushYds || 0) / 500;
        score += (stats.rushTd || 0) * 3;
        score += (stats.recYds || 0) / 1000;
        // Advanced metrics
        score += rushYdsPerGame * 0.5; // Yards per game
        score += (ydsPerRec / 10) * 2; // Yards per reception
        // Team success
        score += teamWinPct * 10;
        // Negative factors
        score -= (stats.fumblesLost || 0) * 2;
      } else if (player.position === "WR" || player.position === "TE") {
        // Base stats
        score += (stats.recYds || 0) / 500;
        score += (stats.recTd || 0) * 3;
        score += (stats.receptions || 0) / 20;
        // Advanced metrics
        score += (ydsPerRec / 10) * 3; // Yards per reception
        score += recYdsPerGame * 0.5; // Yards per game
        score += (receptions / games) * 2; // Receptions per game
        // Team success
        score += teamWinPct * 10;
        // Negative factors
        score -= (stats.fumblesLost || 0) * 2;
      } else if (["DL", "LB", "CB", "S"].includes(player.position)) {
        // Base stats
        score += (stats.tackles || 0) / 10;
        score += (stats.sacks || 0) * 5;
        score += (stats.deflections || 0) / 5;
        // Advanced metrics
        score += (stats.fumRecoveries || 0) * 4; // Takeaways
        score += (stats.interceptions || 0) * 5; // INTs (if tracked for defenders)
        // Team defensive success (heavier for DPOY)
        const defensiveScore = 100 - (teamStats.pa / games); // Lower points allowed = better
        if (awardDef.id === "defensive_poy") {
          score += defensiveScore * 0.3;
          score += teamWinPct * 20;
        } else {
          score += defensiveScore * 0.15;
          score += teamWinPct * 10;
        }
      }

      // Rookie bonus
      if (awardDef.id === "rookie" && player.age <= 22) {
        score += 15; // Rookie bonus for early career impact
      }

      // Consistency bonus (avoid stat padding) - penalize if performance is too far above rating
      const expectedPerformance = player.rating || 70;
      if (score > expectedPerformance + 50) {
        score -= (score - expectedPerformance - 50) * 0.5; // Penalize extreme outliers
      }

      candidates.push({
        name: player.name,
        position: player.position,
        team: teamName(team),
        teamKey: key,
        rating: player.rating,
        score: Math.round(score),
        stats
      });
    });
  });

  return candidates.sort((a, b) => b.score - a.score).slice(0, 5).map((c, i) => ({
    rank: i + 1,
    ...c
  }));
}

function renderAwards() {
  const container = $("awards-list");
  if (!container) return;
  container.innerHTML = "";
  AWARD_DEFINITIONS.forEach(def => {
    const current = awards[def.id] || { player: "", teamKey: "" };
    const team = TEAMS.find(t => teamKey(t) === current.teamKey);
    const hasWinner = current.player || current.teamKey;
    let winnerText = "Not yet awarded";
    if (hasWinner) {
      if (def.id === "best_defense" || def.id === "coach") winnerText = team ? teamName(team) : current.player || "Unknown";
      else winnerText = `${current.player || "Unknown"}${team ? " – " + teamName(team) : ""}`;
    }

    // Get top 5 candidates
    const topCandidates = getTopCandidatesForAward(def);
    const candidatesHTML = topCandidates.map(c => `
      <div class="award-candidate" data-name="${c.name || c.teamKey}" data-team="${c.teamKey}">
        <span class="candidate-rank">${c.rank}.</span>
        <span class="candidate-name">${c.name || c.team}</span>
        <span class="candidate-info">${c.position ? c.position + " • " : ""}${c.rating !== undefined ? "OVR " + c.rating : c.value}</span>
      </div>
    `).join("");

    const card = document.createElement("div");
    card.className = "award-card";
    card.innerHTML = `
      <div class="award-title">${def.title}</div>
      <div class="award-winner ${hasWinner ? "" : "empty"}">${winnerText}</div>
      <div class="award-candidates">
        <h4>Top Candidates</h4>
        <div class="candidates-list">${candidatesHTML}</div>
      </div>
      <div class="award-form">
        <select data-award="${def.id}" class="award-candidate-select">
          <option value="">– Select Winner –</option>
          ${topCandidates.map(c => `<option value="${c.name || c.teamKey}" data-team="${c.teamKey}" ${current.player === (c.name || c.teamKey) ? "selected" : ""}>${c.rank}. ${c.name || c.team} ${c.position ? "(" + c.position + ")" : ""}</option>`).join("")}
        </select>
        <button class="btn primary small award-save-btn" data-award="${def.id}">Save</button>
      </div>
    `;
    container.appendChild(card);
  });

  // Add click handlers for candidates
  document.querySelectorAll(".award-candidate").forEach(candidate => {
    candidate.addEventListener("click", () => {
      const name = candidate.dataset.name;
      const team = candidate.dataset.team;
      const awardId = candidate.closest(".award-card").querySelector(".award-candidate-select").dataset.award;

      const select = candidate.closest(".award-card").querySelector(`.award-candidate-select`);
      select.value = name;
    });
  });

  document.querySelectorAll(".award-save-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.award;
      const select = document.querySelector(`.award-candidate-select[data-award="${id}"]`);
      const selectedOption = select.options[select.selectedIndex];

      awards[id] = {
        player: select.value,
        teamKey: selectedOption ? selectedOption.dataset.team : ""
      };
      saveAwards(awards);
      renderAwards();
    });
  });
}

function openTeamPage(teamIndex) {
  try {
    console.log("openTeamPage called with teamIndex:", teamIndex);
    
    const team = TEAMS[teamIndex];
    if (!team) {
      console.error("Team not found for index:", teamIndex);
      return;
    }
    console.log("Team found:", teamName(team));
    
    const key = teamKey(team);
    console.log("Team key:", key);
    
    const rec = standings[key] || { wins: 0, losses: 0, ties: 0, pf: 0, pa: 0 };
    const sorted = getSortedStandings();
    const rank = sorted.findIndex(r => teamKey(r.team) === key) + 1;

    // Get coach information
    const coach = window.CoachSystem ? window.CoachSystem.getCoach(team) : null;
    
    // Validate DOM elements exist
    const nameEl = $("team-page-name");
    const ratingEl = $("team-page-rating");
    const recordEl = $("team-page-record");
    const standingEl = $("team-page-standing");
    
    if (!nameEl) {
      console.error("team-page-name element not found");
      return;
    }
    
    nameEl.textContent = teamName(team);
    if (ratingEl) ratingEl.textContent = `Overall: ${getTeamOverall(team)}`;
    if (recordEl) recordEl.textContent = `${rec.wins}-${rec.losses}-${rec.ties}`;
    
    const gp = rec.wins + rec.losses + rec.ties;
    const pct = gp === 0 ? ".000" : (rec.wins / gp).toFixed(3).replace(/^0/, "");
    const diff = rec.pf - rec.pa;
    if (standingEl) standingEl.textContent = `#${rank}  |  ${rec.wins}-${rec.losses}-${rec.ties}  |  PCT ${pct}  |  PF ${rec.pf}  PA ${rec.pa}  |  DIFF ${diff > 0 ? "+" : ""}${diff}`;

    const upcoming = $("team-page-upcoming");
    if (upcoming) {
      const teamGames = schedule
        .filter(g => teamKey(g.home) === key || teamKey(g.away) === key)
        .sort((a, b) => a.week - b.week);
      const byeWeek = byeWeeks[key];
      if (teamGames.length === 0 && !byeWeek) {
        upcoming.innerHTML = `<p class="empty-note">No schedule yet. Reset Schedule to generate.</p>`;
      } else {
        const lines = [];
        for (let w = 1; w <= 18; w++) {
          if (byeWeek === w) {
            lines.push(`<div class="team-schedule-game bye-week"><span class="schedule-week">Wk ${w}</span><span class="schedule-opponent">BYE</span></div>`);
            continue;
          }
          const g = teamGames.find(x => x.week === w);
          if (!g) continue;
          const isHome = teamKey(g.home) === key;
          const opp = isHome ? g.away : g.home;
          const loc = isHome ? "vs" : "@";
          const score = g.played ? ` ${g.awayScore}-${g.homeScore}` : "";
          const status = g.played ? '<span class="schedule-status final">FINAL</span>' : "";
          lines.push(`<div class="team-schedule-game"><span class="schedule-week">Wk ${w}</span><span class="schedule-location">${loc}</span><span class="schedule-opponent">${teamName(opp)}</span><span class="schedule-score">${score}</span>${status}</div>`);
        }
        upcoming.innerHTML = `<div class="team-schedule-list">${lines.join("")}</div>` || `<p class="empty-note">No games found.</p>`;
      }
    }

    const players = ROSTERS[key] || [];
    const tbody = $("team-page-roster");
    if (!tbody) {
      console.error("team-page-roster element not found");
      return;
    }
    tbody.innerHTML = "";
    players.forEach((p, i) => {
      let ratingClass = "rating-low";
      if (p.rating >= 85) ratingClass = "rating-high";
      else if (p.rating >= 70) ratingClass = "rating-mid";
      const tr = document.createElement("tr");
      tr.innerHTML = `<td class="rank">${i + 1}</td><td class="team-cell">${p.name}</td><td>${p.position}</td><td>${p.age}</td><td>${p.height}</td><td>${p.weight}</td><td class="${ratingClass}">${p.rating}</td>`;
      tbody.appendChild(tr);
    });

    // Add coach information section
    const teamPage = document.getElementById("team-page-screen");
    if (!teamPage) {
      console.error("team-page-screen element not found");
      return;
    }
    
    let coachSection = document.getElementById("team-page-coach");
    if (!coachSection) {
      coachSection = document.createElement("div");
      coachSection.id = "team-page-coach";
      coachSection.className = "team-page-section";
      // Just append it to the end
      teamPage.appendChild(coachSection);
    }

    if (coach) {
      coachSection.innerHTML = `
        <h3>Head Coach</h3>
        <div class="coach-info">
          <div class="coach-name">${coach.name}</div>
          <div class="coach-stats">
            <div class="coach-stat"><strong>Overall:</strong> <span class="${coach.overallRating >= 85 ? 'rating-high' : coach.overallRating >= 70 ? 'rating-mid' : 'rating-low'}">${coach.overallRating}</span></div>
            <div class="coach-stat"><strong>Offense:</strong> ${coach.offenseRating}</div>
            <div class="coach-stat"><strong>Defense:</strong> ${coach.defenseRating}</div>
            <div class="coach-stat"><strong>Drafting:</strong> ${coach.draftingRating}</div>
            <div class="coach-stat"><strong>Development:</strong> ${coach.developmentRating}</div>
            <div class="coach-stat"><strong>Championships:</strong> ${coach.totalChampionships}</div>
            <div class="coach-stat"><strong>Years with Team:</strong> ${coach.yearsWithTeam}</div>
          </div>
        </div>
      `;
    } else {
      coachSection.innerHTML = `
        <h3>Head Coach</h3>
        <p class="empty-note">No coach information available</p>
      `;
    }

    showScreen("team-page-screen");
    console.log("Team page rendered successfully for:", teamName(team));
    
    // Scroll to top of main content area
    const mainEl = document.querySelector(".main");
    if (mainEl) {
      mainEl.scrollTop = 0;
    }
  } catch (error) {
    console.error("Error in openTeamPage:", error);
    console.error("Error stack:", error.stack);
    // Show error message to user
    const teamPage = document.getElementById("team-page-screen");
    if (teamPage) {
      teamPage.innerHTML = `<div class="team-page-section"><h3>Error</h3><p>Failed to load team page: ${error.message}</p></div>`;
      showScreen("team-page-screen");
    }
  }
}

let game = null;
function createNewGame(home, away, scheduledGame = null) {
  return {
    home, away, scheduledGame,
    homeScore: 0, awayScore: 0,
    quarter: 1, clockSeconds: 15 * 60,
    possession: "home", down: 1, distance: 10, yardLine: 25,
    playLog: [`Game started: ${teamName(away)} at ${teamName(home)}`, "Kickoff — ball at the 25"],
    gameOver: false, resultRecorded: false
  };
}
function $(id) { return document.getElementById(id); }
function clockDisplay(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
function fieldPosDisplay(yardLine) {
  return yardLine <= 50 ? `Own ${yardLine}` : `Opponent ${100 - yardLine}`;
}
function downDisplay(down, distance) {
  const suffixes = ["", "1st", "2nd", "3rd", "4th"];
  return `${suffixes[down] || down + "th"} & ${distance}`;
}
function updateUI() {
  if (!game) return;
  $("away-name").textContent = teamName(game.away);
  $("home-name").textContent = teamName(game.home);
  $("away-score").textContent = game.awayScore;
  $("home-score").textContent = game.homeScore;
  $("quarter").textContent = `Q${game.quarter}`;
  $("clock").textContent = clockDisplay(game.clockSeconds);
  $("down-distance").textContent = downDisplay(game.down, game.distance);
  $("field-pos").textContent = `Ball on ${fieldPosDisplay(game.yardLine)}`;
  const possessionTeam = game.possession === "home" ? game.home : game.away;
  $("possession-text").textContent = `Possession: ${teamName(possessionTeam)}`;
  const log = $("log-content");
  log.innerHTML = "";
  game.playLog.slice().reverse().forEach(entry => {
    const div = document.createElement("div");
    div.textContent = entry;
    log.appendChild(div);
  });
}
function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
  $(id).classList.remove("hidden");
  document.querySelectorAll(".sidebar-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.screen === id);
  });
  if (id === "standings-screen") renderStandings();
  if (id === "awards-screen") renderAwards();
  if (id === "schedule-screen") renderSchedule();
  if (id === "setup-screen") renderWeeklyGames();
}
function applyTime(seconds) {
  const multiplier = (window.gameClockMultiplier && window.gameClockMultiplier.value) ? window.gameClockMultiplier.value : 1;
  const adjustedSeconds = seconds * multiplier;
  game.clockSeconds -= adjustedSeconds;
  if (game.clockSeconds <= 0) {
    game.clockSeconds = 0;
    if (game.quarter >= 4) {
      game.gameOver = true;
      game.playLog.push("*** END OF GAME ***");
      finishGame();
    } else {
      game.quarter += 1;
      const quarterMinutes = (parseInt(localStorage.getItem("mfl-quarter-length") === "quick" ? 5 : localStorage.getItem("mfl-quarter-length") === "realistic" ? 15 : 10) || 10);
      game.clockSeconds = quarterMinutes * 60;
      game.playLog.push("--- End of Quarter " + (game.quarter - 1) + " ---");
    }
  }
}
function switchPossession() {
  game.possession = game.possession === "home" ? "away" : "home";
  game.down = 1; game.distance = 10;
}
function flipField() {
  game.yardLine = 100 - game.yardLine;
  if (game.yardLine < 1) game.yardLine = 20;
  if (game.yardLine > 99) game.yardLine = 80;
}
function finishGame() {
  if (!game || game.resultRecorded) return;
  game.resultRecorded = true;
  recordGameResult(game.home, game.away, game.homeScore, game.awayScore);
  if (window.currentScheduledGame) {
    window.currentScheduledGame.played = true;
    window.currentScheduledGame.homeScore = game.homeScore;
    window.currentScheduledGame.awayScore = game.awayScore;
    saveSchedule();
    window.currentScheduledGame = null;
  }
  alert(`Final Score\n${teamName(game.away)} ${game.awayScore} - ${game.homeScore} ${teamName(game.home)}\n\nStandings have been updated!`);
}
function processPlay() {
  if (!game || game.gameOver) return;
  const roll = {
    d4: parseInt($("die-1").value), d10_0_9: parseInt($("die-2").value),
    d8: parseInt($("die-3").value), d100_tens: parseInt($("die-4").value),
    d20: parseInt($("die-5").value), d10: parseInt($("die-6").value), d6: parseInt($("die-7").value)
  };
  if ([roll.d4, roll.d10_0_9, roll.d8, roll.d100_tens, roll.d20, roll.d10, roll.d6].some(Number.isNaN)) {
    alert("Enter the result of all seven dice."); return;
  }
  if (roll.d4 < 1 || roll.d4 > 4 || roll.d10_0_9 < 0 || roll.d10_0_9 > 9 || roll.d8 < 1 || roll.d8 > 8 ||
      roll.d100_tens < 0 || roll.d100_tens > 90 || roll.d100_tens % 10 !== 0 ||
      roll.d20 < 1 || roll.d20 > 20 || roll.d10 < 1 || roll.d10 > 10 || roll.d6 < 1 || roll.d6 > 6) {
    alert("One or more dice results are invalid."); return;
  }
  const current = game.possession === "home" ? game.home : game.away;
  const other = game.possession === "home" ? game.away : game.home;
  const team = teamName(current);
  const outcome = DiceEngine.determinePlayOutcome(roll);
  let description = "";
  let timeUsed = 30;
  switch (outcome.type) {
    case "run":
      description = `${team} — ${outcome.name} for ${outcome.yards} yards`;
      game.yardLine += outcome.yards; timeUsed = 35;
      if (outcome.yards >= game.distance) { game.down = 1; game.distance = 10; description += " — FIRST DOWN!"; }
      else { game.down++; game.distance -= outcome.yards; if (game.down > 4) { description += " — TURNOVER ON DOWNS"; switchPossession(); flipField(); } }
      break;
    case "pass_complete":
      description = `${team} — ${outcome.name} for ${outcome.yards} yards`;
      game.yardLine += outcome.yards; timeUsed = 28;
      if (outcome.yards >= game.distance) { game.down = 1; game.distance = 10; description += " — FIRST DOWN!"; }
      else { game.down++; game.distance -= outcome.yards; if (game.down > 4) { description += " — TURNOVER ON DOWNS"; switchPossession(); flipField(); } }
      break;
    case "pass_incomplete":
      description = `${team} — INCOMPLETE PASS`; game.down++; timeUsed = 12;
      if (game.down > 4) { description += " — TURNOVER ON DOWNS"; switchPossession(); flipField(); }
      break;
    case "sack":
      description = `${team} — SACK, LOSS OF ${Math.abs(outcome.yards)} YARDS`;
      game.yardLine += outcome.yards; game.distance += Math.abs(outcome.yards); game.down++; timeUsed = 25;
      if (game.down > 4) { description += " — TURNOVER ON DOWNS"; switchPossession(); flipField(); }
      break;
    case "interception":
      description = `INTERCEPTION! ${team} throws an interception.`; switchPossession(); flipField(); timeUsed = 20; break;
    case "fumble":
      description = `FUMBLE! ${team} fumbles. ${teamName(other)} recovers!`; switchPossession(); flipField(); timeUsed = 25; break;
    case "big_play":
      description = `${team} — BIG PLAY for ${outcome.yards} yards!`; game.yardLine += outcome.yards; timeUsed = 30;
      if (outcome.yards >= game.distance) { game.down = 1; game.distance = 10; description += " — FIRST DOWN!"; }
      else { game.down++; game.distance -= outcome.yards; }
      break;
    case "penalty":
      description = `${team} — PENALTY, ${outcome.yards} YARDS`; game.yardLine -= outcome.yards; timeUsed = 10; break;
    case "punt":
      description = `${team} punts ${outcome.yards} yards.`; switchPossession();
      game.yardLine = 100 - (game.yardLine + outcome.yards);
      if (game.yardLine < 1) game.yardLine = 20;
      timeUsed = 15; break;
  }
  if (game.yardLine < 0) game.yardLine = 0;
  if (game.yardLine > 100) game.yardLine = 100;
  game.playLog.push(description);
  ["die-1","die-2","die-3","die-4","die-5","die-6","die-7"].forEach(id => { $(id).value = ""; });
  applyTime(timeUsed);
  updateUI();
}

window.addEventListener("DOMContentLoaded", () => {
  generateSchedule();
  if (schedule.length === 0 && window.ScheduleGenerator) generateSchedule(true);
  currentWeek = parseInt(localStorage.getItem("mfl-current-week")) || 1;
  renderWeeklyGames();

  document.querySelectorAll(".sidebar-btn").forEach(btn => {
    btn.addEventListener("click", () => showScreen(btn.dataset.screen));
  });
  const standingsViewSelect = $("standings-view-select");
  if (standingsViewSelect) standingsViewSelect.addEventListener("change", renderStandings);
  const submitPlayButton = $("roll-play-btn");
  if (submitPlayButton) submitPlayButton.addEventListener("click", processPlay);
  const submitDiceRoll = $("submit-dice-roll");
  if (submitDiceRoll) submitDiceRoll.addEventListener("click", processPlay);
  $("end-game-btn").addEventListener("click", () => {
    if (game && !game.gameOver) {
      game.gameOver = true;
      game.playLog.push("Game ended early.");
      updateUI();
      finishGame();
    }
  });
  $("new-game-btn").addEventListener("click", () => { game = null; showScreen("setup-screen"); });
  $("reset-standings-btn").addEventListener("click", () => {
    if (confirm("Reset all standings to 0-0?")) {
      standings = createEmptyStandings();
      saveStandings(standings);
      renderStandings();
    }
  });
  $("reset-awards-btn").addEventListener("click", () => {
    if (confirm("Clear all awards?")) {
      awards = createEmptyAwards();
      saveAwards(awards);
      renderAwards();
    }
  });
  const resetScheduleBtn = $("reset-schedule-btn");
  if (resetScheduleBtn) resetScheduleBtn.addEventListener("click", resetSchedule);
  $("back-to-standings").addEventListener("click", () => showScreen("standings-screen"));

  // Settings page handlers
  try {
    const quarterLength = $("quarter-length");
    const difficulty = $("difficulty");
    if (quarterLength) {
      quarterLength.value = localStorage.getItem("mfl-quarter-length") || "normal";
      quarterLength.addEventListener("change", function() {
        localStorage.setItem("mfl-quarter-length", quarterLength.value);
        applyQuarterLength(quarterLength.value);
      });
    }
    if (difficulty) {
      difficulty.value = localStorage.getItem("mfl-difficulty") || "normal";
      difficulty.addEventListener("change", function() {
        localStorage.setItem("mfl-difficulty", difficulty.value);
      });
    }

    const theme = $("theme");
    const animations = $("animations");
    const sound = $("sound");
    if (theme) {
      theme.value = localStorage.getItem("mfl-theme") || "default";
      theme.addEventListener("change", function() {
        localStorage.setItem("mfl-theme", theme.value);
        applyTheme(theme.value);
      });
    }
    if (animations) {
      animations.checked = localStorage.getItem("mfl-animations") !== "false";
      animations.addEventListener("change", function() {
        localStorage.setItem("mfl-animations", animations.checked);
        applyAnimations(animations.checked);
      });
    }
    if (sound) {
      sound.checked = localStorage.getItem("mfl-sound") !== "false";
      sound.addEventListener("change", function() {
        localStorage.setItem("mfl-sound", sound.checked);
      });
    }

    const saveBtns = document.querySelectorAll(".save-btn");
    const loadBtns = document.querySelectorAll(".load-btn");
    saveBtns.forEach(btn => {
      btn.addEventListener("click", function() {
        const slot = btn.dataset.slot;
        saveGame(slot);
      });
    });
    loadBtns.forEach(btn => {
      btn.addEventListener("click", function() {
        const slot = btn.dataset.slot;
        loadGame(slot);
      });
    });
    if (saveBtns.length > 0) updateSaveSlots();

    const exportBtn = $("export-btn");
    const importBtn = $("import-btn");
    const importFile = $("import-file");
    if (exportBtn) exportBtn.addEventListener("click", exportGameData);
    if (importBtn) importBtn.addEventListener("click", function() { importFile.click(); });
    if (importFile) importFile.addEventListener("change", importGameData);

    const resetBtns = document.querySelectorAll("[data-reset]");
    resetBtns.forEach(btn => {
      btn.addEventListener("click", function() {
        const resetType = btn.dataset.reset;
        selectiveReset(resetType);
      });
    });

    const resetEverythingBtn = $("reset-everything-btn");
    if (resetEverythingBtn) resetEverythingBtn.addEventListener("click", resetEverything);

    // Settings tab switching
    const tabs = document.querySelectorAll(".settings-tab");
    const panels = document.querySelectorAll(".settings-tab-panel");
    tabs.forEach(tab => {
      tab.addEventListener("click", function() {
        const target = tab.dataset.tab;
        tabs.forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        panels.forEach(p => p.classList.add("hidden"));
        const targetPanel = $("settings-tab-" + target);
        if (targetPanel) targetPanel.classList.remove("hidden");
      });
    });
    console.log("Settings handlers initialized successfully");
  } catch (e) {
    console.error("Error initializing settings handlers:", e);
  }

  const prevWeek = $("prev-week-btn");
  const nextWeek = $("next-week-btn");
  if (prevWeek) prevWeek.addEventListener("click", () => {
    if (currentWeek > 1) {
      currentWeek--;
      localStorage.setItem("mfl-current-week", String(currentWeek));
      renderWeeklyGames();
    }
  });
  if (nextWeek) nextWeek.addEventListener("click", () => {
    if (currentWeek < 18) {
      currentWeek++;
      localStorage.setItem("mfl-current-week", String(currentWeek));
      renderWeeklyGames();
    }
  });
});
