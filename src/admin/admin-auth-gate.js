import { initializeFirebaseInfrastructure, isFirebaseReady } from "../firebase/firebase-service.js";
import {
    requireAdminAuthState,
    signInAdminWithGoogle,
    signOutCurrentUser,
    watchAuthState
} from "../firebase/firebase-auth-service.js";

export function renderAdminFirebaseRequired() {

    return `
        <div class="admin-auth-gate">
            <div class="admin-auth-gate__card ui-card">
                <h1 class="admin-auth-gate__title">Admin Access Requires Firebase</h1>
                <p class="ui-card__text">
                    Configure Firebase for this project before using the Admin module.
                    Copy <code>src/firebase/firebase-config.local.example.js</code>
                    to <code>src/firebase/firebase-config.local.js</code>, enable
                    <code>USE_FIREBASE</code>, and deploy Firestore security rules.
                </p>
            </div>
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

    return initializeFirebaseInfrastructure();

}

export function bindAdminAuthGate(root, handlers = {}) {

    root.querySelector("#adminGoogleSignInBtn")
        ?.addEventListener("click", handlers.onSignIn || (() => {}));

}

export async function attemptAdminGoogleSignIn() {

    return signInAdminWithGoogle();

}

export async function getAuthorizedAdminSession() {

    return requireAdminAuthState();

}

export function observeAdminAuthState(callback) {

    return watchAuthState(callback);

}

export async function signOutAdmin() {

    return signOutCurrentUser();

}

export function isAdminFirebaseReady() {

    return isFirebaseReady();

}

export const AdminAuthGate = {
    renderAdminFirebaseRequired,
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
