import { createSuccess, createFailure, DOMAIN_RESULT_CODES, isDomainSuccess } from "../shared/errors/domain-result.js";

export const PERSONAL_DASHBOARD_SCHEMA_VERSION = 1;

/**
 * Build the personal Muhasabah home dashboard from existing pipeline outputs.
 * Does not recalculate trends, actions, or feedback.
 */
export function buildPersonalDashboard(trendResult, actionPlanResult, feedbackResult, reassessmentResult, options = {}) {

    if (!isDomainSuccess(trendResult)) {
        return createFailure(
            DOMAIN_RESULT_CODES.VALIDATION_ERROR,
            "Trend data is required to build the personal dashboard."
        );
    }

    const trend = trendResult.data;
    const actionPlan = isDomainSuccess(actionPlanResult) ? actionPlanResult.data : {};
    const feedback = isDomainSuccess(feedbackResult) ? feedbackResult.data : {};
    const reassessment = isDomainSuccess(reassessmentResult) ? reassessmentResult.data : null;
    const latestAssessment = trend.latestAssessment || null;
    const firstAssessment = trend.firstAssessment || null;
    const overallTrend = trend.overallTrend || {};
    const priorities = actionPlan.topPriorities
        || actionPlan.highestPriorityGrowthAreas
        || [];

    return createSuccess({
        schemaVersion: PERSONAL_DASHBOARD_SCHEMA_VERSION,
        computedAt: new Date().toISOString(),
        lastAssessmentDate: latestAssessment?.createdAt || null,
        currentOverallLevel: latestAssessment?.overallLevel || null,
        currentOverallPercentage: latestAssessment?.overallPercentage ?? null,
        growthSummary: feedback.summary || trend.summary || null,
        currentPriorities: priorities.slice(0, 3),
        suggestedReassessmentDate: reassessment?.suggestedDate
            || actionPlan.suggestedReassessmentInterval?.suggestedDate
            || null,
        suggestedReassessmentDays: reassessment?.days
            || actionPlan.suggestedReassessmentInterval?.days
            || 30,
        progressSinceFirstAssessment: firstAssessment && latestAssessment
            ? {
                firstPercentage: firstAssessment.overallPercentage,
                latestPercentage: latestAssessment.overallPercentage,
                deltaPercentage: overallTrend.deltaPercentage ?? Number(
                    (latestAssessment.overallPercentage - firstAssessment.overallPercentage).toFixed(1)
                ),
                classification: overallTrend.classification || "Insufficient Data"
            }
            : null,
        assessmentCount: trend.assessmentCount || trend.snapshotCount || 0,
        hasIncompleteSession: Boolean(options.hasIncompleteSession)
    });

}

export const PersonalDashboardBuilder = {
    buildPersonalDashboard
};
