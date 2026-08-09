// ============================================
// DRIVE ENGINE
// Dice decide the DRIVE result once.
// Plays are generated to match; each play type
// burns a different amount of clock.
// ============================================

window.DriveEngine = {
  // Approximate live game-clock burn by play type (seconds)
  CLOCK: {
    incomplete: [5, 8],        // clock stops almost immediately
    pass_short: [18, 28],      // complete, tackled in bounds
    pass_medium: [22, 32],
    pass_deep: [12, 22],       // often out of bounds / TD quick stop
    run_short: [35, 42],       // clock keeps running
    run_medium: [38, 45],
    run_big: [28, 40],
    sack: [12, 20],
    stuff: [32, 40],           // no-gain run, clock runs
    screen: [25, 35],
    scramble: [20, 30],
    penalty: [8, 15],
    punt: [8, 14],             // dead ball after kick
    field_goal: [6, 10],
    extra_point: [4, 7],
    interception: [10, 18],
    fumble: [12, 20],
    safety: [10, 16],
    touchdown_pass: [10, 18],
    touchdown_run: [22, 35],
    spike: [3, 5],
    kneel: [38, 42]
  },

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

  /** Seconds off the clock for a named play type. */
  clockFor(type) {
    const range = this.CLOCK[type] || [20, 30];
    return this.rand(range[0], range[1]);
  },

  /** Build one intermediate play with type-specific clock. */
  makePlay(kind, yards) {
    const y = yards;
    switch (kind) {
      case "run": {
        let type = "run_short";
        if (y >= 12) type = "run_big";
        else if (y >= 5) type = "run_medium";
        else if (y <= 0) type = y < 0 ? "stuff" : "stuff";
        const text = y > 0
          ? this.pick([
              `Run up the middle for ${y}`,
              `Off-tackle run for ${y}`,
              `Sweep picks up ${y}`,
              `Draw play for ${y}`
            ])
          : y === 0
            ? this.pick(["Run stuffed at the line", "No gain on the ground"])
            : this.pick([`Tackled for a loss of ${Math.abs(y)}`, `Run meets the defense, loss of ${Math.abs(y)}`]);
        return { yards: y, time: this.clockFor(type), text, playType: type, special: null };
      }
      case "pass": {
        if (y === 0) {
          return {
            yards: 0,
            time: this.clockFor("incomplete"),
            text: this.pick(["Incomplete pass", "Pass broken up", "Thrown away", "Overthrown"]),
            playType: "incomplete",
            special: null
          };
        }
        let type = "pass_short";
        if (y >= 20) type = "pass_deep";
        else if (y >= 10) type = "pass_medium";
        return {
          yards: y,
          time: this.clockFor(type),
          text: this.pick([
            `Short pass complete for ${y}`,
            `Quick slant for ${y} yards`,
            y >= 15 ? `Downfield completion for ${y}` : `Screen pass for ${y}`,
            `Out route, ${y} yards`
          ]),
          playType: type,
          special: null
        };
      }
      case "sack":
        return {
          yards: y,
          time: this.clockFor("sack"),
          text: `Sack — loss of ${Math.abs(y)}`,
          playType: "sack",
          special: null
        };
      case "screen":
        return {
          yards: y,
          time: this.clockFor("screen"),
          text: `Screen pass for ${y}`,
          playType: "screen",
          special: null
        };
      default:
        return {
          yards: y,
          time: this.clockFor("run_short"),
          text: y ? `Gain of ${y}` : "No gain",
          playType: "run_short",
          special: null
        };
    }
  },

  pushSeries(plays, budget, maxPlays) {
    let left = Math.max(0, budget);
    const count = this.rand(2, maxPlays);
    for (let i = 0; i < count - 1 && left > 2; i++) {
      const roll = Math.random();
      if (roll < 0.10) {
        const loss = -this.rand(1, 4);
        left += Math.abs(loss);
        plays.push(this.makePlay("sack", loss));
      } else if (roll < 0.22) {
        plays.push(this.makePlay("pass", 0)); // incomplete
      } else if (roll < 0.55) {
        const y = this.rand(1, Math.min(12, left));
        left -= y;
        plays.push(this.makePlay("run", y));
      } else if (roll < 0.75) {
        const y = this.rand(1, Math.min(15, left));
        left -= y;
        plays.push(this.makePlay("pass", y));
      } else {
        const y = this.rand(1, Math.min(10, left));
        left -= y;
        plays.push(this.makePlay("screen", y));
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
        const isPass = Math.random() < 0.55;
        plays.push({
          yards: finalGain,
          time: this.clockFor(isPass ? "touchdown_pass" : "touchdown_run"),
          text: isPass
            ? this.pick([
                `TOUCHDOWN pass for ${finalGain}`,
                `Strike into the end zone — ${finalGain}-yard TD pass`
              ])
            : this.pick([
                `TOUCHDOWN run — ${finalGain} yards`,
                `Breaks free for a ${finalGain}-yard TOUCHDOWN`
              ]),
          playType: isPass ? "touchdown_pass" : "touchdown_run",
          special: "td"
        });
        break;
      }
      case "field_goal": {
        const target = Math.min(99, Math.max(start, this.rand(55, 78)));
        this.pushSeries(plays, Math.max(0, target - start), this.rand(3, 7));
        plays.push({
          yards: 0,
          time: this.clockFor("field_goal"),
          text: this.pick([
            "Field goal is GOOD",
            "The kick is good — FIELD GOAL",
            "Splits the uprights for three"
          ]),
          playType: "field_goal",
          special: "fg"
        });
        break;
      }
      case "missed_fg": {
        const target = Math.min(99, Math.max(start, this.rand(50, 70)));
        this.pushSeries(plays, Math.max(0, target - start), this.rand(2, 6));
        plays.push({
          yards: 0,
          time: this.clockFor("field_goal"),
          text: this.pick([
            "Field goal is NO good",
            "Kick misses wide",
            "Field goal attempt is short"
          ]),
          playType: "field_goal",
          special: "miss_fg"
        });
        break;
      }
      case "punt":
      case "big_stop_punt": {
        const stops = outcome.id === "big_stop_punt" ? 3 : this.rand(3, 6);
        for (let i = 0; i < stops - 1; i++) {
          const r = Math.random();
          if (r < 0.25) plays.push(this.makePlay("pass", 0));
          else if (r < 0.4) plays.push(this.makePlay("sack", -this.rand(1, 5)));
          else if (r < 0.7) plays.push(this.makePlay("run", this.rand(0, 6)));
          else plays.push(this.makePlay("pass", this.rand(1, 8)));
        }
        const puntY = this.rand(35, 52);
        plays.push({
          yards: puntY,
          time: this.clockFor("punt"),
          text: `Punt — ${puntY} yards`,
          playType: "punt",
          special: "punt"
        });
        break;
      }
      case "turnover_int": {
        const n = this.rand(1, 4);
        for (let i = 0; i < n - 1; i++) {
          if (Math.random() < 0.4) plays.push(this.makePlay("pass", 0));
          else plays.push(this.makePlay("pass", this.rand(1, 9)));
        }
        plays.push({
          yards: 0,
          time: this.clockFor("interception"),
          text: this.pick(["INTERCEPTION!", "Picked off in coverage", "The pass is intercepted"]),
          playType: "interception",
          special: "int"
        });
        break;
      }
      case "turnover_fumble": {
        const n = this.rand(1, 5);
        for (let i = 0; i < n - 1; i++) {
          const r = Math.random();
          if (r < 0.4) plays.push(this.makePlay("run", this.rand(1, 8)));
          else if (r < 0.7) plays.push(this.makePlay("pass", this.rand(0, 10)));
          else plays.push(this.makePlay("sack", -this.rand(1, 4)));
        }
        plays.push({
          yards: 0,
          time: this.clockFor("fumble"),
          text: this.pick(["FUMBLE! Defense recovers", "Ball is loose — defense recovers", "Strip sack, fumble recovered"]),
          playType: "fumble",
          special: "fumble"
        });
        break;
      }
      case "turnover_downs": {
        for (let i = 0; i < 4; i++) {
          const last = i === 3;
          if (last) {
            // short of sticks on 4th
            const y = this.rand(0, 3);
            const kind = Math.random() < 0.5 ? "run" : "pass";
            const p = this.makePlay(kind, y);
            p.text = "Fourth down — short of the marker. Turnover on downs";
            p.special = "downs";
            plays.push(p);
          } else {
            const r = Math.random();
            if (r < 0.3) plays.push(this.makePlay("pass", 0));
            else if (r < 0.55) plays.push(this.makePlay("run", this.rand(-1, 5)));
            else plays.push(this.makePlay("pass", this.rand(1, 6)));
          }
        }
        break;
      }
      case "safety": {
        plays.push({
          yards: -Math.min(start, this.rand(2, 8)),
          time: this.clockFor("safety"),
          text: "Tackled in the end zone — SAFETY",
          playType: "safety",
          special: "safety"
        });
        break;
      }
      default: {
        plays.push(this.makePlay("pass", 0));
        plays.push(this.makePlay("run", this.rand(0, 3)));
        plays.push(this.makePlay("pass", 0));
        const puntY = this.rand(38, 50);
        plays.push({
          yards: puntY,
          time: this.clockFor("punt"),
          text: `Punt — ${puntY} yards`,
          playType: "punt",
          special: "punt"
        });
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
