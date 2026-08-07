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

function teamName(team) {
  return `${team.city} ${team.name}`;
}

function teamKey(team) {
  return `${team.city}-${team.name}`;
}

// ============================================
// SEEDED RANDOM + PLAYER GENERATION
// ============================================
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
  const feet = Math.floor(inches / 12);
  const inch = inches % 12;
  return `${feet}'${inch}"`;
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

function getTeamOverall(team){
    const players = ROSTERS[teamKey(team)] || [];

    if(players.length === 0) return 0;

    const total = players.reduce(
        (sum, player)=>sum + player.rating,
        0
    );

    return Math.round(total / players.length);
}

// ============================================
// STANDINGS
// ============================================
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
    if (b.wins !== a.wins) return b.wins - a.wins;
    const diffA = a.pf - a.pa, diffB = b.pf - b.pa;
    if (diffB !== diffA) return diffB - diffA;
    return b.pf - a.pf;
  });
}

function renderStandings() {
  const tbody = $("standings-body");
  tbody.innerHTML = "";
  getSortedStandings().forEach((row, index) => {
    const gp = row.wins + row.losses + row.ties;
    const pct = gp === 0 ? ".000" : (row.wins / gp).toFixed(3).replace(/^0/, "");
    const diff = row.pf - row.pa;
    const diffClass = diff > 0 ? "positive" : diff < 0 ? "negative" : "";
    const tr = document.createElement("tr");
    tr.innerHTML = `<td class="rank">${index + 1}</td><td class="team-cell">${teamName(row.team)}</td><td>${row.wins}</td><td>${row.losses}</td><td>${row.ties}</td><td>${pct}</td><td>${row.pf}</td><td>${row.pa}</td><td class="${diffClass}">${diff > 0 ? "+" : ""}${diff}</td>`;
    tbody.appendChild(tr);
  });
}

// ============================================
// AWARDS
// ============================================
const AWARD_DEFINITIONS = [
  { id: "mvp", title: "League MVP" },
  { id: "offensive_poy", title: "Offensive Player of the Year" },
  { id: "defensive_poy", title: "Defensive Player of the Year" },
  { id: "rookie", title: "Rookie of the Year" },
  { id: "coach", title: "Coach of the Year" },
  { id: "comeback", title: "Comeback Player of the Year" },
  { id: "most_improved", title: "Most Improved Player" },
  { id: "best_qb", title: "Best Quarterback" },
  { id: "best_rb", title: "Best Running Back" },
  { id: "best_wr", title: "Best Wide Receiver" },
  { id: "best_defense", title: "Best Defense" },
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

function renderAwards() {
  const container = $("awards-list");
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
    const card = document.createElement("div");
    card.className = "award-card";
    card.innerHTML = `<div class="award-title">${def.title}</div><div class="award-winner ${hasWinner ? "" : "empty"}">${winnerText}</div><div class="award-form"><input type="text" placeholder="Player name" value="${current.player || ""}" data-award="${def.id}" class="award-player-input"><select data-award="${def.id}" class="award-team-select"><option value="">– Select Team –</option>${TEAMS.map(t => `<option value="${teamKey(t)}" ${current.teamKey === teamKey(t) ? "selected" : ""}>${teamName(t)}</option>`).join("")}</select><button class="btn primary small award-save-btn" data-award="${def.id}">Save</button></div>`;
    container.appendChild(card);
  });
  document.querySelectorAll(".award-save-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.award;
      awards[id] = {
        player: document.querySelector(`.award-player-input[data-award="${id}"]`).value.trim(),
        teamKey: document.querySelector(`.award-team-select[data-award="${id}"]`).value
      };
      saveAwards(awards);
      renderAwards();
    });
  });
}

// ============================================
// TEAMS LIST + TEAM PAGE
// ============================================
function renderTeamsGrid() {
  const grid = $("teams-grid");
  grid.innerHTML = "";
  TEAMS.forEach((team, i) => {
    const key = teamKey(team);
    const rec = standings[key] || { wins: 0, losses: 0, ties: 0 };
    const card = document.createElement("div");
    card.className = "team-card";
    card.innerHTML = `<div class="team-card-name">${teamName(team)}</div><div class="team-card-record">${rec.wins}-${rec.losses}-${rec.ties}</div>`;
    card.addEventListener("click", () => openTeamPage(i));
    grid.appendChild(card);
  });
}

