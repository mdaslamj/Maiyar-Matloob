import { createSuccess, createFailure, DOMAIN_RESULT_CODES, isDomainSuccess } from "../shared/errors/domain-result.js";

export const REASSESSMENT_PLAN_SCHEMA_VERSION = 1;

const BASIS_EXPLANATIONS = {
    no_assessments: "ابھی تک کوئی جائزہ محفوظ نہیں ہے، اس لیے ایک معیاری 30 دن کا وقفہ تجویز کیا گیا ہے۔",
    initial_guidance: "آپ نے ابھی ایک جائزہ مکمل کیا ہے؛ اگلے موازنے کے لیے 30 دن کا وقفہ مناسب رہے گا۔",
    high_consistency_frequent: "آپ کے جائزے مستقل ہیں اور فاصلہ مختصر ہے، اس لیے 7 دن بعد دوبارہ محاسبہ مفید ہوگا۔",
    moderate_consistency_regular: "آپ کا جائزے کا سلسلہ منظم ہے؛ 14 دن بعد دوبارہ جائزہ لینا مناسب ہے۔",
    standard_rhythm: "آپ کے موجودہ جائزے کے فاصلے اور مستقل مزاجی کے مطابق 30 دن بعد دوبارہ جائزہ تجویز کیا گیا ہے۔",
    low_consistency_infrequent: "جائزوں کے درمیان طویل فاصلہ ہے؛ 60 دن بعد دوبارہ محاسبہ زیادہ مناسب ہے۔",
    historical_average: "آپ کے پچھلے جائزوں کے اوسط فاصلے کی بنیاد پر یہ وقفہ تجویز کیا گیا ہے۔",
    declining_trend_regular_user: "مجموعی رجحان میں فرق نظر آیا ہے اور آپ باقاعدہ جائزے لیتے ہیں؛ 14 دن بعد دوبارہ محاسبہ مفید ہوگا۔",
    multiple_focus_areas: "متعدد شعبوں میں توجہ درکار ہے؛ 14 دن بعد دوبارہ جائزہ تجویز کیا گیا ہے۔",
    default: "آپ کے محفوظ جائزوں کی بنیاد پر یہ وقفہ تجویز کیا گیا ہے۔"
};

function buildReasonUrdu(basis) {

    return BASIS_EXPLANATIONS[basis] || BASIS_EXPLANATIONS.default;

}

/**
 * Expand reassessment recommendation into a planning view model.
 * Does not modify reassessment calculations.
 */
export function buildReassessmentPlan(reassessmentResult, trendResult) {

    if (!isDomainSuccess(reassessmentResult)) {
        return createFailure(
            DOMAIN_RESULT_CODES.VALIDATION_ERROR,
            "Reassessment recommendation is required."
        );
    }

    const reassessment = reassessmentResult.data;
    const trend = isDomainSuccess(trendResult) ? trendResult.data : {};

    return createSuccess({
        schemaVersion: REASSESSMENT_PLAN_SCHEMA_VERSION,
        computedAt: new Date().toISOString(),
        recommendedDays: reassessment.days,
        recommendedDate: reassessment.suggestedDate || null,
        reasonUrdu: buildReasonUrdu(reassessment.basis),
        basis: reassessment.basis,
        consistencyScore: trend.consistency?.score ?? reassessment.inputs?.consistencyScore ?? null,
        assessmentFrequency: trend.assessmentFrequency || {
            averageDaysBetween: reassessment.inputs?.averageDaysBetween ?? null,
            count: reassessment.inputs?.snapshotCount ?? trend.snapshotCount ?? 0
        },
        allowedIntervals: reassessment.allowedIntervals || [7, 14, 30, 60],
        planningOnly: true
    });

}

export const ReassessmentPlanBuilder = {
    buildReassessmentPlan
};
