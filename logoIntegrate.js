// Runs after renderer.js — upgrades UI with logo slots + starts loading screen
(function () {
  function L() { return window.MFLLogos; }

  const _renderWeeklyGames = window.renderWeeklyGames;
  window.renderWeeklyGames = function () {
    const container = document.getElementById("weekly-games");
    if (!container) return;
    container.innerHTML = "";
    const label = document.getElementById("current-week-label");
    if (label) label.textContent = currentWeek;

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
      const awayLogo = L() ? L().slotHTML(scheduledGame.away, "logo-slot-md") : "";
      const homeLogo = L() ? L().slotHTML(scheduledGame.home, "logo-slot-md") : "";
      if (scheduledGame.played) {
        card.innerHTML =
          `<div class="game-teams">${awayLogo}<strong>${awayName}</strong><span class="game-score">${scheduledGame.awayScore}</span></div>` +
          `<div class="game-final">FINAL</div>` +
          `<div class="game-teams">${homeLogo}<strong>${homeName}</strong><span class="game-score">${scheduledGame.homeScore}</span></div>`;
      } else {
        card.innerHTML =
          `<div class="game-teams">${awayLogo}<strong>${awayName}</strong></div>` +
          `<div class="game-vs">@</div>` +
          `<div class="game-teams">${homeLogo}<strong>${homeName}</strong></div>` +
          `<button class="btn primary play-scheduled-game">Play Game</button>`;
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
      byeBox.innerHTML =
        `<div style="color:#94a3b8;font-weight:600;margin-bottom:6px">BYE WEEK</div>` +
        `<div style="color:#e2e8f0">${byeKeys.map(teamNameFromKey).join(" · ")}</div>`;
      container.appendChild(byeBox);
    }
  };

  const _updateUI = window.updateUI;
  window.updateUI = function () {
    if (typeof _updateUI === "function") _updateUI();
    if (!game || !L()) return;
    L().fillTeamSlot(document.getElementById("away-logo-slot"), game.away);
    L().fillTeamSlot(document.getElementById("home-logo-slot"), game.home);
    const awayLab = document.getElementById("field-away-label");
    const homeLab = document.getElementById("field-home-label");
    if (awayLab && game.away) awayLab.textContent = game.away.name.toUpperCase();
    if (homeLab && game.home) homeLab.textContent = game.home.name.toUpperCase();
  };

  const _openTeamPage = window.openTeamPage;
  window.openTeamPage = function (teamIndex) {
    if (typeof _openTeamPage === "function") _openTeamPage(teamIndex);
    const team = TEAMS[teamIndex];
    if (team && L()) L().fillTeamSlot(document.getElementById("team-page-logo-slot"), team);
  };

  const _renderSchedule = window.renderSchedule;
  window.renderSchedule = function () {
    if (typeof _renderSchedule === "function") _renderSchedule();
    // Enhance existing schedule rows with logos if missing
    if (!L()) return;
    document.querySelectorAll(".schedule-game").forEach(row => {
      if (row.querySelector(".logo-slot")) return;
      // leave original schedule text; weekly + team page carry the main logos
    });
  };

  const _renderStandings = window.renderStandings;
  window.renderStandings = function () {
    if (typeof _renderStandings === "function") _renderStandings();
    if (!L()) return;
    document.querySelectorAll(".team-name-cell").forEach(cell => {
      if (cell.querySelector(".logo-slot")) return;
      const name = (cell.textContent || "").trim();
      const team = TEAMS.find(t => teamName(t) === name);
      if (!team) return;
      const wrap = document.createElement("span");
      wrap.style.cssText = "display:inline-flex;align-items:center;gap:8px";
      wrap.innerHTML = L().slotHTML(team, "logo-slot-xs") + `<span>${name}</span>`;
      cell.textContent = "";
      cell.appendChild(wrap);
    });
  };

  window.addEventListener("DOMContentLoaded", () => {
    if (L()) {
      L().startLoadingScreen();
      L().fillAppLogos();
    }
    // Re-render weekly games with logos after our override is in place
    if (typeof window.renderWeeklyGames === "function") {
      window.renderWeeklyGames();
    }
  });
})();
