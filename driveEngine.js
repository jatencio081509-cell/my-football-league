// ============================================
// DRIVE ENGINE
// Dice decide the DRIVE result once.
// Individual plays are generated to match that
// result and still burn clock time.
// ============================================

window.DriveEngine = {
  /** Map dice → drive outcome (not a single play). */
  resolveDriveFromDice(roll, game) {
    const combinationIndex =
      ((((((roll.d4 - 1) * 10 + roll.d10_0_9)
      * 8 + (roll.d8 - 1))
      * 10 + (roll.d100_tens / 10))
      * 20 + (roll.d20 - 1))
      * 10 + (roll.d10 - 1))
      * 6 + (roll.d6 - 1);
    const position = combinationIndex / 3840000;

    // Weighted drive endings (rough NFL-ish)
    const table = [
      { id: "touchdown", weight: 0.22 },
      { id: "field_goal", weight: 0.14 },
      { id: "missed_fg", weight: 0.04 },
      { id: "punt", weight: 0.32 },
      { id: "turnover_int", weight: 0.07 },
      { id: "turnover_fumble", weight: 0.05 },
      { id: "turnover_downs", weight: 0.10 },
      { id: "safety", weight: 0.02 },
      { id: "big_stop_punt", weight: 0.04 } // 3-and-out style
    ];
    const total = table.reduce((s, t) => s + t.weight, 0);
    let run = 0;
    let pick = table[table.length - 1];
    for (const row of table) {
      run += row.weight / total;
      if (position < run) { pick = row; break; }
    }

    // Field-position sanity: hard to score TD from own 5, etc.
    const yl = game.yardLine;
    if (pick.id === "touchdown" && yl < 15 && position > 0.08) pick = { id: "punt" };
    if (pick.id === "field_goal" && yl < 40) pick = { id: "punt" };
    if (pick.id === "safety" && yl > 25) pick = { id: "punt" };
    if ((pick.id === "field_goal" || pick.id === "missed_fg") && yl < 45) pick = { id: "punt" };

    return { id: pick.id, position };
  },

  rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  },

  /**
   * Build a list of play steps that lead to `outcome`.
   * Each step: { yards, time, text, downDelta?, special? }
   * special: 'td'|'fg'|'miss_fg'|'punt'|'int'|'fumble'|'downs'|'safety'
   */
  generatePlays(game, outcome) {
    const plays = [];
    const start = game.yardLine;
    const needForTd = Math.max(1, 100 - start);

    const add = (yards, time, text, special) => {
      plays.push({ yards, time, text, special: special || null });
    };

    const nibble = (remaining, maxPlays) => {
      // Generate intermediate gains/losses that leave `remaining` yards for the last push
      let left = remaining;
      const count = this.rand(2, maxPlays);
      for (let i = 0; i < count - 1 && left > 3; i++) {
        const maxGain = Math.min(12, Math.max(1, left - 1));
        let y;
        const roll = Math.random();
        if (roll < 0.12) y = -this.rand(1, 4); // loss
        else if (roll < 0.22) y = 0; // stuff / incomplete
        else y = this.rand(1, maxGain);
        left -= Math.max(0, y);
        if (y > 0) add(y, this.rand(22, 38), this.pick([
          `Run up the middle for ${y}`,
          `Short pass complete, gain of ${y}`,
          `Sweep picks up ${y}`,
          `Quick slant for ${y} yards`,
          `Off-tackle run for ${y}`
        ]));
        else if (y === 0) add(0, this.rand(18, 28), this.pick([
          "Incomplete pass",
          "Run stuffed at the line",
          "Pass broken up",
          "No gain"
        ]));
        else add(y, this.rand(20, 32), this.pick([
          `Tackled for a loss of ${Math.abs(y)}`,
          `Sack — loss of ${Math.abs(y)}`,
          `Run meets the defense, loss of ${Math.abs(y)}`
        ]));
      }
      return left;
    };

    switch (outcome.id) {
      case "touchdown": {
        const left = nibble(needForTd, this.rand(4, 9));
        const finalGain = Math.max(1, left);
        add(finalGain, this.rand(28, 42), this.pick([
          `TOUCHDOWN! ${finalGain}-yard strike into the end zone`,
          `TOUCHDOWN run — ${finalGain} yards`,
          `Breaks free for a ${finalGain}-yard TOUCHDOWN`
        ]), "td");
        break;
      }
      case "field_goal": {
        // Advance into FG range if needed, then kick
        let target = Math.max(start, this.rand(55, 75));
        if (target > 99) target = 99;
        const gainNeeded = Math.max(0, target - start);
        if (gainNeeded > 0) nibble(gainNeeded, this.rand(3, 7));
        // After nibbles yard tracking is applied later; FG is special
        add(0, this.rand(12, 18), this.pick([
          "Field goal is GOOD",
          "The kick splits the uprights — FIELD GOAL",
          "Chip-shot field goal is good"
        ]), "fg");
        break;
      }
      case "missed_fg": {
        let target = Math.max(start, this.rand(50, 70));
        const gainNeeded = Math.max(0, target - start);
        if (gainNeeded > 0) nibble(gainNeeded, this.rand(2, 6));
        add(0, this.rand(12, 18), this.pick([
          "Field goal is NO good — wide right",
          "The kick misses left",
          "Field goal attempt is short"
        ]), "miss_fg");
        break;
      }
      case "punt":
      case "big_stop_punt": {
        const stops = outcome.id === "big_stop_punt" ? 3 : this.rand(3, 6);
        for (let i = 0; i < stops - 1; i++) {
          const y = Math.random() < 0.35 ? this.rand(0, 4) : this.rand(-2, 8);
          if (y > 0) add(y, this.rand(22, 35), `Gain of ${y} on ${this.pick(["run", "short pass", "screen"])}`);
          else if (y === 0) add(0, this.rand(18, 28), this.pick(["Incomplete", "No gain", "Pass defended"]));
          else add(y, this.rand(20, 30), `Loss of ${Math.abs(y)}`);
        }
        const puntY = this.rand(35, 52);
        add(puntY, this.rand(12, 20), `Punt — ${puntY} yards", "punt");
        // fix quote typo below
        break;
      }
      case "turnover_int": {
        const n = this.rand(1, 4);
        for (let i = 0; i < n - 1; i++) {
          const y = this.rand(0, 9);
          add(y, this.rand(20, 32), y ? `Complete for ${y}` : "Incomplete");
        }
        add(0, this.rand(15, 25), this.pick([
          "INTERCEPTION!",
          "Picked off in coverage",
          "The pass is intercepted"
        ]), "int");
        break;
      }
      case "turnover_fumble": {
        const n = this.rand(1, 5);
        for (let i = 0; i < n - 1; i++) {
          const y = this.rand(-1, 10);
          add(y, this.rand(20, 34), y >= 0 ? `Play gains ${y}` : `Loss of ${Math.abs(y)}`);
        }
        add(0, this.rand(15, 25), this.pick([
          "FUMBLE! Defense recovers",
          "Ball is loose — recovered by the defense",
          "Strip sack, fumble recovered"
        ]), "fumble");
        break;
      }
      case "turnover_downs": {
        for (let i = 0; i < 4; i++) {
          const y = this.rand(-2, 6);
          const last = i === 3;
          add(y, this.rand(20, 35),
            last
              ? (y < 10 ? "Fourth down — short of the marker. Turnover on downs" : `Fourth down conversion for ${y}`)
              : (y > 0 ? `Gain of ${y}` : y === 0 ? "No gain" : `Loss of ${Math.abs(y)}`),
            last ? "downs" : null
          );
        }
        // Force last to be downs stop — mark special on last
        if (plays.length) plays[plays.length - 1].special = "downs";
        break;
      }
      case "safety": {
        add(-Math.min(start, this.rand(2, 8)), this.rand(18, 28), "Tackled in the end zone — SAFETY", "safety");
        break;
      }
      default: {
        const puntY = this.rand(38, 50);
        add(0, 25, "Three-and-out");
        add(puntY, 15, `Punt — ${puntY} yards`, "punt");
      }
    }

    // Fix accidental typo in punt text if any
    plays.forEach(p => {
      if (p.text && p.text.includes('Punt') && p.text.includes('"')) {
        p.text = p.text.replace(/".*/, "");
        if (!p.special) p.special = "punt";
      }
    });

    return plays;
  },

  outcomeTitle(id) {
    const map = {
      touchdown: "DRIVE RESULT: Touchdown",
      field_goal: "DRIVE RESULT: Field Goal",
      missed_fg: "DRIVE RESULT: Missed Field Goal",
      punt: "DRIVE RESULT: Punt",
      big_stop_punt: "DRIVE RESULT: Three-and-out / Punt",
      turnover_int: "DRIVE RESULT: Interception",
      turnover_fumble: "DRIVE RESULT: Fumble",
      turnover_downs: "DRIVE RESULT: Turnover on Downs",
      safety: "DRIVE RESULT: Safety"
    };
    return map[id] || "DRIVE RESULT";
  }
};
