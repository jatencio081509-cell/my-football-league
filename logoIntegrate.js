// Runs after renderer.js — logos, week lock, playoffs, field visual
(function () {
  function L() { return window.MFLLogos; }
  function P() { return window.Playoffs; }
  function F() { return window.FieldVisual; }

  window.renderWeeklyGames = function () {
    const container = document.getElementById("weekly-games");
    if (!container) return;
    container.innerHTML = "";
    const label = document.getElementById("current-week-label");
    if (label) label.textContent = currentWeek;

    const banner = document.getElementById("week-lock-banner");
    const unlocked = P() ? P().canPlayWeek(currentWeek) : true;

    if (banner) {
      if (!unlocked) {
        banner.classList.remove("hidden");
        banner.classList.remove("week-complete");
        banner.innerHTML =
          `<strong>Week ${currentWeek} is locked.</strong> ` +
          `Finish every game in Week ${currentWeek - 1} before these games can be played.`;
      } else {
        const weekGamesCheck = schedule.filter(g => g.week === currentWeek);
        const done = weekGamesCheck.length && weekGamesCheck.every(g => g.played);
        if (done) {
          banner.classList.remove("hidden");
          banner.innerHTML = `<strong>Week ${currentWeek} complete.</strong> All results are in — next week is unlocked.`;
          banner.classList.add("week-complete");
        } else {
          banner.classList.add("hidden");
          banner.classList.remove("week-complete");
        }
      }
    }

    const weekGames = schedule.filter(g => g.week === currentWeek);
    const byeKeys = teamsOnByeByWeek[String(currentWeek)] || teamsOnByeByWeek[currentWeek] || [];

    if (weekGames.length === 0 && byeKeys.length === 0) {
      container.innerHTML = `<div class="empty-note">No games scheduled for Week ${currentWeek}.</div>`;
      return;
    }

    weekGames.forEach(scheduledGame => {
      const card = document.createElement("div");
      card.className = "week-game-card" + (!unlocked && !scheduledGame.played ? " locked-game" : "");
      const awayName = teamName(scheduledGame.away);
      const homeName = teamName(scheduledGame.home);
      const awayLogo = L() ? L().slotHTML(scheduledGame.away, "logo-slot-md") : "";
      const homeLogo = L() ? L().slotHTML(scheduledGame.home, "logo-slot-md") : "";

      if (scheduledGame.played) {
        card.innerHTML =
          `<div class="game-teams">${awayLogo}<strong>${awayName}</strong><span class="game-score">${scheduledGame.awayScore}</span></div>` +
          `<div class="game-final">FINAL</div>` +
          `<div class="game-teams">${homeLogo}<strong>${homeName}</strong><span class="game-score">${scheduledGame.homeScore}</span></div>`;
      } else if (!unlocked) {
        card.innerHTML =
          `<div class="game-teams">${awayLogo}<strong>${awayName}</strong></div>` +
          `<div class="game-vs">@</div>` +
          `<div class="game-teams">${homeLogo}<strong>${homeName}</strong></div>` +
          `<button class="btn play-scheduled-game" disabled>Locked</button>`;
      } else {
        card.innerHTML =
          `<div class="game-teams">${awayLogo}<strong>${awayName}</strong></div>` +
          `<div class="game-vs">@</div>` +
          `<div class="game-teams">${homeLogo}<strong>${homeName}</strong></div>` +
          `<button class="btn primary play-scheduled-game">Play Game</button>`;
        card.querySelector(".play-scheduled-game").addEventListener("click", () => {
          if (P() && !P().canPlayWeek(currentWeek)) {
            alert(`Finish all Week ${currentWeek - 1} games first.`);
            return;
          }
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
      byeBox.style.borderColor = "#6b8499";
      byeBox.innerHTML =
        `<div style="color:#a8bdd0;font-weight:600;margin-bottom:6px">BYE WEEK</div>` +
        `<div style="color:#e2e8f0">${byeKeys.map(teamNameFromKey).join(" · ")}</div>`;
      container.appendChild(byeBox);
    }
  };

  const _updateUI = window.updateUI;
  window.updateUI = function () {
    if (typeof _updateUI === "function") _updateUI();
    if (!game) return;

    if (L()) {
      L().fillTeamSlot(document.getElementById("away-logo-slot"), game.away);
      L().fillTeamSlot(document.getElementById("home-logo-slot"), game.home);
    }
    const awayLab = document.getElementById("field-away-label");
    const homeLab = document.getElementById("field-home-label");
    if (awayLab && game.away) awayLab.textContent = game.away.name.toUpperCase();
    if (homeLab && game.home) homeLab.textContent = game.home.name.toUpperCase();

    // Move ball + first-down line after every play
    if (F()) F().update(game);
  };

  const _openTeamPage = window.openTeamPage;
  window.openTeamPage = function (teamIndex) {
    if (typeof _openTeamPage === "function") _openTeamPage(teamIndex);
    const team = TEAMS[teamIndex];
    if (team && L()) L().fillTeamSlot(document.getElementById("team-page-logo-slot"), team);
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

  const _showScreen = window.showScreen;
  window.showScreen = function (id) {
    if (typeof _showScreen === "function") _showScreen(id);
    if (id === "playoffs-screen" && P()) P().renderPlayoffs();
    if (id === "game-screen" && game && F()) F().update(game);
  };

  window.addEventListener("DOMContentLoaded", () => {
    if (L()) {
      L().startLoadingScreen();
      L().fillAppLogos();
    }
    if (F()) F().ensureStructure();
    if (typeof window.renderWeeklyGames === "function") {
      window.renderWeeklyGames();
    }
  });
})();
