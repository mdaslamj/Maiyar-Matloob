import {
    formatDate,
    renderDataTable,
    renderPageIntro,
    renderSectionCard,
    renderStatusBadge,
    escapeHtml
} from "./admin-components.js";

export function renderAdminUsersPage(data) {

    const participants = data.users || [];

    const table = renderDataTable(
        [
            {
                label: "Participant",
                render: row => `<strong>${escapeHtml(row.name)}</strong>`
            },
            {
                label: "Assessments",
                render: row => escapeHtml(String(row.assessments ?? 0))
            },
            {
                label: "Last Assessment",
                render: row => escapeHtml(formatDate(row.lastAssessment))
            },
            {
                label: "Current Level",
                render: row => escapeHtml(row.currentLevel || "—")
            },
            {
                label: "Participation Status",
                render: row => renderStatusBadge(row.status)
            }
        ],
        participants
    );

    return `
        ${renderPageIntro(
            "Participants",
            "Community participation in Maiyar-e-Matloob. Sample records only — participant access will require future authentication."
        )}

        ${renderSectionCard(
            "Participant Directory",
            table,
            { description: "Participation activity overview. Individual assessment answers are never shown." }
        )}

        <section class="ui-card ui-card--compact admin-note-card">
            <div class="ui-card__body">
                <p class="ui-card__text">
                    This directory supports implementation monitoring — not user management or CRM.
                    It shows who is participating and how consistently assessments are being completed.
                </p>
            </div>
        </section>`;

}

export const AdminUsersPage = {
    renderAdminUsersPage
};
