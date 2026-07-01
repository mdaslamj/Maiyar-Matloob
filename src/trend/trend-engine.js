import { createSuccess } from "../shared/errors/domain-result.js";
import { DOMAIN_SCHEMA_VERSIONS } from "../shared/domain/models.js";
import {
    TREND_CLASSIFICATIONS,
    TREND_RESULT_SCHEMA_VERSION,
    TREND_THRESHOLDS
} from "./trend-config.js";
import {
    classifyTrend,
    classificationToDirection
} from "./trend-classifier.js";

const DAY_MS = 1000 * 60 * 60 * 24;

function normalizeSnapshots(snapshots = [], options = {}) {

    const ordered = [...snapshots].sort((a, b) => {
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        return options.order === "newest-first" ? timeB - timeA : timeA - timeB;
    });

    if (options.limit && options.limit > 0) {
        return ordered.slice(0, options.limit);
    }

    return ordered;

}

function toOldestFirst(snapshots) {

    return [...snapshots].sort((a, b) => {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

}

function toAssessmentSummary(snapshot) {

    if (!snapshot) {
        return null;
    }

    return {
        snapshotId: snapshot.snapshotId,
        createdAt: snapshot.createdAt,
        overallPercentage: snapshot.overallPercentage,
        overallLevel: snapshot.overallLevel
    };

}

export function calculateOverallTrend(snapshotsOldestFirst) {

    if (!snapshotsOldestFirst.length) {
        return {
            deltaPercentage: null,
            direction: classificationToDirection(TREND_CLASSIFICATIONS.INSUFFICIENT_DATA),
            classification: TREND_CLASSIFICATIONS.INSUFFICIENT_DATA,
            latestPercentage: null,
            firstPercentage: null
        };
    }

    const first = snapshotsOldestFirst[0];
    const latest = snapshotsOldestFirst[snapshotsOldestFirst.length - 1];
    const snapshotCount = snapshotsOldestFirst.length;

    if (snapshotCount < TREND_THRESHOLDS.MIN_SNAPSHOTS_FOR_TREND) {
        return {
            deltaPercentage: null,
            direction: classificationToDirection(TREND_CLASSIFICATIONS.INSUFFICIENT_DATA),
            classification: TREND_CLASSIFICATIONS.INSUFFICIENT_DATA,
            latestPercentage: latest.overallPercentage,
            firstPercentage: first.overallPercentage
        };
    }

    const deltaPercentage = Number((latest.overallPercentage - first.overallPercentage).toFixed(1));
    const classification = classifyTrend(deltaPercentage, snapshotCount);

    return {
        deltaPercentage,
        direction: classificationToDirection(classification),
        classification,
        latestPercentage: latest.overallPercentage,
        firstPercentage: first.overallPercentage
    };

}

export function calculateSectionTrends(snapshotsOldestFirst) {

    if (!snapshotsOldestFirst.length) {
        return [];
    }

    const sectionTimeline = {};

    snapshotsOldestFirst.forEach(snapshot => {
        (snapshot.sectionSummary || []).forEach(section => {
            if (!sectionTimeline[section.sectionId]) {
                sectionTimeline[section.sectionId] = {
                    sectionId: section.sectionId,
                    title: section.title,
                    firstPercentage: section.percentage,
                    latestPercentage: section.percentage
                };
                return;
            }

            sectionTimeline[section.sectionId].latestPercentage = section.percentage;
            sectionTimeline[section.sectionId].title = section.title;
        });
    });

    return Object.values(sectionTimeline).map(section => {
        const snapshotCount = snapshotsOldestFirst.length;
        const deltaPercentage = snapshotCount >= TREND_THRESHOLDS.MIN_SNAPSHOTS_FOR_TREND
            ? Number((section.latestPercentage - section.firstPercentage).toFixed(1))
            : null;
        const classification = classifyTrend(deltaPercentage, snapshotCount);

        return {
            sectionId: section.sectionId,
            title: section.title,
            deltaPercentage,
            direction: classificationToDirection(classification),
            classification,
            firstPercentage: section.firstPercentage,
            latestPercentage: section.latestPercentage
        };
    });

}

export function calculateConsistency(snapshotsOldestFirst) {

    if (!snapshotsOldestFirst.length) {
        return {
            score: null,
            standardDeviation: null,
            classification: TREND_CLASSIFICATIONS.INSUFFICIENT_DATA
        };
    }

    if (snapshotsOldestFirst.length < TREND_THRESHOLDS.MIN_SNAPSHOTS_FOR_TREND) {
        return {
            score: null,
            standardDeviation: null,
            classification: TREND_CLASSIFICATIONS.INSUFFICIENT_DATA
        };
    }

    const percentages = snapshotsOldestFirst.map(snapshot => snapshot.overallPercentage);
    const mean = percentages.reduce((sum, value) => sum + value, 0) / percentages.length;
    const variance = percentages.reduce((sum, value) => sum + ((value - mean) ** 2), 0) / percentages.length;
    const standardDeviation = Number(Math.sqrt(variance).toFixed(1));
    const score = Number(Math.max(
        0,
        Math.min(100, 100 - (standardDeviation * TREND_THRESHOLDS.CONSISTENCY_STD_DEV_FACTOR))
    ).toFixed(1));

    return {
        score,
        standardDeviation
    };

}

export function calculateAssessmentFrequency(snapshotsOldestFirst) {

    const count = snapshotsOldestFirst.length;

    if (count < TREND_THRESHOLDS.MIN_SNAPSHOTS_FOR_TREND) {
        return {
            count,
            averageDaysBetween: null,
            totalSpanDays: null
        };
    }

    const timestamps = snapshotsOldestFirst.map(snapshot => new Date(snapshot.createdAt).getTime());
    let intervalTotal = 0;

    for (let index = 1; index < timestamps.length; index += 1) {
        intervalTotal += (timestamps[index] - timestamps[index - 1]) / DAY_MS;
    }

    return {
        count,
        averageDaysBetween: Number((intervalTotal / (timestamps.length - 1)).toFixed(1)),
        totalSpanDays: Number(((timestamps[timestamps.length - 1] - timestamps[0]) / DAY_MS).toFixed(1))
    };

}

export function calculateImprovementVelocity(snapshotsOldestFirst) {

    const overallTrend = calculateOverallTrend(snapshotsOldestFirst);
    const frequency = calculateAssessmentFrequency(snapshotsOldestFirst);

    if (
        overallTrend.deltaPercentage == null
        || !frequency.totalSpanDays
        || frequency.totalSpanDays <= 0
    ) {
        return {
            pointsPerThirtyDays: null,
            classification: TREND_CLASSIFICATIONS.INSUFFICIENT_DATA
        };
    }

    const pointsPerThirtyDays = Number(
        ((overallTrend.deltaPercentage / frequency.totalSpanDays) * 30).toFixed(2)
    );
    const classification = classifyTrend(pointsPerThirtyDays, snapshotsOldestFirst.length);

    return {
        pointsPerThirtyDays,
        classification
    };

}

export function generateTrendSummary(trendData) {

    const {
        overallTrend,
        snapshotCount,
        consistency,
        improvementVelocity,
        latestAssessment,
        firstAssessment
    } = trendData;

    if (snapshotCount === 0) {
        return "ابھی تک کوئی مکمل شدہ جائزہ محفوظ نہیں ہے۔ پہلا جائزہ مکمل کریں، پھر آپ کی پیش رفت یہاں دکھائی جائے گی۔";
    }

    if (snapshotCount === 1) {
        return "آپ کا پہلا جائزہ محفوظ ہو گیا ہے۔ مزید جائزوں کے بعد مجموعی رجحان یہاں ظاہر ہوگا۔";
    }

    const deltaText = overallTrend.deltaPercentage != null
        ? `${Math.abs(overallTrend.deltaPercentage)}%`
        : "—";

    if (overallTrend.classification === TREND_CLASSIFICATIONS.IMPROVING) {
        return `آپ کے پہلے (${firstAssessment?.overallPercentage ?? "—"}%) اور تازہ ترین (${latestAssessment?.overallPercentage ?? "—"}%) جائزے کے درمیان ${deltaText} کی بہتری دیکھی گئی ہے۔ یہ ایک مثبت سمت ہے۔`;
    }

    if (overallTrend.classification === TREND_CLASSIFICATIONS.DECLINING) {
        return `پہلے اور تازہ ترین جائزے کے درمیان ${deltaText} کا فرق ہے۔ یہ آپ کے لیے غور و فکر اور محاسبۂ نفس کا موقع ہے۔`;
    }

    if (overallTrend.classification === TREND_CLASSIFICATIONS.STABLE) {
        return `آپ کا مجموعی رجحان نسبتاً مستحکم ہے۔ پہلے (${firstAssessment?.overallPercentage ?? "—"}%) اور تازہ ترین (${latestAssessment?.overallPercentage ?? "—"}%) جائزے قریب قریب ہیں۔`;
    }

    const consistencyText = consistency?.score != null ? `${consistency.score}%` : "—";
    const velocityText = improvementVelocity?.pointsPerThirtyDays != null
        ? `${improvementVelocity.pointsPerThirtyDays}%`
        : "—";

    return `آپ کے ${snapshotCount} محفوظ جائزوں کی بنیاد پر مستقل مزاجی ${consistencyText} ہے اور 30 دن کی شرحِ بہتری ${velocityText} ہے۔`;

}

export function computeTrends(snapshots = [], options = {}) {

    const normalized = normalizeSnapshots(snapshots, options);
    const snapshotsOldestFirst = toOldestFirst(normalized);
    const snapshotCount = snapshotsOldestFirst.length;
    const overallTrend = calculateOverallTrend(snapshotsOldestFirst);
    const sectionTrends = calculateSectionTrends(snapshotsOldestFirst);
    const consistency = calculateConsistency(snapshotsOldestFirst);
    const assessmentFrequency = calculateAssessmentFrequency(snapshotsOldestFirst);
    const improvementVelocity = calculateImprovementVelocity(snapshotsOldestFirst);
    const latestAssessment = toAssessmentSummary(snapshotsOldestFirst[snapshotsOldestFirst.length - 1]);
    const firstAssessment = toAssessmentSummary(snapshotsOldestFirst[0]);

    const trendData = {
        schemaVersion: TREND_RESULT_SCHEMA_VERSION,
        computedAt: new Date().toISOString(),
        snapshotCount,
        overallDeltaPercentage: overallTrend.deltaPercentage,
        overallDirection: overallTrend.direction,
        overallClassification: overallTrend.classification,
        overallTrend,
        sectionTrends,
        consistency,
        consistencyScore: consistency.score,
        assessmentFrequency,
        improvementVelocity,
        latestAssessment,
        firstAssessment,
        assessmentCount: snapshotCount
    };

    trendData.summary = generateTrendSummary(trendData);

    return createSuccess({
        ...trendData,
        sectionTrends: sectionTrends.map(section => ({
            sectionId: section.sectionId,
            title: section.title,
            deltaPercentage: section.deltaPercentage,
            direction: section.direction,
            classification: section.classification,
            firstPercentage: section.firstPercentage,
            latestPercentage: section.latestPercentage
        }))
    });

}

export function getSectionTrendFromResult(trendResult, sectionId) {

    if (!sectionId || !trendResult?.data?.sectionTrends) {
        return null;
    }

    return trendResult.data.sectionTrends.find(section => section.sectionId === sectionId) || null;

}

export const TrendEngine = {
    calculateOverallTrend,
    calculateSectionTrends,
    calculateConsistency,
    calculateAssessmentFrequency,
    calculateImprovementVelocity,
    generateTrendSummary,
    computeTrends,
    getSectionTrendFromResult
};

export {
    buildCommunityAnswerRecord,
    buildQuestionCatalog,
    collectCommunityAnswerRecords
} from "./trend-community-data.js";

export {
    computeMaiyaarInsights,
    computePracticeInsights,
    computeQuestionInsights,
    computeSectionInsights,
    computeImplementationTrends,
    computeEducationalPriorities,
    computeCommunitySummary,
    CommunityInsightsEngine
} from "./trend-community-insights.js";

export {
    IMPLEMENTATION_STATUS_CATEGORIES,
    EDUCATIONAL_PRIORITY_THRESHOLDS,
    RESPONSE_BUCKETS
} from "./trend-community-config.js";
