import { buildReportSections } from "../report/report.js";
import { buildReportSectionPresentation } from "../presentation/report-section-presentation.js";

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

export function buildHistoricalDashboardPresentation(report, snapshot, questionnaire = []) {

    const assessment = report?.assessment || {};
    const categories = assessment.categories || [];
    const reportSections = buildReportSections(categories);
    const insights = report?.insights || {};

    return {
        reportSections,
        insights,
        rawScores: deriveRawScoresFromAssessment(assessment),
        sectionPresentation: buildReportSectionPresentation({
            questionnaire,
            reportSections,
            insights,
            strengths: report?.strengths || [],
            weaknesses: report?.weaknesses || [],
            recommendations: report?.recommendations || [],
            growthQuestionGroups: insights.growthQuestionGroups || []
        }),
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
