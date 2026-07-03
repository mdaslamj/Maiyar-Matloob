import { loadAdminSampleData } from "./admin-sample-data.js";
import { renderAdminLayout } from "./admin-layout.js";
import { ADMIN_ROUTES, bindAdminNavigation, getRouteMeta } from "./admin-navigation.js";
import { renderAdminDashboardPage } from "./admin-dashboard.js";
import { renderAdminInsightsPage } from "./admin-insights.js";
import { renderAdminTrendsPage } from "./admin-trends.js";
import { renderAdminUsersPage } from "./admin-users.js";
import { renderAdminSettingsPage } from "./admin-settings.js";
import {
    attemptAdminGoogleSignIn,
    bindAdminAuthGate,
    getAuthorizedAdminSession,
    initializeAdminFirebase,
    isAdminFirebaseReady,
    observeAdminAuthState,
    renderAdminAccessDenied,
    renderAdminAuthGate,
    renderAdminFirebaseRequired
} from "./admin-auth-gate.js";

export const ADMIN_MODULE_VERSION = "2.0.0";

const PAGE_RENDERERS = {
    [ADMIN_ROUTES.dashboard]: renderAdminDashboardPage,
    [ADMIN_ROUTES.insights]: renderAdminInsightsPage,
    [ADMIN_ROUTES.trends]: renderAdminTrendsPage,
    [ADMIN_ROUTES.users]: renderAdminUsersPage,
    [ADMIN_ROUTES.settings]: renderAdminSettingsPage
};

const PAGE_DESCRIPTIONS = {
    [ADMIN_ROUTES.dashboard]: "Community implementation summary for Maiyar-e-Matloob.",
    [ADMIN_ROUTES.insights]: "Anonymous community implementation insights.",
    [ADMIN_ROUTES.trends]: "Directional implementation changes over time.",
    [ADMIN_ROUTES.users]: "Participant directory and participation activity.",
    [ADMIN_ROUTES.settings]: "Future-ready admin configuration preview."
};

let adminData = null;
let activeRoute = ADMIN_ROUTES.dashboard;
let contentRoot = null;
let shellRoot = null;
let adminSession = null;
let authUnsubscribe = null;
let popStateBound = false;

function getRouteFromLocation() {

    const hash = window.location.hash.replace(/^#\/?/, "").trim();

    if (hash && PAGE_RENDERERS[hash]) {
        return hash;
    }

    return ADMIN_ROUTES.dashboard;

}

function setRoute(route, options = {}) {

    if (!PAGE_RENDERERS[route]) {
        return;
    }

    activeRoute = route;

    if (!options.replace) {
        window.history.pushState({ adminRoute: route }, "", `#/${route}`);
    }
    else {
        window.history.replaceState({ adminRoute: route }, "", `#/${route}`);
    }

    renderActivePage();

}

function renderActivePage() {

    if (!shellRoot || !adminData || !adminSession?.authorized) {
        return;
    }

    const routeMeta = getRouteMeta(activeRoute);
    const renderer = PAGE_RENDERERS[activeRoute];
    const pageHtml = renderer(adminData);

    shellRoot.innerHTML = renderAdminLayout({
        activeRoute,
        pageTitle: routeMeta.label,
        pageDescription: PAGE_DESCRIPTIONS[activeRoute],
        contentHtml: pageHtml,
        adminEmail: adminSession.user?.email || ""
    });

    contentRoot = shellRoot.querySelector("#adminPageContent");
    bindAdminNavigation(shellRoot, route => setRoute(route));
    contentRoot?.focus();

    document.title = `${routeMeta.label} | Maiyar-e-Matloob Admin`;

    const announcer = document.getElementById("adminAnnouncer");

    if (announcer) {
        announcer.textContent = `${routeMeta.label} page loaded.`;
    }

}

function renderUnauthorizedState(markup) {

    if (!shellRoot) {
        return;
    }

    shellRoot.innerHTML = markup;
    bindAdminAuthGate(shellRoot, {
        onSignIn: handleAdminSignIn
    });

}

async function handleAdminSignIn() {

    const result = await attemptAdminGoogleSignIn();

    if (!result.success) {
        if (result.reason === "admin-not-authorized") {
            renderUnauthorizedState(renderAdminAccessDenied(result.email));
            return;
        }

        renderUnauthorizedState(renderAdminAuthGate({
            errorMessage: result.error || "Google sign-in failed. Please try again."
        }));
    }

}

async function bootstrapAuthorizedAdmin() {

    adminSession = await getAuthorizedAdminSession();

    if (!adminSession.authorized) {
        renderUnauthorizedState(renderAdminAuthGate());
        return;
    }

    if (!adminData) {
        adminData = await loadAdminSampleData();
    }

    activeRoute = getRouteFromLocation();

    if (!window.location.hash) {
        window.history.replaceState({ adminRoute: activeRoute }, "", `#/${activeRoute}`);
    }

    renderActivePage();

    if (!popStateBound) {
        window.addEventListener("popstate", handlePopState);
        popStateBound = true;
    }

}

function handlePopState() {

    if (!adminSession?.authorized) {
        return;
    }

    activeRoute = getRouteFromLocation();
    renderActivePage();

}

export async function initializeAdminApp() {

    shellRoot = document.getElementById("adminRoot");

    if (!shellRoot) {
        return;
    }

    document.body.classList.add("admin-app");

    await initializeAdminFirebase();

    if (!isAdminFirebaseReady()) {
        renderUnauthorizedState(renderAdminFirebaseRequired());
        return;
    }

    authUnsubscribe = observeAdminAuthState(async () => {
        await bootstrapAuthorizedAdmin();
    });

    await bootstrapAuthorizedAdmin();

}

document.addEventListener("DOMContentLoaded", initializeAdminApp);

export const AdminApp = {
    ADMIN_MODULE_VERSION,
    initializeAdminApp,
    setRoute
};
