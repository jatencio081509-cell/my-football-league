// ============================================
// TEAM DATA
// ============================================
const TEAMS = [
  { city: "Boston", name: "Oceans", state: "MA" },
  { city: "Denver", name: "Mountaineers", state: "CO" },
  { city: "Louisville", name: "Chickens", state: "KY" },
  { city: "Honolulu", name: "Stars", state: "HI" },
  { city: "Austin", name: "Bullriders", state: "TX" },
  { city: "New York", name: "Emperors", state: "NY" },
  { city: "Buffalo", name: "Beavers", state: "NY" },
  { city: "Portland", name: "Wildcats", state: "OR" },
  { city: "Oklahoma City", name: "Brawlers", state: "OK" },
  { city: "Detroit", name: "Wolverines", state: "MI" },
  { city: "Minneapolis", name: "Lakers", state: "MN" },
  { city: "Washington", name: "Presidents", state: "DC" },
  { city: "Huntsville", name: "Rockets", state: "AL" },
  { city: "Anchorage", name: "Snowcaps", state: "AK" },
  { city: "New Orleans", name: "Pelicans", state: "LA" },
  { city: "Salt Lake City", name: "Bees", state: "UT" },
  { city: "Burlington", name: "Foresters", state: "VT" },
  { city: "Sacramento", name: "Goldnuggets", state: "CA" },
  { city: "Los Angeles", name: "Rangers", state: "CA" },
  { city: "Miami", name: "Billionaires", state: "FL" },
  { city: "Houston", name: "Flyers", state: "TX" },
  { city: "Billings", name: "Pirates", state: "MT" },
  { city: "Lincoln", name: "Cornhusks", state: "NE" },
  { city: "Madison", name: "Badgers", state: "WI" },
  { city: "Cheyenne", name: "Towers", state: "WY" },
  { city: "Las Vegas", name: "Bluejays", state: "NV" },
  { city: "Manchester", name: "Finches", state: "NH" },
  { city: "Jackson", name: "Magnolias", state: "MS" },
  { city: "Kansas City", name: "Borders", state: "MO" },
  { city: "Indianapolis", name: "Racers", state: "IN" },
  { city: "Seattle", name: "Tree Bearers", state: "WA" },
  { city: "Charleston", name: "Cardinals", state: "WV" },
];

function teamName(team) {
  return `${team.city} ${team.name}`;
}

// ============================================
// GAME STATE
// ============================================
let game = null;

function createNewGame(home, away) {
  return {
    home,
    away,
    homeScore: 0,
    awayScore: 0,
    quarter: 1,
    clockSeconds: 15 * 60,
    possession: "home", // home or away
    down: 1,
    distance: 10,
    yardLine: 25,
    playLog: [`Game started: ${teamName(away)} at ${teamName(home)}`, "Kickoff — ball at the 25"],
    gameOver: false
  };
}

// ============================================
// UI HELPERS
// ============================================
function $(id) {
  return document.getElementById(id);
}

function populateTeamSelects() {
  const awaySelect = $("away-select");
  const homeSelect = $("home-select");

  TEAMS.forEach((team, i) => {
    const opt1 = document.createElement("option");
    opt1.value = i;
    opt1.textContent = teamName(team);
    awaySelect.appendChild(opt1);

    const opt2 = document.createElement("option");
    opt2.value = i;
    opt2.textContent = teamName(team);
    homeSelect.appendChild(opt2);
  });

  // Default to different teams
  awaySelect.value = 0;
  homeSelect.value = 1;
}

function clockDisplay(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function fieldPosDisplay(yardLine) {
  if (yardLine <= 50) return `Own ${yardLine}`;
  return `Opponent ${100 - yardLine}`;
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

  // Play log
  const log = $("log-content");
  log.innerHTML = "";
  game.playLog.slice().reverse().forEach(entry => {
    const div = document.createElement("div");
    div.textContent = entry;
    log.appendChild(div);
  });
}

function showScreen(id) {
  $("setup-screen").classList.add("hidden");
  $("game-screen").classList.add("hidden");
  $(id).classList.remove("hidden");
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
    } else {
      game.quarter += 1;
      game.clockSeconds = 15 * 60;
      game.playLog.push(`--- End of Quarter ${game.quarter - 1} ---`);
    }
  }
}

function switchPossession() {
  game.possession = game.possession === "home" ? "away" : "home";
  game.down = 1;
  game.distance = 10;
}

