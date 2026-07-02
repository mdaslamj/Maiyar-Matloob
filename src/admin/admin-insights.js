import {
    renderDistributionBars,
    renderDistributionCards,
    renderPageIntro,
    renderRankedTeachingList,
    renderSectionCard,
    formatPercent
} from "./admin-components.js";

export function renderAdminInsightsPage(data) {

    const questions = data.questions || [];
    const sections = data.sections || [];

    const questionMarkup = questions.length
        ? questions.map(question => `
            <article class="ui-card ui-card--compact admin-question-card">
                <header class="ui-card__header">
                    <span class="ui-card__kicker">${question.section} · ${question.standardId || question.questionId}</span>
                    <h3 class="ui-card__title admin-question-card__title" dir="rtl" lang="ur">${question.questionText}</h3>
                </header>
                <div class="ui-card__body">
                    ${renderDistributionBars(question.distribution, { compact: true })}
                    <p class="admin-question-card__meta">Positive implementation: ${formatPercent(question.positiveRate)}</p>
                </div>
            </article>`).join("")
        : `<p class="ui-empty">No question implementation data available.</p>`;

    const sectionMarkup = sections.length
        ? sections.map(section => `
            <article class="ui-card ui-card--status admin-section-card">
                <header class="ui-card__header">
                    <h3 class="ui-card__title">${section.sectionTitle}</h3>
                    <span class="ui-card__kicker">${section.questionCount || 0} questions · ${formatPercent(section.positiveRate)} positive</span>
                </header>
                <div class="ui-card__body">
                    ${renderDistributionBars(section.distribution, { compact: true })}
                </div>
            </article>`).join("")
        : `<p class="ui-empty">No section implementation data available.</p>`;

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
                "Most Implemented Teachings",
                renderRankedTeachingList(data.mostImplementedTeachings, "No teaching data available."),
                { className: "admin-section--positive" }
            )}
            ${renderSectionCard(
                "Least Implemented Teachings",
                renderRankedTeachingList(data.leastImplementedTeachings, "No teaching data available."),
                { className: "admin-section--attention" }
            )}
        </div>

        ${renderSectionCard(
            "Question-wise Implementation",
            `<div class="admin-question-list">${questionMarkup}</div>`,
            { description: "Every question shows anonymous Always / Often / Sometimes / Rarely / Never percentages." }
        )}

        ${renderSectionCard(
            "Section-wise Implementation",
            `<div class="admin-section-list">${sectionMarkup}</div>`,
            { description: "Implementation percentages grouped by Maiyar-e-Matloob assessment sections." }
        )}`;

}

export const AdminInsightsPage = {
    renderAdminInsightsPage
};
