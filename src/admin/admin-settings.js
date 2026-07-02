import { renderPageIntro, renderSettingsGroup } from "./admin-components.js";

export function renderAdminSettingsPage(data) {

    const settings = data.settings || {};

    return `
        ${renderPageIntro(
            "Settings",
            "Read-only configuration preview for the future Admin module. Firebase integration is not active yet."
        )}

        <div class="admin-settings-grid">
            ${renderSettingsGroup("Application", [
                { label: "Title", value: settings.application?.title || "—" },
                { label: "Student Entry", value: settings.application?.studentEntry || "—" },
                { label: "Admin Entry", value: settings.application?.adminEntry || "—" },
                { label: "Environment", value: settings.application?.environment || "—" }
            ])}

            ${renderSettingsGroup("Firebase", [
                { label: "Status", value: settings.firebase?.status || "—" },
                { label: "Authentication", value: settings.firebase?.authentication || "—" },
                { label: "Firestore", value: settings.firebase?.firestore || "—" },
                { label: "Note", value: settings.firebase?.note || "—" }
            ])}

            ${renderSettingsGroup("Exports", [
                { label: "CSV", value: settings.exports?.csv || "—" },
                { label: "PDF", value: settings.exports?.pdf || "—" },
                { label: "Scheduled Reports", value: settings.exports?.scheduledReports || "—" }
            ])}

            ${renderSettingsGroup("Security", [
                { label: "Admin Access", value: settings.security?.adminAccess || "—" },
                { label: "Role Model", value: settings.security?.roleModel || "—" },
                { label: "Audit Log", value: settings.security?.auditLog || "—" }
            ])}

            ${renderSettingsGroup("Version", [
                { label: "Admin Module", value: settings.version?.adminModule || "—" },
                { label: "Student Application", value: settings.version?.studentApplication || "—" },
                { label: "Sample Data Schema", value: String(settings.version?.sampleDataSchema ?? "—") }
            ])}

            ${renderSettingsGroup("About", [
                { label: "Purpose", value: settings.about?.purpose || "—" },
                { label: "Privacy", value: settings.about?.privacy || "—" }
            ])}
        </div>`;

}

export const AdminSettingsPage = {
    renderAdminSettingsPage
};
