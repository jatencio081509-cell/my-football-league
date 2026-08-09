// Drive mode: one dice roll → drive result → auto plays (clock still ticks)
(function () {
  function DE() { return window.DriveEngine; }
  function F() { return window.FieldVisual; }

  let driveBusy = false;

  // Track drive start when game is created / possession changes
  const _createNewGame = window.createNewGame;
  window.createNewGame = function (home, away, scheduledGame) {
    const g = typeof _createNewGame === "function"
      ? _createNewGame(home, away, scheduledGame)
      : null;
    if (g) {
      g.driveStartYard = g.yardLine;
      g.driveStartAbs = null; // filled by FieldVisual
    }
    return g;
  };

  function markDriveStart() {
    if (!game) return;
    game.driveStartYard = game.yardLine;
    if (F()) {
      game.driveStartAbs = F().absFromAway(game);
    }
  }

  function applySpecial(special) {
    if (!special) return;
    switch (special) {
      case "td":
        if (game.possession === "home") game.homeScore += 7;
        else game.awayScore += 7;
        game.playLog.push("*** TOUCHDOWN — PAT good (+7) ***");
        // Kickoff the other way
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
        // Opponent takes over roughly at the LOS (spot of kick ~ current)
        switchPossession();
        flipField();
        game.down = 1;
        game.distance = 10;
        markDriveStart();
        break;
      case "punt": {
        // yards already in step; treat yardLine advance as punt distance then flip
        // process step already added yards toward opponent; for punt we set field after
        break;
      }
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

  function applyPlayStep(step) {
    if (!game || game.gameOver) return;

    if (step.special === "punt") {
      // Net field after punt: from current LOS, ball travels step.yards, then possession flips
      const afterKick = game.yardLine + step.yards;
      game.playLog.push(step.text);
      switchPossession();
      // Opponent field position from their own goal
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

    // Normal yardage
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
          if (game.down > 4 && !step.special) {
            // safety net
            step.special = "downs";
          }
        }
      }
    }

    game.playLog.push(step.text);

    if (step.special === "td") {
      game.yardLine = 100;
    }

    applySpecial(step.special);
    applyTime(step.time);
    updateUI();
  }

  function runDriveSequence(steps, i) {
    if (!game || game.gameOver || i >= steps.length) {
      driveBusy = false;
      const btn = document.getElementById("submit-dice-roll");
      if (btn) btn.disabled = false;
      return;
    }
    applyPlayStep(steps[i]);
    setTimeout(() => runDriveSequence(steps, i + 1), 650);
  }

  window.processDrive = function () {
    if (!game || game.gameOver || driveBusy) return;
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

    driveBusy = true;
    const btn = document.getElementById("submit-dice-roll");
    if (btn) btn.disabled = true;

    // Drive starts here
    markDriveStart();

    const outcome = DE().resolveDriveFromDice(roll, game);
    const title = DE().outcomeTitle(outcome.id);
    game.playLog.push("——— " + title + " ——-");
    if (window.formatDiceRoll) {
      game.playLog.push("Dice: " + formatDiceRoll(roll));
    }

    const steps = DE().generatePlays(game, outcome);
    ["die-1", "die-2", "die-3", "die-4", "die-5", "die-6", "die-7"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });

    updateUI();
    runDriveSequence(steps, 0);
  };

  // Replace old per-play handlers
  window.addEventListener("DOMContentLoaded", () => {
    const rollBtn = document.getElementById("roll-play-btn");
    const submitBtn = document.getElementById("submit-dice-roll");
    if (rollBtn) {
      const clone = rollBtn.cloneNode(true);
      rollBtn.parentNode.replaceChild(clone, rollBtn);
      clone.addEventListener("click", () => {
        // optional: still allow random fill if they want
        if (window.rollAllDice) {
          const r = rollAllDice();
          document.getElementById("die-1").value = r.d4;
          document.getElementById("die-2").value = r.d10_0_9;
          document.getElementById("die-3").value = r.d8;
          document.getElementById("die-4").value = r.d100_tens;
          document.getElementById("die-5").value = r.d20;
          document.getElementById("die-6").value = r.d10;
          document.getElementById("die-7").value = r.d6;
        }
      });
      clone.textContent = "Fill random (test)";
    }
    if (submitBtn) {
      const clone2 = submitBtn.cloneNode(true);
      submitBtn.parentNode.replaceChild(clone2, submitBtn);
      clone2.id = "submit-dice-roll";
      clone2.textContent = "Resolve Drive";
      clone2.addEventListener("click", () => window.processDrive());
    }

    // Update labels
    const h3 = document.querySelector(".play-entry h3");
    if (h3) h3.textContent = "Roll for Drive";
    const instr = document.querySelector(".dice-instructions");
    if (instr) {
      instr.textContent =
        "Roll all seven dice once per drive. The result sets how the drive ends; plays are generated automatically and still run the clock.";
    }
  });
})();
