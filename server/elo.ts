/**
 * ELO Rating Calculation System
 * Based on standard chess ELO rating formula
 */

const K_FACTOR = 32; // Standard K-factor for chess

/**
 * Calculate expected score (probability of winning)
 * @param ratingA - Player A's current rating
 * @param ratingB - Player B's current rating
 * @returns Expected score for Player A (0 to 1)
 */
export function calculateExpectedScore(ratingA: number, ratingB: number): number {
    return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

/**
 * Calculate new rating after a match
 * @param oldRating - Player's current rating
 * @param expectedScore - Expected score (from calculateExpectedScore)
 * @param actualScore - Actual score (1 = win, 0.5 = draw, 0 = loss)
 * @param kFactor - K-factor (default 32)
 * @returns New rating
 */
export function calculateNewRating(
    oldRating: number,
    expectedScore: number,
    actualScore: number,
    kFactor: number = K_FACTOR
): number {
    return Math.round(oldRating + kFactor * (actualScore - expectedScore));
}

/**
 * Calculate ELO changes for both players after a match
 * @param whiteRating - White player's current rating
 * @param blackRating - Black player's current rating
 * @param result - Match result: 'white', 'black', or 'draw'
 * @returns Object with new ratings and changes for both players
 */
export function calculateEloChanges(
    whiteRating: number,
    blackRating: number,
    result: 'white' | 'black' | 'draw'
): {
    whiteNewRating: number;
    blackNewRating: number;
    whiteChange: number;
    blackChange: number;
} {
    // Calculate expected scores
    const whiteExpected = calculateExpectedScore(whiteRating, blackRating);
    const blackExpected = 1 - whiteExpected;

    // Determine actual scores
    let whiteActual: number;
    let blackActual: number;

    if (result === 'white') {
        whiteActual = 1;
        blackActual = 0;
    } else if (result === 'black') {
        whiteActual = 0;
        blackActual = 1;
    } else {
        whiteActual = 0.5;
        blackActual = 0.5;
    }

    // Calculate new ratings
    const whiteNewRating = calculateNewRating(whiteRating, whiteExpected, whiteActual);
    const blackNewRating = calculateNewRating(blackRating, blackExpected, blackActual);

    return {
        whiteNewRating,
        blackNewRating,
        whiteChange: whiteNewRating - whiteRating,
        blackChange: blackNewRating - blackRating
    };
}
