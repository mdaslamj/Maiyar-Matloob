import { createSuccess } from "../shared/errors/domain-result.js";
import { TREND_CLASSIFICATIONS } from "./trend-config.js";
import { classifyTrend } from "./trend-classifier.js";
import {
    COMMUNITY_INSIGHTS_SCHEMA_VERSION,
    IMPLEMENTATION_STATUS_CATEGORIES,
    EDUCATIONAL_PRIORITY_THRESHOLDS,
    TREND_CLASSIFICATION_KEYS
} from "./trend-community-config.js";
import {
    buildQuestionCatalog,
    collectCommunityAnswerRecords,
    accumulateDistribution,
    positiveRateFromDistribution
} from "./trend-community-data.js";

function classifyImplementationStatus(positiveRate, categories = IMPLEMENTATION_STATUS_CATEGORIES) {

    const sorted = [...categories].sort((left, right) => right.minPositiveRate - left.minPositiveRate);
    const match = sorted.find(category => positiveRate >= category.minPositiveRate);

    return match || sorted[sorted.length - 1];

}

function buildPracticeInsights(records, questionCatalog) {

    const practices = {};

    questionCatalog.forEach(question => {
        if (!practices[question.practice]) {
            practices[question.practice] = {
                practiceId: question.practice,
                practiceName: question.practice,
                section: question.section,
                questionIds: []
            };
        }

        practices[question.practice].questionIds.push(question.questionId);
    });

    return Object.values(practices).map(practice => {
        const distribution = accumulateDistribution(records, record => {
            return practice.questionIds
                .map(questionId => record.questionAnswers[questionId])
                .filter(value => value != null);
        });

        const status = classifyImplementationStatus(positiveRateFromDistribution(distribution));

        return {
            practiceId: practice.practiceId,
            practiceName: practice.practiceName,
            section: practice.section,
            distribution,
            implementationStatus: status.key,
            implementationStatusLabel: status.label,
            positiveRate: positiveRateFromDistribution(distribution)
        };
    });

}

function buildQuestionInsights(records, questionCatalog) {

    return questionCatalog.map(question => {
        const distribution = accumulateDistribution(records, record => {
            const value = record.questionAnswers[question.questionId];

            return value == null ? [] : [value];
        });

        const status = classifyImplementationStatus(positiveRateFromDistribution(distribution));

        return {
            questionId: question.questionId,
            questionText: question.questionText,
            section: question.section,
            practice: question.practice,
            distribution,
            implementationStatus: status.key,
            implementationStatusLabel: status.label
        };
    });

}

function buildSectionInsights(records, questionCatalog) {

    const sections = {};

    questionCatalog.forEach(question => {
        if (!sections[question.section]) {
            sections[question.section] = {
                sectionId: question.section,
                sectionTitle: question.section,
                questionIds: []
            };
        }

        sections[question.section].questionIds.push(question.questionId);
    });

    return Object.values(sections).map(section => {
        const distribution = accumulateDistribution(records, record => {
            return section.questionIds
                .map(questionId => record.questionAnswers[questionId])
                .filter(value => value != null);
        });

        const status = classifyImplementationStatus(positiveRateFromDistribution(distribution));

        return {
            sectionId: section.sectionId,
            sectionTitle: section.sectionTitle,
            distribution,
            implementationStatus: status.key,
            implementationStatusLabel: status.label,
            positiveRate: positiveRateFromDistribution(distribution)
        };
    });

}

