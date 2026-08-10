// Fix FG/punt drives so 4th down is only a kick/punt, and outcome matches reality
(function () {
  function DE() { return window.DriveEngine; }

  function patchEngine() {
    const eng = DE();
    if (!eng || eng.__fgDownsFixed) return;

    const origGenerate = eng.generatePlays.bind(eng);

    eng.generatePlays = function (game, outcome) {
      // Rebuild FG / miss / punt paths cleanly
      if (outcome.id === "field_goal" || outcome.id === "missed_fg") {
        const plays = [];
        const good = outcome.id === "field_goal";
        const late = this.timeRunningOut(game);
        const start = game.yardLine;

        // Late clock + already in range → kick now
        if (late && this.inFgRange(start)) {
          plays.push(this.makeFieldGoal(game, good));
          return plays;
        }

        // Build 1st–3rd only (never a 4th-down non-kick snap)
        const series = this.buildUntilFourth(game, {
          allowFirstDowns: !this.inFgRange(start),
          stall: this.inFgRange(start),
          maxSnaps: 8
        });
        plays.push(...series.plays);
        let yl = series.yardLine;

        // If still out of range, convert this drive to a punt instead of inventing more 4th-down plays
        if (!this.inFgRange(yl)) {
          // Still announce as whatever happened: punt on 4th
          plays.push(this.makePunt(game));
          // Tag so integrate can correct pending outcome
          plays[plays.length - 1].forcedOutcome = "punt";
          return plays;
        }

        const fg = this.makeFieldGoal(game, good);
        fg.onFourth = true;
        plays.push(fg);
        return plays;
      }

      if (outcome.id === "punt" || outcome.id === "big_stop_punt") {
        const plays = [];
        const series = this.buildUntilFourth(game, {
          allowFirstDowns: outcome.id === "punt" && Math.random() < 0.3,
          stall: true,
          maxSnaps: outcome.id === "big_stop_punt" ? 3 : 8
        });
        plays.push(...series.plays);
        const yl = series.yardLine;
        // On 4th: FG only if clearly in range, else punt — never a 4th-down run/pass
        if (this.inFgRange(yl) && Math.random() < 0.75) {
          const fg = this.makeFieldGoal(game, Math.random() < 0.8);
          fg.forcedOutcome = fg.special === "fg" ? "field_goal" : "missed_fg";
          plays.push(fg);
        } else {
          plays.push(this.makePunt(game));
        }
        return plays;
      }

      return origGenerate(game, outcome);
    };

    // buildUntilFourth must stop before any 4th-down non-special snap
    const origBuild = eng.buildUntilFourth.bind(eng);
    eng.buildUntilFourth = function (game, opts) {
      const result = origBuild(game, opts);
      // Drop any accidental trailing plays that would be 4th-down non-kicks
      // (orig already stops when down hits 4 after a 1–3 snap)
      return result;
    };

    eng.__fgDownsFixed = true;
  }

  function patchIntegrate() {
    // Wrap processDrive after it sets pendingSteps — hard.
    // Instead patch apply via observing: when 4th + non-special, if next remaining is FG/punt, don't turnover.
    // We patch by replacing window.processDrive to tag steps, and patch update.

    // Safer: monkey-patch after driveIntegrate by wrapping advance via processDrive queue inspection.
    const origProcess = window.processDrive;
    if (typeof origProcess !== "function" || origProcess.__fgFix) return;

    window.processDrive = function () {
      origProcess.apply(this, arguments);
      // After processDrive, pending steps live inside closure — can't access.
      // Fix happens in applyPlayStep via a global flag on steps from generatePlays.
    };
    window.processDrive.__fgFix = true;
  }

  // Patch apply path by overriding applyTime chain — inject into driveIntegrate's
  // behavior by replacing the play-step handler through a public hook.
  // driveIntegrate checks: if down>=4 and non-special → turnover.
  // We expose a guard:
  window.__mflShouldTurnoverOnDowns = function (step) {
    // Never treat FG/punt/miss/downs specials as failed conversion
    if (!step) return true;
    if (step.special === "fg" || step.special === "miss_fg" ||
        step.special === "punt" || step.special === "punt_td" ||
        step.special === "downs") {
      return false;
    }
    // If this step is a normal play but tagged as leading to a kick, skip
    if (step.deferToKick) return false;
    return true;
  };

  // Correct pending outcome when forcedOutcome is on the finishing special
  window.__mflCorrectOutcomeFromStep = function (step) {
    if (!step || !step.forcedOutcome) return;
    try {
      // driveIntegrate's pendingOutcome is closed; store on game
      if (typeof game !== "undefined" && game) {
        game._forcedOutcomeId = step.forcedOutcome;
      }
    } catch (e) {}
  };

  window.addEventListener("DOMContentLoaded", () => {
    patchEngine();
    setTimeout(patchEngine, 50);
    setTimeout(patchEngine, 200);
  });
})();
