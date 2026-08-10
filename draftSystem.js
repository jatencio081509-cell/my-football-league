// ============================================
// DRAFT + RETIREMENT + CAREER-ENDING INJURIES
// ============================================

window.DraftSystem = {
  FIRST: ["Jaylen","Malik","Caleb","Dereck","Jaxon","Kai","Nolan","Asher","Brooks","Cole","Darius","Eli","Finn","Grant","Holden","Isaiah","Jett","Knox","Landon","Miles","Nash","Owen","Preston","Quinn","Reid","Sawyer","Trent","Vaughn","Wesley","Zane","Andre","Bryson","Cam","Devin","Evan","Felix","Gage","Hunter","Ivan","Jalen"],
  LAST: ["Brooks","Carter","Dixon","Ellis","Foster","Griffin","Hayes","Ingram","Jordan","Knight","Lawson","Morris","Nash","Owens","Parker","Quinn","Reed","Sanders","Turner","Underwood","Vaughn","Walsh","Young","Zimmerman","Barnes","Cooper","Dunn","Ford","Gibson","Holt"],
  COLLEGES: ["Alabama","Ohio State","Georgia","Michigan","Clemson","LSU","Texas","USC","Oregon","Penn State","Notre Dame","Florida","Tennessee","Oklahoma","Utah","Miami","Texas A&M","Ole Miss","Washington","Colorado"],
  HS: ["St. John Bosco (CA)","Mater Dei (CA)","IMG Academy (FL)","Duncanville (TX)","Bishop Gorman (NV)","Buford (GA)","St. Thomas Aquinas (FL)","Allen (TX)","Centennial (NV)","De La Salle (CA)","Dutch Fork (SC)","Hoover (AL)","North Shore (TX)","St. Joseph's Prep (PA)","Catholic (LA)"],
  POS: ["QB","RB","WR","TE","OL","DL","LB","CB","S","K","P"],

  seasonYear() {
    try {
      const y = parseInt(localStorage.getItem("mfl-season-year") || "2026", 10);
      return Number.isFinite(y) ? y : 2026;
    } catch (e) { return 2026; }
  },
  setSeasonYear(y) {
    localStorage.setItem("mfl-season-year", String(y));
  },

  loadProspects() {
    try { return JSON.parse(localStorage.getItem("mfl-prospects") || "null"); }
    catch (e) { return null; }
  },
  saveProspects(list) {
    localStorage.setItem("mfl-prospects", JSON.stringify(list));
  },

  loadDraftState() {
    try { return JSON.parse(localStorage.getItem("mfl-draft-state") || "null"); }
    catch (e) { return null; }
  },
  saveDraftState(st) {
    localStorage.setItem("mfl-draft-state", JSON.stringify(st));
  },

  loadOffseasonHistory() {
    try { return JSON.parse(localStorage.getItem("mfl-offseason-history") || "[]"); }
    catch (e) { return []; }
  },
  saveOffseasonHistory(history) {
    localStorage.setItem("mfl-offseason-history", JSON.stringify(history));
  },

  /** Super Bowl / league championship finished? */
  championshipDone() {
    try {
      return localStorage.getItem("mfl-championship-done") === "1";
    } catch (e) { return false; }
  },
  markChampionshipDone() {
    localStorage.setItem("mfl-championship-done", "1");
  },
  clearChampionshipFlag() {
    localStorage.removeItem("mfl-championship-done");
  },

  mulberry(seed) {
    return function () {
      let t = seed += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  },

  /** Generate multi-year pipeline (0–6 years until draft). */
  generateProspects(force) {
    if (!force) {
      const existing = this.loadProspects();
      if (existing && existing.length) return existing;
    }
    const year = this.seasonYear();
    const rng = this.mulberry(year * 9973 + 42);
    const list = [];
    // ~40 per class year * 7 years
    for (let yearsOut = 0; yearsOut <= 6; yearsOut++) {
      const count = yearsOut === 0 ? 120 : 40;
      for (let i = 0; i < count; i++) {
        const pos = this.POS[Math.floor(rng() * (this.POS.length - (yearsOut > 3 ? 2 : 0)))]; // fewer K/P deep
        const first = this.FIRST[Math.floor(rng() * this.FIRST.length)];
        const last = this.LAST[Math.floor(rng() * this.LAST.length)];
        let level, school, age;
        if (yearsOut >= 5) {
          level = yearsOut === 6 ? "HS Sophomore" : "HS Junior";
          school = this.HS[Math.floor(rng() * this.HS.length)];
          age = yearsOut === 6 ? 15 + Math.floor(rng() * 2) : 16 + Math.floor(rng() * 2);
        } else if (yearsOut >= 3) {
          level = yearsOut === 4 ? "HS Senior" : "College Freshman";
          school = yearsOut === 4
            ? this.HS[Math.floor(rng() * this.HS.length)]
            : this.COLLEGES[Math.floor(rng() * this.COLLEGES.length)];
          age = yearsOut === 4 ? 17 + Math.floor(rng() * 2) : 18 + Math.floor(rng() * 2);
        } else {
          const classes = ["College Senior", "College Junior", "College Sophomore"];
          level = classes[yearsOut] || "College Senior";
          school = this.COLLEGES[Math.floor(rng() * this.COLLEGES.length)];
          age = 20 + (2 - yearsOut) + Math.floor(rng() * 2);
        }
        // Rating: seniors higher ceiling; HS much lower current
        let rating;
        if (yearsOut === 0) rating = 58 + Math.floor(rng() * 32);
        else if (yearsOut === 1) rating = 55 + Math.floor(rng() * 28);
        else if (yearsOut === 2) rating = 52 + Math.floor(rng() * 25);
        else if (yearsOut <= 4) rating = 48 + Math.floor(rng() * 22);
        else rating = 42 + Math.floor(rng() * 18);
        if (rng() > 0.92) rating = Math.min(97, rating + 10 + Math.floor(rng() * 8));

        const heightIn = pos === "OL" || pos === "DL" || pos === "TE"
          ? 74 + Math.floor(rng() * 6)
          : pos === "QB" ? 72 + Math.floor(rng() * 5)
          : 68 + Math.floor(rng() * 8);
        const weight = pos === "OL" || pos === "DL"
          ? 280 + Math.floor(rng() * 50)
          : pos === "QB" ? 210 + Math.floor(rng() * 30)
          : 180 + Math.floor(rng() * 50);

        list.push({
          id: `p-${year}-${yearsOut}-${i}-${Math.floor(rng() * 1e6)}`,
          name: `${first} ${last}`,
          position: pos,
          age,
          height: `${Math.floor(heightIn / 12)}'${heightIn % 12}`,
          weight,
          rating,
          school,
          level,
          yearsUntilDraft: yearsOut,
          draftYear: year + yearsOut,
          projectedRound: rating >= 88 ? 1 : rating >= 80 ? 2 : rating >= 74 ? 3 : rating >= 68 ? 4 : rating >= 62 ? 5 : 6
        });
      }
    }
    list.sort((a, b) => b.rating - a.rating);
    this.saveProspects(list);
    return list;
  },

  prospectsForYear(draftYear) {
    const all = this.generateProspects(false);
    return all.filter(p => p.draftYear === draftYear).sort((a, b) => b.rating - a.rating);
  },

  /** Draft order: worst regular-season record first (NFL-style with playoff teams at end). */
  buildDraftOrder() {
    const standings = typeof loadStandings === "function" ? loadStandings() : {};
    const rows = TEAMS.map(team => {
      const s = standings[teamKey(team)] || { wins: 0, losses: 0, ties: 0, pf: 0, pa: 0 };
      const games = (s.wins || 0) + (s.losses || 0) + (s.ties || 0);
      const pct = games ? (s.wins + 0.5 * (s.ties || 0)) / games : 0;
      return { team, wins: s.wins || 0, losses: s.losses || 0, ties: s.ties || 0, pct, pf: s.pf || 0, pa: s.pa || 0 };
    });

    // Separate playoff and non-playoff teams (simplified - teams with .500+ record considered playoff teams)
    const nonPlayoff = rows.filter(r => r.pct < 0.500);
    const playoff = rows.filter(r => r.pct >= 0.500);

    // Sort non-playoff teams by record (worst first)
    nonPlayoff.sort((a, b) => {
      if (a.pct !== b.pct) return a.pct - b.pct;
      const ad = a.pf - a.pa, bd = b.pf - b.pa;
      if (ad !== bd) return ad - bd;
      return a.wins - b.wins;
    });

    // Sort playoff teams by record (worst first among playoff teams)
    playoff.sort((a, b) => {
      if (a.pct !== b.pct) return a.pct - b.pct;
      const ad = a.pf - a.pa, bd = b.pf - b.pa;
      if (ad !== bd) return ad - bd;
      return a.wins - b.wins;
    });

    // Combine: non-playoff teams first, then playoff teams
    // In real NFL, Super Bowl loser picks 31st, winner 32nd
    // For simplicity, we'll just put the best playoff team last
    const allTeams = [...nonPlayoff, ...playoff];
    return allTeams.map(r => r.team);
  },

  startDraft() {
    if (!this.championshipDone()) {
      alert("Finish the League Championship (Super Bowl) before starting the draft.");
      return null;
    }
    const year = this.seasonYear();
    const pool = this.prospectsForYear(year).map(p => ({ ...p }));
    const order = this.buildDraftOrder();
    const state = {
      year,
      round: 1,
      pickInRound: 0,
      overall: 0,
      order: order.map(t => teamKey(t)),
      remaining: pool,
      picks: [], // { overall, round, pick, teamKey, prospect }
      done: false
    };
    this.saveDraftState(state);
    return state;
  },

  getState() {
    return this.loadDraftState();
  },

  currentTeam(state) {
    if (!state || state.done) return null;
    const idx = state.pickInRound % 32;
    const key = state.order[idx];
    return TEAMS.find(t => teamKey(t) === key) || null;
  },

  /** Best available by rating, slight need bias for missing low depth. */
  autoPick(state) {
    if (!state || state.done || !state.remaining.length) return null;
    const team = this.currentTeam(state);
    const roster = ROSTERS[teamKey(team)] || [];
    const counts = {};
    roster.forEach(p => { counts[p.position] = (counts[p.position] || 0) + 1; });

    let best = null;
    let bestScore = -1;
    state.remaining.forEach(p => {
      let score = p.rating;
      const c = counts[p.position] || 0;
      if (c < 2) score += 4;
      if (c < 1) score += 6;
      if (p.position === "QB" && c < 2) score += 3;
      if (score > bestScore) { bestScore = score; best = p; }
    });
    return best;
  },

  makePick(state, prospect) {
    if (!state || state.done || !prospect) return state;
    const team = this.currentTeam(state);
    const overall = state.overall + 1;
    const round = state.round;
    const pick = state.pickInRound + 1;
    state.picks.push({
      overall, round, pick,
      teamKey: teamKey(team),
      teamName: teamName(team),
      prospect: { ...prospect }
    });
    state.remaining = state.remaining.filter(p => p.id !== prospect.id);

    // Add to roster as undrafted-age pro
    this.addToRoster(team, prospect, overall);

    state.overall = overall;
    state.pickInRound += 1;
    if (state.pickInRound >= 32) {
      state.pickInRound = 0;
      state.round += 1;
    }
    if (state.round > 7 || !state.remaining.length) {
      state.done = true;
    }
    this.saveDraftState(state);
    return state;
  },

  nextPick(state) {
    const p = this.autoPick(state);
    if (!p) { state.done = true; this.saveDraftState(state); return state; }
    return this.makePick(state, p);
  },

  simRound(state) {
    if (!state || state.done) return state;
    const targetRound = state.round;
    while (!state.done && state.round === targetRound) {
      state = this.nextPick(state);
    }
    return state;
  },

  endDraft(state) {
    while (state && !state.done) {
      state = this.nextPick(state);
    }
    return state;
  },

  addToRoster(team, prospect, overallPick) {
    const key = teamKey(team);
    if (!ROSTERS[key]) ROSTERS[key] = [];
    const player = {
      name: prospect.name,
      position: prospect.position,
      age: Math.max(21, prospect.age || 21),
      height: prospect.height,
      weight: prospect.weight,
      rating: Math.min(99, prospect.rating + (overallPick <= 10 ? 2 : 0)),
      starter: false,
      college: prospect.school,
      draftYear: this.seasonYear(),
      draftRound: Math.ceil(overallPick / 32),
      experience: 0
    };
    ROSTERS[key].push(player);
    if (window.PlayerSystem) window.PlayerSystem.applyDepthCharts();
    if (window.PlayerBio) window.PlayerBio.enrich(player, team);
  },

  // ---------- RETIREMENT ----------
  retireChance(player) {
    const age = player.age || 24;
    const rating = player.rating || 70;
    let p = 0;
    if (age >= 38) p = 0.75;
    else if (age >= 36) p = 0.45;
    else if (age >= 34) p = 0.22;
    else if (age >= 32) p = 0.10;
    else if (age >= 30) p = 0.04;
    else p = 0.005;
    // Stars hang on longer
    if (rating >= 90) p *= 0.45;
    else if (rating >= 85) p *= 0.65;
    else if (rating < 65 && age >= 30) p *= 1.5;
    return Math.min(0.9, p);
  },

  /** Run after championship: retirements, age+1, tick injuries already handled per game. */
  processOffseason() {
    const retired = [];
    TEAMS.forEach(team => {
      const key = teamKey(team);
      const list = ROSTERS[key] || [];
      const kept = [];
      list.forEach(p => {
        if (p.careerOver) {
          retired.push({ team, player: p, reason: p.careerEndReason || "Career-ending injury" });
          // Track for Hall of Fame
          if (window.HallOfFame) {
            window.HallOfFame.retirePlayer(team, p, p.careerEndReason || "Career-ending injury");
          }
          return;
        }
        if (Math.random() < this.retireChance(p)) {
          retired.push({ team, player: p, reason: "Retired" });
          // Track for Hall of Fame
          if (window.HallOfFame) {
            window.HallOfFame.retirePlayer(team, p, "Retired");
          }
          return;
        }
        const oldRating = p.rating;
        p.age = (p.age || 24) + 1;
        p.experience = (p.experience || 0) + 1;
        // slight aging rating drift
        if (p.age >= 33 && Math.random() < 0.4) {
          p.rating = Math.max(50, p.rating - 1);
          p.ratingChange = p.rating - oldRating;
          p.oldRating = oldRating;
        }
        if (p.age >= 36 && Math.random() < 0.5) {
          p.rating = Math.max(48, p.rating - 1);
          p.ratingChange = p.rating - oldRating;
          p.oldRating = oldRating;
        }
        // Young players can improve
        if (p.age <= 25 && Math.random() < 0.3) {
          p.rating = Math.min(99, p.rating + 1);
          p.ratingChange = p.rating - oldRating;
          p.oldRating = oldRating;
        }
        kept.push(p);
      });
      ROSTERS[key] = kept;
    });
    if (window.PlayerSystem) window.PlayerSystem.applyDepthCharts();
    return retired;
  },

  /** Age prospects one year (pipeline). */
  ageProspects() {
    const list = this.generateProspects(false).map(p => {
      const q = { ...p };
      q.yearsUntilDraft = Math.max(0, (q.yearsUntilDraft || 0) - 1);
      q.draftYear = this.seasonYear() + q.yearsUntilDraft;
      q.age = (q.age || 18) + 1;
      if (q.yearsUntilDraft === 0 && q.rating < 90) q.rating = Math.min(96, q.rating + Math.floor(Math.random() * 3));
      return q;
    });
    this.saveProspects(list);
    return list;
  },

  /** Generate offseason overview with draft picks, rating changes, retirements */
  generateOffseasonOverview(draftState, retiredPlayers) {
    const year = this.seasonYear();
    const overview = {
      year,
      draftPicks: [],
      ratingChanges: [],
      retirements: retiredPlayers || [],
      timestamp: Date.now()
    };

    // Top 10 draft picks
    if (draftState && draftState.picks) {
      overview.draftPicks = draftState.picks.slice(0, 10).map(pick => ({
        overall: pick.overall,
        round: pick.round,
        team: pick.teamName,
        player: pick.prospect.name,
        position: pick.prospect.position,
        rating: pick.prospect.rating,
        school: pick.prospect.school
      }));
    }

    // Rating changes across the league
    TEAMS.forEach(team => {
      const key = teamKey(team);
      const roster = ROSTERS[key] || [];
      roster.forEach(player => {
        if (player.ratingChange) {
          overview.ratingChanges.push({
            team: teamName(team),
            player: player.name,
            position: player.position,
            oldRating: player.oldRating || player.rating,
            newRating: player.rating,
            change: player.ratingChange
          });
        }
      });
    });

    // Sort rating changes by absolute change
    overview.ratingChanges.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
    overview.ratingChanges = overview.ratingChanges.slice(0, 20); // Top 20 most significant changes

    return overview;
  },

  /** Save offseason overview to history */
  saveOffseasonOverview(overview) {
    const history = this.loadOffseasonHistory();
    history.push(overview);
    // Keep only last 10 years of history
    if (history.length > 10) {
      history.shift();
    }
    this.saveOffseasonHistory(history);
  }
};

// Career-ending injury chance on top of normal injuries
(function () {
  function patchInjuries() {
    const PS = window.PlayerSystem;
    if (!PS || PS.__careerInjPatched) return;
    const orig = PS.maybeInjureFromPlay.bind(PS);
    PS.maybeInjureFromPlay = function (team, player, playType) {
      const result = orig(team, player, playType);
      if (!result) return null;
      // ~3% of injuries are career-ending; higher on violent plays
      let careerChance = 0.03;
      if (playType === "sack" || playType === "safety") careerChance = 0.05;
      if (result.injury && /knee|concussion/i.test(result.injury.type || "")) careerChance += 0.04;
      if (Math.random() < careerChance) {
        player.careerOver = true;
        player.careerEndReason = `Career-ending ${result.injury.type}`;
        // remove from injury list by setting huge games left marker — stay out
        const all = PS.loadInjuries();
        const id = PS.playerId(team, player);
        all[id] = {
          type: result.injury.type + " (career-ending)",
          gamesLeft: 99,
          playerName: player.name,
          position: player.position,
          wasStarter: !!player.starter,
          teamKey: teamKey(team),
          careerEnding: true
        };
        PS.saveInjuries(all);
        return {
          text: `CAREER-ENDING INJURY: ${player.name} (${player.position}) — ${result.injury.type}. Season and career over.`,
          injury: all[id],
          player,
          careerEnding: true
        };
      }
      return result;
    };
    PS.__careerInjPatched = true;
  }

  // Clear player season stats helper
  window.resetSeasonPlayerStats = function () {
    localStorage.removeItem("mfl-player-stats");
    // keep injuries optional — clear those too for full season reset
    if (confirm("Also clear injuries?")) {
      localStorage.removeItem("mfl-injuries");
    }
    alert("Season player stats cleared.");
  };

  window.addEventListener("DOMContentLoaded", () => {
    patchInjuries();
    setTimeout(patchInjuries, 100);
    window.DraftSystem.generateProspects(false);
  });
})();
