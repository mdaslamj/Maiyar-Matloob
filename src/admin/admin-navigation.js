export const ADMIN_ROUTES = {
    dashboard: "dashboard",
    insights: "insights",
    trends: "trends",
    users: "users",
    settings: "settings"
};

export const ADMIN_NAV_ITEMS = [
    {
        route: ADMIN_ROUTES.dashboard,
        label: "Dashboard",
        icon: "◫"
    },
    {
        route: ADMIN_ROUTES.insights,
        label: "Maiyaar-e-Matloob Insights",
        icon: "✦"
    },
    {
        route: ADMIN_ROUTES.trends,
        label: "Implementation Trends",
        icon: "↗"
    },
    {
        route: ADMIN_ROUTES.users,
        label: "Participants",
        icon: "👥"
    },
    {
        route: ADMIN_ROUTES.settings,
        label: "Settings",
        icon: "⚙"
    }
];

export function getRouteMeta(route) {

    return ADMIN_NAV_ITEMS.find(item => item.route === route) || ADMIN_NAV_ITEMS[0];

}

export function renderAdminNavigation(activeRoute, options = {}) {

    const statusNote = options.statusNote || "Authentication not configured";

    return `
        <nav class="admin-nav" aria-label="Implementation monitoring navigation">
            <div class="admin-nav__brand">
                <span class="admin-nav__icon" aria-hidden="true">✦</span>
                <div>
                    <strong class="admin-nav__title">Maiyar-e-Matloob</strong>
                    <span class="admin-nav__subtitle">Implementation Monitoring</span>
                </div>
            </div>
            <ul class="admin-nav__list" role="list">
                ${ADMIN_NAV_ITEMS.map(item => {
                    const isActive = item.route === activeRoute;

                    return `
                        <li class="admin-nav__item" role="listitem">
                            <button type="button"
                                class="admin-nav__link${isActive ? " is-active" : ""}"
                                data-admin-route="${item.route}"
                                aria-current="${isActive ? "page" : "false"}">
                                <span class="admin-nav__link-icon" aria-hidden="true">${item.icon}</span>
                                <span class="admin-nav__link-label">${item.label}</span>
                            </button>
                        </li>`;
                }).join("")}
            </ul>
            <div class="admin-nav__footer">
                <p class="admin-nav__note">Sample data mode</p>
                <p class="admin-nav__note">${statusNote}</p>
            </div>
        </nav>`;

}

export function renderAdminMobileNavigation(activeRoute) {

    return `
        <div class="admin-mobile-nav" role="navigation" aria-label="Implementation monitoring mobile navigation">
            ${ADMIN_NAV_ITEMS.map(item => {
                const isActive = item.route === activeRoute;

                return `
                    <button type="button"
                        class="admin-mobile-nav__link${isActive ? " is-active" : ""}"
                        data-admin-route="${item.route}"
                        aria-current="${isActive ? "page" : "false"}">
                        <span aria-hidden="true">${item.icon}</span>
                        <span>${item.label}</span>
                    </button>`;
            }).join("")}
        </div>`;

}

export function bindAdminNavigation(root, onNavigate) {

    root.querySelectorAll("[data-admin-route]").forEach(element => {
        element.addEventListener("click", () => {
            const route = element.getAttribute("data-admin-route");

            if (route) {
                onNavigate(route);
            }
        });
    });

}
