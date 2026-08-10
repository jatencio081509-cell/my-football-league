// ============================================
// STARTERS / BENCH + STATS + INJURIES + AWARDS
// ============================================

window.PlayerSystem = {
  STARTER_SLOTS: {
    QB: 1, RB: 2, WR: 3, TE: 1, OL: 5,
    DL: 4, LB: 3, CB: 2, S: 2, K: 1, P: 1
  },

  INJURY_TYPES: [
    { name: "ankle sprain", minGames: 1, maxGames: 3 },
    { name: "hamstring", minGames: 1, maxGames: 4 },
    { name: "concussion", minGames: 1, maxGames: 2 },
    { name: "shoulder", minGames: 2, maxGames: 5 },
    { name: "knee sprain", minGames: 2, maxGames: 6 },
    { name: "ribs", minGames: 1, maxGames: 3 },
    { name: "wrist", minGames: 1, maxGames: 3 },
    { name: "quad strain", minGames: 1, maxGames: 3 }
  ],

  emptyStat() {
    return {
      passYds: 0, passTd: 0, interceptions: 0,
      rushYds: 0, rushTd: 0,
      recYds: 0, recTd: 0, receptions: 0,
      tackles: 0, sacks: 0, deflections: 0,
      fgMade: 0, fgMiss: 0, punts: 0, puntYds: 0,
      returnYds: 0, returnTd: 0, fumblesLost: 0, fumRecoveries: 0,
      kickRetYds: 0, puntRetYds: 0
    };
  },

  playerId(team, player) {
    return teamKey(team) + "::" + player.name;
  },

  loadStats() {
    try { return JSON.parse(localStorage.getItem("mfl-player-stats") || "{}"); }
    catch (e) { return {}; }
  },
  saveStats(stats) {
    localStorage.setItem("mfl-player-stats", JSON.stringify(stats));
  },

  loadInjuries() {
    try { return JSON.parse(localStorage.getItem("mfl-injuries") || "{}"); }
    catch (e) { return {}; }
  },
  saveInjuries(map) {
    localStorage.setItem("mfl-injuries", JSON.stringify(map));
  },

  getStat(team, player) {
    const all = this.loadStats();
    const id = this.playerId(team, player);
    return all[id] || this.emptyStat();
  },

  addStat(team, player, patch) {
    if (!team || !player || !patch) return;
    const all = this.loadStats();
    const id = this.playerId(team, player);
    const cur = all[id] || this.emptyStat();
    Object.keys(patch).forEach(k => {
      cur[k] = (cur[k] || 0) + (patch[k] || 0);
    });
    all[id] = cur;
    this.saveStats(all);
  },

  isInjured(team, player) {
    if (!team || !player) return false;
    const inj = this.loadInjuries()[this.playerId(team, player)];
    return !!(inj && inj.gamesLeft > 0);
  },

  getInjury(team, player) {
    if (!team || !player) return null;
    return this.loadInjuries()[this.playerId(team, player)] || null;
  },

  injure(team, player) {
    if (!team || !player) return null;
    const type = this.INJURY_TYPES[Math.floor(Math.random() * this.INJURY_TYPES.length)];
    const gamesLeft = type.minGames + Math.floor(Math.random() * (type.maxGames - type.minGames + 1));
    const all = this.loadInjuries();
    const rec = {
      type: type.name,
      gamesLeft,
      playerName: player.name,
      position: player.position,
      wasStarter: !!player.starter,
      teamKey: teamKey(team)
    };
    all[this.playerId(team, player)] = rec;
    this.saveInjuries(all);
    return rec;
  },

  tickInjuriesForTeam(team) {
    if (!team) return;
    const all = this.loadInjuries();
    const key = teamKey(team);
    let changed = false;
    Object.keys(all).forEach(id => {
      if (!id.startsWith(key + "::")) return;
      all[id].gamesLeft = (all[id].gamesLeft || 1) - 1;
      if (all[id].gamesLeft <= 0) {
        delete all[id];
      }
      changed = true;
    });
    if (changed) this.saveInjuries(all);
  },

  applyDepthCharts() {
    if (typeof ROSTERS === "undefined") return;
    Object.keys(ROSTERS).forEach(key => {
      const players = ROSTERS[key];
      const byPos = {};
      players.forEach(p => {
        if (!byPos[p.position]) byPos[p.position] = [];
        byPos[p.position].push(p);
      });
      Object.keys(byPos).forEach(pos => {
        byPos[pos].sort((a, b) => b.rating - a.rating);
        const n = this.STARTER_SLOTS[pos] || 1;
        byPos[pos].forEach((p, i) => {
          p.starter = i < n;
          p.depth = i + 1;
        });
      });
    });
  },

  depthList(team, positions) {
    const list = [];
    const roster = ROSTERS[teamKey(team)] || [];
    positions.forEach(pos => {
      roster.filter(p => p.position === pos).forEach(p => list.push(p));
    });
    list.sort((a, b) => {
      if (!!a.starter !== !!b.starter) return a.starter ? -1 : 1;
      if ((a.depth || 99) !== (b.depth || 99)) return (a.depth || 99) - (b.depth || 99);
      return b.rating - a.rating;
    });
    return list;
  },

  starters(team, pos) {
    return this.depthList(team, [pos]).filter(p => p.starter);
  },

  /**
   * Who plays this snap:
   * 1) Healthy starters only (random among starter slots for multi-starter positions)
   * 2) If all starters at that position are injured → healthy bench by depth
   * 3) Last resort → anyone on the list
   * Never mixes healthy starters with healthy bench on the same role pick.
   */
  pickAvailable(team, positions) {
    const list = this.depthList(team, positions);
    if (!list.length) {
      return { name: "Unknown", position: positions[0], rating: 70, starter: true, depth: 1 };
    }

    const healthyStarters = list.filter(p => p.starter && !this.isInjured(team, p));
    if (healthyStarters.length) {
      // Multi-starter groups (RB2, WR3, etc.): pick among healthy starters only
      if (healthyStarters.length === 1) return healthyStarters[0];
      // Slight rating weight among healthy starters only
      const weights = healthyStarters.map(p => Math.max(1, p.rating - 50));
      const sum = weights.reduce((a, b) => a + b, 0);
      let r = Math.random() * sum;
      for (let i = 0; i < healthyStarters.length; i++) {
        r -= weights[i];
        if (r <= 0) return healthyStarters[i];
      }
      return healthyStarters[0];
    }

    // Starters all out → next healthy on depth chart (bench)
    const healthyBench = list.filter(p => !p.starter && !this.isInjured(team, p));
    if (healthyBench.length) {
      // Strict depth order for first healthy backup (not random mix with starters)
      return healthyBench[0];
    }

    // Everyone hurt — use top of chart anyway
    return list[0];
  },

  pickStarter(team, positions) {
    return this.pickAvailable(team, positions);
  },

  offenseOverall(team) {
    const pos = ["QB", "RB", "WR", "TE", "OL"];
    const units = [];
    pos.forEach(p => {
      const avail = this.depthList(team, [p]).filter(x => !this.isInjured(team, x));
      const take = (this.STARTER_SLOTS[p] || 1);
      (avail.length ? avail : this.depthList(team, [p])).slice(0, take).forEach(x => units.push(x));
    });
    if (!units.length) return getTeamOverall(team);
    return Math.round(units.reduce((s, p) => s + p.rating, 0) / units.length);
  },

  defenseOverall(team) {
    const pos = ["DL", "LB", "CB", "S"];
    const units = [];
    pos.forEach(p => {
      const avail = this.depthList(team, [p]).filter(x => !this.isInjured(team, x));
      const take = (this.STARTER_SLOTS[p] || 1);
      (avail.length ? avail : this.depthList(team, [p])).slice(0, take).forEach(x => units.push(x));
    });
    if (!units.length) return getTeamOverall(team);
    return Math.round(units.reduce((s, p) => s + p.rating, 0) / units.length);
  },

  maybeInjureFromPlay(team, player, playType) {
    if (!team || !player || this.isInjured(team, player)) return null;
    let chance = 0.012;
    if (playType === "sack" || playType === "safety") chance = 0.04;
    else if (playType === "run_big" || playType === "touchdown_run") chance = 0.025;
    else if (playType === "run_short" || playType === "run_medium" || playType === "stuff") chance = 0.018;
    else if (playType === "interception" || playType === "fumble") chance = 0.02;
    else if (playType === "pass_deep") chance = 0.015;

    if (Math.random() > chance) return null;

    const rec = this.injure(team, player);
    if (!rec) return null;
    const role = player.starter ? "starter" : "backup";
    return {
      text: `INJURY: ${player.name} (${player.position}, ${role}) — ${rec.type}, out ~${rec.gamesLeft} game${rec.gamesLeft > 1 ? "s" : ""}`,
      injury: rec,
      player
    };
  },

  projections() {
    const all = this.loadStats();
    const rows = [];
    Object.keys(all).forEach(id => {
      const [tKey, ...nameParts] = id.split("::");
      const name = nameParts.join("::");
      const team = TEAMS.find(t => teamKey(t) === tKey);
      const players = ROSTERS[tKey] || [];
      const player = players.find(p => p.name === name);
      if (!player || !team) return;
      rows.push({ team, player, stats: all[id] });
    });

    const scoreMVP = r =>
      r.stats.passYds * 0.04 + r.stats.passTd * 6 + r.stats.rushYds * 0.1 +
      r.stats.rushTd * 6 + r.stats.recYds * 0.1 + r.stats.recTd * 6 - r.stats.interceptions * 3;
    const scoreDPOY = r => r.stats.tackles * 1.2 + r.stats.sacks * 8 + r.stats.interceptions * 10 + r.stats.deflections * 2;
    const scoreQB = r => r.player.position === "QB" ? scoreMVP(r) : -1;
    const scoreRB = r => r.player.position === "RB" ? r.stats.rushYds + r.stats.rushTd * 40 + r.stats.recYds * 0.5 : -1;
    const scoreWR = r => (r.player.position === "WR" || r.player.position === "TE")
      ? r.stats.recYds + r.stats.recTd * 40 + r.stats.receptions * 2 : -1;

    function top(scorer) {
      const sorted = rows.slice().sort((a, b) => scorer(b) - scorer(a));
      const best = sorted[0];
      if (!best || scorer(best) <= 0) return null;
      return best;
    }

    return {
      mvp: top(scoreMVP),
      offensive_poy: top(scoreMVP),
      defensive_poy: top(scoreDPOY),
      best_qb: top(scoreQB),
      best_rb: top(scoreRB),
      best_wr: top(scoreWR)
    };
  }
};

if (typeof ROSTERS !== "undefined") {
  window.PlayerSystem.applyDepthCharts();
}
