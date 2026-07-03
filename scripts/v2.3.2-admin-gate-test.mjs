/**
 * Version 2.3.2 — Admin Gate alignment verification.
 *
 * Usage: node scripts/v2.3.2-admin-gate-test.mjs
 */

import { FEATURE_FLAGS } from "../src/shared/feature-flags.js";
import { resetBackendAdaptersForTests } from "../src/backend/backend-adapter.js";
import {
    ADMIN_GATE_MODES,
    createDevelopmentAdminSession,
    renderAdminAuthNotConfigured,
    renderAdminDevelopmentModeBanner,
    renderAdminFirebaseRequired,
    resolveAdminGateMode
} from "../src/admin/admin-auth-gate.js";

function assert(condition, message) {

    if (!condition) {
        throw new Error(message);
    }

}

function withFlags(flags, callback) {

    const original = {
        USE_BACKEND_SYNC: FEATURE_FLAGS.USE_BACKEND_SYNC,
        USE_FIREBASE: FEATURE_FLAGS.USE_FIREBASE,
        BACKEND_PROVIDER: FEATURE_FLAGS.BACKEND_PROVIDER
    };

    Object.assign(FEATURE_FLAGS, flags);
    resetBackendAdaptersForTests();

    try {
        callback();
    }
    finally {
        Object.assign(FEATURE_FLAGS, original);
        resetBackendAdaptersForTests();
    }

}

function testDevelopmentMode() {

    withFlags({
        USE_BACKEND_SYNC: false,
        USE_FIREBASE: false,
        BACKEND_PROVIDER: "none"
    }, () => {
        assert(
            resolveAdminGateMode() === ADMIN_GATE_MODES.DEVELOPMENT,
            "USE_BACKEND_SYNC=false resolves to development mode"
        );
    });

    withFlags({
        USE_BACKEND_SYNC: true,
        USE_FIREBASE: false,
        BACKEND_PROVIDER: "none"
    }, () => {
        assert(
            resolveAdminGateMode() === ADMIN_GATE_MODES.DEVELOPMENT,
            "BACKEND_PROVIDER=none resolves to development mode"
        );
    });

    const session = createDevelopmentAdminSession();
    assert(session.authorized === true, "development session is authorized");
    assert(session.developmentMode === true, "development session flag set");

    const banner = renderAdminDevelopmentModeBanner();
    assert(
        banner.includes("Development Mode — Authentication Disabled"),
        "development banner text"
    );

    console.log("development mode: PASS");

}

function testSupabaseAndFutureProviders() {

    withFlags({
        USE_BACKEND_SYNC: true,
        USE_FIREBASE: false,
        BACKEND_PROVIDER: "supabase"
    }, () => {
        assert(
            resolveAdminGateMode() === ADMIN_GATE_MODES.AUTH_NOT_CONFIGURED,
            "supabase without storage config resolves to auth-not-configured"
        );
    });

    withFlags({
        USE_BACKEND_SYNC: true,
        USE_FIREBASE: false,
        BACKEND_PROVIDER: "rest"
    }, () => {
        assert(
            resolveAdminGateMode() === ADMIN_GATE_MODES.AUTH_NOT_CONFIGURED,
            "rest resolves to auth-not-configured"
        );
    });

    withFlags({
        USE_BACKEND_SYNC: true,
        USE_FIREBASE: false,
        BACKEND_PROVIDER: "self-hosted"
    }, () => {
        assert(
            resolveAdminGateMode() === ADMIN_GATE_MODES.AUTH_NOT_CONFIGURED,
            "self-hosted resolves to auth-not-configured"
        );
    });

    const markup = renderAdminAuthNotConfigured();
    assert(
        markup.includes("Authentication is not configured for the current backend provider."),
        "neutral auth-not-configured message"
    );
    assert(!markup.includes("Firebase"), "auth-not-configured does not mention Firebase");
    assert(!markup.includes("Google"), "auth-not-configured does not mention Google");

    console.log("supabase and future providers: PASS");

}

function testFirebaseProviderModes() {

    withFlags({
        USE_BACKEND_SYNC: true,
        USE_FIREBASE: false,
        BACKEND_PROVIDER: "firebase"
    }, () => {
        assert(
            resolveAdminGateMode() === ADMIN_GATE_MODES.FIREBASE_REQUIRED,
            "firebase without config resolves to firebase-required"
        );
    });

    withFlags({
        USE_BACKEND_SYNC: false,
        USE_FIREBASE: true,
        BACKEND_PROVIDER: "none"
    }, () => {
        assert(
            resolveAdminGateMode() === ADMIN_GATE_MODES.DEVELOPMENT,
            "legacy USE_FIREBASE with sync disabled still uses development mode"
        );
    });

    const backendRequired = renderAdminFirebaseRequired();
    assert(
        backendRequired.includes("Authentication is not configured for the current backend provider."),
        "backend-required screen uses provider-neutral message"
    );
    assert(!backendRequired.includes("Firebase"), "backend-required screen does not mention Firebase");

    console.log("firebase provider modes: PASS");

}

function main() {

    testDevelopmentMode();
    testSupabaseAndFutureProviders();
    testFirebaseProviderModes();
    console.log("Version 2.3.2 admin gate tests completed.");

}

main();
