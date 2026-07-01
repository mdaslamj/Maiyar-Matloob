import { createSuccess, createFailure, DOMAIN_RESULT_CODES, isDomainSuccess } from "../shared/errors/domain-result.js";
import { TREND_CLASSIFICATIONS } from "../trend/trend-config.js";
import { getTrendClassificationLabel } from "../trend/trend-classifier.js";

export const FEEDBACK_SCHEMA_VERSION = 1;

export const FEEDBACK_CATEGORIES = {
    PROGRESS_SUMMARY: "progress_summary",
    POSITIVE_REINFORCEMENT: "positive_reinforcement",
    STABLE_ENCOURAGEMENT: "stable_encouragement",
    GENTLE_REMINDER: "gentle_reminder",
    PRIORITY_EXPLANATION: "priority_explanation",
    REASSESSMENT: "reassessment"
};

function createFeedbackItem(id, category, message) {

    return {
        id,
        category,
        message
    };

}

function buildProgressSummaryFeedback(trend) {

    const snapshotCount = trend.snapshotCount || 0;
    const overallTrend = trend.overallTrend || {};

    if (snapshotCount === 0) {
        return createFeedbackItem(
            "progress-summary-empty",
            FEEDBACK_CATEGORIES.PROGRESS_SUMMARY,
            "آپ کا پہلا جائزہ مکمل کرنے کے بعد یہاں آپ کی ذاتی پیش رفت کا خلاصہ دکھایا جائے گا۔"
        );
    }

    if (snapshotCount === 1) {
        return createFeedbackItem(
            "progress-summary-first",
            FEEDBACK_CATEGORIES.PROGRESS_SUMMARY,
            "آپ نے پہلا جائزہ مکمل کر لیا ہے۔ اگلے جائزے کے بعد آپ اپنے پہلے اور تازہ ترین نتائج کا موازنہ یہاں دیکھ سکیں گے۔"
        );
    }

    const classificationLabel = getTrendClassificationLabel(overallTrend.classification || "Insufficient Data");

    return createFeedbackItem(
        "progress-summary-overall",
        FEEDBACK_CATEGORIES.PROGRESS_SUMMARY,
        `آپ کے ${snapshotCount} محفوظ جائزوں کے موازنے میں مجموعی رجحان ${classificationLabel} ہے۔ پہلا جائزہ ${overallTrend.firstPercentage ?? "—"}% تھا اور تازہ ترین ${overallTrend.latestPercentage ?? "—"}% ہے۔`
    );

}

function buildPositiveReinforcementFeedback(trend) {

    const items = [];
    const overallTrend = trend.overallTrend || {};

    if (trend.snapshotCount >= 2 && overallTrend.classification === TREND_CLASSIFICATIONS.IMPROVING) {
        items.push(createFeedbackItem(
            "positive-overall",
            FEEDBACK_CATEGORIES.POSITIVE_REINFORCEMENT,
            `آپ کے پہلے (${overallTrend.firstPercentage ?? "—"}%) اور تازہ ترین (${overallTrend.latestPercentage ?? "—"}%) جائزے کے درمیان ${overallTrend.deltaPercentage ?? "—"}% کا اضافہ محفوظ جائزوں میں دیکھا گیا ہے — یہ ایک مثبت سمت ہے۔`
        ));
    }

    (trend.sectionTrends || [])
        .filter(section => section.classification === TREND_CLASSIFICATIONS.IMPROVING)
        .slice(0, 3)
        .forEach((section, index) => {
            items.push(createFeedbackItem(
                `positive-section-${index + 1}`,
                FEEDBACK_CATEGORIES.POSITIVE_REINFORCEMENT,
                `${section.title} میں آپ کی ذاتی پیش رفت قابلِ ذکر ہے: پہلے (${section.firstPercentage}%) سے تازہ (${section.latestPercentage}%) تک ${section.deltaPercentage ?? "—"}% کی بہتری۔`
            ));
        });

    if (!items.length && (trend.snapshotCount || 0) >= 2) {
        items.push(createFeedbackItem(
            "positive-continuity",
            FEEDBACK_CATEGORIES.POSITIVE_REINFORCEMENT,
            "آپ نے مسلسل محاسبۂ نفس جاری رکھا ہے — یہ خود ایک قیمتی عمل ہے جو وقت کے ساتھ واضح موازنہ ممکن بناتا ہے۔"
        ));
    }

    return items;

}

