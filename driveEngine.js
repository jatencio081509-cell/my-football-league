// ============================================
// DRIVE ENGINE
// Punt = 4th down only
// FG = 4th down OR time running out (in range)
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
    touchdown_run: [22, 35],
    kneel: [30, 40]
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

  /** Late-clock FG window (2-min / end of half or game). */
  timeRunningOut(game) {
    if (!game) return false;
    const c = game.clockSeconds || 0;
    const q = game.quarter || 1;
    if (c <= 35) return true;
    if ((q === 2 || q >= 4) && c <= 55) return true;
    return false;
  },

  inFgRange(yardLine) {
    return yardLine >= 60; // own 60+ → about opp 40 or closer
  },

  shouldEndHalf(game) {
    if (!game) return false;
    const c = game.clockSeconds || 0;
    const q = game.quarter || 1;
    const possession = game.possession || "home";
    const homeScore = game.homeScore || 0;
    const awayScore = game.awayScore || 0;

    // Check if it's end of half or game situation
    const isEndOfHalf = (q === 2 && c <= 10) || (q === 4 && c <= 10);
    if (!isEndOfHalf) return false;

    // Determine who's leading
    const leading = possession === "home" ? homeScore >= awayScore : awayScore >= homeScore;
    const scoreDiff = Math.abs(homeScore - awayScore);

    // End of half/game if:
    // - Leading by any margin with very little time left (under 10 seconds)
    // - Leading by significant margin (14+ points) with little time left (under 30 seconds)
    // - Trailing by huge margin (21+ points) with very little time left (under 15 seconds)
    if (c <= 5) return true; // Final seconds
    if (leading && scoreDiff >= 14 && c <= 30) return true;
    if (!leading && scoreDiff >= 21 && c <= 15) return true;

    return false;
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

    const PS = window.PlayerSystem;
    const off = this.offenseTeam(game);
    const def = this.defenseTeam(game);
    const oRating = PS ? PS.offenseOverall(off) : 75;
    const dRating = PS ? PS.defenseOverall(def) : 75;
    const edge = (oRating - dRating) / 100;

    const yl = game.yardLine;
    const fgOk = this.inFgRange(yl);
    const deepOwn = yl <= 20;
    const redZone = yl >= 80;
    const late = this.timeRunningOut(game);

    // Check if game should end (end of half/game logic)
    if (this.shouldEndHalf(game)) {
      return { id: "end_of_half", position, oRating, dRating };
    }

    let w = {
      touchdown: 0.199,
      field_goal: 0.126,
      missed_fg: 0.018,
      punt: 0.272,
      turnover_int: 0.071,
      turnover_fumble: 0.041,
      turnover_downs: 0.110,
      safety: 0.005,
      blocked_kick: 0.006,
      end_of_half: 0.152
    };

    // Apply rating edge modifiers
    w.touchdown += edge * 0.05;
    w.punt -= edge * 0.03;
    w.turnover_int -= edge * 0.02;
    w.turnover_fumble -= edge * 0.01;
    w.turnover_downs -= edge * 0.02;

    // Ensure no weight goes below 0
    Object.keys(w).forEach(key => {
      if (w[key] < 0) w[key] = 0;
    });

    // Apply weather modifiers if weather system is available
    if (window.WeatherSystem && game && game.weather) {
      window.WeatherSystem.applyToWeights(w, game.weather);
    }

    // Apply time of day modifiers
    if (game && game.kickoff && game.kickoff.timeStr) {
      const timeStr = game.kickoff.timeStr;
      if (timeStr === "8:20 PM") {
        w.touchdown += 0.02;
        w.punt -= 0.02;
      }
    }

    let sum = Object.values(w).reduce((a, b) => a + Math.max(0, b), 0);
    const entries = Object.keys(w).map(id => ({ id, weight: Math.max(0, w[id]) / sum }));

    let run = 0;
    let pick = entries[entries.length - 1];
    for (const row of entries) {
      run += row.weight;
      if (position < run) { pick = row; break; }
    }

    return { id: pick.id, position, oRating, dRating };
  },

  withPersonnel(game, play, roles) {
    const PS = window.PlayerSystem;
    const off = this.offenseTeam(game);
    const def = this.defenseTeam(game);
    play.actors = {};
    play.statPatches = [];
    if (!PS || !roles) return play;

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
      play = { yards: y, time: this.clockFor(type), playType: type, special: null, text: "" };
      this.withPersonnel(game, play, {
        rb: () => ({ rushYds: Math.max(0, y), rushTd: 0 }),
        def: y <= 0 ? () => ({ tackles: 1 }) : null
      });
      const name = play.actors.rb ? play.actors.rb.name : "RB";
      play.text = y > 0
        ? this.pick([`${name} runs up the middle for ${y}`, `${name} off-tackle for ${y}`, `${name} sweeps for ${y}`])
        : y === 0
          ? `${name} stuffed at the line — no gain`
          : `${name} tackled for a loss of ${Math.abs(y)}`;
      return play;
    }

    if (kind === "pass") {
      if (y === 0) {
        play = { yards: 0, time: this.clockFor("incomplete"), playType: "incomplete", special: null, text: "" };
        this.withPersonnel(game, play, { qb: () => ({ passAttempts: 1 }), def: () => ({ deflections: 1 }) });
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
        qb: () => ({ passYds: y, passAttempts: 1, passCompletions: 1 }),
        wr: () => ({ recYds: y, receptions: 1 })
      });
      play.text = `${play.actors.qb ? play.actors.qb.name : "QB"} to ${play.actors.wr ? play.actors.wr.name : "WR"} for ${y}`;
      return play;
    }

    if (kind === "sack") {
      play = { yards: y, time: this.clockFor("sack"), playType: "sack", special: null, text: "" };
      this.withPersonnel(game, play, {
        qb: () => ({ passAttempts: 1, sacksTaken: 1 }),
        sacker: () => ({ sacks: 1, tackles: 1 })
      });
      play.text = `Sack by ${play.actors.sacker ? play.actors.sacker.name : "defense"} — loss of ${Math.abs(y)}`;
      return play;
    }

    if (kind === "scramble") {
      let type = "run_short";
      if (y >= 12) type = "run_big";
      else if (y >= 5) type = "run_medium";
      else type = y <= 0 ? "stuff" : "run_short";
      play = { yards: y, time: this.clockFor(type), playType: "scramble", special: null, text: "" };
      this.withPersonnel(game, play, {
        qb: () => ({ rushYds: Math.max(0, y), rushTd: 0, passAttempts: 1 }),
        def: y <= 0 ? () => ({ tackles: 1 }) : null
      });
      const name = play.actors.qb ? play.actors.qb.name : "QB";
      play.text = y > 0
        ? this.pick([`${name} scrambles for ${y}`, `${name} takes off and gains ${y}`, `${name} runs for ${y}`])
        : y === 0
          ? `${name} stuffed at the line — no gain`
          : `${name} tackled for a loss of ${Math.abs(y)}`;
      return play;
    }

    if (kind === "screen") {
      play = { yards: y, time: this.clockFor("screen"), playType: "screen", special: null, text: "" };
      this.withPersonnel(game, play, {
        qb: () => ({ passYds: Math.max(0, y), passAttempts: 1, passCompletions: 1 }),
        rb: () => ({ recYds: Math.max(0, y), receptions: y > 0 ? 1 : 0 })
      });
      play.text = `Screen to ${play.actors.rb ? play.actors.rb.name : "RB"} for ${y}`;
      return play;
    }

    return { yards: y, time: 25, playType: "run_short", special: null, text: `Gain of ${y}`, actors: {}, statPatches: [] };
  },

  /** Random non-scoring snap for building a series. */
  randomSnap(game, preferShort) {
    const r = Math.random();
    if (r < 0.12) return this.makePlay(game, "sack", -this.rand(1, 5));
    if (r < 0.20) return this.makePlay(game, "scramble", preferShort ? this.rand(0, 4) : this.rand(0, 8));
    if (r < 0.38) return this.makePlay(game, "pass", 0);
    if (r < 0.60) return this.makePlay(game, "run", preferShort ? this.rand(0, 4) : this.rand(0, 8));
    if (r < 0.85) return this.makePlay(game, "pass", preferShort ? this.rand(1, 6) : this.rand(1, 12));
    return this.makePlay(game, "screen", this.rand(1, 8));
  },

  /**
   * Build plays until 4th down (optionally allowing first downs).
   * Returns { plays, yardLine, down, distance } virtual state at 4th down.
   */
  buildUntilFourth(game, opts) {
    const plays = [];
    let yl = game.yardLine;
    let down = game.down || 1;
    let distance = game.distance || 10;
    const allowFD = opts && opts.allowFirstDowns;
    const maxSnaps = (opts && opts.maxSnaps) || 12;
    const stall = opts && opts.stall; // keep gains short of sticks when possible

    let snaps = 0;
    while (down < 4 && snaps < maxSnaps) {
      snaps++;
      let play;
      if (stall) {
        // Prefer incomplete / short of distance
        const r = Math.random();
        if (r < 0.35) play = this.makePlay(game, "pass", 0);
        else if (r < 0.5) play = this.makePlay(game, "sack", -this.rand(1, 4));
        else if (r < 0.75) play = this.makePlay(game, "run", this.rand(0, Math.max(0, distance - 1)));
        else play = this.makePlay(game, "pass", this.rand(0, Math.max(0, distance - 1)));
      } else {
        play = this.randomSnap(game, !allowFD);
        // If first downs not allowed, cap yards short of distance
        if (!allowFD && play.yards >= distance) {
          play = this.makePlay(game, play.playType && play.playType.startsWith("pass") ? "pass" : "run",
            Math.max(0, distance - 1));
        }
      }

      plays.push(play);
      yl = Math.max(0, Math.min(99, yl + play.yards));

      if (play.yards >= distance) {
        if (!allowFD) {
          // shouldn't happen often
          down = 4;
          distance = 1;
        } else {
          down = 1;
          distance = yl >= 90 ? Math.max(1, 100 - yl) : 10;
        }
      } else {
        down += 1;
        distance = Math.max(1, distance - play.yards);
      }
    }

    // Force 4th if loop ended early
    if (down < 4) {
      down = 4;
    }

    return { plays, yardLine: yl, down, distance };
  },

  makeFieldGoal(game, good) {
    const play = {
      yards: 0,
      time: this.clockFor("field_goal"),
      playType: "field_goal",
      special: good ? "fg" : "miss_fg",
      text: "",
      onFourth: true
    };
    this.withPersonnel(game, play, {
      k: () => (good ? { fgMade: 1 } : { fgMiss: 1 })
    });
    const k = play.actors.k;
    play.text = good
      ? `4th down — ${k ? k.name : "K"} field goal is GOOD`
      : `4th down — ${k ? k.name : "K"} field goal is NO good`;
    if (this.timeRunningOut(game) && game.down !== 4) {
      play.text = good
        ? `Clock winding down — ${k ? k.name : "K"} field goal is GOOD`
        : `Clock winding down — ${k ? k.name : "K"} field goal is NO good`;
      play.onFourth = false;
    }
    return play;
  },

  makePunt(game) {
    const puntY = this.rand(35, 52);
    const play = {
      yards: puntY,
      time: this.clockFor("punt"),
      playType: "punt",
      special: "punt",
      text: "",
      onFourth: true
    };
    this.withPersonnel(game, play, {
      p: () => ({ punts: 1, puntYds: puntY })
    });
    play.text = `4th down — ${play.actors.p ? play.actors.p.name : "P"} punts ${puntY} yards`;
    return play;
  },

  generatePlays(game, outcome) {
    const plays = [];
    const start = game.yardLine;
    const needForTd = Math.max(1, 100 - start);
    const late = this.timeRunningOut(game);

    switch (outcome.id) {
      case "touchdown": {
        // March with real-ish downs until score - improved success rate
        let yl = start;
        let down = 1;
        let distance = 10;
        let guard = 0;
        while (yl < 100 && guard < 25) {
          guard++;
          const need = 100 - yl;
          if (need <= 12 && Math.random() < 0.65) {
            // scoring play - increased probability
            const finalGain = need;
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
          // Use improved randomSnap for TD drives - better gains
          const play = this.randomSnap(game, false);
          // Boost gains for TD drives to prevent stalling
          if (play.yards > 0 && play.yards < distance) {
            play.yards = Math.min(play.yards + this.rand(1, 4), distance);
          }
          // avoid accidental huge plays past end zone
          if (yl + play.yards >= 100) {
            play.yards = 100 - yl;
            play.special = "td";
            play.text = (play.text || "Gain") + " — TOUCHDOWN";
            plays.push(play);
            break;
          }
          plays.push(play);
          yl += play.yards;
          if (play.yards >= distance) {
            down = 1;
            distance = yl >= 90 ? Math.max(1, 100 - yl) : 10;
          } else {
            down += 1;
            distance = Math.max(1, distance - play.yards);
            if (down > 4) {
              // If stalled on 4th down, give one more chance with a big play
              if (guard < 20) {
                down = 1;
                distance = 10;
                continue;
              }
              // Final fallback - still should result in TD
              const finalGain = 100 - yl;
              const isPass = Math.random() < 0.5;
              const finalPlay = {
                yards: finalGain,
                time: this.clockFor(isPass ? "touchdown_pass" : "touchdown_run"),
                playType: isPass ? "touchdown_pass" : "touchdown_run",
                special: "td",
                text: ""
              };
              if (isPass) {
                this.withPersonnel(game, finalPlay, {
                  qb: () => ({ passYds: finalGain, passTd: 1 }),
                  wr: () => ({ recYds: finalGain, recTd: 1, receptions: 1 })
                });
                finalPlay.text = `TOUCHDOWN! ${finalPlay.actors.qb ? finalPlay.actors.qb.name : "QB"} to ${finalPlay.actors.wr ? finalPlay.actors.wr.name : "WR"} for ${finalGain}`;
              } else {
                this.withPersonnel(game, finalPlay, {
                  rb: () => ({ rushYds: finalGain, rushTd: 1 })
                });
                finalPlay.text = `TOUCHDOWN! ${finalPlay.actors.rb ? finalPlay.actors.rb.name : "RB"} runs it in from ${finalGain}`;
              }
              plays.push(finalPlay);
              break;
            }
          }
        }
        break;
      }

      case "field_goal":
      case "missed_fg": {
        const good = outcome.id === "field_goal";
        // Late clock + already in range → kick now (any down)
        if (late && this.inFgRange(start)) {
          plays.push(this.makeFieldGoal(game, good));
          break;
        }
        // Otherwise: build to 4th down, get into range if needed, then kick on 4th
        const series = this.buildUntilFourth(game, {
          allowFirstDowns: !this.inFgRange(start),
          stall: this.inFgRange(start),
          maxSnaps: 10
        });
        plays.push(...series.plays);
        let yl = series.yardLine;

        // If still out of range after series, one more short push then 4th
        if (!this.inFgRange(yl)) {
          // try a couple more snaps allowing first downs toward 60
          let down = 1;
          let distance = 10;
          let guard = 0;
          while (!this.inFgRange(yl) && guard < 6) {
            guard++;
            const need = 60 - yl;
            const play = this.makePlay(game, Math.random() < 0.5 ? "run" : "pass", this.rand(1, Math.min(12, Math.max(1, need + 5))));
            plays.push(play);
            yl = Math.min(99, yl + play.yards);
            if (play.yards >= distance) {
              down = 1;
              distance = 10;
            } else {
              down++;
              distance = Math.max(1, distance - play.yards);
              if (down >= 4) break;
            }
          }
          // ensure we're treating kick as 4th
          if (down < 4 && !this.inFgRange(yl)) {
            // can't reasonably FG — punt instead on 4th
            while (down < 4) {
              plays.push(this.makePlay(game, "pass", 0));
              down++;
            }
            plays.push(this.makePunt(game));
            break;
          }
        }

        const fg = this.makeFieldGoal(game, good);
        fg.text = fg.text.replace(/^Clock winding down — /, "4th down — ");
        if (!fg.text.startsWith("4th")) fg.text = "4th down — " + fg.text;
        plays.push(fg);
        break;
      }

      case "punt":
      case "big_stop_punt": {
        // Always reach 4th down first
        const series = this.buildUntilFourth(game, {
          allowFirstDowns: outcome.id === "punt" && Math.random() < 0.35,
          stall: true,
          maxSnaps: outcome.id === "big_stop_punt" ? 3 : 8
        });
        plays.push(...series.plays);
        const yl = series.yardLine;

        // On 4th: FG if in range, else punt
        if (this.inFgRange(yl)) {
          plays.push(this.makeFieldGoal(game, Math.random() < 0.8));
        } else {
          plays.push(this.makePunt(game));
        }
        break;
      }

      case "turnover_int": {
        if (Math.random() > 0.3) {
          const n = this.rand(1, 4);
          for (let i = 0; i < n; i++) {
            if (Math.random() < 0.45) plays.push(this.makePlay(game, "pass", 0));
            else if (Math.random() < 0.5) plays.push(this.makePlay(game, "run", this.rand(1, 7)));
            else plays.push(this.makePlay(game, "pass", this.rand(1, 10)));
          }
        }
        const play = {
          yards: 0, time: this.clockFor("interception"), playType: "interception", special: "int", text: ""
        };
        this.withPersonnel(game, play, {
          qb: () => ({ passAttempts: 1, interceptions: 1 }),
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
          yards: 0, time: this.clockFor("fumble"), playType: "fumble", special: "fumble", text: ""
        };
        this.withPersonnel(game, play, { def: () => ({ tackles: 1 }) });
        play.text = `FUMBLE recovered by ${play.actors.def ? play.actors.def.name : "the defense"}`;
        plays.push(play);
        break;
      }

      case "turnover_downs": {
        // Explicitly 1st–3rd then failed 4th
        const series = this.buildUntilFourth(game, { allowFirstDowns: false, stall: true, maxSnaps: 4 });
        plays.push(...series.plays);
        const y = this.rand(0, Math.max(0, series.distance - 1));
        const p = this.makePlay(game, Math.random() < 0.5 ? "run" : "pass", y);
        p.special = "downs";
        p.text += " — 4th down, short of the marker. Turnover on downs";
        plays.push(p);
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
        this.withPersonnel(game, play, { sacker: () => ({ tackles: 1 }) });
        play.text = `SAFETY — ${play.actors.sacker ? play.actors.sacker.name : "defense"} tackles in the end zone`;
        plays.push(play);
        break;
      }

      case "blocked_kick": {
        // Build to 4th down, then have kick blocked
        const series = this.buildUntilFourth(game, { allowFirstDowns: false, stall: true, maxSnaps: 4 });
        plays.push(...series.plays);
        const yl = series.yardLine;
        const isFg = this.inFgRange(yl);
        const play = {
          yards: 0,
          time: this.clockFor(isFg ? "field_goal" : "punt"),
          playType: isFg ? "field_goal" : "punt",
          special: "blocked_kick",
          text: ""
        };
        this.withPersonnel(game, play, {
          k: () => isFg ? { fgMiss: 1 } : null,
          p: () => !isFg ? { punts: 1 } : null,
          def: () => ({ tackles: 1 })
        });
        const defender = play.actors.def ? play.actors.def.name : "defender";
        const kicker = isFg && play.actors.k ? play.actors.k.name : (!isFg && play.actors.p ? play.actors.p.name : "kicker");
        play.text = `BLOCKED KICK! ${defender} gets a hand on ${isFg ? "the field goal attempt" : "the punt"} by ${kicker}`;
        plays.push(play);
        break;
      }

      case "end_of_half": {
        // Kneel down or time runs out
        const play = {
          yards: 0,
          time: Math.min(game.clockSeconds, 40),
          playType: "kneel",
          special: "end_of_half",
          text: "Kneel down — end of half/game"
        };
        this.withPersonnel(game, play, {
          qb: () => ({ rushYds: 0 })
        });
        plays.push(play);
        break;
      }

      default: {
        const series = this.buildUntilFourth(game, { allowFirstDowns: false, stall: true, maxSnaps: 4 });
        plays.push(...series.plays);
        if (this.inFgRange(series.yardLine)) plays.push(this.makeFieldGoal(game, true));
        else plays.push(this.makePunt(game));
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
      turnover_int: "DRIVE RESULT: Interception",
      turnover_fumble: "DRIVE RESULT: Fumble",
      turnover_downs: "DRIVE RESULT: Turnover on Downs",
      safety: "DRIVE RESULT: Safety",
      blocked_kick: "DRIVE RESULT: Blocked Kick",
      end_of_half: "DRIVE RESULT: End of Half/Game"
    };
    return map[id] || "DRIVE RESULT";
  }
};
