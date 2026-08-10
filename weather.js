// ============================================
// WEATHER — based on home-city climate
// ============================================

window.WeatherSystem = {
  /** Approximate NFL-season (Sep–Jan) condition weights by state. */
  CLIMATE: {
    // Northeast — cold, wet, snow possible
    MA: { clear: 0.35, cloudy: 0.25, rain: 0.22, wind: 0.10, snow: 0.08 },
    NY: { clear: 0.32, cloudy: 0.25, rain: 0.22, wind: 0.10, snow: 0.11 },
    VT: { clear: 0.28, cloudy: 0.22, rain: 0.15, wind: 0.10, snow: 0.25 },
    NH: { clear: 0.30, cloudy: 0.22, rain: 0.16, wind: 0.10, snow: 0.22 },
    DC: { clear: 0.40, cloudy: 0.25, rain: 0.22, wind: 0.08, snow: 0.05 },
    // Midwest / Great Lakes
    MI: { clear: 0.30, cloudy: 0.25, rain: 0.18, wind: 0.12, snow: 0.15 },
    MN: { clear: 0.28, cloudy: 0.22, rain: 0.12, wind: 0.13, snow: 0.25 },
    WI: { clear: 0.30, cloudy: 0.24, rain: 0.14, wind: 0.12, snow: 0.20 },
    NE: { clear: 0.40, cloudy: 0.22, rain: 0.12, wind: 0.18, snow: 0.08 },
    // Plains / Rockies
    CO: { clear: 0.50, cloudy: 0.18, rain: 0.08, wind: 0.14, snow: 0.10 },
    UT: { clear: 0.55, cloudy: 0.18, rain: 0.08, wind: 0.12, snow: 0.07 },
    WY: { clear: 0.40, cloudy: 0.18, rain: 0.08, wind: 0.22, snow: 0.12 },
    MT: { clear: 0.38, cloudy: 0.20, rain: 0.10, wind: 0.18, snow: 0.14 },
    OK: { clear: 0.45, cloudy: 0.20, rain: 0.15, wind: 0.18, snow: 0.02 },
    // South
    TX: { clear: 0.50, cloudy: 0.22, rain: 0.18, wind: 0.09, snow: 0.01 },
    LA: { clear: 0.38, cloudy: 0.22, rain: 0.30, wind: 0.09, snow: 0.01 },
    AL: { clear: 0.42, cloudy: 0.24, rain: 0.25, wind: 0.08, snow: 0.01 },
    MS: { clear: 0.40, cloudy: 0.24, rain: 0.26, wind: 0.09, snow: 0.01 },
    FL: { clear: 0.48, cloudy: 0.18, rain: 0.28, wind: 0.06, snow: 0.00 },
    KY: { clear: 0.38, cloudy: 0.26, rain: 0.24, wind: 0.09, snow: 0.03 },
    MO: { clear: 0.40, cloudy: 0.24, rain: 0.20, wind: 0.12, snow: 0.04 },
    // West coast
    CA: { clear: 0.62, cloudy: 0.20, rain: 0.12, wind: 0.06, snow: 0.00 },
    OR: { clear: 0.28, cloudy: 0.30, rain: 0.35, wind: 0.07, snow: 0.00 },
    WA: { clear: 0.30, cloudy: 0.28, rain: 0.35, wind: 0.07, snow: 0.00 },
    // Desert / other
    NV: { clear: 0.70, cloudy: 0.15, rain: 0.05, wind: 0.10, snow: 0.00 },
    HI: { clear: 0.50, cloudy: 0.20, rain: 0.25, wind: 0.05, snow: 0.00 },
    AK: { clear: 0.22, cloudy: 0.25, rain: 0.15, wind: 0.13, snow: 0.25 },
    IN: { clear: 0.35, cloudy: 0.25, rain: 0.20, wind: 0.12, snow: 0.08 },
    WV: { clear: 0.35, cloudy: 0.28, rain: 0.22, wind: 0.08, snow: 0.07 }
  },

  DEFAULT: { clear: 0.40, cloudy: 0.25, rain: 0.20, wind: 0.10, snow: 0.05 },

  LABELS: {
    clear: "Clear / Sunny",
    cloudy: "Cloudy",
    rain: "Rain",
    wind: "Windy",
    snow: "Snow"
  },

  ICONS: {
    clear: "☀",
    cloudy: "☁",
    rain: "🌧",
    wind: "💨",
    snow: "❄"
  },

  /**
   * Effects applied to drive outcome weights and play flavor.
   * Values are additive adjustments to weights before normalize.
   */
  EFFECTS: {
    clear: {
      touchdown: 0.02,
      field_goal: 0.02,
      turnover_int: -0.01,
      note: "Good conditions"
    },
    cloudy: {
      touchdown: 0,
      field_goal: 0,
      note: "Overcast"
    },
    rain: {
      touchdown: -0.04,
      field_goal: -0.03,
      turnover_fumble: 0.04,
      turnover_int: 0.02,
      punt: 0.02,
      note: "Wet ball — higher fumble risk, tougher passing"
    },
    wind: {
      touchdown: -0.03,
      field_goal: -0.06,
      missed_fg: 0.04,
      turnover_int: 0.02,
      note: "Strong wind — kicks and deep balls suffer"
    },
    snow: {
      touchdown: -0.05,
      field_goal: -0.05,
      turnover_fumble: 0.04,
      punt: 0.02,
      turnover_int: 0.02,
      note: "Snow — footing and ball security suffer"
    }
  },

  climateFor(team) {
    if (!team) return this.DEFAULT;
    return this.CLIMATE[team.state] || this.DEFAULT;
  },

  /** Pick a condition from climate weights. */
  rollWeather(homeTeam) {
    const climate = this.climateFor(homeTeam);
    const entries = Object.keys(climate).map(k => ({ id: k, w: climate[k] }));
    const sum = entries.reduce((s, e) => s + e.w, 0);
    let r = Math.random() * sum;
    let pick = entries[0].id;
    for (const e of entries) {
      r -= e.w;
      if (r <= 0) { pick = e.id; break; }
    }
    const temp = this.tempFor(homeTeam, pick);
    return {
      condition: pick,
      label: this.LABELS[pick] || pick,
      icon: this.ICONS[pick] || "",
      tempF: temp,
      note: (this.EFFECTS[pick] && this.EFFECTS[pick].note) || "",
      city: homeTeam ? homeTeam.city : "",
      state: homeTeam ? homeTeam.state : ""
    };
  },

  tempFor(team, condition) {
    // Rough seasonal game-day temps by region
    const cold = ["AK", "MN", "VT", "NH", "WI", "MI", "MT", "WY", "CO", "ME"];
    const mild = ["OR", "WA", "NY", "MA", "NE", "UT", "DC", "IN", "WV", "KY", "MO"];
    const warm = ["CA", "NV", "TX", "OK", "AL", "MS", "LA", "FL", "HI"];
    let base = 55;
    if (team && cold.includes(team.state)) base = 32;
    else if (team && mild.includes(team.state)) base = 48;
    else if (team && warm.includes(team.state)) base = 68;
    if (condition === "snow") base = Math.min(base, 28);
    if (condition === "rain") base -= 5;
    if (condition === "clear" && warm.includes(team && team.state)) base += 8;
    // small random swing
    base += Math.floor(Math.random() * 11) - 5;
    return base;
  },

  /** Kickoff datetime string for display (season week based). */
  kickoffFor(scheduledGame) {
    const week = (scheduledGame && scheduledGame.week) || 1;
    // Season starts first Sunday of September 2026 in this sim
    const start = new Date(Date.UTC(2026, 8, 6, 17, 0, 0)); // Sep 6 2026 1:00 PM ET ≈ 17:00 UTC
    const day = new Date(start.getTime() + (week - 1) * 7 * 24 * 3600 * 1000);
    // Slot: mostly Sunday afternoon, some night
    const slots = [
      { h: 13, m: 0, label: "1:00 PM" },
      { h: 16, m: 25, label: "4:25 PM" },
      { h: 20, m: 20, label: "8:20 PM" }
    ];
    const slot = slots[Math.floor(Math.random() * slots.length)];
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    // Prefer Sunday (0 offset from start which is Sunday)
    let dow = 0;
    if (Math.random() < 0.08) dow = 4; // Thursday night
    else if (Math.random() < 0.12) dow = 1; // Monday night
    const gameDate = new Date(day.getTime() + dow * 24 * 3600 * 1000);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const dateStr = `${days[gameDate.getUTCDay()]}, ${months[gameDate.getUTCMonth()]} ${gameDate.getUTCDate()}, ${gameDate.getUTCFullYear()}`;
    return {
      dateStr,
      timeStr: slot.label,
      display: `${dateStr} · ${slot.label}`
    };
  },

  /** Apply weather modifiers onto a weight map (mutates). */
  applyToWeights(weights, weather) {
    if (!weather || !weather.condition) return weights;
    const eff = this.EFFECTS[weather.condition];
    if (!eff) return weights;
    Object.keys(eff).forEach(k => {
      if (k === "note") return;
      if (typeof weights[k] === "number") weights[k] += eff[k];
    });
    return weights;
  }
};
