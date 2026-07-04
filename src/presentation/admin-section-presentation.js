import {
    buildQuestionnaireHierarchy,
    getCanonicalSectionName
} from "./section-hierarchy.js";
import {
    buildImplementationBuckets,
    createEmptyDistribution,
    RESPONSE_BUCKETS
} from "../trend/trend-community-config.js";

function resolveBuckets(questionnaire, implementationBuckets) {

    if (implementationBuckets?.length) {
        return implementationBuckets;
    }

    return buildImplementationBuckets(questionnaire?.responseScale);

}

function aggregateDistribution(distributions, buckets = RESPONSE_BUCKETS) {

    const totals = createEmptyDistribution(buckets);
    const count = distributions.length || 1;

    distributions.forEach(distribution => {
        buckets.forEach(bucket => {
            totals[bucket.key] += distribution[bucket.key] || 0;
        });
    });

    const aggregated = {};

    buckets.forEach(bucket => {
        aggregated[bucket.key] = Number((totals[bucket.key] / count).toFixed(1));
    });

    return aggregated;

}

function positiveRate(distribution) {

    return Number(((distribution.always || 0) + (distribution.often || 0)).toFixed(1));

}

function resolveQuestionSection(question) {

    return getCanonicalSectionName(question.section || question.category || "General");

}

function resolveQuestionCategory(question) {

    return question.category || question.section || "General";

}

/**
 * Build admin insights presentation grouped by questionnaire section → category hierarchy.
 */
export function buildAdminInsightsPresentation({
    questionnaire = [],
    questions = [],
    sections = [],
    mostImplementedTeachings = [],
    leastImplementedTeachings = [],
    trends = [],
    implementationBuckets = null
} = {}) {

    const buckets = resolveBuckets(questionnaire, implementationBuckets);
    const emptyDistribution = createEmptyDistribution(buckets);
    const hierarchy = buildQuestionnaireHierarchy(questionnaire);
    const questionMap = new Map(questions.map(question => [question.questionId, question]));
    const sectionAggregateMap = new Map(sections.map(section => [
        getCanonicalSectionName(section.sectionTitle || section.sectionId),
        section
    ]));

    const hierarchicalSections = hierarchy.sections.map(sectionNode => {
        const aggregate = sectionAggregateMap.get(sectionNode.sectionTitle);
        const categoryGroups = sectionNode.categories.map(category => {
            const categoryQuestions = category.questions
                .map(entry => questionMap.get(entry.questionId))
                .filter(Boolean);

            const distribution = categoryQuestions.length
                ? aggregateDistribution(categoryQuestions.map(question => question.distribution), buckets)
                : { ...emptyDistribution };

            return {
                categoryId: category.categoryId,
                categoryTitle: category.categoryTitle,
                questionCount: categoryQuestions.length,
                questions: categoryQuestions,
                distribution,
                positiveRate: positiveRate(distribution)
            };
        });

        const sectionQuestions = categoryGroups.flatMap(category => category.questions);
        const sectionDistribution = aggregate?.distribution
            || (sectionQuestions.length
                ? aggregateDistribution(sectionQuestions.map(question => question.distribution), buckets)
                : { ...emptyDistribution });

        return {
            sectionId: sectionNode.sectionId,
            sectionTitle: sectionNode.sectionTitle,
            questionCount: sectionQuestions.length || aggregate?.questionCount || 0,
            categories: categoryGroups,
            distribution: sectionDistribution,
            positiveRate: aggregate?.positiveRate ?? positiveRate(sectionDistribution)
        };
    });

    const categoryRankings = hierarchicalSections
        .flatMap(section => section.categories.map(category => ({
            id: `${section.sectionId}::${category.categoryId}`,
            sectionTitle: section.sectionTitle,
            categoryTitle: category.categoryTitle,
            name: category.categoryTitle,
            distribution: category.distribution,
            positiveRate: category.positiveRate
        })));

    const rankedMost = [...categoryRankings]
        .sort((left, right) => right.positiveRate - left.positiveRate)
        .slice(0, 10);
    const rankedLeast = [...categoryRankings]
        .sort((left, right) => left.positiveRate - right.positiveRate)
        .slice(0, 10);

    const hierarchicalTrends = buildAdminTrendPresentation({
        questionnaire,
        trends,
        hierarchicalSections
    });

    return {
        sections: hierarchicalSections,
        questions: hierarchicalSections.flatMap(section => section.categories.flatMap(category => (
            category.questions.map(question => ({
                ...question,
                section: section.sectionTitle,
                category: category.categoryTitle
            }))
        ))),
        mostImplementedTeachings: rankedMost.length ? rankedMost : mostImplementedTeachings,
        leastImplementedTeachings: rankedLeast.length ? rankedLeast : leastImplementedTeachings,
        trends: hierarchicalTrends,
        hierarchy
    };

}

function inferTrendDirection(positiveRate) {

    if (positiveRate >= 62) {
        return "up";
    }

    if (positiveRate < 52) {
        return "down";
    }

    return "stable";

}

function buildTrendSummary(sectionTitle, categoryTitle, direction, positiveRate) {

    if (direction === "up") {
        return `${categoryTitle} (${sectionTitle}) community implementation is strengthening at ${positiveRate}%.`;
    }

    if (direction === "down") {
        return `${categoryTitle} (${sectionTitle}) needs renewed attention at ${positiveRate}% positive implementation.`;
    }

    return `${categoryTitle} (${sectionTitle}) remains steady at ${positiveRate}% positive implementation.`;

}

/**
 * Build implementation trends grouped under questionnaire sections and categories.
 */
export function buildAdminTrendPresentation({
    questionnaire = [],
    trends = [],
    hierarchicalSections = null
} = {}) {

    const sections = hierarchicalSections
        || buildAdminInsightsPresentation({ questionnaire, questions: [], sections: [] }).sections;

    if (!sections.length) {
        return trends;
    }

    return sections.map(section => ({
        sectionId: section.sectionId,
        sectionTitle: section.sectionTitle,
        direction: inferTrendDirection(section.positiveRate),
        summary: `${section.sectionTitle} section is ${inferTrendDirection(section.positiveRate)} at ${section.positiveRate}% positive implementation.`,
        categories: section.categories.map(category => ({
            id: `${section.sectionId}::${category.categoryId}`,
            teachingName: category.categoryTitle,
            sectionTitle: section.sectionTitle,
            direction: inferTrendDirection(category.positiveRate),
            summary: buildTrendSummary(
                section.sectionTitle,
                category.categoryTitle,
                inferTrendDirection(category.positiveRate),
                category.positiveRate
            ),
            positiveRate: category.positiveRate
        }))
    }));

}

export function enrichAdminQuestionRecords(questionnaire, questionRecords = []) {

    const hierarchy = buildQuestionnaireHierarchy(questionnaire);
    const lookup = new Map();

    hierarchy.sections.forEach(section => {
        section.categories.forEach(category => {
            category.questions.forEach(question => {
                lookup.set(question.questionId, {
                    section: section.sectionTitle,
                    category: category.categoryTitle
                });
            });
        });
    });

    return questionRecords.map(question => ({
        ...question,
        section: lookup.get(question.questionId)?.section
            || getCanonicalSectionName(question.section),
        category: lookup.get(question.questionId)?.category
            || resolveQuestionCategory(question)
    }));

}

export const AdminSectionPresentation = {
    buildAdminInsightsPresentation,
    buildAdminTrendPresentation,
    enrichAdminQuestionRecords
};
