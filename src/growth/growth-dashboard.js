import { createSuccess, createFailure, DOMAIN_RESULT_CODES, isDomainSuccess } from "../shared/errors/domain-result.js";

export const GROWTH_DASHBOARD_SCHEMA_VERSION = 1;

/**
 * Assemble a Growth Dashboard view model from pipeline engine outputs.
 * Read-only aggregation — no storage or trend recalculation.
 */
export function buildGrowthDashboard(trendResult, actionPlanResult, feedbackResult, reassessmentResult) {

    if (!isDomainSuccess(trendResult)) {
        return createFailure(
            DOMAIN_RESULT_CODES.VALIDATION_ERROR,
            "Trend data is required to build the growth dashboard."
        );
    }

    if (!isDomainSuccess(actionPlanResult)) {
        return createFailure(
            DOMAIN_RESULT_CODES.VALIDATION_ERROR,
            "Action plan data is required to build the growth dashboard."
        );
    }

    if (!isDomainSuccess(feedbackResult)) {
        return createFailure(
            DOMAIN_RESULT_CODES.VALIDATION_ERROR,
            "Feedback data is required to build the growth dashboard."
        );
    }

    const trend = trendResult.data;
    const actionPlan = actionPlanResult.data;
    const feedback = feedbackResult.data;
    const reassessment = isDomainSuccess(reassessmentResult) ? reassessmentResult.data : null;

    const nextSuggestedAssessment = reassessment || actionPlan.suggestedReassessmentInterval || {
        days: 30,
        unit: "days",
        basis: "default"
    };

    return createSuccess({
        schemaVersion: GROWTH_DASHBOARD_SCHEMA_VERSION,
        computedAt: new Date().toISOString(),
        overview: {
            overallTrend: trend.overallTrend || {},
            assessmentCount: trend.assessmentCount || trend.snapshotCount || 0,
            firstAssessment: trend.firstAssessment || null,
            latestAssessment: trend.latestAssessment || null,
            consistencyScore: trend.consistencyScore ?? trend.consistency?.score ?? null,
            assessmentFrequency: trend.assessmentFrequency || null,
            trendSummary: trend.summary || null
        },
        recommendedFocus: actionPlan.recommendedFocusSections
            || actionPlan.recommendedFocusOrder
            || [],
        thisWeeksPriority: actionPlan.weeklyImprovementPriorities || [],
        continueTheseHabits: actionPlan.continueHabits
            || actionPlan.sectionsToMaintain
            || [],
        improvementOpportunities: actionPlan.weakAreas || [],
        nextSuggestedAssessment: {
            days: nextSuggestedAssessment.days,
            unit: nextSuggestedAssessment.unit || "days",
            basis: nextSuggestedAssessment.basis || "default",
            suggestedDate: nextSuggestedAssessment.suggestedDate ?? null,
            allowedIntervals: nextSuggestedAssessment.allowedIntervals || [7, 14, 30, 60]
        },
        actionPlanSummary: {
            topPriorities: actionPlan.topPriorities || actionPlan.highestPriorityGrowthAreas || [],
            estimatedImprovementDifficulty: actionPlan.estimatedImprovementDifficulty || null
        },
        feedbackSummary: {
            summary: feedback.summary || null,
            items: feedback.items || []
        },
        sectionTrends: trend.sectionTrends || []
    });

}

export const GrowthDashboardBuilder = {
    buildGrowthDashboard
};
