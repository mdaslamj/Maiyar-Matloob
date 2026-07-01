import { createSuccess, createFailure, DOMAIN_RESULT_CODES, isDomainSuccess } from "../shared/errors/domain-result.js";
import { TREND_CLASSIFICATIONS } from "../trend/trend-config.js";

export const REASSESSMENT_SCHEMA_VERSION = 1;

/** Allowed discrete reassessment intervals (days). */
export const REASSESSMENT_INTERVALS = [7, 14, 30, 60];

const DEFAULT_INTERVAL_DAYS = 30;

function snapToAllowedInterval(days) {

    return REASSESSMENT_INTERVALS.reduce((closest, candidate) => {
        return Math.abs(candidate - days) < Math.abs(closest - days) ? candidate : closest;
    }, DEFAULT_INTERVAL_DAYS);

}

/**
 * Recommend a reassessment interval from trend consistency and assessment frequency.
 * Does not schedule reminders — calculation only.
 *
 * @param {import("../shared/errors/domain-result.js").DomainSuccess<TrendResult>} trendResult
 * @param {import("../shared/errors/domain-result.js").DomainSuccess<ActionPlanResult>} [actionPlanResult]
 */
export function computeSuggestedReassessment(trendResult, actionPlanResult) {

    if (!isDomainSuccess(trendResult)) {
        return createFailure(
            DOMAIN_RESULT_CODES.VALIDATION_ERROR,
            "Trend data is required to compute reassessment recommendation."
        );
    }

    const trend = trendResult.data;
    const snapshotCount = trend.snapshotCount || 0;

    if (snapshotCount < 1) {
        return createSuccess({
            schemaVersion: REASSESSMENT_SCHEMA_VERSION,
            computedAt: new Date().toISOString(),
            days: DEFAULT_INTERVAL_DAYS,
            unit: "days",
            basis: "no_assessments",
            allowedIntervals: REASSESSMENT_INTERVALS
        });
    }

    if (snapshotCount < 2) {
        return createSuccess({
            schemaVersion: REASSESSMENT_SCHEMA_VERSION,
            computedAt: new Date().toISOString(),
            days: DEFAULT_INTERVAL_DAYS,
            unit: "days",
            basis: "initial_guidance",
            allowedIntervals: REASSESSMENT_INTERVALS
        });
    }

    const consistencyScore = trend.consistency?.score;
    const averageDaysBetween = trend.assessmentFrequency?.averageDaysBetween;
    let recommendedDays = DEFAULT_INTERVAL_DAYS;
    let basis = "default";

    if (consistencyScore != null && averageDaysBetween != null) {
        if (consistencyScore >= 75 && averageDaysBetween <= 10) {
            recommendedDays = 7;
            basis = "high_consistency_frequent";
        } else if (consistencyScore >= 60 && averageDaysBetween <= 21) {
            recommendedDays = 14;
            basis = "moderate_consistency_regular";
        } else if (consistencyScore >= 40 || averageDaysBetween <= 45) {
            recommendedDays = 30;
            basis = "standard_rhythm";
        } else {
            recommendedDays = 60;
            basis = "low_consistency_infrequent";
        }
    } else if (averageDaysBetween != null) {
        recommendedDays = snapToAllowedInterval(Math.round(averageDaysBetween));
        basis = "historical_average";
    }

    const weakAreaCount = actionPlanResult?.data?.weakAreas?.length || 0;
    const overallClassification = trend.overallTrend?.classification;

    if (
        overallClassification === TREND_CLASSIFICATIONS.DECLINING
        && recommendedDays > 14
        && consistencyScore != null
        && consistencyScore >= 50
    ) {
        recommendedDays = 14;
        basis = "declining_trend_regular_user";
    }

    if (weakAreaCount >= 3 && recommendedDays > 14 && consistencyScore != null && consistencyScore >= 55) {
        recommendedDays = 14;
        basis = "multiple_focus_areas";
    }

    recommendedDays = snapToAllowedInterval(recommendedDays);

    const latestCreatedAt = trend.latestAssessment?.createdAt;
    let suggestedDate = null;

    if (latestCreatedAt) {
        const nextDate = new Date(latestCreatedAt);
        nextDate.setDate(nextDate.getDate() + recommendedDays);
        suggestedDate = nextDate.toISOString();
    }

    return createSuccess({
        schemaVersion: REASSESSMENT_SCHEMA_VERSION,
        computedAt: new Date().toISOString(),
        days: recommendedDays,
        unit: "days",
        basis,
        allowedIntervals: REASSESSMENT_INTERVALS,
        suggestedDate,
        inputs: {
            consistencyScore: consistencyScore ?? null,
            averageDaysBetween: averageDaysBetween ?? null,
            snapshotCount
        }
    });

}

export const ReassessmentPlanner = {
    computeSuggestedReassessment
};
