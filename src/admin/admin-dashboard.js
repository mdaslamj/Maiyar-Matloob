import {
    formatDate,
    formatDateTime,
    formatLatestAssessmentMeta,
    formatPercent,
    renderMetricCard,
    renderPageIntro
} from "./admin-components.js";

function renderTotalParticipantsWidget(data) {

    const summary = data.summary || {};

    if (!data.useLiveTotalParticipants) {
        return renderMetricCard(
            "Total Participants",
            String(summary.totalParticipants ?? "—")
        );
    }

    const widget = data.liveWidgets?.totalParticipants || {
        status: "loading",
        message: "Loading..."
    };

    switch (widget.status) {
        case "loading":
            return renderMetricCard(
                "Total Participants",
                "Loading...",
                widget.message || "Loading..."
            );
        case "success":
            return renderMetricCard(
                "Total Participants",
                String(widget.value ?? 0),
                `Last updated: ${formatDateTime(widget.lastUpdated)}`
            );
        case "empty":
            return renderMetricCard(
                "Total Participants",
                "0",
                widget.message || "No participants yet."
            );
        case "permission-denied":
            return renderMetricCard(
                "Total Participants",
                "—",
                widget.message || "Permission denied."
            );
        case "unavailable":
            return renderMetricCard(
                "Total Participants",
                "—",
                widget.message || "Firestore unavailable."
            );
        default:
            return renderMetricCard(
                "Total Participants",
                "—",
                widget.message || "Unable to load participant count."
            );
    }

}

function renderCompletedAssessmentsWidget(data) {

    const summary = data.summary || {};

    if (!data.useLiveCompletedAssessments) {
        return renderMetricCard(
            "Completed Assessments",
            String(summary.completedAssessments ?? "—")
        );
    }

    const widget = data.liveWidgets?.completedAssessments || {
        status: "loading",
        message: "Loading..."
    };

    switch (widget.status) {
        case "loading":
            return renderMetricCard(
                "Completed Assessments",
                "Loading...",
                widget.message || "Loading..."
            );
        case "success":
            return renderMetricCard(
                "Completed Assessments",
                String(widget.value ?? 0),
                `Last updated: ${formatDateTime(widget.lastUpdated)}`
            );
        case "empty":
            return renderMetricCard(
                "Completed Assessments",
                "0",
                widget.message || "No assessments submitted yet."
            );
        case "permission-denied":
            return renderMetricCard(
                "Completed Assessments",
                "—",
                widget.message || "Permission denied."
            );
        case "unavailable":
            return renderMetricCard(
                "Completed Assessments",
                "—",
                widget.message || "Firestore unavailable."
            );
        default:
            return renderMetricCard(
                "Completed Assessments",
                "—",
                widget.message || "Unable to load assessment count."
            );
    }

}

function renderLatestAssessmentWidget(data) {

    const summary = data.summary || {};

    if (!data.useLiveLatestAssessment) {
        return renderMetricCard(
            "Latest Assessment",
            formatDate(summary.latestAssessmentDate)
        );
    }

    const widget = data.liveWidgets?.latestAssessment || {
        status: "loading",
        message: "Loading..."
    };

    switch (widget.status) {
        case "loading":
            return renderMetricCard(
                "Latest Assessment",
                "Loading...",
                widget.message || "Loading..."
            );
        case "success":
            return renderMetricCard(
                "Latest Assessment",
                formatDate(widget.value),
                formatLatestAssessmentMeta(widget.value)
            );
        case "empty":
            return renderMetricCard(
                "Latest Assessment",
                "—",
                widget.message || "No assessments submitted yet."
            );
        case "permission-denied":
            return renderMetricCard(
                "Latest Assessment",
                "—",
                widget.message || "Permission denied."
            );
        case "unavailable":
            return renderMetricCard(
                "Latest Assessment",
                "—",
                widget.message || "Firestore unavailable."
            );
        default:
            return renderMetricCard(
                "Latest Assessment",
                "—",
                widget.message || "Unable to load latest assessment."
            );
    }

}

function renderAverageImplementationWidget(data) {

    const summary = data.summary || {};

    if (!data.useLiveAverageImplementation) {
        return renderMetricCard(
            "Average Implementation",
            formatPercent(summary.averageImplementation)
        );
    }

    const widget = data.liveWidgets?.averageImplementation || {
        status: "loading",
        message: "Loading..."
    };

    switch (widget.status) {
        case "loading":
            return renderMetricCard(
                "Average Implementation",
                "Loading...",
                widget.message || "Loading..."
            );
        case "success":
            return renderMetricCard(
                "Average Implementation",
                formatPercent(widget.value),
                `Last updated: ${formatDateTime(widget.lastUpdated)}`
            );
        case "empty":
            return renderMetricCard(
                "Average Implementation",
                "—",
                widget.message || "No completed assessments yet."
            );
        case "permission-denied":
            return renderMetricCard(
                "Average Implementation",
                "—",
                widget.message || "Permission denied."
            );
        case "unavailable":
            return renderMetricCard(
                "Average Implementation",
                "—",
                widget.message || "Firestore unavailable."
            );
        default:
            return renderMetricCard(
                "Average Implementation",
                "—",
                widget.message || "Unable to load average implementation."
            );
    }

}

export function renderAdminDashboardPage(data) {

    const summary = data.summary || {};

    return `
        ${renderPageIntro(
            "Community Implementation Dashboard",
            "Overview of how well the community is implementing Maiyar-e-Matloob."
        )}

        <div class="admin-metric-grid">
            ${renderTotalParticipantsWidget(data)}
            ${renderMetricCard("Active Participants", String(summary.activeParticipants ?? "—"))}
            ${renderCompletedAssessmentsWidget(data)}
            ${renderAverageImplementationWidget(data)}
            ${renderLatestAssessmentWidget(data)}
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
                    ${data.useLiveTotalParticipants
        ? "Live widget values are loaded from the configured backend provider."
        : "All figures shown are anonymous aggregated sample data."}
                </p>
            </div>
        </section>`;

}

export const AdminDashboardPage = {
    renderAdminDashboardPage
};