function flipField() {
  game.yardLine = 100 - game.yardLine;
  if (game.yardLine < 1) game.yardLine = 20;
  if (game.yardLine > 99) game.yardLine = 80;
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
    case "run":
      description = `${team} run for ${yards} yards`;
      game.yardLine += yards;
      timeUsed = 35;
      break;
    case "pass_complete":
      description = `${team} pass complete for ${yards} yards`;
      game.yardLine += yards;
      timeUsed = 28;
      break;
    case "pass_incomplete":
      description = `${team} pass incomplete`;
      timeUsed = 12;
      yards = 0;
      break;
    case "sack":
      description = `${team} sacked for a loss of ${Math.abs(yards)} yards`;
      game.yardLine += yards; // should be negative
      timeUsed = 25;
      break;
    case "interception":
      description = `INTERCEPTION by ${teamName(other)}!`;
      switchPossession();
      flipField();
      timeUsed = 20;
      break;
    case "fumble":
      description = `FUMBLE recovered by ${teamName(other)}!`;
      switchPossession();
      flipField();
      timeUsed = 25;
      break;
    case "punt":
      description = `${team} punts`;
      switchPossession();
      game.yardLine = 100 - (game.yardLine + 40);
      if (game.yardLine < 1) game.yardLine = 20;
      timeUsed = 15;
      break;
    case "fg_made":
      description = `FIELD GOAL is GOOD! (+3 ${team})`;
      if (game.possession === "home") game.homeScore += 3;
      else game.awayScore += 3;
      switchPossession();
      game.yardLine = 25;
      timeUsed = 10;
      break;
    case "fg_missed":
      description = `Field goal is NO GOOD`;
      switchPossession();
      flipField();
      timeUsed = 10;
      break;
    case "touchdown":
      description = `TOUCHDOWN ${team}!!!`;
      if (game.possession === "home") game.homeScore += 6;
      else game.awayScore += 6;
      timeUsed = 15;
      break;
    case "xp_good":
      description = `Extra point is GOOD`;
      if (game.possession === "home") game.homeScore += 1;
      else game.awayScore += 1;
      switchPossession();
      game.yardLine = 25;
      timeUsed = 5;
      break;
    case "xp_missed":
      description = `Extra point is MISSED`;
      switchPossession();
      game.yardLine = 25;
      timeUsed = 5;
      break;
    case "two_pt_good":
      description = `2-POINT CONVERSION SUCCESSFUL!`;
      if (game.possession === "home") game.homeScore += 2;
      else game.awayScore += 2;
      switchPossession();
      game.yardLine = 25;
      timeUsed = 8;
      break;
    case "two_pt_failed":
      description = `2-point conversion FAILED`;
      switchPossession();
      game.yardLine = 25;
      timeUsed = 8;
      break;
    case "safety":
      description = `SAFETY! (+2 ${teamName(other)})`;
      if (game.possession === "home") game.awayScore += 2;
      else game.homeScore += 2;
      switchPossession();
      game.yardLine = 25;
      timeUsed = 10;
      break;
  }

  // Update downs for normal offensive plays
  if (["run", "pass_complete", "pass_incomplete", "sack"].includes(playType)) {
    if (yards >= game.distance) {
      game.down = 1;
      game.distance = 10;
      description += " — FIRST DOWN!";
    } else {
      game.down += 1;
      game.distance -= yards;
      if (game.down > 4) {
        description += " — TURNOVER ON DOWNS";
        switchPossession();
        flipField();
      }
    }
  }

  // Keep yard line in bounds
  if (game.yardLine < 0) game.yardLine = 0;
  if (game.yardLine > 100) game.yardLine = 100;

  game.playLog.push(description);
  applyTime(timeUsed);
  updateUI();

  if (game.gameOver) {
    alert(`Final Score\n${teamName(game.away)} ${game.awayScore}  -  ${game.homeScore} ${teamName(game.home)}`);
  }
}

// ============================================
// EVENT LISTENERS
// ============================================
window.addEventListener("DOMContentLoaded", () => {
  populateTeamSelects();

  $("start-btn").addEventListener("click", () => {
    const awayIdx = parseInt($("away-select").value);
    const homeIdx = parseInt($("home-select").value);

    if (awayIdx === homeIdx) {
      alert("Home and Away teams must be different!");
      return;
    }

    game = createNewGame(TEAMS[homeIdx], TEAMS[awayIdx]);
    updateUI();
    showScreen("game-screen");
  });

  $("submit-play").addEventListener("click", processPlay);

  $("end-game-btn").addEventListener("click", () => {
    if (game) {
      game.gameOver = true;
      game.playLog.push("Game ended early.");
      updateUI();
      alert(`Final Score\n${teamName(game.away)} ${game.awayScore}  -  ${game.homeScore} ${teamName(game.home)}`);
    }
  });

  $("new-game-btn").addEventListener("click", () => {
    game = null;
    showScreen("setup-screen");
  });
});