function buildStableEncouragementFeedback(trend) {

    return (trend.sectionTrends || [])
        .filter(section => section.classification === TREND_CLASSIFICATIONS.STABLE)
        .slice(0, 3)
        .map((section, index) => createFeedbackItem(
            `stable-section-${index + 1}`,
            FEEDBACK_CATEGORIES.STABLE_ENCOURAGEMENT,
            `${section.title} میں آپ کا رجحان مستحکم ہے؛ پہلے (${section.firstPercentage}%) اور تازہ (${section.latestPercentage}%) جائزے قریب قریب ہیں — یہ سطح برقرار رکھنا بھی ایک کامیابی ہے۔`
        ));

}

function buildGentleReminderFeedback(actionPlan) {

    if (!actionPlan?.weakAreas?.length) {
        return [];
    }

    return actionPlan.weakAreas.map((area, index) => createFeedbackItem(
        `gentle-${index + 1}`,
        FEEDBACK_CATEGORIES.GENTLE_REMINDER,
        `${area.title} میں آپ کے پہلے (${area.firstPercentage ?? "—"}%) اور تازہ (${area.latestPercentage}%) جائزے کے درمیان فرق ہے — آہستہ آہستہ توجہ یہاں مفید رہے گی۔`
    ));

}

function buildPriorityExplanationFeedback(actionPlan) {

    const priorities = actionPlan?.topPriorities || actionPlan?.highestPriorityGrowthAreas || [];

    if (!priorities.length) {
        return [];
    }

    return priorities.slice(0, 3).map((priority, index) => createFeedbackItem(
        `priority-${index + 1}`,
        FEEDBACK_CATEGORIES.PRIORITY_EXPLANATION,
        `اولویت ${priority.priority}: ${priority.sectionTitle} — تازہ ترین ${priority.latestPercentage}%${priority.deltaPercentage != null ? `، پہلے جائزے سے ${priority.deltaPercentage}% فرق` : ""}۔`
    ));

}

function buildReassessmentFeedback(actionPlan, reassessmentResult) {

    const interval = reassessmentResult?.data || actionPlan?.suggestedReassessmentInterval;

    if (!interval?.days) {
        return [];
    }

    const dateHint = interval.suggestedDate
        ? ` (تقریباً ${new Date(interval.suggestedDate).toLocaleDateString("ur-PK", { year: "numeric", month: "long", day: "numeric" })})`
        : "";

    return [
        createFeedbackItem(
            "reassessment-interval",
            FEEDBACK_CATEGORIES.REASSESSMENT,
            `آپ کے محفوظ جائزوں، مستقل مزاجی، اور جائزے کے فاصلے کی بنیاد پر اگلے جائزے کے لیے ${interval.days} دن کا وقفہ تجویز کیا گیا ہے${dateHint}۔`
        )
    ];

}

function buildSummary(items, trend) {

    if (!items.length) {
        return trend.summary || "فی الحال رائے کے لیے کافی محفوظ جائزے موجود نہیں ہیں۔";
    }

    const counts = {
        positive: items.filter(item => item.category === FEEDBACK_CATEGORIES.POSITIVE_REINFORCEMENT).length,
        stable: items.filter(item => item.category === FEEDBACK_CATEGORIES.STABLE_ENCOURAGEMENT).length,
        gentle: items.filter(item => item.category === FEEDBACK_CATEGORIES.GENTLE_REMINDER).length
    };

    return `آپ کے محفوظ جائزوں کے موازنے میں ${counts.positive} مثبت رجحان، ${counts.stable} مستحکم شعبے، اور ${counts.gentle} آہستہ توجہ کے شعبے شناخت ہوئے ہیں۔`;

}

export function generateFeedback(trendResult, actionPlanResult, reassessmentResult = null) {

    if (!isDomainSuccess(trendResult)) {
        return createFailure(
            DOMAIN_RESULT_CODES.VALIDATION_ERROR,
            "Trend data is required to generate feedback."
        );
    }

    if (!isDomainSuccess(actionPlanResult)) {
        return createFailure(
            DOMAIN_RESULT_CODES.VALIDATION_ERROR,
            "Action plan data is required to generate feedback."
        );
    }

    const trend = trendResult.data;
    const actionPlan = actionPlanResult.data;

    const items = [
        buildProgressSummaryFeedback(trend),
        ...buildPositiveReinforcementFeedback(trend),
        ...buildStableEncouragementFeedback(trend),
        ...buildGentleReminderFeedback(actionPlan),
        ...buildPriorityExplanationFeedback(actionPlan),
        ...buildReassessmentFeedback(actionPlan, reassessmentResult)
    ];

    return createSuccess({
        schemaVersion: FEEDBACK_SCHEMA_VERSION,
        computedAt: new Date().toISOString(),
        snapshotId: trend.latestAssessment?.snapshotId || null,
        summary: buildSummary(items, trend),
        items
    });

}

export const FeedbackEngine = {
    generateFeedback
};
