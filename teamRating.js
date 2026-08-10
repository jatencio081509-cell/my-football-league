// Team overall = average of STARTERS only (not full roster)
(function () {
  function ensureStarters() {
    if (window.PlayerSystem && typeof window.PlayerSystem.applyDepthCharts === "function") {
      window.PlayerSystem.applyDepthCharts();
    }
  }

  function startersOf(team) {
    ensureStarters();
    const list = (typeof ROSTERS !== "undefined" && ROSTERS[teamKey(team)]) || [];
    const starters = list.filter(p => p.starter);
    // Fallback if depth chart not applied yet: top by position slots
    if (starters.length) return starters;
    return list.slice().sort((a, b) => b.rating - a.rating).slice(0, 22);
  }

  window.getTeamOverall = function (team) {
    const starters = startersOf(team);
    if (!starters.length) return 0;
    return Math.round(starters.reduce((s, p) => s + p.rating, 0) / starters.length);
  };

  // Re-apply when DOM ready so any early calls still get corrected on UI refresh
  window.addEventListener("DOMContentLoaded", () => {
    ensureStarters();
  });
})();
