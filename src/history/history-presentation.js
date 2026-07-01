import { buildReportSections } from "../report/report.js";

export function deriveRawScoresFromAssessment(assessment) {

    const categories = assessment?.categories || [];

    const overall = categories.reduce((totals, category) => {
        totals.raw += category.raw || 0;
        totals.max += category.max || 0;
        return totals;
    }, { raw: 0, max: 0 });

    return {
        overall
    };

}

export function buildHistoricalDashboardPresentation(report, snapshot) {

    const assessment = report?.assessment || {};
    const categories = assessment.categories || [];

    return {
        reportSections: buildReportSections(categories),
        insights: report?.insights || {},
        rawScores: deriveRawScoresFromAssessment(assessment),
        snapshot
    };

}

export function buildSectionRowsFromSnapshot(sectionSummary = []) {

    return sectionSummary.map(section => ({
        title: section.title,
        percentage: section.percentage,
        level: section.level,
        raw: 0,
        max: 0
    }));

}
