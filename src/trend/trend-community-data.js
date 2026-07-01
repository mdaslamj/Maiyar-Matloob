import { RESPONSE_BUCKETS } from "./trend-community-config.js";

export const COMMUNITY_ANSWER_RECORD_SCHEMA_VERSION = 1;

function emptyDistribution() {

    return {
        always: 0,
        often: 0,
        sometimes: 0,
        never: 0,
        total: 0
    };

}

function bucketKeyForValue(value) {

    const match = RESPONSE_BUCKETS.find(bucket => bucket.value === Number(value));

    return match?.key || null;

}

/**
 * Build a read-only answer record stored alongside historical reports.
 * Does not alter assessment scoring.
 */
export function buildCommunityAnswerRecord(questionnaire, answers, responseScale, getQuestionKey) {

    const questionAnswers = {};

    questionnaire.forEach((question, index) => {
        const questionKey = getQuestionKey(question, index);
        const questionId = question.id || question.standardId || questionKey;

        if (answers[questionKey] == null) {
            return;
        }

        questionAnswers[questionId] = Number(answers[questionKey]);
    });

    return {
        schemaVersion: COMMUNITY_ANSWER_RECORD_SCHEMA_VERSION,
        capturedAt: new Date().toISOString(),
        questionAnswers
    };

}

export function buildQuestionCatalog(questionnaire = [], getQuestionKey, getQuestionSection) {

    return questionnaire.map((question, index) => {
        const questionId = question.id || question.standardId || getQuestionKey(question, index);

        return {
            questionId,
            questionKey: getQuestionKey(question, index),
            section: getQuestionSection(question),
            practice: question.category || question.practice || getQuestionSection(question),
            questionText: question.question || "",
            standardId: question.standardId || null
        };
    });

}

/**
 * Collect answer records from historical reports (read-only).
 */
export function collectCommunityAnswerRecords(snapshots = [], loadHistoricalReport) {

    return snapshots
        .map(snapshot => {
            const report = loadHistoricalReport(snapshot.snapshotId);
            const record = report?.communityAnswerRecord;

            if (!record?.questionAnswers) {
                return null;
            }

            return {
                snapshotId: snapshot.snapshotId,
                createdAt: snapshot.createdAt,
                questionAnswers: record.questionAnswers
            };
        })
        .filter(Boolean)
        .sort((left, right) => {
            return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
        });

}

export function createDistributionFromCounts(counts) {

    const total = counts.total || 0;
    const toPercent = value => total ? Number(((value / total) * 100).toFixed(1)) : 0;

    return {
        always: toPercent(counts.always),
        often: toPercent(counts.often),
        sometimes: toPercent(counts.sometimes),
        never: toPercent(counts.never),
        totalResponses: total,
        counts: { ...counts }
    };

}

export function accumulateDistribution(records, selector) {

    const counts = emptyDistribution();

    records.forEach(record => {
        selector(record).forEach(answerValue => {
            const bucket = bucketKeyForValue(answerValue);

            if (!bucket) {
                return;
            }

            counts[bucket] += 1;
            counts.total += 1;
        });
    });

    return createDistributionFromCounts(counts);

}

export function positiveRateFromDistribution(distribution) {

    return Number(((distribution.always || 0) + (distribution.often || 0)).toFixed(1));

}
