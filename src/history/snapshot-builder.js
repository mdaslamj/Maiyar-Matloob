import { buildReportSections } from "../report/report.js";
import { HISTORY_SNAPSHOT_SCHEMA_VERSION } from "./history-config.js";

export function createSnapshotId() {

    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }

    return `snapshot-${Date.now()}-${Math.random().toString(16).slice(2)}`;

}

export function buildAssessmentSnapshot(report, metadata = {}) {

    const assessment = report?.assessment;
    const insights = report?.insights || {};
    const overall = assessment?.overall || {};

    const sectionSummary = buildReportSections(assessment?.categories || []).map(section => ({
        sectionId: section.title,
        title: section.title,
        percentage: section.percentage,
        level: section.level || "Critical"
    }));

    const reportSummary = {
        overallSummary: insights.overallSummary || overall.summary || "",
        strongestSection: insights.strongestSection
            ? {
                title: insights.strongestSection.title,
                percentage: insights.strongestSection.percentage
            }
            : null,
        growthSection: insights.growthSection
            ? {
                title: insights.growthSection.title,
                percentage: insights.growthSection.percentage
            }
            : null,
        actionPlanCount: Array.isArray(insights.actionPlan) ? insights.actionPlan.length : 0
    };

    return {
        schemaVersion: HISTORY_SNAPSHOT_SCHEMA_VERSION,
        snapshotId: createSnapshotId(),
        createdAt: new Date().toISOString(),
        appVersion: metadata.appVersion || "unknown",
        contentVersion: metadata.contentVersion || "unknown",
        overallPercentage: overall.percentage ?? 0,
        overallLevel: overall.level || "Critical",
        sectionSummary,
        reportSummary
    };

}
