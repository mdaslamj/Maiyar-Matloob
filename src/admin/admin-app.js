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
    createDevelopmentAdminSession,
    createStorageVerificationAdminSession,
    getAuthorizedAdminSession,
    initializeAdminFirebase,
    observeAdminAuthState,
    renderAdminAccessDenied,
    renderAdminAuthGate,
    renderAdminAuthNotConfigured,
    renderAdminFirebaseRequired,
    resolveAdminGateMode,
    ADMIN_GATE_MODES
} from "./admin-auth-gate.js";
import {
    createLoadingAverageImplementationWidget,
    createLoadingCompletedAssessmentsWidget,
    createLoadingLatestAssessmentWidget,
    createLoadingTotalParticipantsWidget,
    isAdminLiveDataEnabled,
    loadDashboardLiveWidgets
} from "./admin-dashboard-data.js";
import {
    createLoadingParticipantDirectory,
    loadParticipantDirectoryData
} from "./admin-users-data.js";

export const ADMIN_MODULE_VERSION = "2.1.0";

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

    if (route === ADMIN_ROUTES.users) {
        refreshParticipantDirectory().catch(error => {
            console.warn("Admin participant directory refresh failed.", error);
        });
    }

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
        adminEmail: adminSession.user?.email || "",
        developmentMode: Boolean(adminSession.developmentMode),
        storageVerificationMode: Boolean(adminSession.storageVerificationMode),
        liveDataEnabled: Boolean(adminData?.useLiveTotalParticipants)
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

async function loadAdminDataBundle() {

    const sampleData = await loadAdminSampleData();

    if (!isAdminLiveDataEnabled()) {
        return {
            ...sampleData,
            useLiveTotalParticipants: false,
            useLiveCompletedAssessments: false,
            useLiveLatestAssessment: false,
            useLiveAverageImplementation: false,
            useLiveParticipantDirectory: false,
            liveWidgets: {},
            participantDirectory: {
                status: "unavailable",
                rows: [],
                lastUpdated: null,
                message: "Live participant directory requires backend sync."
            }
        };
    }

    return {
        ...sampleData,
        useLiveTotalParticipants: true,
        useLiveCompletedAssessments: true,
        useLiveLatestAssessment: true,
        useLiveAverageImplementation: true,
        useLiveParticipantDirectory: true,
        liveWidgets: {
            totalParticipants: createLoadingTotalParticipantsWidget(),
            completedAssessments: createLoadingCompletedAssessmentsWidget(),
            latestAssessment: createLoadingLatestAssessmentWidget(),
            averageImplementation: createLoadingAverageImplementationWidget()
        },
        participantDirectory: createLoadingParticipantDirectory()
    };

}

async function refreshParticipantDirectory() {

    if (!isAdminLiveDataEnabled() || !adminData) {
        return;
    }

    const participantDirectory = await loadParticipantDirectoryData();

    adminData = {
        ...adminData,
        participantDirectory
    };

    if (activeRoute === ADMIN_ROUTES.users) {
        renderActivePage();
    }

}

async function refreshDashboardLiveWidgets() {

    if (!isAdminLiveDataEnabled() || !adminData) {
        return;
    }

    const liveData = await loadDashboardLiveWidgets();

    adminData = {
        ...adminData,
        ...liveData
    };

    if (activeRoute === ADMIN_ROUTES.dashboard) {
        renderActivePage();
    }

}

async function bootstrapAuthorizedAdmin() {

    adminSession = await getAuthorizedAdminSession();

    if (!adminSession.authorized) {
        renderUnauthorizedState(renderAdminAuthGate());
        return;
    }

    if (!adminData) {
        adminData = await loadAdminDataBundle();
    }

    activeRoute = getRouteFromLocation();

    if (!window.location.hash) {
        window.history.replaceState({ adminRoute: activeRoute }, "", `#/${activeRoute}`);
    }

    renderActivePage();
    refreshDashboardLiveWidgets().catch(error => {
        console.warn("Admin live widget refresh failed.", error);
    });
    refreshParticipantDirectory().catch(error => {
        console.warn("Admin participant directory refresh failed.", error);
    });

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

    if (activeRoute === ADMIN_ROUTES.users) {
        refreshParticipantDirectory().catch(error => {
            console.warn("Admin participant directory refresh failed.", error);
        });
    }

}

async function bootstrapStorageVerificationAdmin() {

    adminSession = createStorageVerificationAdminSession();

    if (!adminData) {
        adminData = await loadAdminDataBundle();
    }

    activeRoute = getRouteFromLocation();

    if (!window.location.hash) {
        window.history.replaceState({ adminRoute: activeRoute }, "", `#/${activeRoute}`);
    }

    renderActivePage();
    refreshDashboardLiveWidgets().catch(error => {
        console.warn("Admin live widget refresh failed.", error);
    });
    refreshParticipantDirectory().catch(error => {
        console.warn("Admin participant directory refresh failed.", error);
    });

    if (!popStateBound) {
        window.addEventListener("popstate", handlePopState);
        popStateBound = true;
    }

}

export async function initializeAdminApp() {

    shellRoot = document.getElementById("adminRoot");

    if (!shellRoot) {
        return;
    }

    document.body.classList.add("admin-app");

    await initializeAdminFirebase();

    const gateMode = resolveAdminGateMode();

    if (gateMode === ADMIN_GATE_MODES.FIREBASE_REQUIRED) {
        renderUnauthorizedState(renderAdminFirebaseRequired());
        return;
    }

    if (gateMode === ADMIN_GATE_MODES.AUTH_NOT_CONFIGURED) {
        renderUnauthorizedState(renderAdminAuthNotConfigured());
        return;
    }

    if (gateMode === ADMIN_GATE_MODES.DEVELOPMENT) {
        adminSession = createDevelopmentAdminSession();

        if (!adminData) {
            adminData = await loadAdminDataBundle();
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

        return;
    }

    if (gateMode === ADMIN_GATE_MODES.STORAGE_VERIFICATION) {
        await bootstrapStorageVerificationAdmin();
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
