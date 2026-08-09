// ============================================
// STARTERS / BENCH + PLAYER STATS + AWARD PROJECTIONS
// ============================================

window.PlayerSystem = {
  // How many starters per position (depth chart)
  STARTER_SLOTS: {
    QB: 1, RB: 2, WR: 3, TE: 1, OL: 5,
    DL: 4, LB: 3, CB: 2, S: 2, K: 1, P: 1
  },

  emptyStat() {
    return {
      passYds: 0, passTd: 0, interceptions: 0,
      rushYds: 0, rushTd: 0,
      recYds: 0, recTd: 0, receptions: 0,
      tackles: 0, sacks: 0, deflections: 0,
      fgMade: 0, fgMiss: 0, punts: 0, puntYds: 0
    };
  },

  playerId(team, player) {
    return teamKey(team) + "::" + player.name;
  },

  loadStats() {
    try {
      return JSON.parse(localStorage.getItem("mfl-player-stats") || "{}");
    } catch (e) {
      return {};
    }
  },

  saveStats(stats) {
    localStorage.setItem("mfl-player-stats", JSON.stringify(stats));
  },

  getStat(team, player) {
    const all = this.loadStats();
    const id = this.playerId(team, player);
    return all[id] || this.emptyStat();
  },

  addStat(team, player, patch) {
    if (!team || !player) return;
    const all = this.loadStats();
    const id = this.playerId(team, player);
    const cur = all[id] || this.emptyStat();
    Object.keys(patch).forEach(k => {
      cur[k] = (cur[k] || 0) + (patch[k] || 0);
    });
    all[id] = cur;
    this.saveStats(all);
  },

  /** Mark starter/bench on every roster (by rating within position). */
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

  starters(team, pos) {
    const list = (ROSTERS[teamKey(team)] || []).filter(p => p.position === pos);
    list.sort((a, b) => (b.starter === a.starter ? b.rating - a.rating : (b.starter ? 1 : 0) - (a.starter ? 1 : 0)));
    return list.filter(p => p.starter);
  },

  /** Weighted pick among starters (higher rating more likely). */
  pickStarter(team, positions) {
    const pool = [];
    positions.forEach(pos => {
      this.starters(team, pos).forEach(p => pool.push(p));
    });
    if (!pool.length) {
      const all = ROSTERS[teamKey(team)] || [];
      return all[0] || { name: "Unknown", position: positions[0], rating: 70, starter: true };
    }
    const weights = pool.map(p => Math.max(1, p.rating - 40));
    const sum = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * sum;
    for (let i = 0; i < pool.length; i++) {
      r -= weights[i];
      if (r <= 0) return pool[i];
    }
    return pool[pool.length - 1];
  },

  offenseOverall(team) {
    const pos = ["QB", "RB", "WR", "TE", "OL"];
    const starters = [];
    pos.forEach(p => this.starters(team, p).forEach(x => starters.push(x)));
    if (!starters.length) return getTeamOverall(team);
    return Math.round(starters.reduce((s, p) => s + p.rating, 0) / starters.length);
  },

  defenseOverall(team) {
    const pos = ["DL", "LB", "CB", "S"];
    const starters = [];
    pos.forEach(p => this.starters(team, p).forEach(x => starters.push(x)));
    if (!starters.length) return getTeamOverall(team);
    return Math.round(starters.reduce((s, p) => s + p.rating, 0) / starters.length);
  },

  /** Award projection leaders from season stats. */
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
      const s = all[id];
      rows.push({ team, player, stats: s });
    });

    const scoreMVP = r =>
      r.stats.passYds * 0.04 + r.stats.passTd * 6 + r.stats.rushYds * 0.1 +
      r.stats.rushTd * 6 + r.stats.recYds * 0.1 + r.stats.recTd * 6 - r.stats.interceptions * 3;
    const scoreOPOY = scoreMVP;
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
      offensive_poy: top(scoreOPOY),
      defensive_poy: top(scoreDPOY),
      best_qb: top(scoreQB),
      best_rb: top(scoreRB),
      best_wr: top(scoreWR)
    };
  }
};

// Apply depth charts as soon as ROSTERS exist
if (typeof ROSTERS !== "undefined") {
  window.PlayerSystem.applyDepthCharts();
}