function openTeamPage(teamIndex) {
  const team = TEAMS[teamIndex];
  const key = teamKey(team);
  const rec = standings[key] || { wins: 0, losses: 0, ties: 0, pf: 0, pa: 0 };
  const sorted = getSortedStandings();
  const rank = sorted.findIndex(r => teamKey(r.team) === key) + 1;

  $("team-page-name").textContent = teamName(team);
  $("team-page-record").textContent = `${rec.wins}-${rec.losses}-${rec.ties}`;

  const gp = rec.wins + rec.losses + rec.ties;
  const pct = gp === 0 ? ".000" : (rec.wins / gp).toFixed(3).replace(/^0/, "");
  const diff = rec.pf - rec.pa;
  $("team-page-standing").textContent = `#${rank}  |  ${rec.wins}-${rec.losses}-${rec.ties}  |  PCT ${pct}  |  PF ${rec.pf}  PA ${rec.pa}  |  DIFF ${diff > 0 ? "+" : ""}${diff}`;

  // Roster
  const players = ROSTERS[key] || [];
  const tbody = $("team-page-roster");
  tbody.innerHTML = "";
  players.forEach((p, i) => {
    let ratingClass = "rating-low";
    if (p.rating >= 85) ratingClass = "rating-high";
    else if (p.rating >= 70) ratingClass = "rating-mid";
    const tr = document.createElement("tr");
    tr.innerHTML = `<td class="rank">${i + 1}</td><td class="team-cell">${p.name}</td><td>${p.position}</td><td>${p.age}</td><td>${p.height}</td><td>${p.weight}</td><td class="${ratingClass}">${p.rating}</td>`;
    tbody.appendChild(tr);
  });

  showScreen("team-page-screen");
}

// ============================================
// GAME STATE
// ============================================
let game = null;

function createNewGame(home, away) {
  return {
    home, away, homeScore: 0, awayScore: 0,
    quarter: 1, clockSeconds: 15 * 60,
    possession: "home", down: 1, distance: 10, yardLine: 25,
    playLog: [`Game started: ${teamName(away)} at ${teamName(home)}`, "Kickoff — ball at the 25"],
    gameOver: false, resultRecorded: false
  };
}

// ============================================
// UI HELPERS
// ============================================
function $(id) { return document.getElementById(id); }

function populateTeamSelects() {
  const awaySelect = $("away-select");
  const homeSelect = $("home-select");
  awaySelect.innerHTML = ""; homeSelect.innerHTML = "";
  TEAMS.forEach((team, i) => {
    const o1 = document.createElement("option"); o1.value = i; o1.textContent = teamName(team); awaySelect.appendChild(o1);
    const o2 = document.createElement("option"); o2.value = i; o2.textContent = teamName(team); homeSelect.appendChild(o2);
  });
  awaySelect.value = 0; homeSelect.value = 1;
}

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
  const possTeam = game.possession === "home" ? game.home : game.away;
  $("possession-text").textContent = `Possession: ${teamName(possTeam)}`;
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

  // Update sidebar buttons (ignore team-page-screen for active state)
  document.querySelectorAll(".sidebar-btn").forEach(btn => {
    const target = btn.dataset.screen;
    btn.classList.toggle("active", target === id || (id === "team-page-screen" && target === "teams-screen"));
  });

  if (id === "standings-screen") renderStandings();
  if (id === "awards-screen") renderAwards();
  if (id === "teams-screen") renderTeamsGrid();
}

