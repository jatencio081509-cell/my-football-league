// ============================================
// COACH SYSTEM
// ============================================

window.CoachSystem = {
  COACH_NAMES: {
    first: ["Bill","Andy","Sean","Mike","John","Kyle","Dan","Kevin","Pat","Matt","Brian","Todd","Ron","Mike","Frank","Arthur","John","Mike","Bill","Jon","Nick","Mike","Josh","Kevin","Mike"],
    last: ["Belichick","Reid","McVay","Tomlin","Harbaugh","Shanahan","Campbell","O'Connell","Mahomes","LaFleur","Daboll","Bowles","Rivera","Zimmer","Reich","Smith","Gruden","Vrabel","Cowher","Gruden","Saban","Martz","McDaniels","Stefanski","Tomlin"]
  },

  loadCoaches() {
    try { return JSON.parse(localStorage.getItem("mfl-coaches") || "null"); }
    catch (e) { return null; }
  },

  saveCoaches(coaches) {
    localStorage.setItem("mfl-coaches", JSON.stringify(coaches));
  },

  generateCoaches(force = false) {
    const existing = this.loadCoaches();
    if (!force && existing && Object.keys(existing).length === TEAMS.length) {
      return existing;
    }

    const coaches = {};
    const rng = Math.random;

    TEAMS.forEach(team => {
      const first = this.COACH_NAMES.first[Math.floor(rng() * this.COACH_NAMES.first.length)];
      const last = this.COACH_NAMES.last[Math.floor(rng() * this.COACH_NAMES.last.length)];

      // Coach ratings (0-100)
      const offenseRating = 60 + Math.floor(rng() * 35);
      const defenseRating = 60 + Math.floor(rng() * 35);
      const draftingRating = 60 + Math.floor(rng() * 35);
      const developmentRating = 60 + Math.floor(rng() * 35);

      coaches[teamKey(team)] = {
        name: `${first} ${last}`,
        team: teamKey(team),
        offenseRating,
        defenseRating,
        draftingRating,
        developmentRating,
        overallRating: Math.round((offenseRating + defenseRating + draftingRating + developmentRating) / 4),
        yearsWithTeam: 0,
        totalChampionships: 0,
        seasons: 0
      };
    });

    this.saveCoaches(coaches);
    return coaches;
  },

  getCoach(team) {
    const coaches = this.generateCoaches(false);
    if (!coaches) return null;
    return coaches[teamKey(team)] || null;
  },

  /** Get coach rating for specific category */
  getCoachRating(team, category) {
    const coach = this.getCoach(team);
    if (!coach) return 70; // Default average

    switch (category) {
      case "offense": return coach.offenseRating || 70;
      case "defense": return coach.defenseRating || 70;
      case "drafting": return coach.draftingRating || 70;
      case "development": return coach.developmentRating || 70;
      default: return coach.overallRating || 70;
    }
  },

  /** Apply coach bonus to player development during offseason */
  applyDevelopmentBonus(team, player) {
    const coach = this.getCoach(team);
    if (!coach) return 0;

    const devRating = coach.developmentRating || 70;
    let bonus = 0;

    // Higher development rating = better chance of improvement
    if (devRating >= 85 && Math.random() < 0.4) {
      bonus = 1; // Extra rating point
    } else if (devRating >= 75 && Math.random() < 0.25) {
      bonus = 1;
    } else if (devRating <= 55 && Math.random() < 0.2) {
      bonus = -1; // Poor development can hurt
    }

    return bonus;
  },

  /** Apply coach bonus to draft pick quality */
  applyDraftingBonus(team, prospect) {
    const coach = this.getCoach(team);
    if (!coach) return 0;

    const draftRating = coach.draftingRating || 70;
    let bonus = 0;

    // Better drafting coaches get more out of their picks
    if (draftRating >= 85) {
      bonus = Math.floor(Math.random() * 3); // 0-2 bonus points
    } else if (draftRating >= 75) {
      bonus = Math.floor(Math.random() * 2); // 0-1 bonus points
    } else if (draftRating <= 55) {
      bonus = -Math.floor(Math.random() * 2); // 0 to -1 penalty
    }

    return bonus;
  },

  /** Apply coach bonus to drive outcomes when underdog */
  getDriveOutcomeBonus(team, opponentTeam, playType) {
    const coach = this.getCoach(team);
    if (!coach) return 0;

    const teamRating = getTeamOverall ? getTeamOverall(team) : 75;
    const opponentRating = getTeamOverall ? getTeamOverall(opponentTeam) : 75;

    // Only apply bonus when underdog
    if (teamRating >= opponentRating) return 0;

    const ratingDiff = opponentRating - teamRating;
    let bonus = 0;

    // Higher rated coaches help overcome rating disadvantages
    if (coach.offenseRating >= 80 && ["pass", "run"].includes(playType)) {
      bonus = Math.min(5, Math.floor(ratingDiff / 5));
    } else if (coach.defenseRating >= 80 && ["defense", "stop"].includes(playType)) {
      bonus = Math.min(5, Math.floor(ratingDiff / 5));
    }

    return bonus;
  },

  /** Process coach offseason changes */
  processCoachOffseason() {
    const coaches = this.generateCoaches(false);
    if (!coaches) return [];

    const changes = [];

    Object.keys(coaches).forEach(key => {
      const coach = coaches[key];
      coach.seasons++;
      coach.yearsWithTeam++;

      // Random coach turnover (lower rated coaches more likely to be fired)
      const performance = Math.random();
      if (coach.overallRating < 65 && performance < 0.15) {
        // Fire coach
        const team = TEAMS.find(t => teamKey(t) === key);
        changes.push({
          type: "fired",
          team: teamName(team),
          oldCoach: coach.name,
          newCoach: this.hireNewCoach(coach)
        });
      } else if (coach.overallRating >= 85 && performance < 0.05) {
        // Great coach might retire or move to better team
        changes.push({
          type: "retired",
          team: teamName(TEAMS.find(t => teamKey(t) === key)),
          coach: coach.name
        });
      }

      // Slight rating fluctuation based on season performance
      if (Math.random() < 0.3) {
        const change = Math.random() < 0.6 ? 1 : -1;
        coach.offenseRating = Math.max(50, Math.min(95, coach.offenseRating + change));
        coach.defenseRating = Math.max(50, Math.min(95, coach.defenseRating + change));
        coach.draftingRating = Math.max(50, Math.min(95, coach.draftingRating + change));
        coach.developmentRating = Math.max(50, Math.min(95, coach.developmentRating + change));
        coach.overallRating = Math.round((coach.offenseRating + coach.defenseRating + coach.draftingRating + coach.developmentRating) / 4);
      }
    });

    this.saveCoaches(coaches);
    return changes;
  },

  /** Hire a new coach for a team */
  hireNewCoach(oldCoach) {
    const first = this.COACH_NAMES.first[Math.floor(Math.random() * this.COACH_NAMES.first.length)];
    const last = this.COACH_NAMES.last[Math.floor(Math.random() * this.COACH_NAMES.last.length)];

    return {
      name: `${first} ${last}`,
      team: oldCoach.team,
      offenseRating: 60 + Math.floor(Math.random() * 30),
      defenseRating: 60 + Math.floor(Math.random() * 30),
      draftingRating: 60 + Math.floor(Math.random() * 30),
      developmentRating: 60 + Math.floor(Math.random() * 30),
      overallRating: 0, // Will be calculated
      yearsWithTeam: 0,
      totalChampionships: 0,
      seasons: 0
    };
  },

  /** Award championship to coach */
  awardChampionship(team) {
    const coaches = this.generateCoaches(false);
    if (!coaches) return;

    const key = teamKey(team);
    if (coaches[key]) {
      coaches[key].totalChampionships++;
      // Winning championships boosts coach rating
      coaches[key].offenseRating = Math.min(95, coaches[key].offenseRating + 2);
      coaches[key].defenseRating = Math.min(95, coaches[key].defenseRating + 2);
      coaches[key].overallRating = Math.round((coaches[key].offenseRating + coaches[key].defenseRating + coaches[key].draftingRating + coaches[key].developmentRating) / 4);
      this.saveCoaches(coaches);
    }
  }
};

