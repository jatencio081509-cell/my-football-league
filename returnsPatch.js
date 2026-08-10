// Returns, named fumbles & interceptions
(function () {
  function PS() { return window.PlayerSystem; }
  function DE() { return window.DriveEngine; }

  function rollReturn(kind) {
    // kind: 'int' | 'fumble' | 'punt' | 'kick'
    const r = Math.random();
    if (kind === "punt") {
      if (r < 0.35) return { yards: 0, td: false, fairCatch: true }; // fair catch / downed
      if (r < 0.90) return { yards: 4 + Math.floor(Math.random() * 16), td: false }; // 4–19
      if (r < 0.985) return { yards: 20 + Math.floor(Math.random() * 26), td: false }; // 20–45
      return { yards: 99, td: true }; // rare punt-return TD
    }
    if (kind === "kick") {
      if (r < 0.15) return { yards: 12 + Math.floor(Math.random() * 10), td: false }; // short
      if (r < 0.92) return { yards: 18 + Math.floor(Math.random() * 18), td: false }; // 18–35
      if (r < 0.988) return { yards: 36 + Math.floor(Math.random() * 20), td: false }; // 36–55
      return { yards: 99, td: true }; // rare kick-return TD
    }
    // INT / fumble returns — usually short
    if (r < 0.40) return { yards: 0, td: false };
    if (r < 0.88) return { yards: 2 + Math.floor(Math.random() * 14), td: false }; // 2–15
    if (r < 0.98) return { yards: 16 + Math.floor(Math.random() * 20), td: false }; // 16–35
    return { yards: 99, td: true }; // rare pick-six / scoop-and-score ~2%
  }

  function pickOff(game, positions) {
    const team = game.possession === "home" ? game.home : game.away;
    return PS() ? PS().pickAvailable(team, positions) : { name: "Player", position: positions[0], starter: true };
  }
  function pickDef(game, positions) {
    const team = game.possession === "home" ? game.away : game.home;
    return PS() ? PS().pickAvailable(team, positions) : { name: "Player", position: positions[0], starter: true };
  }
  function offTeam(game) {
    return game.possession === "home" ? game.home : game.away;
  }
  function defTeam(game) {
    return game.possession === "home" ? game.away : game.home;
  }

  function patchDriveEngine() {
    const eng = DE();
    if (!eng || eng.__returnsPatched) return;

    // --- Punt with return ---
    eng.makePunt = function (game) {
      const puntY = this.rand(35, 52);
      const ret = rollReturn("punt");
      const punter = pickOff(game, ["P"]);
      const returner = pickDef(game, ["WR", "RB", "CB"]);
      const play = {
        yards: puntY,
        returnYards: ret.td ? 99 : ret.yards,
        returnTd: !!ret.td,
        fairCatch: !!ret.fairCatch,
        time: this.clockFor("punt"),
        playType: "punt",
        special: ret.td ? "punt_td" : "punt",
        text: "",
        onFourth: true,
        actors: { p: punter, returner },
        statPatches: []
      };
      play.statPatches.push({ team: offTeam(game), player: punter, patch: { punts: 1, puntYds: puntY } });
      if (ret.td) {
        play.statPatches.push({
          team: defTeam(game), player: returner,
          patch: { puntRetYds: 50, returnTd: 1, returnYds: 50 }
        });
        play.text = `4th down — ${punter.name} punts ${puntY} yards — ${returner.name} takes it back for a TOUCHDOWN!`;
      } else if (ret.fairCatch || ret.yards === 0) {
        play.text = `4th down — ${punter.name} punts ${puntY} yards — fair catch by ${returner.name}`;
      } else {
        play.statPatches.push({
          team: defTeam(game), player: returner,
          patch: { puntRetYds: ret.yards, returnYds: ret.yards }
        });
        play.text = `4th down — ${punter.name} punts ${puntY} yards — ${returner.name} returns for ${ret.yards}`;
      }
      return play;
    };

    // --- Kickoff return helper (after scores) ---
    eng.makeKickReturn = function (game) {
      // Called AFTER possession already flipped to receiving team
      const ret = rollReturn("kick");
      const returner = PS()
        ? PS().pickAvailable(game.possession === "home" ? game.home : game.away, ["RB", "WR", "CB"])
        : { name: "Returner", position: "RB" };
      const team = game.possession === "home" ? game.home : game.away;
      const play = {
        yards: 0,
        returnYards: ret.td ? 99 : ret.yards,
        returnTd: !!ret.td,
        time: 12,
        playType: "kick_return",
        special: ret.td ? "kick_td" : "kick_return",
        text: "",
        actors: { returner },
        statPatches: []
      };
      if (ret.td) {
        play.statPatches.push({
          team, player: returner,
          patch: { kickRetYds: 100, returnTd: 1, returnYds: 100 }
        });
        play.text = `Kickoff — ${returner.name} returns it all the way — TOUCHDOWN!`;
      } else {
        play.statPatches.push({
          team, player: returner,
          patch: { kickRetYds: ret.yards, returnYds: ret.yards }
        });
        play.text = `Kickoff — ${returner.name} returns to the ${Math.min(40, Math.max(15, ret.yards))} (${ret.yards} yards)`;
      }
      return play;
    };

    const origGenerate = eng.generatePlays.bind(eng);
    eng.generatePlays = function (game, outcome) {
      if (outcome.id === "turnover_int") {
        const plays = [];
        if (Math.random() > 0.3) {
          const n = this.rand(1, 4);
          for (let i = 0; i < n; i++) {
            if (Math.random() < 0.45) plays.push(this.makePlay(game, "pass", 0));
            else if (Math.random() < 0.5) plays.push(this.makePlay(game, "run", this.rand(1, 7)));
            else plays.push(this.makePlay(game, "pass", this.rand(1, 10)));
          }
        }
        const ret = rollReturn("int");
        const qb = pickOff(game, ["QB"]);
        const interceptor = pickDef(game, ["CB", "S", "LB"]);
        const play = {
          yards: 0,
          returnYards: ret.td ? 99 : ret.yards,
          returnTd: !!ret.td,
          time: this.clockFor("interception"),
          playType: "interception",
          special: ret.td ? "int_td" : "int",
          text: "",
          actors: { qb, def: interceptor, interceptor },
          statPatches: [
            { team: offTeam(game), player: qb, patch: { interceptions: 1 } },
            {
              team: defTeam(game),
              player: interceptor,
              patch: ret.td
                ? { interceptions: 1, returnYds: 40, returnTd: 1 }
                : { interceptions: 1, returnYds: ret.yards, tackles: ret.yards === 0 ? 1 : 0 }
            }
          ]
        };
        if (ret.td) {
          play.text = `INTERCEPTION! ${interceptor.name} picks off ${qb.name} and returns it for a TOUCHDOWN!`;
        } else if (ret.yards > 0) {
          play.text = `INTERCEPTION! ${interceptor.name} picks off ${qb.name} and returns ${ret.yards} yards`;
        } else {
          play.text = `INTERCEPTION! ${interceptor.name} picks off ${qb.name} — tackled immediately`;
        }
        plays.push(play);
        return plays;
      }

      if (outcome.id === "turnover_fumble") {
        const plays = [];
        if (Math.random() > 0.25) {
          const n = this.rand(1, 4);
          for (let i = 0; i < n; i++) {
            const r = Math.random();
            if (r < 0.4) plays.push(this.makePlay(game, "run", this.rand(1, 8)));
            else if (r < 0.7) plays.push(this.makePlay(game, "pass", this.rand(0, 9)));
            else plays.push(this.makePlay(game, "sack", -this.rand(1, 4)));
          }
        }
        const ret = rollReturn("fumble");
        // Who was carrying? Prefer RB, else QB/WR
        const fumbler = pickOff(game, Math.random() < 0.55 ? ["RB"] : (Math.random() < 0.5 ? ["QB"] : ["WR", "TE"]));
        const recoverer = pickDef(game, ["DL", "LB", "CB", "S"]);
        const play = {
          yards: 0,
          returnYards: ret.td ? 99 : ret.yards,
          returnTd: !!ret.td,
          time: this.clockFor("fumble"),
          playType: "fumble",
          special: ret.td ? "fumble_td" : "fumble",
          text: "",
          actors: { fumbler, def: recoverer, returner: recoverer },
          statPatches: [
            { team: offTeam(game), player: fumbler, patch: { fumblesLost: 1 } },
            {
              team: defTeam(game),
              player: recoverer,
              patch: ret.td
                ? { fumRecoveries: 1, returnYds: 30, returnTd: 1, tackles: 1 }
                : { fumRecoveries: 1, returnYds: ret.yards, tackles: 1 }
            }
          ]
        };
        if (ret.td) {
          play.text = `FUMBLE! ${fumbler.name} loses it — ${recoverer.name} scoops and scores! TOUCHDOWN!`;
        } else if (ret.yards > 0) {
          play.text = `FUMBLE! ${fumbler.name} loses it — recovered by ${recoverer.name}, returned ${ret.yards} yards`;
        } else {
          play.text = `FUMBLE! ${fumbler.name} loses it — recovered by ${recoverer.name}`;
        }
        plays.push(play);
        return plays;
      }

      return origGenerate(game, outcome);
    };

    eng.__returnsPatched = true;
  }

  function applyReturnScore(game, forDefense) {
    // Defense scores (or receiving team after kick if possession already flipped)
    if (forDefense) {
      if (game.possession === "home") game.awayScore += 7;
      else game.homeScore += 7;
    } else {
      if (game.possession === "home") game.homeScore += 7;
      else game.awayScore += 7;
    }
  }

  function markDriveStart() {
    if (!game) return;
    game.driveStartYard = game.yardLine;
    if (window.FieldVisual) game.driveStartAbs = window.FieldVisual.absFromAway(game);
  }

  function doKickoff(game) {
    // Possession already with receiving team at ~25 after score; generate return narrative
    const eng = DE();
    if (!eng || !eng.makeKickReturn) {
      game.yardLine = 25;
      game.down = 1;
      game.distance = 10;
      markDriveStart();
      return;
    }
    const kr = eng.makeKickReturn(game);
    // Apply stats
    if (kr.statPatches && PS()) {
      kr.statPatches.forEach(sp => {
        if (sp.team && sp.player && sp.patch) PS().addStat(sp.team, sp.player, sp.patch);
      });
    }
    game.playLog.push(kr.text);
    if (kr.returnTd) {
      applyReturnScore(game, false); // scoring team has possession (returner)
      game.playLog.push("*** KICK RETURN TOUCHDOWN (+7) ***");
      // Other team receives next kickoff
      if (typeof switchPossession === "function") switchPossession();
      game.yardLine = 25;
      game.down = 1;
      game.distance = 10;
      // Nested kickoff once is enough — no infinite TD chain for simplicity
      markDriveStart();
      return;
    }
    // Spot: typical kick to ~25–35 after return
    const spot = Math.min(40, Math.max(15, kr.returnYards || 25));
    game.yardLine = spot;
    game.down = 1;
    game.distance = 10;
    markDriveStart();
  }

  function patchIntegrate() {
    // Wrap is hard; instead patch via overriding process after apply —
    // Hook into update by replacing apply path on next driveIntegrate load.
    // We intercept specials by wrapping window.processDrive application...
    // Cleaner: patch global helpers used in driveIntegrate by redefining after load.

    // Patch applyPlayStep by re-binding after driveIntegrate — use Mutation of updateUI is messy.
    // Instead, monkey-patch switchPossession chain by wrapping createNewGame only for KR,
    // and override special handling via a global hook driveIntegrate can call.

    window.__mflHandleSpecialReturn = function (step) {
      if (!game || !step) return false;

      if (step.special === "int" || step.special === "int_td") {
        const intSpot = game.yardLine;
        const retY = step.returnTd ? intSpot : (step.returnYards || 0);
        if (step.returnTd) {
          // Defensive TD — defense scores, then kickoff to original offense
          if (game.possession === "home") game.awayScore += 7;
          else game.homeScore += 7;
          game.playLog.push("*** PICK-SIX — TOUCHDOWN (+7) ***");
          // Original offense receives kickoff → stay with same possession after "kick to them"
          // After INT, possession would flip to defense; for TD they scored so flip back for KO receive
          // Defense scored → offense receives kickoff → possession stays with current offense? 
          // Current possession is still offense. Defense scored. Kickoff to offense.
          game.yardLine = 25;
          game.down = 1;
          game.distance = 10;
          markDriveStart();
          doKickoff(game);
          return true;
        }
        // Flip to defense; field pos from their own goal
        if (typeof switchPossession === "function") switchPossession();
        if (typeof flipField === "function") flipField();
        // Adjust for return: after flipField, yardLine ≈ 100-intSpot; add return yards toward opp EZ
        // flipField typically sets yardLine = 100 - old
        // Return moves closer to opponent end zone = higher yardLine for new offense
        game.yardLine = Math.min(99, Math.max(1, (game.yardLine || (100 - intSpot)) + retY));
        game.down = 1;
        game.distance = 10;
        markDriveStart();
        return true;
      }

      if (step.special === "fumble" || step.special === "fumble_td") {
        const spot = game.yardLine;
        const retY = step.returnTd ? spot : (step.returnYards || 0);
        if (step.returnTd) {
          if (game.possession === "home") game.awayScore += 7;
          else game.homeScore += 7;
          game.playLog.push("*** SCOOP AND SCORE — TOUCHDOWN (+7) ***");
          game.yardLine = 25;
          game.down = 1;
          game.distance = 10;
          markDriveStart();
          doKickoff(game);
          return true;
        }
        if (typeof switchPossession === "function") switchPossession();
        if (typeof flipField === "function") flipField();
        game.yardLine = Math.min(99, Math.max(1, (game.yardLine || (100 - spot)) + retY));
        game.down = 1;
        game.distance = 10;
        markDriveStart();
        return true;
      }

      if (step.special === "punt" || step.special === "punt_td") {
        const afterKick = game.yardLine + (step.yards || 40);
        if (step.returnTd) {
          // Receiving team scores
          if (game.possession === "home") game.awayScore += 7;
          else game.homeScore += 7;
          game.playLog.push("*** PUNT RETURN TOUCHDOWN (+7) ***");
          // Kicking team receives next KO → possession stays with current (kicking) team after score? 
          // Receiving team scored → kicking team gets kickoff → possession remains current offense
          game.yardLine = 25;
          game.down = 1;
          game.distance = 10;
          markDriveStart();
          doKickoff(game);
          return true;
        }
        if (typeof switchPossession === "function") switchPossession();
        let spot = 100 - afterKick;
        if (spot < 1) spot = 20;
        if (spot > 80) spot = 20;
        // Add return yards for receiving team (now in possession)
        spot = Math.min(60, Math.max(1, spot + (step.returnYards || 0)));
        game.yardLine = spot;
        game.down = 1;
        game.distance = 10;
        markDriveStart();
        return true;
      }

      return false;
    };
  }

  // Patch driveIntegrate applyPlayStep by wrapping update after scripts load
  function hookApply() {
    // driveIntegrate uses internal applyPlayStep; we intercept via processDrive play queue
    // by wrapping generatePlays results... already patched.
    // For apply, patch updateUI is not enough.
    // Override processDrive to wrap steps — actually driveIntegrate.applyPlayStep is private.
    // Monkey-patch: replace switchPossession? No.
    // Best approach: wrap window.processDrive after and also replace advance by intercepting specials in updateUI — unreliable.

    // Re-define by patching the driveIntegrate apply path: listen to playLog pushes — no.

    // Patch applySpecial cases by replacing the functions int/fumble/punt handling
    // driveIntegrate calls applySpecial("int") — we need applyPlayStep to call our hook first.
    // Since applyPlayStep is closed, we'll re-bind processDrive sequence:

    const origProcess = window.processDrive;
    if (typeof origProcess !== "function" || origProcess.__retHook) return;

    // Instead, patch at applyTime level — too late.
    // Use a custom next-play wrapper:
    const tryHookButtons = () => {
      const nextBtn = document.getElementById("next-play-btn");
      const autoBtn = document.getElementById("auto-play-btn");
      // driveIntegrate already bound; we need deeper patch.
    };

    // Patch DriveEngine generate + use MutationObserver — simpler:
    // Redefine global apply helpers used if exposed.

    // EXPOSE: driveIntegrate stores nothing. Patch by replacing processDrive entirely is too heavy.

    // Alternative: patch applySpecial-like behavior by wrapping switchPossession and detecting step — no.

    // Practical approach: override applyPlayStep by re-loading logic.
    // We'll patch the punt/int/fumble handling by wrapping updateUI and checking last play — bad.

    // Final approach: monkey-patch Array used for pending — can't.

    // Read driveIntegrate — applyPlayStep is internal. Inject by re-fetching and replacing processDrive
    // with our version that uses __mflHandleSpecialReturn.

    // Minimal: wrap game.playLog.push to detect? No.

    // Do this: after driveIntegrate, replace processDrive to use same dice but our apply:
    // Actually the cleanest fix that works: patch applyPlayStep by editing driveIntegrate.js on github.
  }

  window.addEventListener("DOMContentLoaded", () => {
    patchDriveEngine();
    patchIntegrate();
    setTimeout(patchDriveEngine, 50);
  });
})();
