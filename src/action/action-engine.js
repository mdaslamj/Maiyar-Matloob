import { createSuccess, createFailure, DOMAIN_RESULT_CODES, isDomainSuccess } from "../shared/errors/domain-result.js";
import { TREND_CLASSIFICATIONS } from "../trend/trend-config.js";
import { computeSuggestedReassessment } from "../reassessment/reassessment-planner.js";
import {
    WEAK_SECTION_THRESHOLD,
    STRONG_SECTION_THRESHOLD,
    MAX_FOCUS_SECTIONS,
    MAX_WEEKLY_PRIORITIES,
    IMPROVEMENT_DIFFICULTY
} from "./action-config.js";

export const ACTION_PLAN_SCHEMA_VERSION = 1;

function estimateImprovementDifficulty(section) {

    const latest = section.latestPercentage ?? 0;
    const isDeclining = section.classification === TREND_CLASSIFICATIONS.DECLINING;
    const gapToStrong = STRONG_SECTION_THRESHOLD - latest;

    if (latest >= 70 && !isDeclining) {
        return IMPROVEMENT_DIFFICULTY.LOW;
    }

    if (latest >= 50 && !isDeclining && gapToStrong <= 20) {
        return IMPROVEMENT_DIFFICULTY.MODERATE;
    }

    if (isDeclining && latest < 45) {
        return IMPROVEMENT_DIFFICULTY.HIGH;
    }

    if (latest < 40 || (isDeclining && gapToStrong > 25)) {
        return IMPROVEMENT_DIFFICULTY.HIGH;
    }

    return IMPROVEMENT_DIFFICULTY.MODERATE;

}

function buildSectionReference(section) {

    const difficulty = estimateImprovementDifficulty(section);

    return {
        sectionId: section.sectionId,
        title: section.title,
        latestPercentage: section.latestPercentage,
        firstPercentage: section.firstPercentage,
        deltaPercentage: section.deltaPercentage,
        classification: section.classification,
        estimatedImprovementDifficulty: difficulty
    };

}

function buildWeeklyImprovementPriorities(topPriorities) {

    return topPriorities
        .slice(0, MAX_WEEKLY_PRIORITIES)
        .map((priority, index) => ({
            id: `week-priority-${index + 1}`,
            weekRank: index + 1,
            sectionId: priority.sectionId,
            sectionTitle: priority.sectionTitle,
            latestPercentage: priority.latestPercentage,
            deltaPercentage: priority.deltaPercentage,
            classification: priority.classification,
            estimatedImprovementDifficulty: priority.estimatedImprovementDifficulty,
            focusDurationDays: 7
        }));

}

export function generateActionPlan(trendResult) {

    if (!isDomainSuccess(trendResult)) {
        return createFailure(
            DOMAIN_RESULT_CODES.VALIDATION_ERROR,
            "Trend data is required to generate an action plan."
        );
    }

    const trend = trendResult.data;
    const sectionTrends = [...(trend.sectionTrends || [])];
    const reassessmentResult = computeSuggestedReassessment(trendResult);

    const weakAreas = sectionTrends
        .filter(section => {
            return section.classification === TREND_CLASSIFICATIONS.DECLINING
                || section.latestPercentage < WEAK_SECTION_THRESHOLD;
        })
        .sort((left, right) => left.latestPercentage - right.latestPercentage)
        .slice(0, MAX_FOCUS_SECTIONS)
        .map(buildSectionReference);

    const continueHabits = sectionTrends
        .filter(section => {
            return (section.classification === TREND_CLASSIFICATIONS.IMPROVING
                || section.classification === TREND_CLASSIFICATIONS.STABLE)
                && section.latestPercentage >= STRONG_SECTION_THRESHOLD;
        })
        .sort((left, right) => right.latestPercentage - left.latestPercentage)
        .slice(0, MAX_FOCUS_SECTIONS)
        .map(buildSectionReference);

    const recommendedFocusSections = [...sectionTrends]
        .sort((left, right) => left.latestPercentage - right.latestPercentage)
        .slice(0, MAX_FOCUS_SECTIONS)
        .map((section, index) => ({
            ...buildSectionReference(section),
            rank: index + 1,
            reason: "lowest_latest_percentage"
        }));

    const topPriorities = recommendedFocusSections.map((section, index) => ({
        id: `priority-${index + 1}`,
        priority: index + 1,
        sectionId: section.sectionId,
        sectionTitle: section.title,
        latestPercentage: section.latestPercentage,
        deltaPercentage: section.deltaPercentage,
        classification: section.classification,
        estimatedImprovementDifficulty: section.estimatedImprovementDifficulty,
        focusType: weakAreas.some(area => area.sectionId === section.sectionId)
            ? "weak_area"
            : "focus_section"
    }));

    const weeklyImprovementPriorities = buildWeeklyImprovementPriorities(topPriorities);
    const suggestedReassessmentInterval = isDomainSuccess(reassessmentResult)
        ? {
            days: reassessmentResult.data.days,
            unit: reassessmentResult.data.unit,
            basis: reassessmentResult.data.basis,
            suggestedDate: reassessmentResult.data.suggestedDate ?? null
        }
        : {
            days: 30,
            unit: "days",
            basis: "default",
            suggestedDate: null
        };

    return createSuccess({
        schemaVersion: ACTION_PLAN_SCHEMA_VERSION,
        computedAt: new Date().toISOString(),
        snapshotId: trend.latestAssessment?.snapshotId || null,
        highestPriorityGrowthAreas: topPriorities,
        topPriorities,
        sectionsToMaintain: continueHabits,
        continueHabits,
        weakAreas,
        recommendedFocusOrder: recommendedFocusSections,
        recommendedFocusSections,
        weeklyImprovementPriorities,
        suggestedReassessmentInterval,
        estimatedImprovementDifficulty: {
            overall: topPriorities[0]?.estimatedImprovementDifficulty || IMPROVEMENT_DIFFICULTY.MODERATE,
            bySection: sectionTrends.map(section => ({
                sectionId: section.sectionId,
                title: section.title,
                difficulty: estimateImprovementDifficulty(section)
            }))
        }
    });

}

export const ActionEngine = {
    generateActionPlan
};
