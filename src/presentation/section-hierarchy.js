import {
    CANONICAL_REPORT_SECTIONS,
    getCanonicalSectionName
} from "../report/report.js";

export { getCanonicalSectionName };

function normalizeQuestionnaireQuestions(questionnaire = []) {

    if (Array.isArray(questionnaire)) {
        return questionnaire;
    }

    return questionnaire?.questions || [];

}

function createQuestionEntry(question, index) {

    const questionId = question.id || question.standardId || `Q${index + 1}`;

    return {
        questionId,
        standardId: question.standardId || question.id || questionId,
        questionText: question.question || "",
        section: question.section || question.category || "General",
        category: question.category || question.section || "General",
        index
    };

}

/**
 * Build the canonical section → category hierarchy from questionnaire content.
 * Section order follows CANONICAL_REPORT_SECTIONS; categories preserve first-seen order.
 */
export function buildQuestionnaireHierarchy(questionnaire = []) {

    const questions = normalizeQuestionnaireQuestions(questionnaire);
    const sectionMap = new Map();
    const sectionOrder = [];

    questions.forEach((question, index) => {
        const entry = createQuestionEntry(question, index);
        const canonicalSection = getCanonicalSectionName(entry.section);
        const categoryTitle = entry.category;

        if (!sectionMap.has(canonicalSection)) {
            sectionMap.set(canonicalSection, {
                sectionId: canonicalSection,
                sectionTitle: canonicalSection,
                categories: new Map(),
                categoryOrder: []
            });
            sectionOrder.push(canonicalSection);
        }

        const sectionNode = sectionMap.get(canonicalSection);

        if (!sectionNode.categories.has(categoryTitle)) {
            sectionNode.categories.set(categoryTitle, {
                categoryId: categoryTitle,
                categoryTitle,
                questions: []
            });
            sectionNode.categoryOrder.push(categoryTitle);
        }

        sectionNode.categories.get(categoryTitle).questions.push({
            questionId: entry.questionId,
            standardId: entry.standardId,
            questionText: entry.questionText,
            index: entry.index
        });
    });

    const orderedSectionNames = [
        ...CANONICAL_REPORT_SECTIONS.filter(sectionName => sectionMap.has(sectionName)),
        ...sectionOrder.filter(sectionName => (
            !CANONICAL_REPORT_SECTIONS.includes(sectionName) && sectionMap.has(sectionName)
        ))
    ];

    return {
        sections: orderedSectionNames.map(sectionName => {
            const sectionNode = sectionMap.get(sectionName);

            return {
                sectionId: sectionNode.sectionId,
                sectionTitle: sectionNode.sectionTitle,
                categories: sectionNode.categoryOrder.map(categoryName => sectionNode.categories.get(categoryName))
            };
        })
    };

}

export function buildQuestionLookupMaps(questionnaire = []) {

    const questions = normalizeQuestionnaireQuestions(questionnaire);
    const byQuestionId = new Map();
    const byStandardId = new Map();

    questions.forEach((question, index) => {
        const entry = createQuestionEntry(question, index);
        byQuestionId.set(String(entry.questionId), entry);
        byStandardId.set(String(entry.standardId), entry);
    });

    return {
        byQuestionId,
        byStandardId
    };

}

export function resolveQuestionHierarchyEntry(questionRef, lookupMaps) {

    const key = String(questionRef?.questionNumber || questionRef?.questionId || questionRef?.standardId || "");

    return lookupMaps.byQuestionId.get(key)
        || lookupMaps.byStandardId.get(key)
        || null;

}

export function groupItemsByCategory(sectionNode, items, resolveCategory) {

    const grouped = new Map();

    sectionNode.categories.forEach(category => {
        grouped.set(category.categoryTitle, []);
    });

    items.forEach(item => {
        const categoryTitle = resolveCategory(item) || sectionNode.categories[0]?.categoryTitle || "General";

        if (!grouped.has(categoryTitle)) {
            grouped.set(categoryTitle, []);
        }

        grouped.get(categoryTitle).push(item);
    });

    return sectionNode.categories.map(category => ({
        categoryId: category.categoryId,
        categoryTitle: category.categoryTitle,
        items: grouped.get(category.categoryTitle) || []
    }));

}
