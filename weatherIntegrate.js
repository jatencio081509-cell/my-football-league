// Weather integration: kickoff time + city weather on game start
(function () {
  function WS() { return window.WeatherSystem; }

  function ensureWeatherBar() {
    let bar = document.getElementById("game-weather-bar");
    if (bar) return bar;
    const scoreboard = document.querySelector("#game-screen .scoreboard");
    if (!scoreboard || !scoreboard.parentNode) return null;
    bar = document.createElement("div");
    bar.id = "game-weather-bar";
    bar.className = "game-weather-bar";
    bar.innerHTML = `
      <div class="wx-when"><span class="wx-label">KICKOFF</span> <span id="wx-kickoff">—</span></div>
      <div class="wx-cond"><span class="wx-label">WEATHER</span> <span id="wx-condition">—</span></div>
      <div class="wx-temp"><span class="wx-label">TEMP</span> <span id="wx-temp">—</span></div>
      <div class="wx-note" id="wx-note"></div>
    `;
    scoreboard.parentNode.insertBefore(bar, scoreboard.nextSibling);
    return bar;
  }

  function renderWeather(g) {
    ensureWeatherBar();
    const kick = document.getElementById("wx-kickoff");
    const cond = document.getElementById("wx-condition");
    const temp = document.getElementById("wx-temp");
    const note = document.getElementById("wx-note");
    if (!g || !g.weather) {
      if (kick) kick.textContent = "—";
      if (cond) cond.textContent = "—";
      if (temp) temp.textContent = "—";
      if (note) note.textContent = "";
      return;
    }
    const w = g.weather;
    if (kick) kick.textContent = (g.kickoff && g.kickoff.display) || "—";
    if (cond) cond.textContent = `${w.icon || ""} ${w.label}`.trim();
    if (temp) temp.textContent = `${w.tempF}°F`;
    if (note) note.textContent = w.note || "";

    const bar = document.getElementById("game-weather-bar");
    if (bar) {
      bar.className = "game-weather-bar wx-" + (w.condition || "clear");
    }
  }

  // Wrap createNewGame
  const prevCreate = window.createNewGame;
  window.createNewGame = function (home, away, scheduledGame) {
    const g = typeof prevCreate === "function"
      ? prevCreate(home, away, scheduledGame)
      : null;
    if (!g) return g;

    if (WS()) {
      g.weather = WS().rollWeather(home);
      g.kickoff = WS().kickoffFor(scheduledGame);
      g.playLog = g.playLog || [];
      g.playLog.unshift(
        `Kickoff: ${g.kickoff.display} · ${g.weather.icon} ${g.weather.label}, ${g.weather.tempF}°F in ${home.city}`
      );
      if (g.weather.note) {
        g.playLog.push(`Weather note: ${g.weather.note}`);
      }
    }
    setTimeout(() => renderWeather(g), 0);
    return g;
  };

  // Patch drive outcome weights with weather
  function patchDriveEngine() {
    const DE = window.DriveEngine;
    if (!DE || DE.__weatherPatched) return;
    const orig = DE.resolveDriveFromDice.bind(DE);
    DE.resolveDriveFromDice = function (roll, game) {
      // Temporarily apply weather by intercepting weight build:
      // Call original after monkey-patching apply inside via weather on game
      const result = orig(roll, game);
      // Re-roll outcome with weather if system present — cleaner: rebuild weights
      if (!WS() || !game || !game.weather) return result;

      // Rebuild the same way as DriveEngine but with weather
      const combinationIndex =
        ((((((roll.d4 - 1) * 10 + roll.d10_0_9)
        * 8 + (roll.d8 - 1))
        * 10 + (roll.d100_tens / 10))
        * 20 + (roll.d20 - 1))
        * 10 + (roll.d10 - 1))
        * 6 + (roll.d6 - 1);
      const position = combinationIndex / 3840000;

      const PS = window.PlayerSystem;
      const off = game.possession === "home" ? game.home : game.away;
      const def = game.possession === "home" ? game.away : game.home;
      const oRating = PS ? PS.offenseOverall(off) : 75;
      const dRating = PS ? PS.defenseOverall(def) : 75;
      const edge = (oRating - dRating) / 100;
      const yl = game.yardLine;
      const fgOk = yl >= 60;
      const deepOwn = yl <= 20;
      const redZone = yl >= 80;
      const late = (game.clockSeconds <= 35) || ((game.quarter === 2 || game.quarter >= 4) && game.clockSeconds <= 55);

      let w = {
        touchdown: 0.18 + edge * 0.12 + (redZone ? 0.12 : 0),
        field_goal: 0.10 + (fgOk ? 0.10 : 0.04) + (late && fgOk ? 0.08 : 0),
        missed_fg: 0.03 + (fgOk ? 0.02 : 0),
        punt: 0.28 - edge * 0.08,
        turnover_int: 0.07 - edge * 0.04,
        turnover_fumble: 0.05,
        turnover_downs: 0.10 - edge * 0.03,
        safety: deepOwn ? 0.03 : 0.005,
        big_stop_punt: 0.06 - edge * 0.02
      };
      if (!deepOwn) w.safety = 0.005;
      if (yl < 35) w.touchdown *= 0.55;

      WS().applyToWeights(w, game.weather);

      let sum = Object.values(w).reduce((a, b) => a + Math.max(0, b), 0);
      if (sum <= 0) return result;
      const entries = Object.keys(w).map(id => ({ id, weight: Math.max(0, w[id]) / sum }));
      let run = 0;
      let pick = entries[entries.length - 1];
      for (const row of entries) {
        run += row.weight;
        if (position < run) { pick = row; break; }
      }
      return { id: pick.id, position, oRating, dRating, weather: game.weather.condition };
    };
    DE.__weatherPatched = true;
  }

  // Also bias intermediate play types slightly in rain/snow toward runs / incompletions
  function patchMakePlay() {
    const DE = window.DriveEngine;
    if (!DE || DE.__wxPlayPatched) return;
    const origRandom = DE.randomSnap && DE.randomSnap.bind(DE);
    if (!origRandom) return;
    DE.randomSnap = function (game, preferShort) {
      const play = origRandom(game, preferShort);
      if (!game || !game.weather) return play;
      const c = game.weather.condition;
      // In rain/snow, slightly more run-heavy series already handled by outcome weights;
      // add flavor to log header only when drive starts.
      return play;
    };
    DE.__wxPlayPatched = true;
  }

  // Keep weather bar updated with UI
  function hookUI() {
    const prev = window.updateUI;
    if (typeof prev !== "function" || prev.__wxUI) return;
    function wrapped() {
      prev.apply(this, arguments);
      try {
        if (typeof game !== "undefined" && game) renderWeather(game);
      } catch (e) {}
    }
    wrapped.__wxUI = true;
    window.updateUI = wrapped;
  }

  window.addEventListener("DOMContentLoaded", () => {
    ensureWeatherBar();
    patchDriveEngine();
    patchMakePlay();
    hookUI();
    setTimeout(patchDriveEngine, 50);
    setTimeout(hookUI, 100);

    if (document.getElementById("wx-style")) return;
    const s = document.createElement("style");
    s.id = "wx-style";
    s.textContent = `
      .game-weather-bar {
        display: flex;
        flex-wrap: wrap;
        gap: 12px 20px;
        align-items: center;
        margin: 10px 0 12px;
        padding: 10px 14px;
        border-radius: 10px;
        background: #0d1a24;
        border: 1px solid #1E7B44;
        font-size: 0.9rem;
      }
      .game-weather-bar .wx-label {
        font-size: 0.65rem;
        font-weight: 800;
        letter-spacing: 0.8px;
        color: #FDB813;
        margin-right: 6px;
      }
      .game-weather-bar .wx-note {
        flex-basis: 100%;
        color: #a8bdd0;
        font-size: 0.82rem;
        margin-top: 2px;
      }
      .game-weather-bar.wx-rain { border-color: #3b82f6; background: #0c1929; }
      .game-weather-bar.wx-snow { border-color: #93c5fd; background: #0f172a; }
      .game-weather-bar.wx-wind { border-color: #94a3b8; }
      .game-weather-bar.wx-clear { border-color: #FDB813; }
      .game-weather-bar.wx-cloudy { border-color: #6b8499; }
    `;
    document.head.appendChild(s);
  });
})();
