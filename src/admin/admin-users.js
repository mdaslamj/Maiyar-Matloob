import {
    formatDate,
    renderDataTable,
    renderPageIntro,
    renderSectionCard,
    renderStatusBadge,
    escapeHtml
} from "./admin-components.js";

function renderParticipantDirectoryTable(directory) {

    const participants = directory?.rows || [];

    return renderDataTable(
        [
            {
                label: "Participant ID",
                render: row => `<strong>${escapeHtml(row.displayId || "—")}</strong>`
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
                label: "Implementation Level",
                render: row => escapeHtml(row.currentLevel || "—")
            },
            {
                label: "Participation Status",
                render: row => renderStatusBadge(row.status)
            }
        ],
        participants
    );

}

function renderParticipantDirectoryBody(data) {

    const directory = data.participantDirectory || {
        status: "unavailable",
        rows: [],
        message: "Participant directory unavailable."
    };

    if (!data.useLiveParticipantDirectory) {
        return `
            <p class="ui-empty">${escapeHtml(directory.message || "Participant directory unavailable.")}</p>`;
    }

    if (directory.status === "loading") {
        return `<p class="ui-empty">${escapeHtml(directory.message || "Loading participant directory...")}</p>`;
    }

    if (directory.status === "unavailable" || directory.status === "error") {
        return `<p class="ui-empty">${escapeHtml(directory.message || "Unable to load participant directory.")}</p>`;
    }

    if (directory.status === "empty") {
        return `<p class="ui-empty">${escapeHtml(directory.message || "No participants yet.")}</p>`;
    }

    return renderParticipantDirectoryTable(directory);

}

export function renderAdminUsersPage(data) {

    const directory = data.participantDirectory || {};
    const participantCount = Array.isArray(directory.rows) ? directory.rows.length : 0;
    const description = data.useLiveParticipantDirectory
        ? "Anonymous participation activity from the configured backend storage provider."
        : "Live participant directory requires backend sync.";

    return `
        ${renderPageIntro(
            "Participants",
            description
        )}

        ${renderSectionCard(
            "Participant Directory",
            renderParticipantDirectoryBody(data),
            {
                description: data.useLiveParticipantDirectory
                    ? `${participantCount} anonymized participant record${participantCount === 1 ? "" : "s"}. Individual assessment answers and personal details are never shown.`
                    : "Participation activity overview. Individual assessment answers are never shown."
            }
        )}

        <section class="ui-card ui-card--compact admin-note-card">
            <div class="ui-card__body">
                <p class="ui-card__text">
                    This directory supports implementation monitoring — not user management or CRM.
                    It shows anonymized participation metadata and how consistently assessments are being completed.
                </p>
            </div>
        </section>`;

}

export const AdminUsersPage = {
    renderAdminUsersPage
};
