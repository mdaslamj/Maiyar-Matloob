import {
    renderDistributionBars,
    renderDistributionCards,
    renderPageIntro,
    renderRankedTeachingList,
    renderSectionCard,
    renderTrendCard,
    formatPercent
} from "./admin-components.js";

function renderAdminQuestionCard(question, distributionOptions) {

    return `
        <article class="ui-card ui-card--compact admin-question-card">
            <header class="ui-card__header">
                <span class="ui-card__kicker">${question.section} · ${question.category} · ${question.standardId || question.questionId}</span>
                <h3 class="ui-card__title admin-question-card__title" dir="rtl" lang="ur">${question.questionText}</h3>
            </header>
            <div class="ui-card__body">
                ${renderDistributionBars(question.distribution, distributionOptions)}
                <p class="admin-question-card__meta">Positive implementation: ${formatPercent(question.positiveRate)}</p>
            </div>
        </article>`;

}

function renderAdminCategoryCard(category, distributionOptions) {

    return `
        <article class="ui-card ui-card--compact admin-category-card">
            <header class="ui-card__header">
                <h4 class="ui-card__title admin-category-card__title" dir="rtl" lang="ur">${category.categoryTitle}</h4>
                <span class="ui-card__kicker">${category.questionCount || 0} questions · ${formatPercent(category.positiveRate)} positive</span>
            </header>
            <div class="ui-card__body">
                ${renderDistributionBars(category.distribution, distributionOptions)}
            </div>
        </article>`;

}

function renderAdminSectionHierarchyCard(section, distributionOptions) {

    const categoryMarkup = (section.categories || []).length
        ? `<div class="admin-category-list">${section.categories.map(category => renderAdminCategoryCard(category, distributionOptions)).join("")}</div>`
        : `<p class="ui-empty">No category data available for this section.</p>`;

    return `
        <article class="ui-card ui-card--status admin-section-card">
            <header class="ui-card__header">
                <h3 class="ui-card__title" dir="rtl" lang="ur">${section.sectionTitle}</h3>
                <span class="ui-card__kicker">${section.questionCount || 0} questions · ${formatPercent(section.positiveRate)} positive</span>
            </header>
            <div class="ui-card__body">
                ${renderDistributionBars(section.distribution, distributionOptions)}
                ${categoryMarkup}
            </div>
        </article>`;

}

function renderAdminQuestionHierarchy(sections, distributionOptions) {

    if (!sections.length) {
        return `<p class="ui-empty">No question implementation data available.</p>`;
    }

    return sections.map(section => `
        <section class="admin-hierarchy-group">
            <header class="admin-hierarchy-group__header">
                <h3 dir="rtl" lang="ur">${section.sectionTitle}</h3>
                <span>${section.questionCount || 0} questions · ${formatPercent(section.positiveRate)} positive</span>
            </header>
            ${(section.categories || []).map(category => `
                <div class="admin-hierarchy-subgroup">
                    <header class="admin-hierarchy-subgroup__header">
                        <h4 dir="rtl" lang="ur">${category.categoryTitle}</h4>
                        <span>${category.questionCount || 0} questions · ${formatPercent(category.positiveRate)} positive</span>
                    </header>
                    <div class="admin-question-list">
                        ${(category.questions || []).map(question => renderAdminQuestionCard(question, distributionOptions)).join("")}
                    </div>
                </div>`).join("")}
        </section>`).join("");

}

export function renderAdminInsightsPage(data) {

    const sections = data.sections || [];
    const distributionOptions = {
        buckets: data.implementationBuckets,
        compact: true
    };

    return `
        ${renderPageIntro(
            "Maiyaar-e-Matloob Insights",
            "Understand community implementation patterns. Anonymous totals only — no individual participants or answers."
        )}

        ${renderSectionCard(
            "Overall Implementation Distribution",
            renderDistributionCards(data.overallDistribution, { buckets: data.implementationBuckets }),
            { description: "Community-wide response pattern across all completed assessments." }
        )}

        <div class="admin-split-grid">
            ${renderSectionCard(
                "Most Implemented Categories",
                renderRankedTeachingList(
                    (data.mostImplementedTeachings || []).map(item => ({
                        ...item,
                        name: item.sectionTitle
                            ? `${item.categoryTitle || item.name} · ${item.sectionTitle}`
                            : item.name
                    })),
                    "No category data available."
                ),
                { className: "admin-section--positive" }
            )}
            ${renderSectionCard(
                "Least Implemented Categories",
                renderRankedTeachingList(
                    (data.leastImplementedTeachings || []).map(item => ({
                        ...item,
                        name: item.sectionTitle
                            ? `${item.categoryTitle || item.name} · ${item.sectionTitle}`
                            : item.name
                    })),
                    "No category data available."
                ),
                { className: "admin-section--attention" }
            )}
        </div>

        ${renderSectionCard(
            "Question-wise Implementation",
            `<div class="admin-hierarchy-list">${renderAdminQuestionHierarchy(sections, distributionOptions)}</div>`,
            { description: "Questions grouped by questionnaire section and category." }
        )}

        ${renderSectionCard(
            "Section-wise Implementation",
            `<div class="admin-section-list">${sections.length
                ? sections.map(section => renderAdminSectionHierarchyCard(section, distributionOptions)).join("")
                : `<p class="ui-empty">No section implementation data available.</p>`}</div>`,
            { description: "Implementation percentages grouped by questionnaire sections and nested categories." }
        )}`;

}

export const AdminInsightsPage = {
    renderAdminInsightsPage
};
