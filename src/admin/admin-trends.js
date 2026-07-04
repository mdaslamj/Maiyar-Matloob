import { renderPageIntro, renderTrendCard } from "./admin-components.js";

function renderAdminSectionTrendGroup(sectionTrend) {

    const categoryMarkup = (sectionTrend.categories || []).length
        ? `<div class="admin-trend-subgrid">${sectionTrend.categories.map(category => renderTrendCard({
            ...category,
            teachingName: `${category.teachingName} · ${sectionTrend.sectionTitle}`
        })).join("")}</div>`
        : `<p class="ui-empty">No category trends available for this section.</p>`;

    return `
        <section class="admin-hierarchy-group admin-hierarchy-group--trends">
            <header class="admin-hierarchy-group__header">
                <h3 dir="rtl" lang="ur">${sectionTrend.sectionTitle}</h3>
                <span>${sectionTrend.summary}</span>
            </header>
            ${categoryMarkup}
        </section>`;

}

export function renderAdminTrendsPage(data) {

    const trends = data.trends || [];

    const trendMarkup = trends.length
        ? trends.map(renderAdminSectionTrendGroup).join("")
        : `<p class="ui-empty">No implementation trends available yet.</p>`;

    return `
        ${renderPageIntro(
            "Implementation Trends",
            "Directional changes grouped by questionnaire sections and categories."
        )}

        <section class="admin-hierarchy-list admin-trend-hierarchy">
            ${trendMarkup}
        </section>

        <section class="ui-card ui-card--compact admin-note-card">
            <div class="ui-card__body">
                <p class="ui-card__text">
                    Trends compare recent assessment periods with earlier periods and follow the same
                    section/category hierarchy as the questionnaire and participant reports.
                </p>
            </div>
        </section>`;

}

export const AdminTrendsPage = {
    renderAdminTrendsPage
};
