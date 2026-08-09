// ============================================
// DRIVE ENGINE
// Dice decide the DRIVE result once.
// Individual plays are generated to match that
// result and still burn clock time.
// ============================================

window.DriveEngine = {
  resolveDriveFromDice(roll, game) {
    const combinationIndex =
      ((((((roll.d4 - 1) * 10 + roll.d10_0_9)
      * 8 + (roll.d8 - 1))
      * 10 + (roll.d100_tens / 10))
      * 20 + (roll.d20 - 1))
      * 10 + (roll.d10 - 1))
      * 6 + (roll.d6 - 1);
    const position = combinationIndex / 3840000;

    const table = [
      { id: "touchdown", weight: 0.22 },
      { id: "field_goal", weight: 0.14 },
      { id: "missed_fg", weight: 0.04 },
      { id: "punt", weight: 0.32 },
      { id: "turnover_int", weight: 0.07 },
      { id: "turnover_fumble", weight: 0.05 },
      { id: "turnover_downs", weight: 0.10 },
      { id: "safety", weight: 0.02 },
      { id: "big_stop_punt", weight: 0.04 }
    ];
    const total = table.reduce((s, t) => s + t.weight, 0);
    let run = 0;
    let pick = table[table.length - 1];
    for (const row of table) {
      run += row.weight / total;
      if (position < run) { pick = row; break; }
    }

    const yl = game.yardLine;
    if (pick.id === "touchdown" && yl < 15 && position > 0.08) pick = { id: "punt" };
    if ((pick.id === "field_goal" || pick.id === "missed_fg") && yl < 45) pick = { id: "punt" };
    if (pick.id === "safety" && yl > 25) pick = { id: "punt" };

    return { id: pick.id, position };
  },

  rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  },

  /** Intermediate gains that roughly spend `budget` yards toward the target. */
  pushSeries(plays, budget, maxPlays) {
    let left = Math.max(0, budget);
    const count = this.rand(2, maxPlays);
    for (let i = 0; i < count - 1 && left > 2; i++) {
      const roll = Math.random();
      let y;
      if (roll < 0.12) y = -this.rand(1, 4);
      else if (roll < 0.22) y = 0;
      else y = this.rand(1, Math.min(12, left));

      if (y > 0) {
        left -= y;
        plays.push({
          yards: y,
          time: this.rand(22, 38),
          text: this.pick([
            `Run up the middle for ${y}`,
            `Short pass complete for ${y}`,
            `Sweep picks up ${y}`,
            `Quick slant for ${y} yards`,
            `Off-tackle for ${y}`
          ]),
          special: null
        });
      } else if (y === 0) {
        plays.push({
          yards: 0,
          time: this.rand(18, 28),
          text: this.pick(["Incomplete pass", "Stuffed at the line", "Pass broken up", "No gain"]),
          special: null
        });
      } else {
        left += Math.abs(y);
        plays.push({
          yards: y,
          time: this.rand(20, 32),
          text: this.pick([
            `Tackled for a loss of ${Math.abs(y)}`,
            `Sack — loss of ${Math.abs(y)}`,
            `Loss of ${Math.abs(y)} on the play`
          ]),
          special: null
        });
      }
    }
    return left;
  },

  generatePlays(game, outcome) {
    const plays = [];
    const start = game.yardLine;
    const needForTd = Math.max(1, 100 - start);

    switch (outcome.id) {
      case "touchdown": {
        const left = this.pushSeries(plays, needForTd, this.rand(4, 9));
        const finalGain = Math.max(1, left);
        plays.push({
          yards: finalGain,
          time: this.rand(28, 42),
          text: this.pick([
            `TOUCHDOWN! ${finalGain}-yard score`,
            `Breaks free — ${finalGain}-yard TOUCHDOWN`,
            `TOUCHDOWN pass for ${finalGain}`
          ]),
          special: "td"
        });
        break;
      }
      case "field_goal": {
        const target = Math.min(99, Math.max(start, this.rand(55, 78)));
        this.pushSeries(plays, Math.max(0, target - start), this.rand(3, 7));
        plays.push({
          yards: 0,
          time: this.rand(12, 18),
          text: this.pick([
            "Field goal is GOOD",
            "The kick is good — FIELD GOAL",
            "Splits the uprights for three"
          ]),
          special: "fg"
        });
        break;
      }
      case "missed_fg": {
        const target = Math.min(99, Math.max(start, this.rand(50, 70)));
        this.pushSeries(plays, Math.max(0, target - start), this.rand(2, 6));
        plays.push({
          yards: 0,
          time: this.rand(12, 18),
          text: this.pick([
            "Field goal is NO good",
            "Kick misses wide",
            "Field goal attempt is short"
          ]),
          special: "miss_fg"
        });
        break;
      }
      case "punt":
      case "big_stop_punt": {
        const stops = outcome.id === "big_stop_punt" ? 3 : this.rand(3, 6);
        for (let i = 0; i < stops - 1; i++) {
          const y = Math.random() < 0.35 ? this.rand(0, 4) : this.rand(-2, 8);
          plays.push({
            yards: y,
            time: this.rand(20, 34),
            text: y > 0
              ? `Gain of ${y} on ${this.pick(["run", "short pass", "screen"])}`
              : y === 0
                ? this.pick(["Incomplete", "No gain", "Pass defended"])
                : `Loss of ${Math.abs(y)}`,
            special: null
          });
        }
        const puntY = this.rand(35, 52);
        plays.push({
          yards: puntY,
          time: this.rand(12, 20),
          text: `Punt — ${puntY} yards`,
          special: "punt"
        });
        break;
      }
      case "turnover_int": {
        const n = this.rand(1, 4);
        for (let i = 0; i < n - 1; i++) {
          const y = this.rand(0, 9);
          plays.push({
            yards: y,
            time: this.rand(20, 32),
            text: y ? `Complete for ${y}` : "Incomplete",
            special: null
          });
        }
        plays.push({
          yards: 0,
          time: this.rand(15, 25),
          text: this.pick(["INTERCEPTION!", "Picked off in coverage", "The pass is intercepted"]),
          special: "int"
        });
        break;
      }
      case "turnover_fumble": {
        const n = this.rand(1, 5);
        for (let i = 0; i < n - 1; i++) {
          const y = this.rand(-1, 10);
          plays.push({
            yards: y,
            time: this.rand(20, 34),
            text: y >= 0 ? `Play gains ${y}` : `Loss of ${Math.abs(y)}`,
            special: null
          });
        }
        plays.push({
          yards: 0,
          time: this.rand(15, 25),
          text: this.pick(["FUMBLE! Defense recovers", "Ball is loose — defense recovers", "Strip sack, fumble recovered"]),
          special: "fumble"
        });
        break;
      }
      case "turnover_downs": {
        for (let i = 0; i < 4; i++) {
          const y = this.rand(-2, 6);
          const last = i === 3;
          plays.push({
            yards: last ? Math.min(y, 3) : y,
            time: this.rand(20, 35),
            text: last
              ? "Fourth down — short of the marker. Turnover on downs"
              : y > 0
                ? `Gain of ${y}`
                : y === 0
                  ? "No gain"
                  : `Loss of ${Math.abs(y)}`,
            special: last ? "downs" : null
          });
        }
        break;
      }
      case "safety": {
        plays.push({
          yards: -Math.min(start, this.rand(2, 8)),
          time: this.rand(18, 28),
          text: "Tackled in the end zone — SAFETY",
          special: "safety"
        });
        break;
      }
      default: {
        plays.push({ yards: 0, time: 22, text: "Three-and-out", special: null });
        const puntY = this.rand(38, 50);
        plays.push({ yards: puntY, time: 15, text: `Punt — ${puntY} yards`, special: "punt" });
      }
    }
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
