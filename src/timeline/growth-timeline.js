import { createSuccess } from "../shared/errors/domain-result.js";

export const GROWTH_TIMELINE_SCHEMA_VERSION = 1;

function buildAssessmentTimelineEntry(snapshot, journalEntries, growthSummary) {

    const linkedReflection = journalEntries.find(entry => entry.linkedSnapshotId === snapshot.snapshotId) || null;

    return {
        entryId: snapshot.snapshotId,
        type: "assessment",
        date: snapshot.createdAt,
        title: "محاسبۂ نفس",
        overallPercentage: snapshot.overallPercentage,
        overallLevel: snapshot.overallLevel,
        growthSummary: growthSummary || null,
        snapshotId: snapshot.snapshotId,
        journalEntryId: linkedReflection?.entryId || null,
        reflectionTitle: linkedReflection?.title || null,
        hasReport: true,
        hasReflection: Boolean(linkedReflection),
        reflection: linkedReflection
            ? {
                notes: linkedReflection.notes,
                lessonsLearned: linkedReflection.lessonsLearned,
                intentions: linkedReflection.intentions
            }
            : null
    };

}

function buildReflectionTimelineEntry(entry) {

    return {
        entryId: entry.entryId,
        type: "reflection",
        date: entry.createdAt,
        title: entry.title || "ذاتی غور و فکر",
        overallPercentage: null,
        overallLevel: null,
        growthSummary: entry.lessonsLearned || entry.notes || null,
        snapshotId: entry.linkedSnapshotId || null,
        journalEntryId: entry.entryId,
        reflectionTitle: entry.title || null,
        hasReport: false,
        hasReflection: true,
        reflection: {
            notes: entry.notes,
            lessonsLearned: entry.lessonsLearned,
            intentions: entry.intentions
        }
    };

}

/**
 * Merge assessments and journal reflections into one chronological timeline.
 */
export function buildGrowthTimeline(snapshots, journalEntries, trendResult, feedbackResult) {

    const trend = trendResult?.data || {};
    const feedback = feedbackResult?.data || {};
    const latestSnapshotId = trend.latestAssessment?.snapshotId || null;
    const growthSummary = feedback.summary || trend.summary || null;
    const assessmentEntries = snapshots.map(snapshot => {
        const summary = snapshot.snapshotId === latestSnapshotId ? growthSummary : null;

        return buildAssessmentTimelineEntry(snapshot, journalEntries, summary);
    });

    const standaloneReflections = journalEntries
        .filter(entry => !entry.linkedSnapshotId)
        .map(buildReflectionTimelineEntry);

    const entries = [...assessmentEntries, ...standaloneReflections]
        .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime());

    return createSuccess({
        schemaVersion: GROWTH_TIMELINE_SCHEMA_VERSION,
        computedAt: new Date().toISOString(),
        entryCount: entries.length,
        assessmentCount: snapshots.length,
        reflectionCount: journalEntries.length,
        entries
    });

}

export const GrowthTimelineBuilder = {
    buildGrowthTimeline
};