// ============================================
// GAME LOGIC
// ============================================
function applyTime(seconds) {
  game.clockSeconds -= seconds;
  if (game.clockSeconds <= 0) {
    game.clockSeconds = 0;
    if (game.quarter >= 4) {
      game.gameOver = true;
      game.playLog.push("*** END OF GAME ***");
      finishGame();
    } else {
      game.quarter += 1;
      game.clockSeconds = 15 * 60;
      game.playLog.push(`--- End of Quarter ${game.quarter - 1} ---`);
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
  alert(`Final Score\n${teamName(game.away)} ${game.awayScore}  -  ${game.homeScore} ${teamName(game.home)}\n\nStandings have been updated!`);
}

function processPlay() {
  if (!game || game.gameOver) return;
  const playType = $("play-type").value;
  let yards = parseInt($("yards-input").value) || 0;
  const current = game.possession === "home" ? game.home : game.away;
  const other = game.possession === "home" ? game.away : game.home;
  const team = teamName(current);
  let description = "";
  let timeUsed = 30;

  switch (playType) {
    case "run": description = `${team} run for ${yards} yards`; game.yardLine += yards; timeUsed = 35; break;
    case "pass_complete": description = `${team} pass complete for ${yards} yards`; game.yardLine += yards; timeUsed = 28; break;
    case "pass_incomplete": description = `${team} pass incomplete`; timeUsed = 12; yards = 0; break;
    case "sack": description = `${team} sacked for a loss of ${Math.abs(yards)} yards`; game.yardLine += yards; timeUsed = 25; break;
    case "interception": description = `INTERCEPTION by ${teamName(other)}!`; switchPossession(); flipField(); timeUsed = 20; break;
    case "fumble": description = `FUMBLE recovered by ${teamName(other)}!`; switchPossession(); flipField(); timeUsed = 25; break;
    case "punt": description = `${team} punts`; switchPossession(); game.yardLine = 100 - (game.yardLine + 40); if (game.yardLine < 1) game.yardLine = 20; timeUsed = 15; break;
    case "fg_made": description = `FIELD GOAL is GOOD! (+3 ${team})`; if (game.possession === "home") game.homeScore += 3; else game.awayScore += 3; switchPossession(); game.yardLine = 25; timeUsed = 10; break;
    case "fg_missed": description = `Field goal is NO GOOD`; switchPossession(); flipField(); timeUsed = 10; break;
    case "touchdown": description = `TOUCHDOWN ${team}!!!`; if (game.possession === "home") game.homeScore += 6; else game.awayScore += 6; timeUsed = 15; break;
    case "xp_good": description = `Extra point is GOOD`; if (game.possession === "home") game.homeScore += 1; else game.awayScore += 1; switchPossession(); game.yardLine = 25; timeUsed = 5; break;
    case "xp_missed": description = `Extra point is MISSED`; switchPossession(); game.yardLine = 25; timeUsed = 5; break;
    case "two_pt_good": description = `2-POINT CONVERSION SUCCESSFUL!`; if (game.possession === "home") game.homeScore += 2; else game.awayScore += 2; switchPossession(); game.yardLine = 25; timeUsed = 8; break;
    case "two_pt_failed": description = `2-point conversion FAILED`; switchPossession(); game.yardLine = 25; timeUsed = 8; break;
    case "safety": description = `SAFETY! (+2 ${teamName(other)})`; if (game.possession === "home") game.awayScore += 2; else game.homeScore += 2; switchPossession(); game.yardLine = 25; timeUsed = 10; break;
  }

  if (["run", "pass_complete", "pass_incomplete", "sack"].includes(playType)) {
    if (yards >= game.distance) { game.down = 1; game.distance = 10; description += " — FIRST DOWN!"; }
    else {
      game.down++; game.distance -= yards;
      if (game.down > 4) { description += " — TURNOVER ON DOWNS"; switchPossession(); flipField(); }
    }
  }

  if (game.yardLine < 0) game.yardLine = 0;
  if (game.yardLine > 100) game.yardLine = 100;
  game.playLog.push(description);
  applyTime(timeUsed);
  updateUI();
}

// ============================================
// EVENT LISTENERS
// ============================================
window.addEventListener("DOMContentLoaded", () => {
  populateTeamSelects();

  document.querySelectorAll(".sidebar-btn").forEach(btn => {
    btn.addEventListener("click", () => showScreen(btn.dataset.screen));
  });

  $("start-btn").addEventListener("click", () => {
    const awayIdx = parseInt($("away-select").value);
    const homeIdx = parseInt($("home-select").value);
    if (awayIdx === homeIdx) { alert("Home and Away teams must be different!"); return; }
    game = createNewGame(TEAMS[homeIdx], TEAMS[awayIdx]);
    updateUI();
    showScreen("game-screen");
  });

  $("submit-play").addEventListener("click", processPlay);

  $("end-game-btn").addEventListener("click", () => {
    if (game && !game.gameOver) {
      game.gameOver = true;
      game.playLog.push("Game ended early.");
      updateUI();
      finishGame();
    }
  });

  $("new-game-btn").addEventListener("click", () => {
    game = null;
    showScreen("setup-screen");
  });

  $("reset-standings-btn").addEventListener("click", () => {
    if (confirm("Are you sure you want to reset all standings to 0-0?")) {
      standings = createEmptyStandings();
      saveStandings(standings);
      renderStandings();
    }
  });

  $("reset-awards-btn").addEventListener("click", () => {
    if (confirm("Are you sure you want to clear all awards?")) {
      awards = createEmptyAwards();
      saveAwards(awards);
      renderAwards();
    }
  });

  $("back-to-teams").addEventListener("click", () => showScreen("teams-screen"));
});
