import {
    getBackendProviderName,
    initializeBackendInfrastructure,
    isBackendInfrastructureReady,
    requireAdminSession,
    signInAdminWithGoogle,
    signOutAdminSession,
    watchAdminSession
} from "../backend/backend-service.js";
import { FEATURE_FLAGS } from "../shared/feature-flags.js";

export const ADMIN_GATE_MODES = Object.freeze({
    DEVELOPMENT: "development",
    STORAGE_VERIFICATION: "storage-verification",
    FIREBASE_REQUIRED: "firebase-required",
    FIREBASE_AUTH: "firebase-auth",
    AUTH_NOT_CONFIGURED: "auth-not-configured"
});

export function resolveAdminGateMode() {

    if (FEATURE_FLAGS.USE_BACKEND_SYNC === false || getBackendProviderName() === "none") {
        return ADMIN_GATE_MODES.DEVELOPMENT;
    }

    const provider = getBackendProviderName();

    if (provider === "firebase") {
        return isBackendInfrastructureReady()
            ? ADMIN_GATE_MODES.FIREBASE_AUTH
            : ADMIN_GATE_MODES.FIREBASE_REQUIRED;
    }

    if (provider === "supabase" && isBackendInfrastructureReady()) {
        return ADMIN_GATE_MODES.STORAGE_VERIFICATION;
    }

    return ADMIN_GATE_MODES.AUTH_NOT_CONFIGURED;

}

export function createDevelopmentAdminSession() {

    return {
        authorized: true,
        user: null,
        developmentMode: true
    };

}

export function createStorageVerificationAdminSession() {

    return {
        authorized: true,
        user: null,
        storageVerificationMode: true
    };

}

export function renderAdminStorageVerificationBanner() {

    return `
        <div class="admin-dev-banner" role="status">
            Storage Verification Mode — Authentication Disabled
        </div>`;

}

export function getAdminNavigationStatusNote(options = {}) {

    const { developmentMode = false, storageVerificationMode = false, liveDataEnabled = false } = options;

    if (developmentMode) {
        return "Development mode";
    }

    if (storageVerificationMode) {
        return liveDataEnabled ? "Live data" : "Storage verification";
    }

    if (resolveAdminGateMode() === ADMIN_GATE_MODES.FIREBASE_AUTH) {
        return "Authentication enabled";
    }

    return "Authentication not configured";

}

export function renderAdminFirebaseRequired() {

    return `
        <div class="admin-auth-gate">
            <div class="admin-auth-gate__card ui-card">
                <h1 class="admin-auth-gate__title">Maiyar-e-Matloob Admin</h1>
                <p class="ui-card__text">
                    Authentication is not configured for the current backend provider.
                </p>
                <p class="admin-auth-gate__dev-note ui-card__text">
                    Developer setup: copy <code>src/backend/config/backend-config.local.example.js</code>
                    to <code>src/backend/config/backend-config.local.js</code>, set
                    <code>USE_BACKEND_SYNC</code> and <code>BACKEND_PROVIDER</code>, and deploy storage
                    security rules.
                </p>
            </div>
        </div>`;

}

export function renderAdminAuthNotConfigured() {

    return `
        <div class="admin-auth-gate">
            <div class="admin-auth-gate__card ui-card">
                <h1 class="admin-auth-gate__title">Maiyar-e-Matloob Admin</h1>
                <p class="ui-card__text">
                    Authentication is not configured for the current backend provider.
                </p>
            </div>
        </div>`;

}

export function renderAdminDevelopmentModeBanner() {

    return `
        <div class="admin-dev-banner" role="status">
            Development Mode — Authentication Disabled
        </div>`;

}

export function renderAdminAuthGate({ errorMessage = "" } = {}) {

    return `
        <div class="admin-auth-gate">
            <div class="admin-auth-gate__card ui-card">
                <h1 class="admin-auth-gate__title">Maiyar-e-Matloob Admin</h1>
                <p class="ui-card__text">
                    Sign in with an authorized Google account to access the implementation monitoring dashboard.
                </p>
                ${errorMessage
        ? `<p class="admin-auth-gate__error" role="alert">${errorMessage}</p>`
        : ""}
                <button type="button" id="adminGoogleSignInBtn" class="primary-btn admin-auth-gate__button">
                    Sign in with Google
                </button>
            </div>
        </div>`;

}

export function renderAdminAccessDenied(email) {

    const suffix = email ? ` (${email})` : "";

    return renderAdminAuthGate({
        errorMessage: `This Google account is not authorized for admin access${suffix}.`
    });

}

export async function initializeAdminFirebase() {

    return initializeBackendInfrastructure();

}

export function bindAdminAuthGate(root, handlers = {}) {

    root.querySelector("#adminGoogleSignInBtn")
        ?.addEventListener("click", handlers.onSignIn || (() => {}));

}

export async function attemptAdminGoogleSignIn() {

    return signInAdminWithGoogle();

}

export async function getAuthorizedAdminSession() {

    return requireAdminSession();

}

export function observeAdminAuthState(callback) {

    return watchAdminSession(callback);

}

export async function signOutAdmin() {

    return signOutAdminSession();

}

export function isAdminFirebaseReady() {

    return isBackendInfrastructureReady();

}

export const AdminAuthGate = {
    ADMIN_GATE_MODES,
    resolveAdminGateMode,
    createDevelopmentAdminSession,
    createStorageVerificationAdminSession,
    getAdminNavigationStatusNote,
    renderAdminFirebaseRequired,
    renderAdminAuthNotConfigured,
    renderAdminDevelopmentModeBanner,
    renderAdminStorageVerificationBanner,
    renderAdminAuthGate,
    renderAdminAccessDenied,
    initializeAdminFirebase,
    bindAdminAuthGate,
    attemptAdminGoogleSignIn,
    getAuthorizedAdminSession,
    observeAdminAuthState,
    signOutAdmin,
    isAdminFirebaseReady
};
