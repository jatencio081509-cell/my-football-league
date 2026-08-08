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
        yardsMin: 0,
        yardsMax: 15
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


    // Find the outcome using the weighted
    // probability table.

    let runningTotal = 0;

    for (const outcome of NORMALIZED_OUTCOMES) {

        runningTotal += outcome.normalizedProbability;

        if (position < runningTotal) {

            let yards = outcome.yardsMin;

            if (outcome.yardsMin !== outcome.yardsMax) {

                yards = rollDie(
                    outcome.yardsMin,
                    outcome.yardsMax
                );

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