import { renderPageIntro, renderTrendCard } from "./admin-components.js";

export function renderAdminTrendsPage(data) {

    const trends = data.trends || [];

    const trendMarkup = trends.length
        ? trends.map(trend => renderTrendCard(trend)).join("")
        : `<p class="ui-empty">No implementation trends available yet.</p>`;

    return `
        ${renderPageIntro(
            "Implementation Trends",
            "Compare how community implementation is changing over time. Simple directional cards — no complex graphs."
        )}

        <section class="admin-trend-grid">
            ${trendMarkup}
        </section>

        <section class="ui-card ui-card--compact admin-note-card">
            <div class="ui-card__body">
                <p class="ui-card__text">
                    Trends compare recent assessment periods with earlier periods.
                    When Firestore is connected, these cards will be populated from aggregated community history.
                </p>
            </div>
        </section>`;

}

export const AdminTrendsPage = {
    renderAdminTrendsPage
};
