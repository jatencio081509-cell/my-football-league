// ============================================
// DICE ENGINE
// ============================================
//
// Physical dice:
//
// D4      = 1–4
// D10     = 0–9
// D8      = 1–8
// D%      = 00–90 (tens)
// D20     = 1–20
// D10     = 1–10
// D6      = 1–6
//
// Total possible combinations:
// 4 × 10 × 8 × 10 × 20 × 10 × 6
// = 3,840,000
//
// The complete dice chain determines the play.
// ============================================
// ============================================
// DICE
// ============================================
function rollDie(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function rollAllDice() {
    return {
        d4: rollDie(1, 4),
        d10_0_9: rollDie(0, 9),
        d8: rollDie(1, 8),
        d100_tens: rollDie(0, 9) * 10,
        d20: rollDie(1, 20),
        d10: rollDie(1, 10),
        d6: rollDie(1, 6)
    };
}
// ============================================
// DISPLAY THE DICE
// ============================================
function formatDiceRoll(roll) {
    const tens =
        roll.d100_tens.toString().padStart(2, "0");
    return [
        roll.d4,
        roll.d10_0_9,
        roll.d8,
        tens,
        roll.d20,
        roll.d10,
        roll.d6
    ].join(" - ");
}
// ============================================
// CONVERT DICE TO A SINGLE 0–99,999,999 VALUE
// ============================================
//
// IMPORTANT:
//
// We don't add the dice together.
//
// The order matters.
//
// Example:
//
// 3 - 7 - 2 - 40 - 16 - 8 - 4
//
// is completely different from:
//
// 4 - 8 - 16 - 40 - 2 - 7 - 3
//
// This preserves the "number chain" idea.
//
function getDiceNumber(roll) {
    return (
        roll.d4 * 10000000 +
        roll.d10_0_9 * 1000000 +
        roll.d8 * 100000 +
        roll.d100_tens * 1000 +
        roll.d20 * 100 +
        roll.d10 * 10 +
        roll.d6
    );
}
// ============================================
// PLAY OUTCOME DEFINITIONS
// ============================================
//
// The outcomes are intentionally weighted.
//
// Common plays have large ranges.
//
// Rare plays have small ranges.
//
// This gives us a football-like distribution.
//
// We will eventually tune these percentages
// using actual NFL play-frequency data.
//
const PLAY_OUTCOMES = [
    // ----------------------------------------
    // RUNNING PLAYS
    // ----------------------------------------
    {
        id: "run_short",
        name: "Short Run",
        type: "run",
        probability: 0.16,
        yardsMin: 1,
        yardsMax: 4
    },
    {
        id: "run_medium",
        name: "Run",
        type: "run",
        probability: 0.12,
        yardsMin: 5,
        yardsMax: 9
    },
    {
        id: "run_long",
        name: "Long Run",
        type: "run",
        probability: 0.025,
        yardsMin: 10,
        yardsMax: 20
    },
    {
        id: "run_breakaway",
        name: "Breakaway Run",
        type: "run",
        probability: 0.005,
        yardsMin: 21,
        yardsMax: 50
    },
    // ----------------------------------------
    // PASSING PLAYS
    // ----------------------------------------
    {
        id: "pass_short",
        name: "Short Pass Complete",
        type: "pass_complete",
        probability: 0.19,
        yardsMin: 3,
        yardsMax: 8
    },
    {
        id: "pass_medium",
        name: "Pass Complete",
        type: "pass_complete",
        probability: 0.16,
        yardsMin: 9,
        yardsMax: 16
    },
    {
        id: "pass_long",
        name: "Long Pass Complete",
        type: "pass_complete",
        probability: 0.045,
        yardsMin: 17,
        yardsMax: 35
    },
    {
        id: "pass_bomb",
        name: "Deep Pass Complete",
        type: "pass_complete",
        probability: 0.005,
        yardsMin: 36,
        yardsMax: 70
    },
    // ----------------------------------------
    // INCOMPLETIONS
    // ----------------------------------------
    {
        id: "pass_incomplete",
        name: "Incomplete Pass",
        type: "pass_incomplete",
        probability: 0.14,
        yardsMin: 0,
        yardsMax: 0
    },
    // ----------------------------------------
    // SACKS
    // ----------------------------------------
    {
        id: "sack",
        name: "Sack",
        type: "sack",
        probability: 0.055,
        yardsMin: -10,
        yardsMax: -1
    },
    // ----------------------------------------
    // TURNOVERS
    // ----------------------------------------
    {
        id: "interception",
        name: "INTERCEPTION",
        type: "interception",
        probability: 0.012,
        yardsMin: 0,
        yardsMax: 0
    },
    {
        id: "fumble",
        name: "FUMBLE",
        type: "fumble",
        probability: 0.008,
        yardsMin: 0,
        yardsMax: 0
    },
    // ----------------------------------------
    // SPECIAL SITUATIONS
    // ----------------------------------------
    {
        id: "big_play",
        name: "BIG PLAY",
        type: "big_play",
        probability: 0.015,
        yardsMin: 15,
        yardsMax: 40
    },
    {
        id: "penalty",
        name: "Penalty",
        type: "penalty",
        probability: 0.02,
        yardsMin: -40,
        yardsMax: -5
    },
    {
        id: "punt",
        name: "Punt",
        type: "punt",
        probability: 0.015,
        yardsMin: 35,
        yardsMax: 65
    }
];
// ============================================
// NORMALIZE PROBABILITIES
// ============================================
//
// This protects us if we later change the
// numbers and they don't add up to exactly 1.
//
function normalizeProbabilities() {
    const total = PLAY_OUTCOMES.reduce(
        (sum, outcome) => sum + outcome.probability,
        0
    );
    return PLAY_OUTCOMES.map(outcome => ({
        ...outcome,
        normalizedProbability:
            outcome.probability / total
    }));
}
const NORMALIZED_OUTCOMES =
    normalizeProbabilities();
    // ============================================
// PLAYER / TEAM RATINGS
// ============================================
function getPositionRating(team, positions) {
    const players = ROSTERS[teamKey(team)] || [];
    const filtered = players.filter(player => positions.includes(player.position));
    if (filtered.length === 0) return 0;
    return filtered.reduce((sum, player) => sum + player.rating, 0) / filtered.length;
}
function getTeamRatings(team) {
    return {
        overall: getTeamOverall(team),
        qb: getPositionRating(team, ["QB"]),
        rb: getPositionRating(team, ["RB"]),
        wr: getPositionRating(team, ["WR"]),
        te: getPositionRating(team, ["TE"]),
        ol: getPositionRating(team, ["OL"]),
        dl: getPositionRating(team, ["DL"]),
        lb: getPositionRating(team, ["LB"]),
        cb: getPositionRating(team, ["CB"]),
        s: getPositionRating(team, ["S"])
    };
}
function getMatchupAdvantage(offense, defense, playType) {
    const o = getTeamRatings(offense);
    const d = getTeamRatings(defense);
    let offensiveRating = 0;
    let defensiveRating = 0;
    switch (playType) {
        case "run":
            offensiveRating = o.rb * 0.45 + o.ol * 0.3 + o.te * 0.1 + o.overall * 0.15;
            defensiveRating = d.dl * 0.45 + d.lb * 0.35 + d.s * 0.1 + d.overall * 0.1;
            break;
        case "pass":
            offensiveRating = o.qb * 0.45 + o.wr * 0.2 + o.te * 0.1 + o.ol * 0.15 + o.overall * 0.1;
            defensiveRating = d.dl * 0.2 + d.lb * 0.2 + d.cb * 0.4 + d.s * 0.1 + d.overall * 0.1;
            break;
        case "sack":
            offensiveRating = o.qb * 0.3 + o.ol * 0.5 + o.overall * 0.2;
            defensiveRating = d.dl * 0.55 + d.lb * 0.25 + d.overall * 0.2;
            break;
        case "turnover":
    offensiveRating = o.qb * 0.4 + o.rb * 0.2 + o.wr * 0.15 + o.overall * 0.25;
    defensiveRating = d.dl * 0.15 + d.lb * 0.25 + d.cb * 0.3 + d.s * 0.2 + d.overall * 0.1;
    break;
        default:
            offensiveRating = o.overall;
            defensiveRating = d.overall;
    }
    const teamOverallAdvantage = o.overall - d.overall;
return (offensiveRating - defensiveRating) * 0.8 + teamOverallAdvantage * 0.2;
}
// ============================================
// DETERMINE OUTCOME
// ============================================
function determinePlayOutcome(roll) {
    // Convert the seven physical dice into one
    // deterministic combination index.
    //
    // There are exactly:
    // 4 × 10 × 8 × 10 × 20 × 10 × 6
    // = 3,840,000 possible combinations.
    //
    // Every possible roll gets exactly one index.
    const combinationIndex =
        ((((((roll.d4 - 1) * 10 + roll.d10_0_9)
        * 8 + (roll.d8 - 1))
        * 10 + (roll.d100_tens / 10))
        * 20 + (roll.d20 - 1))
        * 10 + (roll.d10 - 1))
        * 6 + (roll.d6 - 1);
    // Total possible combinations
    const TOTAL_COMBINATIONS = 3840000;
    // Convert the combination into a position
    // from 0 to just under 1.
    const position =
        combinationIndex / TOTAL_COMBINATIONS;
    const homeTeam = window.game?.home;
const awayTeam = window.game?.away;
const offenseTeam = window.game?.possession === "home" ? homeTeam : awayTeam;
const defenseTeam = window.game?.possession === "home" ? awayTeam : homeTeam;
        // Find the outcome using the weighted
    // probability table.
    let runningTotal = 0;
    for (const outcome of NORMALIZED_OUTCOMES) {
    const adjustedProbability = getAdjustedProbability(outcome, offenseTeam, defenseTeam);
    runningTotal += adjustedProbability / NORMALIZED_OUTCOMES.reduce((sum, item) => sum + getAdjustedProbability(item, offenseTeam, defenseTeam), 0);
        if (position < runningTotal) {
            let yards = outcome.yardsMin;
if (outcome.yardsMin !== outcome.yardsMax) {
    yards = rollDie(outcome.yardsMin, outcome.yardsMax);
    const playType = outcome.type === "run" ? "run" : outcome.type === "sack" ? "sack" : outcome.type === "pass_complete" ? "pass" : null;
    if (playType && offenseTeam && defenseTeam) {
        const advantage = getMatchupAdvantage(offenseTeam, defenseTeam, playType);
        const ratingEffect = advantage / 20;
        yards = Math.round(yards + ratingEffect);
        yards = Math.max(outcome.yardsMin, Math.min(outcome.yardsMax, yards));
    }
}
            return {
                ...outcome,
                yards,
                dice: roll,
                diceChain: formatDiceRoll(roll),
                diceNumber: combinationIndex,
                combinationIndex,
                totalCombinations: TOTAL_COMBINATIONS
            };
        }
    }
    // Safety fallback
    const fallback =
        NORMALIZED_OUTCOMES[
            NORMALIZED_OUTCOMES.length - 1
        ];
    return {
        ...fallback,
        yards: fallback.yardsMin,
        dice: roll,
        diceChain: formatDiceRoll(roll),
        diceNumber: combinationIndex,
        combinationIndex,
        totalCombinations: TOTAL_COMBINATIONS
    };
}
function getAdjustedProbability(outcome, offenseTeam, defenseTeam) {
    if (!offenseTeam || !defenseTeam) return outcome.probability;
    let playType = "default";
    if (outcome.type === "run") playType = "run";
    else if (outcome.type === "pass_complete" || outcome.type === "pass_incomplete") playType = "pass";
    else if (outcome.type === "sack") playType = "sack";
    else if (outcome.type === "interception" || outcome.type === "fumble") playType = "turnover";
    if (playType === "default") return outcome.probability;
const advantage = getMatchupAdvantage(offenseTeam, defenseTeam, playType);
return outcome.probability * (1 + advantage / 200);
}
// ============================================
// PUBLIC API
// ============================================
//
// renderer.js can access:
//
// DiceEngine.rollAllDice()
// DiceEngine.formatDiceRoll()
// DiceEngine.determinePlayOutcome()
//
// ============================================
window.DiceEngine = {
    rollAllDice,
    formatDiceRoll,
    determinePlayOutcome
};