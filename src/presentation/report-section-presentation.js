import { getPerformanceLevel } from "../assessment/assessment.js";
import {
    buildQuestionLookupMaps,
    buildQuestionnaireHierarchy,
    getCanonicalSectionName,
    groupItemsByCategory,
    resolveQuestionHierarchyEntry
} from "./section-hierarchy.js";

function createEmptySectionScore(sectionTitle) {

    return {
        id: sectionTitle,
        title: sectionTitle,
        raw: 0,
        max: 0,
        percentage: 0,
        level: getPerformanceLevel(0),
        comment: ""
    };

}

function resolveGrowthQuestionCategory(question, lookupMaps, fallbackSection) {

    const entry = resolveQuestionHierarchyEntry(question, lookupMaps);

    if (entry) {
        return entry.category;
    }

    return fallbackSection?.categories?.[0]?.categoryTitle || "General";

}

function groupGrowthQuestionsForSection(sectionNode, growthGroup, lookupMaps) {

    const questions = growthGroup?.questions || [];

    return groupItemsByCategory(
        sectionNode,
        questions,
        question => resolveGrowthQuestionCategory(question, lookupMaps, sectionNode)
    );

}

function filterRecommendationsForSection(recommendations, sectionTitle) {

    return (recommendations || []).filter(item => item.includes(sectionTitle));

}

function filterActionPlanForSection(actionPlan, sectionTitle) {

    return (actionPlan || []).filter(item => item.includes(sectionTitle));

}

function mapStrengthItems(strengths, sectionTitle) {

    return (strengths || []).filter(item => getCanonicalSectionName(item.title) === sectionTitle);

}

function mapWeaknessItems(weaknesses, sectionTitle) {

    return (weaknesses || []).filter(item => getCanonicalSectionName(item.title) === sectionTitle);

}

/**
 * Build the hierarchical presentation model for individual assessment reports.
 * Scoring values are passed through unchanged; this module only groups display content.
 */
export function buildReportSectionPresentation({
    questionnaire = [],
    reportSections = [],
    insights = {},
    strengths = [],
    weaknesses = [],
    recommendations = [],
    growthQuestionGroups = insights.growthQuestionGroups || []
} = {}) {

    const hierarchy = buildQuestionnaireHierarchy(questionnaire);
    const lookupMaps = buildQuestionLookupMaps(questionnaire);
    const sectionScoreMap = new Map(reportSections.map(section => [section.title, section]));
    const sectionInsightMap = new Map((insights.sections || []).map(section => [section.title, section]));
    const growthGroupMap = new Map(growthQuestionGroups.map(group => [group.sectionName, group]));

    const sections = hierarchy.sections.map(sectionNode => {
        const score = sectionScoreMap.get(sectionNode.sectionTitle)
            || createEmptySectionScore(sectionNode.sectionTitle);
        const interpretation = sectionInsightMap.get(sectionNode.sectionTitle)?.interpretation || "";
        const growthCategories = groupGrowthQuestionsForSection(
            sectionNode,
            growthGroupMap.get(sectionNode.sectionTitle),
            lookupMaps
        );
        const sectionStrengths = mapStrengthItems(strengths, sectionNode.sectionTitle);
        const sectionWeaknesses = mapWeaknessItems(weaknesses, sectionNode.sectionTitle);
        const sectionRecommendations = filterRecommendationsForSection(recommendations, sectionNode.sectionTitle);
        const sectionActionPlan = filterActionPlanForSection(insights.actionPlan || [], sectionNode.sectionTitle);

        return {
            ...score,
            interpretation,
            categories: sectionNode.categories.map(category => {
                const growthCategory = growthCategories.find(entry => entry.categoryTitle === category.categoryTitle);

                return {
                    categoryId: category.categoryId,
                    categoryTitle: category.categoryTitle,
                    questionCount: category.questions.length,
                    growthQuestions: growthCategory?.items || []
                };
            }),
            strengths: sectionStrengths,
            weaknesses: sectionWeaknesses,
            recommendations: sectionRecommendations,
            actionPlan: sectionActionPlan,
            isStrong: score.percentage >= 75,
            isGrowthArea: score.percentage < 60
        };
    });

    const strongSections = sections.filter(section => section.isStrong);
    const growthSections = [...sections]
        .filter(section => section.isGrowthArea)
        .sort((left, right) => left.percentage - right.percentage);

    return {
        sections,
        strongSections,
        growthSections,
        strongestSection: insights.strongestSection || null,
        growthSection: insights.growthSection || null,
        strongestSectionExplanation: insights.strongestSectionExplanation || "",
        growthSectionExplanation: insights.growthSectionExplanation || "",
        overallSummary: insights.overallSummary || "",
        actionPlan: insights.actionPlan || [],
        recommendations: recommendations || []
    };

}

export const ReportSectionPresentation = {
    buildReportSectionPresentation
};
