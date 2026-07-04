import {
    renderDistributionBars,
    renderDistributionCards,
    renderPageIntro,
    renderRankedTeachingList,
    renderSectionCard,
    renderTrendCard,
    formatPercent
} from "./admin-components.js";

function renderAdminQuestionCard(question) {

    return `
        <article class="ui-card ui-card--compact admin-question-card">
            <header class="ui-card__header">
                <span class="ui-card__kicker">${question.section} · ${question.category} · ${question.standardId || question.questionId}</span>
                <h3 class="ui-card__title admin-question-card__title" dir="rtl" lang="ur">${question.questionText}</h3>
            </header>
            <div class="ui-card__body">
                ${renderDistributionBars(question.distribution, { compact: true })}
                <p class="admin-question-card__meta">Positive implementation: ${formatPercent(question.positiveRate)}</p>
            </div>
        </article>`;

}

function renderAdminCategoryCard(category) {

    return `
        <article class="ui-card ui-card--compact admin-category-card">
            <header class="ui-card__header">
                <h4 class="ui-card__title admin-category-card__title" dir="rtl" lang="ur">${category.categoryTitle}</h4>
                <span class="ui-card__kicker">${category.questionCount || 0} questions · ${formatPercent(category.positiveRate)} positive</span>
            </header>
            <div class="ui-card__body">
                ${renderDistributionBars(category.distribution, { compact: true })}
            </div>
        </article>`;

}

function renderAdminSectionHierarchyCard(section) {

    const categoryMarkup = (section.categories || []).length
        ? `<div class="admin-category-list">${section.categories.map(renderAdminCategoryCard).join("")}</div>`
        : `<p class="ui-empty">No category data available for this section.</p>`;

    return `
        <article class="ui-card ui-card--status admin-section-card">
            <header class="ui-card__header">
                <h3 class="ui-card__title" dir="rtl" lang="ur">${section.sectionTitle}</h3>
                <span class="ui-card__kicker">${section.questionCount || 0} questions · ${formatPercent(section.positiveRate)} positive</span>
            </header>
            <div class="ui-card__body">
                ${renderDistributionBars(section.distribution, { compact: true })}
                ${categoryMarkup}
            </div>
        </article>`;

}

function renderAdminQuestionHierarchy(sections) {

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
                        ${(category.questions || []).map(renderAdminQuestionCard).join("")}
                    </div>
                </div>`).join("")}
        </section>`).join("");

}

export function renderAdminInsightsPage(data) {

    const sections = data.sections || [];

    return `
        ${renderPageIntro(
            "Maiyaar-e-Matloob Insights",
            "Understand community implementation patterns. Anonymous totals only — no individual participants or answers."
        )}

        ${renderSectionCard(
            "Overall Implementation Distribution",
            renderDistributionCards(data.overallDistribution),
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
            `<div class="admin-hierarchy-list">${renderAdminQuestionHierarchy(sections)}</div>`,
            { description: "Questions grouped by questionnaire section and category." }
        )}

        ${renderSectionCard(
            "Section-wise Implementation",
            `<div class="admin-section-list">${sections.length
                ? sections.map(renderAdminSectionHierarchyCard).join("")
                : `<p class="ui-empty">No section implementation data available.</p>`}</div>`,
            { description: "Implementation percentages grouped by questionnaire sections and nested categories." }
        )}`;

}

export const AdminInsightsPage = {
    renderAdminInsightsPage
};
