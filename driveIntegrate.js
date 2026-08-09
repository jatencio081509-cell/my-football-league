// Drive mode: dice → queue → step through plays (Next / Auto)
(function () {
  function DE() { return window.DriveEngine; }
  function F() { return window.FieldVisual; }
  function PS() { return window.PlayerSystem; }

  let pendingSteps = [];
  let stepIndex = 0;
  let autoMode = false;
  let autoTimer = null;
  let driveActive = false;

  const _createNewGame = window.createNewGame;
  window.createNewGame = function (home, away, scheduledGame) {
    const g = typeof _createNewGame === "function"
      ? _createNewGame(home, away, scheduledGame)
      : null;
    if (g) {
      g.driveStartYard = g.yardLine;
      g.driveStartAbs = null;
    }
    resetDriveUI();
    return g;
  };

  function markDriveStart() {
    if (!game) return;
    game.driveStartYard = game.yardLine;
    if (F()) game.driveStartAbs = F().absFromAway(game);
  }

  function setDriveControls(state) {
    // state: 'dice' | 'stepping' | 'idle'
    const diceBox = document.querySelector(".dice-inputs");
    const resolveBtn = document.getElementById("submit-dice-roll");
    const nextBtn = document.getElementById("next-play-btn");
    const autoBtn = document.getElementById("auto-play-btn");
    const status = document.getElementById("drive-status");

    if (state === "stepping") {
      if (diceBox) diceBox.style.opacity = "0.45";
      if (resolveBtn) resolveBtn.disabled = true;
      if (nextBtn) { nextBtn.disabled = false; nextBtn.classList.remove("hidden"); }
      if (autoBtn) { autoBtn.disabled = false; autoBtn.classList.remove("hidden"); }
      if (status) status.textContent = autoMode
        ? `Auto-playing… (${stepIndex + 1}/${pendingSteps.length})`
        : `Play ${stepIndex + 1} of ${pendingSteps.length} — press Next Play`;
    } else {
      if (diceBox) diceBox.style.opacity = "1";
      if (resolveBtn) resolveBtn.disabled = false;
      if (nextBtn) { nextBtn.disabled = true; }
      if (autoBtn) {
        autoBtn.disabled = true;
        autoBtn.textContent = "Auto Play";
      }
      autoMode = false;
      if (autoTimer) { clearTimeout(autoTimer); autoTimer = null; }
      if (status) status.textContent = "Roll dice and resolve a drive.";
    }
  }

  function resetDriveUI() {
    pendingSteps = [];
    stepIndex = 0;
    driveActive = false;
    autoMode = false;
    if (autoTimer) { clearTimeout(autoTimer); autoTimer = null; }
    setDriveControls("idle");
  }

  function applySpecial(special) {
    if (!special) return;
    switch (special) {
      case "td":
        if (game.possession === "home") game.homeScore += 7;
        else game.awayScore += 7;
        game.playLog.push("*** TOUCHDOWN — PAT good (+7) ***");
        switchPossession();
        game.yardLine = 25;
        markDriveStart();
        break;
      case "fg":
        if (game.possession === "home") game.homeScore += 3;
        else game.awayScore += 3;
        game.playLog.push("*** FIELD GOAL (+3) ***");
        switchPossession();
        game.yardLine = 25;
        markDriveStart();
        break;
      case "miss_fg":
        switchPossession();
        flipField();
        game.down = 1;
        game.distance = 10;
        markDriveStart();
        break;
      case "int":
      case "fumble":
      case "downs":
        switchPossession();
        flipField();
        game.down = 1;
        game.distance = 10;
        markDriveStart();
        break;
      case "safety":
        if (game.possession === "home") game.awayScore += 2;
        else game.homeScore += 2;
        game.playLog.push("*** SAFETY (+2) ***");
        switchPossession();
        game.yardLine = 25;
        game.down = 1;
        game.distance = 10;
        markDriveStart();
        break;
      default:
        break;
    }
  }

  function applyStats(step) {
    if (!PS() || !step.statPatches) return;
    step.statPatches.forEach(sp => {
      if (sp && sp.team && sp.player && sp.patch) {
        PS().addStat(sp.team, sp.player, sp.patch);
      }
    });
  }

  function applyPlayStep(step) {
    if (!game || game.gameOver) return;

    applyStats(step);

    if (step.special === "punt") {
      const afterKick = game.yardLine + step.yards;
      game.playLog.push(step.text);
      switchPossession();
      let spot = 100 - afterKick;
      if (spot < 1) spot = 20;
      if (spot > 80) spot = 20;
      game.yardLine = spot;
      game.down = 1;
      game.distance = 10;
      markDriveStart();
      applyTime(step.time);
      updateUI();
      return;
    }

    if (step.special !== "fg" && step.special !== "miss_fg" && step.special !== "int" && step.special !== "fumble") {
      game.yardLine += step.yards;
      if (game.yardLine < 0) game.yardLine = 0;
      if (game.yardLine > 100) game.yardLine = 100;

      if (!step.special) {
        if (step.yards >= game.distance) {
          game.down = 1;
          game.distance = 10;
          if (game.yardLine >= 90) game.distance = Math.max(1, 100 - game.yardLine);
        } else {
          game.down += 1;
          game.distance -= step.yards;
          if (game.distance < 1) game.distance = 1;
        }
      }
    }

    game.playLog.push(step.text + (step.time ? `  (−${step.time}s)` : ""));

    if (step.special === "td") game.yardLine = 100;

    applySpecial(step.special);
    applyTime(step.time);
    updateUI();
  }

  function finishDrive() {
    driveActive = false;
    pendingSteps = [];
    stepIndex = 0;
    setDriveControls("idle");
  }

  function advanceOnePlay() {
    if (!driveActive || !game || game.gameOver) {
      finishDrive();
      return;
    }
    if (stepIndex >= pendingSteps.length) {
      finishDrive();
      return;
    }
    applyPlayStep(pendingSteps[stepIndex]);
    stepIndex += 1;
    if (stepIndex >= pendingSteps.length || game.gameOver) {
      finishDrive();
      return;
    }
    setDriveControls("stepping");
    if (autoMode) {
      autoTimer = setTimeout(advanceOnePlay, 700);
    }
  }

  window.processDrive = function () {
    if (!game || game.gameOver || driveActive) return;
    if (!DE()) {
      alert("Drive engine failed to load.");
      return;
    }

    const roll = {
      d4: parseInt(document.getElementById("die-1").value, 10),
      d10_0_9: parseInt(document.getElementById("die-2").value, 10),
      d8: parseInt(document.getElementById("die-3").value, 10),
      d100_tens: parseInt(document.getElementById("die-4").value, 10),
      d20: parseInt(document.getElementById("die-5").value, 10),
      d10: parseInt(document.getElementById("die-6").value, 10),
      d6: parseInt(document.getElementById("die-7").value, 10)
    };
    if (Object.values(roll).some(Number.isNaN)) {
      alert("Enter all seven dice for this drive.");
      return;
    }

    markDriveStart();

    const outcome = DE().resolveDriveFromDice(roll, game);
    const title = DE().outcomeTitle(outcome.id);
    let header = "——— " + title + " ——-";
    if (outcome.oRating != null) {
      header += `  (Off ${outcome.oRating} vs Def ${outcome.dRating})`;
    }
    game.playLog.push(header);
    if (window.formatDiceRoll) game.playLog.push("Dice: " + formatDiceRoll(roll));

    pendingSteps = DE().generatePlays(game, outcome);
    stepIndex = 0;
    driveActive = true;
    autoMode = false;

    ["die-1", "die-2", "die-3", "die-4", "die-5", "die-6", "die-7"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });

    updateUI();
    setDriveControls("stepping");
  };

  window.addEventListener("DOMContentLoaded", () => {
    // Ensure depth charts
    if (PS()) PS().applyDepthCharts();

    // Inject control row if missing
    const playEntry = document.querySelector(".play-entry");
    if (playEntry && !document.getElementById("next-play-btn")) {
      const row = document.createElement("div");
      row.className = "drive-controls";
      row.innerHTML = `
        <p id="drive-status" class="drive-status">Roll dice and resolve a drive.</p>
        <div class="drive-control-buttons">
          <button id="next-play-btn" class="btn primary" disabled>Next Play</button>
          <button id="auto-play-btn" class="btn" disabled>Auto Play</button>
        </div>`;
      const submit = document.getElementById("submit-dice-roll");
      if (submit && submit.parentNode) {
        submit.parentNode.insertBefore(row, submit.nextSibling);
      } else {
        playEntry.appendChild(row);
      }
    }

    const rollBtn = document.getElementById("roll-play-btn");
    const submitBtn = document.getElementById("submit-dice-roll");

    if (rollBtn) {
      const clone = rollBtn.cloneNode(true);
      rollBtn.parentNode.replaceChild(clone, rollBtn);
      clone.textContent = "Fill random (test)";
      clone.addEventListener("click", () => {
        if (!window.rollAllDice) return;
        const r = rollAllDice();
        document.getElementById("die-1").value = r.d4;
        document.getElementById("die-2").value = r.d10_0_9;
        document.getElementById("die-3").value = r.d8;
        document.getElementById("die-4").value = r.d100_tens;
        document.getElementById("die-5").value = r.d20;
        document.getElementById("die-6").value = r.d10;
        document.getElementById("die-7").value = r.d6;
      });
    }

    if (submitBtn) {
      const clone2 = submitBtn.cloneNode(true);
      submitBtn.parentNode.replaceChild(clone2, submitBtn);
      clone2.id = "submit-dice-roll";
      clone2.textContent = "Resolve Drive";
      clone2.addEventListener("click", () => window.processDrive());
    }

    const nextBtn = document.getElementById("next-play-btn");
    const autoBtn = document.getElementById("auto-play-btn");
    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        if (autoMode) return;
        advanceOnePlay();
      });
    }
    if (autoBtn) {
      autoBtn.addEventListener("click", () => {
        if (!driveActive) return;
        autoMode = !autoMode;
        autoBtn.textContent = autoMode ? "Pause Auto" : "Auto Play";
        if (autoMode) advanceOnePlay();
        else if (autoTimer) { clearTimeout(autoTimer); autoTimer = null; }
        setDriveControls("stepping");
      });
    }

    const h3 = document.querySelector(".play-entry h3");
    if (h3) h3.textContent = "Roll for Drive";
    const instr = document.querySelector(".dice-instructions");
    if (instr) {
      instr.textContent =
        "Roll once per drive. Then use Next Play to step through, or Auto Play to run them out. Clock still ticks per play type.";
    }

    // Style for controls
    if (!document.getElementById("drive-ctrl-style")) {
      const s = document.createElement("style");
      s.id = "drive-ctrl-style";
      s.textContent = `
        .drive-controls { margin: 14px 0 10px; }
        .drive-status { color: var(--text-muted, #a8bdd0); margin-bottom: 8px; font-size: 0.9rem; }
        .drive-control-buttons { display: flex; gap: 10px; flex-wrap: wrap; }
      `;
      document.head.appendChild(s);
    }
  });
})();
