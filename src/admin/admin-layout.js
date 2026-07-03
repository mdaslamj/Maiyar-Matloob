import { getRouteMeta, renderAdminMobileNavigation, renderAdminNavigation } from "./admin-navigation.js";
import { escapeHtml } from "./admin-components.js";

export function renderAdminLayout(options = {}) {

    const {
        activeRoute,
        pageTitle,
        pageDescription = "",
        contentHtml = "",
        adminEmail = ""
    } = options;
    const routeMeta = getRouteMeta(activeRoute);
    const title = pageTitle || routeMeta.label;

    return `
        <div class="admin-shell">
            <aside class="admin-sidebar" aria-label="Admin sidebar">
                ${renderAdminNavigation(activeRoute)}
            </aside>

            <div class="admin-main">
                <header class="admin-topbar">
                    <div class="admin-topbar__titles">
                        <span class="admin-topbar__kicker">Admin Module</span>
                        <h1 class="admin-topbar__title">${escapeHtml(title)}</h1>
                        ${pageDescription ? `<p class="admin-topbar__description">${escapeHtml(pageDescription)}</p>` : ""}
                    </div>
                    <div class="admin-topbar__meta">
                        <span class="admin-topbar__badge">Sample Data</span>
                        ${adminEmail ? `<span class="admin-topbar__account">${escapeHtml(adminEmail)}</span>` : ""}
                        <span class="admin-topbar__version">v2.0.0</span>
                    </div>
                </header>

                ${renderAdminMobileNavigation(activeRoute)}

                <main id="adminPageContent" class="admin-content" tabindex="-1">
                    ${contentHtml}
                </main>
            </div>
        </div>`;

}

export function mountAdminLayout(root, options = {}) {

    root.innerHTML = renderAdminLayout(options);

    return root.querySelector("#adminPageContent");

}

export function updateAdminPageContent(contentRoot, contentHtml) {

    contentRoot.innerHTML = contentHtml;
    contentRoot.focus();

}
