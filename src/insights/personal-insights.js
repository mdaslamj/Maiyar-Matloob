import { createSuccess, createFailure, DOMAIN_RESULT_CODES, isDomainSuccess } from "../shared/errors/domain-result.js";
import { TREND_CLASSIFICATIONS } from "../trend/trend-config.js";

export const PERSONAL_INSIGHTS_SCHEMA_VERSION = 1;

/**
 * Derive lightweight insights from existing Trend, Action, and Feedback outputs.
 * No duplicate trend calculations.
 */
export function buildPersonalInsights(trendResult, actionPlanResult, feedbackResult) {

    if (!isDomainSuccess(trendResult)) {
        return createFailure(
            DOMAIN_RESULT_CODES.VALIDATION_ERROR,
            "Trend data is required to build personal insights."
        );
    }

    const trend = trendResult.data;
    const actionPlan = isDomainSuccess(actionPlanResult) ? actionPlanResult.data : {};
    const feedback = isDomainSuccess(feedbackResult) ? feedbackResult.data : {};
    const sectionTrends = trend.sectionTrends || [];

    const improvingSections = sectionTrends
        .filter(section => section.classification === TREND_CLASSIFICATIONS.IMPROVING)
        .sort((left, right) => (right.deltaPercentage ?? 0) - (left.deltaPercentage ?? 0));

    const stableSections = sectionTrends
        .filter(section => section.classification === TREND_CLASSIFICATIONS.STABLE)
        .sort((left, right) => right.latestPercentage - left.latestPercentage);

    const patienceCandidates = [
        ...(actionPlan.weakAreas || []),
        ...sectionTrends.filter(section => section.classification === TREND_CLASSIFICATIONS.DECLINING)
    ].sort((left, right) => left.latestPercentage - right.latestPercentage);

    const topFocus = (actionPlan.topPriorities
        || actionPlan.highestPriorityGrowthAreas
        || actionPlan.recommendedFocusSections
        || [])[0] || null;

    const biggestImprovement = improvingSections[0]
        ? {
            sectionId: improvingSections[0].sectionId,
            title: improvingSections[0].title,
            deltaPercentage: improvingSections[0].deltaPercentage,
            firstPercentage: improvingSections[0].firstPercentage,
            latestPercentage: improvingSections[0].latestPercentage,
            source: "trend"
        }
        : null;

    const mostConsistentArea = stableSections[0]
        ? {
            sectionId: stableSections[0].sectionId,
            title: stableSections[0].title,
            latestPercentage: stableSections[0].latestPercentage,
            classification: stableSections[0].classification,
            source: "trend"
        }
        : null;

    const areaNeedingPatience = patienceCandidates[0]
        ? {
            sectionId: patienceCandidates[0].sectionId,
            title: patienceCandidates[0].title,
            latestPercentage: patienceCandidates[0].latestPercentage,
            estimatedImprovementDifficulty: patienceCandidates[0].estimatedImprovementDifficulty
                || actionPlan.estimatedImprovementDifficulty?.bySection?.find(
                    item => item.sectionId === patienceCandidates[0].sectionId
                )?.difficulty
                || null,
            source: "action"
        }
        : null;

    const suggestedNextFocus = topFocus
        ? {
            sectionId: topFocus.sectionId,
            title: topFocus.sectionTitle || topFocus.title,
            latestPercentage: topFocus.latestPercentage,
            priority: topFocus.priority || topFocus.rank || 1,
            source: "action"
        }
        : null;

    return createSuccess({
        schemaVersion: PERSONAL_INSIGHTS_SCHEMA_VERSION,
        computedAt: new Date().toISOString(),
        biggestImprovement,
        mostConsistentArea,
        areaNeedingPatience,
        suggestedNextFocus,
        guidanceSummary: feedback.summary || trend.summary || null
    });

}

export const PersonalInsightsBuilder = {
    buildPersonalInsights
};
