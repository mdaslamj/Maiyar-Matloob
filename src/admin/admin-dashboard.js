import {
    formatDate,
    formatPercent,
    renderMetricCard,
    renderPageIntro
} from "./admin-components.js";

export function renderAdminDashboardPage(data) {

    const summary = data.summary || {};

    return `
        ${renderPageIntro(
            "Community Implementation Dashboard",
            "Overview of how well the community is implementing Maiyar-e-Matloob."
        )}

        <div class="admin-metric-grid">
            ${renderMetricCard("Total Participants", String(summary.totalParticipants ?? "—"))}
            ${renderMetricCard("Active Participants", String(summary.activeParticipants ?? "—"))}
            ${renderMetricCard("Completed Assessments", String(summary.completedAssessments ?? "—"))}
            ${renderMetricCard("Average Implementation", formatPercent(summary.averageImplementation))}
            ${renderMetricCard("Latest Assessment", formatDate(summary.latestAssessmentDate))}
            ${renderMetricCard(
                "Assessment Frequency",
                summary.averageAssessmentFrequencyDays != null
                    ? `${summary.averageAssessmentFrequencyDays} days`
                    : "—"
            )}
            ${renderMetricCard("Sections Improving", String(summary.sectionsImproving ?? "—"))}
            ${renderMetricCard("Sections Declining", String(summary.sectionsDeclining ?? "—"))}
        </div>

        <section class="ui-card ui-card--insight admin-note-card">
            <div class="ui-card__body">
                <p class="ui-card__text">
                    This dashboard monitors community implementation of Maiyar-e-Matloob teachings.
                    It focuses on participation and implementation — not CRM, user management, or website analytics.
                    All figures shown are anonymous aggregated sample data.
                </p>
            </div>
        </section>`;

}

export const AdminDashboardPage = {
    renderAdminDashboardPage
};