function buildPracticeTrends(records, questionCatalog) {

    if (records.length < 2) {
        return [];
    }

    const firstRecord = records[0];
    const latestRecord = records[records.length - 1];
    const practices = {};

    questionCatalog.forEach(question => {
        if (!practices[question.practice]) {
            practices[question.practice] = {
                practiceId: question.practice,
                practiceName: question.practice,
                questionIds: []
            };
        }

        practices[question.practice].questionIds.push(question.questionId);
    });

    return Object.values(practices).map(practice => {
        const firstDistribution = accumulateDistribution([firstRecord], record => {
            return practice.questionIds
                .map(questionId => record.questionAnswers[questionId])
                .filter(value => value != null);
        });
        const latestDistribution = accumulateDistribution([latestRecord], record => {
            return practice.questionIds
                .map(questionId => record.questionAnswers[questionId])
                .filter(value => value != null);
        });

        const firstAlways = firstDistribution.always;
        const latestAlways = latestDistribution.always;
        const deltaAlways = Number((latestAlways - firstAlways).toFixed(1));
        const classification = classifyTrend(deltaAlways, 2);

        let trendKey = TREND_CLASSIFICATION_KEYS.STABLE;

        if (classification === TREND_CLASSIFICATIONS.IMPROVING) {
            trendKey = TREND_CLASSIFICATION_KEYS.IMPROVING;
        } else if (classification === TREND_CLASSIFICATIONS.DECLINING) {
            trendKey = TREND_CLASSIFICATION_KEYS.DECLINING;
        } else if (classification === TREND_CLASSIFICATIONS.INSUFFICIENT_DATA) {
            trendKey = TREND_CLASSIFICATION_KEYS.INSUFFICIENT_DATA;
        }

        return {
            practiceId: practice.practiceId,
            practiceName: practice.practiceName,
            firstPeriod: {
                label: firstRecord.createdAt,
                distribution: firstDistribution
            },
            latestPeriod: {
                label: latestRecord.createdAt,
                distribution: latestDistribution
            },
            delta: {
                always: deltaAlways,
                often: Number((latestDistribution.often - firstDistribution.often).toFixed(1)),
                sometimes: Number((latestDistribution.sometimes - firstDistribution.sometimes).toFixed(1)),
                never: Number((latestDistribution.never - firstDistribution.never).toFixed(1))
            },
            trend: trendKey
        };
    });

}

function buildEducationalPriorities(practiceInsights) {

    const thresholds = EDUCATIONAL_PRIORITY_THRESHOLDS;

    return [...practiceInsights]
        .filter(practice => {
            return practice.positiveRate <= thresholds.maxPositiveRate
                || practice.distribution.never >= thresholds.minNeverRate;
        })
        .sort((left, right) => {
            return left.positiveRate - right.positiveRate
                || right.distribution.never - left.distribution.never;
        })
        .slice(0, thresholds.maxItems)
        .map((practice, index) => ({
            rank: index + 1,
            practiceId: practice.practiceId,
            practiceName: practice.practiceName,
            positiveRate: practice.positiveRate,
            neverRate: practice.distribution.never,
            implementationStatus: practice.implementationStatus,
            reason: practice.positiveRate <= thresholds.maxPositiveRate
                ? "low_positive_response_rate"
                : "high_never_response_rate"
        }));

}

function buildCommunitySummary(practiceInsights, implementationTrends) {

    const sortedByPositive = [...practiceInsights].sort((left, right) => right.positiveRate - left.positiveRate);
    const sortedByLow = [...practiceInsights].sort((left, right) => left.positiveRate - right.positiveRate);

    const improving = implementationTrends.filter(item => item.trend === TREND_CLASSIFICATION_KEYS.IMPROVING);
    const declining = implementationTrends.filter(item => item.trend === TREND_CLASSIFICATION_KEYS.DECLINING);
    const stable = implementationTrends.filter(item => item.trend === TREND_CLASSIFICATION_KEYS.STABLE);

    const immediateAttention = practiceInsights.filter(practice => {
        return practice.implementationStatus === "critical_focus_area"
            || practice.implementationStatus === "needs_educational_attention";
    });

    return {
        mostImplementedPractices: sortedByPositive.slice(0, 5),
        leastImplementedPractices: sortedByLow.slice(0, 5),
        improvingPractices: improving.slice(0, 5),
        decliningPractices: declining.slice(0, 5),
        stablePractices: stable.slice(0, 5),
        practicesRequiringImmediateAttention: immediateAttention.slice(0, 5)
    };

}

function buildCommunityContext(input = {}) {

    const snapshots = input.snapshots || [];
    const questionCatalog = buildQuestionCatalog(
        input.questionnaire || [],
        input.getQuestionKey,
        input.getQuestionSection
    );
    const records = collectCommunityAnswerRecords(snapshots, input.loadHistoricalReport);

    return {
        snapshots,
        questionCatalog,
        records,
        assessmentCount: records.length
    };

}

