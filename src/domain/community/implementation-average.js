/**
 * Community Average Implementation — locked business definition (Version 2.1 Phase 4).
 *
 * Average Implementation = mean of each participant's LATEST completed assessment score.
 * Each participant contributes exactly one value.
 * Historical assessments are ignored after a newer assessment exists for that participant.
 */

export function extractImplementationScore(assessmentData = {}) {

    const rawScore = assessmentData.implementationScore ?? assessmentData.overallPercentage;

    if (rawScore == null || rawScore === "") {
        return null;
    }

    const numericScore = Number(rawScore);

    if (Number.isNaN(numericScore)) {
        return null;
    }

    return Number(numericScore.toFixed(1));

}

/**
 * @param {Map<string, number>} latestScoresByParticipant participantId → latest implementation score
 * @returns {number|null}
 */
export function calculateCommunityAverageImplementation(latestScoresByParticipant) {

    if (!(latestScoresByParticipant instanceof Map) || latestScoresByParticipant.size === 0) {
        return null;
    }

    const scores = [...latestScoresByParticipant.values()];

    if (!scores.length) {
        return null;
    }

    const total = scores.reduce((sum, score) => sum + score, 0);

    return Number((total / scores.length).toFixed(1));

}

/**
 * Merge a descending-ordered assessment batch into latest-score map.
 * First score seen per participantId wins (newest assessment when sorted by timestamp desc).
 *
 * @param {Map<string, number>} latestScoresByParticipant
 * @param {Array<{ participantId: string, score: number|null, uid?: string }>} assessments
 */
export function mergeLatestImplementationScores(latestScoresByParticipant, assessments) {

    assessments.forEach(({ participantId, uid, score }) => {
        const key = participantId || uid;

        if (!key || score == null || latestScoresByParticipant.has(key)) {
            return;
        }

        latestScoresByParticipant.set(key, score);
    });

    return latestScoresByParticipant;

}

export const CommunityImplementationAverage = {
    extractImplementationScore,
    calculateCommunityAverageImplementation,
    mergeLatestImplementationScores
};
