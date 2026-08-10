// ============================================
// HALL OF FAME SYSTEM
// ============================================

window.HallOfFame = {
  HOF_CRITERIA: {
    MIN_CAREER_LENGTH: 8,      // Minimum seasons
    MIN_PEAK_RATING: 85,       // Peak rating required
    MIN_AWARDS: 1,             // At least 1 major award
    MIN_PRO_BOWLS: 3,          // Pro Bowl selections
    CHAMPIONSHIP_BONUS: 15,    // Rating boost for championship
    MVP_BONUS: 10,             // Rating boost for MVP
    MULTIPLE_AWARDS_BONUS: 5   // Bonus for each additional award
  },

  loadHallOfFame() {
    try { return JSON.parse(localStorage.getItem("mfl-hall-of-fame") || "[]"); }
    catch (e) { return []; }
  },

  saveHallOfFame(members) {
    localStorage.setItem("mfl-hall-of-fame", JSON.stringify(members));
  },

  loadPlayerCareer() {
    try { return JSON.parse(localStorage.getItem("mfl-player-careers") || "{}"); }
    catch (e) { return {}; }
  },

  savePlayerCareer(careers) {
    localStorage.setItem("mfl-player-careers", JSON.stringify(careers));
  },

  /** Track player career data */
  trackPlayerCareer(team, player, seasonStats, awards = []) {
    const careers = this.loadPlayerCareer();
    const playerId = window.PlayerSystem ? window.PlayerSystem.playerId(team, player) : `${teamKey(team)}::${player.name}`;

    if (!careers[playerId]) {
      careers[playerId] = {
        name: player.name,
        position: player.position,
        teams: [teamKey(team)],
        seasons: 0,
        totalStats: window.PlayerSystem ? window.PlayerSystem.emptyStat() : {},
        peakRating: player.rating || 70,
        awards: [],
        championships: 0,
        proBowls: 0,
        careerStart: this.getCurrentSeason(),
        careerEnd: null,
        retired: false
      };
    }

    const career = careers[playerId];
    career.seasons++;
    career.peakRating = Math.max(career.peakRating, player.rating || 70);

    // Add team if not already tracked
    if (!career.teams.includes(teamKey(team))) {
      career.teams.push(teamKey(team));
    }

    // Accumulate stats
    if (seasonStats && window.PlayerSystem) {
      Object.keys(seasonStats).forEach(key => {
        career.totalStats[key] = (career.totalStats[key] || 0) + (seasonStats[key] || 0);
      });
    }

    // Track awards
    if (awards && awards.length > 0) {
      awards.forEach(award => {
        if (!career.awards.includes(award)) {
          career.awards.push(award);
        }
      });
    }

    this.savePlayerCareer(careers);
    return career;
  },

  /** Mark player as retired and check for HOF eligibility */
  retirePlayer(team, player, reason = "Retired") {
    const careers = this.loadPlayerCareer();
    const playerId = window.PlayerSystem ? window.PlayerSystem.playerId(team, player) : `${teamKey(team)}::${player.name}`;

    if (careers[playerId]) {
      careers[playerId].retired = true;
      careers[playerId].careerEnd = this.getCurrentSeason();
      careers[playerId].retirementReason = reason;

      // Check HOF eligibility
      if (this.isEligibleForHallOfFame(careers[playerId])) {
        this.inductIntoHallOfFame(careers[playerId]);
      }

      this.savePlayerCareer(careers);
    }

    return careers[playerId];
  },

  /** Calculate HOF score for a player */
  calculateHOFScore(career) {
    let score = 0;

    // Career length
    score += Math.min(20, career.seasons * 2);

    // Peak rating
    score += Math.min(25, (career.peakRating - 70) * 1.5);

    // Awards
    score += career.awards.length * this.HOF_CRITERIA.MVP_BONUS;
    if (career.awards.includes("MVP")) score += this.HOF_CRITERIA.MVP_BONUS;
    if (career.awards.includes("offensive_poy") || career.awards.includes("defensive_poy")) score += 8;

    // Championships
    score += career.championships * this.HOF_CRITERIA.CHAMPIONSHIP_BONUS;

    // Pro Bowls
    score += career.proBowls * 3;

    // Position-specific adjustments
    if (career.position === "QB") score += 5; // QBs get slight boost
    if (career.position === "K" || career.position === "P") score -= 5; // Specialists need more

    return Math.round(score);
  },

  /** Check if player meets HOF criteria */
  isEligibleForHallOfFame(career) {
    // Must be retired
    if (!career.retired) return false;

    // Must meet minimum career length
    if (career.seasons < this.HOF_CRITERIA.MIN_CAREER_LENGTH) return false;

    // Must have high peak rating
    if (career.peakRating < this.HOF_CRITERIA.MIN_PEAK_RATING) return false;

    // Calculate HOF score (needs to be above threshold)
    const hofScore = this.calculateHOFScore(career);
    return hofScore >= 50; // Minimum HOF score threshold
  },

  /** Induct player into Hall of Fame */
  inductIntoHallOfFame(career) {
    const members = this.loadHallOfFame();

    // Check if already inducted
    if (members.some(m => m.name === career.name && m.position === career.position)) {
      return false;
    }

    const member = {
      ...career,
      inductYear: this.getCurrentSeason(),
      hofScore: this.calculateHOFScore(career),
      inducted: true
    };

    members.push(member);
    this.saveHallOfFame(members);
    return true;
  },

  /** Get current season year */
  getCurrentSeason() {
    if (window.DraftSystem) {
      return window.DraftSystem.seasonYear();
    }
    try {
      return parseInt(localStorage.getItem("mfl-season-year") || "2026", 10);
    } catch (e) {
      return 2026;
    }
  },

  /** Get all HOF members sorted by induction year */
  getHallOfFameMembers() {
    const members = this.loadHallOfFame();
    return members.sort((a, b) => (a.inductYear || 0) - (b.inductYear || 0));
  },

  /** Get HOF members by position */
  getHallOfFameByPosition(position) {
    return this.getHallOfFameMembers().filter(m => m.position === position);
  },

  /** Check if player is in HOF */
  isInHallOfFame(playerName, position) {
    const members = this.loadHallOfFame();
    return members.some(m => m.name === playerName && m.position === position);
  }
};

// Auto-integrate with existing systems
(function () {
  // Hall of Fame retirement tracking is now handled directly in draftSystem.js
  // This integration is no longer needed but kept for compatibility

  window.addEventListener("DOMContentLoaded", () => {
    // Initialize Hall of Fame system
    if (window.HallOfFame) {
      console.log("Hall of Fame system initialized");
    }
  });
})();