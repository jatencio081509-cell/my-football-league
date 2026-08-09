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
  return `${feet}'${inch}`;
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
    const total = players.reduce((sum, player)=>sum + player.rating, 0);
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
// ============================================
// SCHEDULE
// ============================================
let schedule = [];
let currentWeek = 1;
function saveSchedule() {
    localStorage.setItem("mfl-schedule", JSON.stringify(schedule));
}
function loadSchedule() {
    const saved = localStorage.getItem("mfl-schedule");
    if(saved){
        try { return JSON.parse(saved); } catch(e){ return []; }
    }
    return [];
}
schedule = loadSchedule();
// ============================================
// SCHEDULE GENERATOR
// ============================================
function addGame(week, home, away) {
    schedule.push({
        week,
        home,
        away,
        played: false,
        homeScore: null,
        awayScore: null
    });
}
function generateDivisionGames() {
    const divisions = {};
    TEAMS.forEach(team => {
        const key = `${team.conference}-${team.division}`;
        if(!divisions[key]){
            divisions[key] = [];
        }
        divisions[key].push(team);
    });
    let week = 1;
    Object.values(divisions).forEach(divTeams => {
        if(divTeams.length !== 4) return;
        for(let i = 0; i < divTeams.length; i++){
            for(let j = i + 1; j < divTeams.length; j++){
                addGame(week, divTeams[i], divTeams[j]);
                week++;
                if(week > 18){ week = 1; }
                addGame(week, divTeams[j], divTeams[i]);
                week++;
                if(week > 18){ week = 1; }
            }
        }
    });
}
// force=true clears and rebuilds even if a schedule already exists
function generateSchedule(force = false) {
    if (schedule.length > 0 && !force) {
        return;
    }
    schedule = [];
    generateDivisionGames();
    saveSchedule();
}
function resetSchedule() {
    if (!confirm("Reset the entire schedule? This clears all scheduled games and any saved results on the schedule.")) {
        return;
    }
    schedule = [];
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
            const overallA = getTeamOverall(a.team);
            const overallB = getTeamOverall(b.team);
            if (overallB !== overallA) return overallB - overallA;
            return teamName(a.team).localeCompare(teamName(b.team));
        }
        if (gamesA === 0 && gamesB > 0) return 1;
        if (gamesB === 0 && gamesA > 0) return -1;
        const pctA = a.wins / gamesA;
        const pctB = b.wins / gamesB;
        if (pctB !== pctA) return pctB - pctA;
        const diffA = a.pf - a.pa;
        const diffB = b.pf - b.pa;
        if (diffB !== diffA) return diffB - diffA;
        if (b.pf !== a.pf) return b.pf - a.pf;
        const overallA = getTeamOverall(a.team);
        const overallB = getTeamOverall(b.team);
        if (overallB !== overallA) return overallB - overallA;
        return teamName(a.team).localeCompare(teamName(b.team));
    });
}
function renderWeeklyGames() {
    const container = $("weekly-games");
    if (!container) return;
    container.innerHTML = "";
    $("current-week-label").textContent = currentWeek;
    const weekGames = schedule.filter(scheduledGame => scheduledGame.week === currentWeek);
    if (weekGames.length === 0) {
        container.innerHTML = `<div class="empty-note">No games scheduled for Week ${currentWeek}.</div>`;
        return;
    }
    weekGames.forEach(scheduledGame => {
        const card = document.createElement("div");
        card.className = "week-game-card";
        const awayName = teamName(scheduledGame.away);
        const homeName = teamName(scheduledGame.home);
        if (scheduledGame.played) {
            card.innerHTML = `
                <div class="game-teams"><strong>${awayName}</strong><span class="game-score">${scheduledGame.awayScore}</span></div>
                <div class="game-final">FINAL</div>
                <div class="game-teams"><strong>${homeName}</strong><span class="game-score">${scheduledGame.homeScore}</span></div>`;
        } else {
            card.innerHTML = `
                <div class="game-teams"><strong>${awayName}</strong></div>
                <div class="game-vs">@</div>
                <div class="game-teams"><strong>${homeName}</strong></div>
                <button class="btn primary play-scheduled-game">Play Game</button>`;
            card.querySelector(".play-scheduled-game").addEventListener("click", () => {
                window.currentScheduledGame = scheduledGame;
                game = createNewGame(scheduledGame.home, scheduledGame.away, scheduledGame);
                updateUI();
                showScreen("game-screen");
            });
        }
        container.appendChild(card);
    });
}
function renderSchedule(){
  const container = $("schedule-container");
  if (!container) return;
  container.innerHTML = "";
  const weeks = {};
  schedule.forEach(g => {
    if(!weeks[g.week]) weeks[g.week] = [];
    weeks[g.week].push(g);
  });
  Object.keys(weeks).sort((a,b)=>a-b).forEach(week=>{
    const weekBox = document.createElement("div");
    weekBox.className = "schedule-week";
    weekBox.innerHTML = `<div class="schedule-week-header">WEEK ${week}</div>`;
    weeks[week].forEach(g=>{
      const gameCard = document.createElement("div");
      gameCard.className = "schedule-game";
      gameCard.innerHTML = `
        <div class="schedule-team away-team"><span>${teamName(g.away)}</span></div>
        <div class="schedule-at">@</div>
        <div class="schedule-team home-team"><span>${teamName(g.home)}</span></div>`;
      weekBox.appendChild(gameCard);
    });
    container.appendChild(weekBox);
  });
}
function renderStandings() {
    const container = $("standings-container");
    if (!container) return;
    container.innerHTML = "";
    const viewSelect = $("standings-view-select");
    const view = viewSelect ? viewSelect.value : "league";
    const sorted = getSortedStandings();
    if (view === "league") {
        const leagueBox = document.createElement("div");
        leagueBox.className = "standings-section";
        leagueBox.innerHTML = `
            <div class="standings-section-header"><h3>League</h3></div>
            <div class="standings-table-wrapper">
                <table class="standings-table">
                    <thead><tr><th>Rank</th><th>Team</th><th>Conference</th><th>Division</th><th>W</th><th>L</th><th>T</th><th>OVR</th></tr></thead>
                    <tbody></tbody>
                </table>
            </div>`;
        const tbody = leagueBox.querySelector("tbody");
        sorted.forEach((row, index) => {
            const tr = document.createElement("tr");
            tr.className = "standings-team-row";
            tr.innerHTML = `<td>${index + 1}</td><td class="team-name-cell">${teamName(row.team)}</td><td>${row.team.conference}</td><td>${row.team.division}</td><td>${row.wins}</td><td>${row.losses}</td><td>${row.ties}</td><td class="team-overall-cell">${getTeamOverall(row.team)}</td>`;
            tr.addEventListener("click", () => {
                openTeamPage(TEAMS.findIndex(t => teamKey(t) === teamKey(row.team)));
            });
            tbody.appendChild(tr);
        });
        container.appendChild(leagueBox);
        return;
    }
    if (view === "conference") {
        ["AFC", "NFC"].forEach(conference => {
            const conferenceBox = document.createElement("div");
            conferenceBox.className = "conference-box";
            conferenceBox.innerHTML = `
                <div class="standings-section-header"><h3>${conference}</h3></div>
                <div class="standings-table-wrapper">
                    <table class="standings-table">
                        <thead><tr><th>Rank</th><th>Team</th><th>Division</th><th>W</th><th>L</th><th>T</th><th>OVR</th></tr></thead>
                        <tbody></tbody>
                    </table>
                </div>`;
            const tbody = conferenceBox.querySelector("tbody");
            sorted.filter(row => row.team.conference === conference).forEach((row, index) => {
                const tr = document.createElement("tr");
                tr.className = "standings-team-row";
                tr.innerHTML = `<td>${index + 1}</td><td class="team-name-cell">${teamName(row.team)}</td><td>${row.team.division}</td><td>${row.wins}</td><td>${row.losses}</td><td>${row.ties}</td><td class="team-overall-cell">${getTeamOverall(row.team)}</td>`;
                tr.addEventListener("click", () => openTeamPage(TEAMS.findIndex(t => teamKey(t) === teamKey(row.team))));
                tbody.appendChild(tr);
            });
            container.appendChild(conferenceBox);
        });
        return;
    }
    if (view === "division") {
        ["AFC", "NFC"].forEach(conference => {
            const conferenceHeader = document.createElement("div");
            conferenceHeader.className = "conference-heading";
            conferenceHeader.innerHTML = `<h2>${conference}</h2>`;
            container.appendChild(conferenceHeader);
            ["East", "North", "South", "West"].forEach(division => {
                const divisionBox = document.createElement("div");
                divisionBox.className = "division-box";
                divisionBox.innerHTML = `
                    <div class="standings-section-header"><h3>${conference} ${division}</h3></div>
                    <div class="standings-table-wrapper">
                        <table class="standings-table">
                            <thead><tr><th>Rank</th><th>Team</th><th>W</th><th>L</th><th>T</th><th>OVR</th></tr></thead>
                            <tbody></tbody>
                        </table>
                    </div>`;
                const tbody = divisionBox.querySelector("tbody");
                sorted.filter(row => row.team.conference === conference && row.team.division === division).forEach((row, index) => {
                    const tr = document.createElement("tr");
                    tr.className = "standings-team-row";
                    tr.innerHTML = `<td>${index + 1}</td><td class="team-name-cell">${teamName(row.team)}</td><td>${row.wins}</td><td>${row.losses}</td><td>${row.ties}</td><td class="team-overall-cell">${getTeamOverall(row.team)}</td>`;
                    tr.addEventListener("click", () => openTeamPage(TEAMS.findIndex(t => teamKey(t) === teamKey(row.team))));
                    tbody.appendChild(tr);
                });
                container.appendChild(divisionBox);
            });
        });
    }
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
function openTeamPage(teamIndex) {
  const team = TEAMS[teamIndex];
  const key = teamKey(team);
  const rec = standings[key] || { wins: 0, losses: 0, ties: 0, pf: 0, pa: 0 };
  const sorted = getSortedStandings();
  const rank = sorted.findIndex(r => teamKey(r.team) === key) + 1;
  $("team-page-name").textContent = teamName(team);
  const ratingEl = $("team-page-rating");
  if (ratingEl) ratingEl.textContent = `Overall: ${getTeamOverall(team)}`;
  $("team-page-record").textContent = `${rec.wins}-${rec.losses}-${rec.ties}`;
  const gp = rec.wins + rec.losses + rec.ties;
  const pct = gp === 0 ? ".000" : (rec.wins / gp).toFixed(3).replace(/^0/, "");
  const diff = rec.pf - rec.pa;
  $("team-page-standing").textContent = `#${rank}  |  ${rec.wins}-${rec.losses}-${rec.ties}  |  PCT ${pct}  |  PF ${rec.pf}  PA ${rec.pa}  |  DIFF ${diff > 0 ? "+" : ""}${diff}`;
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
function populateTeamSelects() {}
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
  const currentGame = game;
  $("away-name").textContent = teamName(currentGame.away);
  $("home-name").textContent = teamName(currentGame.home);
  $("away-score").textContent = currentGame.awayScore;
  $("home-score").textContent = currentGame.homeScore;
  $("quarter").textContent = `Q${currentGame.quarter}`;
  $("clock").textContent = clockDisplay(currentGame.clockSeconds);
  $("down-distance").textContent = downDisplay(currentGame.down, currentGame.distance);
  $("field-pos").textContent = `Ball on ${fieldPosDisplay(currentGame.yardLine)}`;
  const possessionTeam = currentGame.possession === "home" ? currentGame.home : currentGame.away;
  $("possession-text").textContent = `Possession: ${teamName(possessionTeam)}`;
  const log = $("log-content");
  log.innerHTML = "";
  currentGame.playLog.slice().reverse().forEach(entry => {
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
        d4: parseInt($("die-1").value),
        d10_0_9: parseInt($("die-2").value),
        d8: parseInt($("die-3").value),
        d100_tens: parseInt($("die-4").value),
        d20: parseInt($("die-5").value),
        d10: parseInt($("die-6").value),
        d6: parseInt($("die-7").value)
    };
    if ([roll.d4, roll.d10_0_9, roll.d8, roll.d100_tens, roll.d20, roll.d10, roll.d6].some(Number.isNaN)) {
        alert("Enter the result of all seven dice.");
        return;
    }
    if (
        roll.d4 < 1 || roll.d4 > 4 ||
        roll.d10_0_9 < 0 || roll.d10_0_9 > 9 ||
        roll.d8 < 1 || roll.d8 > 8 ||
        roll.d100_tens < 0 || roll.d100_tens > 90 || roll.d100_tens % 10 !== 0 ||
        roll.d20 < 1 || roll.d20 > 20 ||
        roll.d10 < 1 || roll.d10 > 10 ||
        roll.d6 < 1 || roll.d6 > 6
    ) {
        alert("One or more dice results are invalid.");
        return;
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
            description = `${team} — INCOMPLETE PASS`;
            game.down++; timeUsed = 12;
            if (game.down > 4) { description += " — TURNOVER ON DOWNS"; switchPossession(); flipField(); }
            break;
        case "sack":
            description = `${team} — SACK, LOSS OF ${Math.abs(outcome.yards)} YARDS`;
            game.yardLine += outcome.yards; game.distance += Math.abs(outcome.yards); game.down++; timeUsed = 25;
            if (game.down > 4) { description += " — TURNOVER ON DOWNS"; switchPossession(); flipField(); }
            break;
        case "interception":
            description = `INTERCEPTION! ${team} throws an interception.`;
            switchPossession(); flipField(); timeUsed = 20;
            break;
        case "fumble":
            description = `FUMBLE! ${team} fumbles the ball. ${teamName(other)} recovers!`;
            switchPossession(); flipField(); timeUsed = 25;
            break;
        case "big_play":
            description = `${team} — BIG PLAY for ${outcome.yards} yards!`;
            game.yardLine += outcome.yards; timeUsed = 30;
            if (outcome.yards >= game.distance) { game.down = 1; game.distance = 10; description += " — FIRST DOWN!"; }
            else { game.down++; game.distance -= outcome.yards; }
            break;
        case "penalty":
            description = `${team} — PENALTY, ${outcome.yards} YARD PENALTY`;
            game.yardLine -= outcome.yards; timeUsed = 10;
            break;
        case "punt":
            description = `${team} punts ${outcome.yards} yards.`;
            switchPossession();
            game.yardLine = 100 - (game.yardLine + outcome.yards);
            if (game.yardLine < 1) game.yardLine = 20;
            timeUsed = 15;
            break;
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
  currentWeek = parseInt(localStorage.getItem("mfl-current-week")) || 1;
  renderWeeklyGames();
  populateTeamSelects();
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
  const resetScheduleBtn = $("reset-schedule-btn");
  if (resetScheduleBtn) resetScheduleBtn.addEventListener("click", resetSchedule);
  $("back-to-standings").addEventListener("click", () => showScreen("standings-screen"));
});
