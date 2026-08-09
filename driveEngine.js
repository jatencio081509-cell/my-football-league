// ============================================
// DRIVE ENGINE
// - Dice + team/player ratings → drive result
// - Sensible FG / punt / field-position rules
// - Generated plays name starters + carry stats
// ============================================

window.DriveEngine = {
  CLOCK: {
    incomplete: [5, 8],
    pass_short: [18, 28],
    pass_medium: [22, 32],
    pass_deep: [12, 22],
    run_short: [35, 42],
    run_medium: [38, 45],
    run_big: [28, 40],
    sack: [12, 20],
    stuff: [32, 40],
    screen: [25, 35],
    punt: [8, 14],
    field_goal: [6, 10],
    interception: [10, 18],
    fumble: [12, 20],
    safety: [10, 16],
    touchdown_pass: [10, 18],
    touchdown_run: [22, 35]
  },

  rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },
  pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  },
  clockFor(type) {
    const range = this.CLOCK[type] || [20, 30];
    return this.rand(range[0], range[1]);
  },

  offenseTeam(game) {
    return game.possession === "home" ? game.home : game.away;
  },
  defenseTeam(game) {
    return game.possession === "home" ? game.away : game.home;
  },

  /** Base weights adjusted by starter unit ratings + field position. */
  resolveDriveFromDice(roll, game) {
    const combinationIndex =
      ((((((roll.d4 - 1) * 10 + roll.d10_0_9)
      * 8 + (roll.d8 - 1))
      * 10 + (roll.d100_tens / 10))
      * 20 + (roll.d20 - 1))
      * 10 + (roll.d10 - 1))
      * 6 + (roll.d6 - 1);
    const position = combinationIndex / 3840000;

    const PS = window.PlayerSystem;
    const off = this.offenseTeam(game);
    const def = this.defenseTeam(game);
    const oRating = PS ? PS.offenseOverall(off) : 75;
    const dRating = PS ? PS.defenseOverall(def) : 75;
    const edge = (oRating - dRating) / 100; // ~-0.3 .. +0.3

    const yl = game.yardLine;
    const inFgRange = yl >= 60; // own 60+ ≈ opp 40 or closer
    const deepOwn = yl <= 20;
    const redZone = yl >= 80;

    // Base weights
    let w = {
      touchdown: 0.18 + edge * 0.12 + (redZone ? 0.12 : 0),
      field_goal: 0.12 + (inFgRange ? 0.10 : -0.08),
      missed_fg: 0.04,
      punt: 0.30 - edge * 0.08,
      turnover_int: 0.07 - edge * 0.04 + (dRating - 70) * 0.001,
      turnover_fumble: 0.05,
      turnover_downs: 0.10 - edge * 0.03,
      safety: deepOwn ? 0.03 : 0.005,
      big_stop_punt: 0.05 - edge * 0.02
    };

    // Hard rules: never punt in clear FG range; never FG out of range
    if (inFgRange) {
      w.punt = 0;
      w.big_stop_punt = 0;
      w.field_goal = Math.max(w.field_goal, 0.18);
    } else {
      w.field_goal = 0;
      w.missed_fg = 0;
    }
    if (!deepOwn) w.safety = 0.005;
    if (yl < 35) w.touchdown *= 0.55;

    // Normalize
    let sum = Object.values(w).reduce((a, b) => a + Math.max(0, b), 0);
    const entries = Object.keys(w).map(id => ({ id, weight: Math.max(0, w[id]) / sum }));

    let run = 0;
    let pick = entries[entries.length - 1];
    for (const row of entries) {
      run += row.weight;
      if (position < run) { pick = row; break; }
    }

    // Final safety net
    if ((pick.id === "punt" || pick.id === "big_stop_punt") && inFgRange) {
      pick = { id: Math.random() < 0.75 ? "field_goal" : "missed_fg" };
    }
    if ((pick.id === "field_goal" || pick.id === "missed_fg") && !inFgRange) {
      pick = { id: "punt" };
    }

    return { id: pick.id, position, oRating, dRating };
  },

  /** Attach involved starters + stat deltas to a play object. */
  withPersonnel(game, play, roles) {
    const PS = window.PlayerSystem;
    const off = this.offenseTeam(game);
    const def = this.defenseTeam(game);
    play.actors = {};
    play.statPatches = []; // { team, player, patch }

    if (!PS) return play;

    if (roles.qb) {
      const qb = PS.pickStarter(off, ["QB"]);
      play.actors.qb = qb;
      play.statPatches.push({ team: off, player: qb, patch: roles.qb(qb) });
    }
    if (roles.rb) {
      const rb = PS.pickStarter(off, ["RB"]);
      play.actors.rb = rb;
      play.statPatches.push({ team: off, player: rb, patch: roles.rb(rb) });
    }
    if (roles.wr) {
      const wr = PS.pickStarter(off, ["WR", "TE"]);
      play.actors.wr = wr;
      play.statPatches.push({ team: off, player: wr, patch: roles.wr(wr) });
    }
    if (roles.k) {
      const k = PS.pickStarter(off, ["K"]);
      play.actors.k = k;
      play.statPatches.push({ team: off, player: k, patch: roles.k(k) });
    }
    if (roles.p) {
      const p = PS.pickStarter(off, ["P"]);
      play.actors.p = p;
      play.statPatches.push({ team: off, player: p, patch: roles.p(p) });
    }
    if (roles.def) {
      const d = PS.pickStarter(def, ["CB", "S", "LB", "DL"]);
      play.actors.def = d;
      play.statPatches.push({ team: def, player: d, patch: roles.def(d) });
    }
    if (roles.sacker) {
      const d = PS.pickStarter(def, ["DL", "LB"]);
      play.actors.sacker = d;
      play.statPatches.push({ team: def, player: d, patch: roles.sacker(d) });
    }
    return play;
  },

  makePlay(game, kind, yards) {
    const y = yards;
    let play;

    if (kind === "run") {
      let type = "run_short";
      if (y >= 12) type = "run_big";
      else if (y >= 5) type = "run_medium";
      else type = y <= 0 ? "stuff" : "run_short";
      play = {
        yards: y,
        time: this.clockFor(type),
        playType: type,
        special: null,
        text: "" // filled after personnel
      };
      this.withPersonnel(game, play, {
        rb: () => ({ rushYds: Math.max(0, y), rushTd: 0 }),
        def: y <= 0 ? () => ({ tackles: 1 }) : null
      });
      const rb = play.actors.rb;
      const name = rb ? rb.name : "RB";
      play.text = y > 0
        ? this.pick([
            `${name} runs up the middle for ${y}`,
            `${name} off-tackle for ${y}`,
            `${name} sweeps for ${y}`
          ])
        : y === 0
          ? `${name} stuffed at the line — no gain`
          : `${name} tackled for a loss of ${Math.abs(y)}`;
      return play;
    }

    if (kind === "pass") {
      if (y === 0) {
        play = { yards: 0, time: this.clockFor("incomplete"), playType: "incomplete", special: null, text: "" };
        this.withPersonnel(game, play, {
          qb: () => ({}),
          def: () => ({ deflections: 1 })
        });
        const qb = play.actors.qb;
        play.text = this.pick([
          `${qb ? qb.name : "QB"} incomplete`,
          `Pass broken up — ${qb ? qb.name : "QB"}`,
          `${qb ? qb.name : "QB"} overthrows the receiver`
        ]);
        return play;
      }
      let type = "pass_short";
      if (y >= 20) type = "pass_deep";
      else if (y >= 10) type = "pass_medium";
      play = { yards: y, time: this.clockFor(type), playType: type, special: null, text: "" };
      this.withPersonnel(game, play, {
        qb: () => ({ passYds: y }),
        wr: () => ({ recYds: y, receptions: 1 })
      });
      const qb = play.actors.qb;
      const wr = play.actors.wr;
      play.text = `${qb ? qb.name : "QB"} to ${wr ? wr.name : "WR"} for ${y}`;
      return play;
    }

    if (kind === "sack") {
      play = { yards: y, time: this.clockFor("sack"), playType: "sack", special: null, text: "" };
      this.withPersonnel(game, play, {
        qb: () => ({}),
        sacker: () => ({ sacks: 1, tackles: 1 })
      });
      const s = play.actors.sacker;
      play.text = `Sack by ${s ? s.name : "defense"} — loss of ${Math.abs(y)}`;
      return play;
    }

    if (kind === "screen") {
      play = { yards: y, time: this.clockFor("screen"), playType: "screen", special: null, text: "" };
      this.withPersonnel(game, play, {
        qb: () => ({ passYds: Math.max(0, y) }),
        rb: () => ({ recYds: Math.max(0, y), receptions: y > 0 ? 1 : 0 })
      });
      const rb = play.actors.rb;
      play.text = `Screen to ${rb ? rb.name : "RB"} for ${y}`;
      return play;
    }

    return { yards: y, time: 25, playType: "run_short", special: null, text: `Gain of ${y}`, actors: {}, statPatches: [] };
  },

  pushSeries(game, plays, budget, maxPlays) {
    let left = Math.max(0, budget);
    const count = this.rand(2, maxPlays);
    for (let i = 0; i < count - 1 && left > 2; i++) {
      const roll = Math.random();
      if (roll < 0.10) {
        const loss = -this.rand(1, 4);
        left += Math.abs(loss);
        plays.push(this.makePlay(game, "sack", loss));
      } else if (roll < 0.22) {
        plays.push(this.makePlay(game, "pass", 0));
      } else if (roll < 0.55) {
        const y = this.rand(1, Math.min(12, left));
        left -= y;
        plays.push(this.makePlay(game, "run", y));
      } else if (roll < 0.75) {
        const y = this.rand(1, Math.min(15, left));
        left -= y;
        plays.push(this.makePlay(game, "pass", y));
      } else {
        const y = this.rand(1, Math.min(10, left));
        left -= y;
        plays.push(this.makePlay(game, "screen", y));
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
        const left = this.pushSeries(game, plays, needForTd, this.rand(4, 9));
        const finalGain = Math.max(1, left);
        const isPass = Math.random() < 0.55;
        const play = {
          yards: finalGain,
          time: this.clockFor(isPass ? "touchdown_pass" : "touchdown_run"),
          playType: isPass ? "touchdown_pass" : "touchdown_run",
          special: "td",
          text: ""
        };
        if (isPass) {
          this.withPersonnel(game, play, {
            qb: () => ({ passYds: finalGain, passTd: 1 }),
            wr: () => ({ recYds: finalGain, recTd: 1, receptions: 1 })
          });
          play.text = `TOUCHDOWN! ${play.actors.qb ? play.actors.qb.name : "QB"} to ${play.actors.wr ? play.actors.wr.name : "WR"} for ${finalGain}`;
        } else {
          this.withPersonnel(game, play, {
            rb: () => ({ rushYds: finalGain, rushTd: 1 })
          });
          play.text = `TOUCHDOWN! ${play.actors.rb ? play.actors.rb.name : "RB"} runs it in from ${finalGain}`;
        }
        plays.push(play);
        break;
      }
      case "field_goal":
      case "missed_fg": {
        // If somehow outside range, march closer first
        const target = Math.min(99, Math.max(start, start < 60 ? 65 : start));
        this.pushSeries(game, plays, Math.max(0, target - start), this.rand(2, 6));
        const good = outcome.id === "field_goal";
        const play = {
          yards: 0,
          time: this.clockFor("field_goal"),
          playType: "field_goal",
          special: good ? "fg" : "miss_fg",
          text: ""
        };
        this.withPersonnel(game, play, {
          k: () => good ? { fgMade: 1 } : { fgMiss: 1 }
        });
        const k = play.actors.k;
        play.text = good
          ? `${k ? k.name : "K"} — field goal is GOOD`
          : `${k ? k.name : "K"} — field goal is NO good`;
        plays.push(play);
        break;
      }
      case "punt":
      case "big_stop_punt": {
        // If in FG range, never punt — convert to FG path
        if (game.yardLine >= 60) {
          return this.generatePlays(game, { id: Math.random() < 0.8 ? "field_goal" : "missed_fg" });
        }
        const stops = outcome.id === "big_stop_punt" ? 3 : this.rand(3, 6);
        for (let i = 0; i < stops - 1; i++) {
          const r = Math.random();
          if (r < 0.25) plays.push(this.makePlay(game, "pass", 0));
          else if (r < 0.4) plays.push(this.makePlay(game, "sack", -this.rand(1, 5)));
          else if (r < 0.7) plays.push(this.makePlay(game, "run", this.rand(0, 6)));
          else plays.push(this.makePlay(game, "pass", this.rand(1, 8)));
        }
        const puntY = this.rand(35, 52);
        const play = {
          yards: puntY,
          time: this.clockFor("punt"),
          playType: "punt",
          special: "punt",
          text: ""
        };
        this.withPersonnel(game, play, {
          p: () => ({ punts: 1, puntYds: puntY })
        });
        play.text = `${play.actors.p ? play.actors.p.name : "P"} punts ${puntY} yards`;
        plays.push(play);
        break;
      }
      case "turnover_int": {
        // Sometimes immediate (30%), usually a short series first
        if (Math.random() > 0.3) {
          const n = this.rand(1, 4);
          for (let i = 0; i < n; i++) {
            if (Math.random() < 0.45) plays.push(this.makePlay(game, "pass", 0));
            else if (Math.random() < 0.5) plays.push(this.makePlay(game, "run", this.rand(1, 7)));
            else plays.push(this.makePlay(game, "pass", this.rand(1, 10)));
          }
        }
        const play = {
          yards: 0,
          time: this.clockFor("interception"),
          playType: "interception",
          special: "int",
          text: ""
        };
        this.withPersonnel(game, play, {
          qb: () => ({ interceptions: 1 }),
          def: () => ({ interceptions: 1, tackles: 1 })
        });
        play.text = `INTERCEPTION! ${play.actors.def ? play.actors.def.name : "DB"} picks off ${play.actors.qb ? play.actors.qb.name : "QB"}`;
        plays.push(play);
        break;
      }
      case "turnover_fumble": {
        if (Math.random() > 0.25) {
          const n = this.rand(1, 4);
          for (let i = 0; i < n; i++) {
            const r = Math.random();
            if (r < 0.4) plays.push(this.makePlay(game, "run", this.rand(1, 8)));
            else if (r < 0.7) plays.push(this.makePlay(game, "pass", this.rand(0, 9)));
            else plays.push(this.makePlay(game, "sack", -this.rand(1, 4)));
          }
        }
        const play = {
          yards: 0,
          time: this.clockFor("fumble"),
          playType: "fumble",
          special: "fumble",
          text: ""
        };
        this.withPersonnel(game, play, {
          def: () => ({ tackles: 1 })
        });
        play.text = `FUMBLE recovered by ${play.actors.def ? play.actors.def.name : "the defense"}`;
        plays.push(play);
        break;
      }
      case "turnover_downs": {
        for (let i = 0; i < 4; i++) {
          const last = i === 3;
          if (last) {
            const y = this.rand(0, 3);
            const p = this.makePlay(game, Math.random() < 0.5 ? "run" : "pass", y);
            p.special = "downs";
            p.text += " — fourth down short. Turnover on downs";
            plays.push(p);
          } else {
            const r = Math.random();
            if (r < 0.3) plays.push(this.makePlay(game, "pass", 0));
            else if (r < 0.55) plays.push(this.makePlay(game, "run", this.rand(-1, 5)));
            else plays.push(this.makePlay(game, "pass", this.rand(1, 6)));
          }
        }
        break;
      }
      case "safety": {
        const play = {
          yards: -Math.min(start, this.rand(2, 8)),
          time: this.clockFor("safety"),
          playType: "safety",
          special: "safety",
          text: ""
        };
        this.withPersonnel(game, play, {
          sacker: () => ({ tackles: 1, sacks: 0.5 })
        });
        play.text = `SAFETY — ${play.actors.sacker ? play.actors.sacker.name : "defense"} tackles in the end zone`;
        plays.push(play);
        break;
      }
      default: {
        plays.push(this.makePlay(game, "pass", 0));
        plays.push(this.makePlay(game, "run", this.rand(0, 3)));
        plays.push(this.makePlay(game, "pass", 0));
        const puntY = this.rand(38, 50);
        const play = {
          yards: puntY, time: this.clockFor("punt"), playType: "punt", special: "punt", text: ""
        };
        this.withPersonnel(game, play, { p: () => ({ punts: 1, puntYds: puntY }) });
        play.text = `${play.actors.p ? play.actors.p.name : "P"} punts ${puntY} yards`;
        plays.push(play);
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