export function computePracticeInsights(input = {}) {

    const context = buildCommunityContext(input);
    const practices = buildPracticeInsights(context.records, context.questionCatalog);

    return createSuccess({
        schemaVersion: COMMUNITY_INSIGHTS_SCHEMA_VERSION,
        computedAt: new Date().toISOString(),
        assessmentCount: context.assessmentCount,
        practices
    });

}

export function computeQuestionInsights(input = {}) {

    const context = buildCommunityContext(input);
    const questions = buildQuestionInsights(context.records, context.questionCatalog);

    return createSuccess({
        schemaVersion: COMMUNITY_INSIGHTS_SCHEMA_VERSION,
        computedAt: new Date().toISOString(),
        assessmentCount: context.assessmentCount,
        questions
    });

}

export function computeSectionInsights(input = {}) {

    const context = buildCommunityContext(input);
    const sections = buildSectionInsights(context.records, context.questionCatalog);

    return createSuccess({
        schemaVersion: COMMUNITY_INSIGHTS_SCHEMA_VERSION,
        computedAt: new Date().toISOString(),
        assessmentCount: context.assessmentCount,
        sections
    });

}

export function computeImplementationTrends(input = {}) {

    const context = buildCommunityContext(input);
    const trends = buildPracticeTrends(context.records, context.questionCatalog);

    return createSuccess({
        schemaVersion: COMMUNITY_INSIGHTS_SCHEMA_VERSION,
        computedAt: new Date().toISOString(),
        assessmentCount: context.assessmentCount,
        trends
    });

}

export function computeEducationalPriorities(input = {}) {

    const context = buildCommunityContext(input);
    const practiceInsights = buildPracticeInsights(context.records, context.questionCatalog);
    const priorities = buildEducationalPriorities(practiceInsights);

    return createSuccess({
        schemaVersion: COMMUNITY_INSIGHTS_SCHEMA_VERSION,
        computedAt: new Date().toISOString(),
        assessmentCount: context.assessmentCount,
        priorities,
        thresholds: EDUCATIONAL_PRIORITY_THRESHOLDS
    });

}

export function computeCommunitySummary(input = {}) {

    const context = buildCommunityContext(input);
    const practiceInsights = buildPracticeInsights(context.records, context.questionCatalog);
    const implementationTrends = buildPracticeTrends(context.records, context.questionCatalog);
    const summary = buildCommunitySummary(practiceInsights, implementationTrends);

    return createSuccess({
        schemaVersion: COMMUNITY_INSIGHTS_SCHEMA_VERSION,
        computedAt: new Date().toISOString(),
        assessmentCount: context.assessmentCount,
        summary
    });

}

/**
 * Unified Maiyaar-e-Matloob community insights payload.
 */
export function computeMaiyaarInsights(input = {}) {

    const context = buildCommunityContext(input);
    const practiceInsights = buildPracticeInsights(context.records, context.questionCatalog);
    const questionInsights = buildQuestionInsights(context.records, context.questionCatalog);
    const sectionInsights = buildSectionInsights(context.records, context.questionCatalog);
    const implementationTrends = buildPracticeTrends(context.records, context.questionCatalog);
    const educationalPriorities = buildEducationalPriorities(practiceInsights);
    const summary = buildCommunitySummary(practiceInsights, implementationTrends);

    return createSuccess({
        schemaVersion: COMMUNITY_INSIGHTS_SCHEMA_VERSION,
        computedAt: new Date().toISOString(),
        assessmentCount: context.assessmentCount,
        hasSufficientData: context.assessmentCount > 0,
        practiceInsights,
        questionInsights,
        sectionInsights,
        implementationTrends,
        educationalPriorities,
        summary,
        configuration: {
            implementationStatusCategories: IMPLEMENTATION_STATUS_CATEGORIES,
            educationalPriorityThresholds: EDUCATIONAL_PRIORITY_THRESHOLDS
        }
    });

}

export const CommunityInsightsEngine = {
    computeMaiyaarInsights,
    computePracticeInsights,
    computeQuestionInsights,
    computeSectionInsights,
    computeImplementationTrends,
    computeEducationalPriorities,
    computeCommunitySummary
};