// Auto-integrate with existing systems
(function () {
  function patchDraftSystem() {
    const DS = window.DraftSystem;
    if (!DS || DS.__coachPatched) return;

    const origAddToRoster = DS.addToRoster.bind(DS);
    DS.addToRoster = function(team, prospect, overallPick) {
      const key = teamKey(team);
      if (!ROSTERS[key]) ROSTERS[key] = [];

      // Apply coach drafting bonus
      const coachBonus = window.CoachSystem ? window.CoachSystem.applyDraftingBonus(team, prospect) : 0;

      const player = {
        name: prospect.name,
        position: prospect.position,
        age: Math.max(21, prospect.age || 21),
        height: prospect.height,
        weight: prospect.weight,
        rating: Math.min(99, prospect.rating + (overallPick <= 10 ? 2 : 0) + coachBonus),
        starter: false,
        college: prospect.school,
        draftYear: this.seasonYear(),
        draftRound: Math.ceil(overallPick / 32),
        experience: 0
      };

      ROSTERS[key].push(player);
      if (window.PlayerSystem) window.PlayerSystem.applyDepthCharts();
      if (window.PlayerBio) window.PlayerBio.enrich(player, team);
    };

    DS.__coachPatched = true;
  }

  function patchOffseason() {
    const DS = window.DraftSystem;
    if (!DS || DS.__devCoachPatched) return;

    const origProcessOffseason = DS.processOffseason.bind(DS);
    DS.processOffseason = function () {
      const retired = origProcessOffseason();

      // Apply coach development bonuses
      TEAMS.forEach(team => {
        const key = teamKey(team);
        const roster = ROSTERS[key] || [];
        roster.forEach(player => {
          const bonus = window.CoachSystem ? window.CoachSystem.applyDevelopmentBonus(team, player) : 0;
          if (bonus !== 0) {
            player.rating = Math.max(50, Math.min(99, player.rating + bonus));
            if (!player.ratingChange) player.ratingChange = 0;
            player.ratingChange += bonus;
          }
        });
      });

      // Process coach changes
      if (window.CoachSystem) {
        window.CoachSystem.processCoachOffseason();
      }

      return retired;
    };

    DS.__devCoachPatched = true;
  }

  window.addEventListener("DOMContentLoaded", () => {
    // Try to patch immediately and retry after delays
    patchDraftSystem();
    patchOffseason();

    setTimeout(() => {
      patchDraftSystem();
      patchOffseason();
    }, 100);

    setTimeout(() => {
      patchDraftSystem();
      patchOffseason();
    }, 500);
  });
})();