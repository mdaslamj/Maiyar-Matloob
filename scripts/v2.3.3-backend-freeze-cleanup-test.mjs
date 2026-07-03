/**
 * Version 2.3.3 — Backend freeze cleanup verification.
 *
 * Usage: node scripts/v2.3.3-backend-freeze-cleanup-test.mjs
 */

import { readFileSync } from "node:fs";
import { FEATURE_FLAGS } from "../src/shared/feature-flags.js";
import { resetBackendAdaptersForTests } from "../src/backend/backend-adapter.js";
import {
    getAdminNavigationStatusNote,
    renderAdminAuthNotConfigured,
    renderAdminFirebaseRequired
} from "../src/admin/admin-auth-gate.js";
import { renderAdminNavigation } from "../src/admin/admin-navigation.js";
import { renderAdminSettingsPage } from "../src/admin/admin-settings.js";
import { loadAdminSampleData } from "../src/admin/admin-sample-data.js";

const ADMIN_UI_FILES = [
    "src/admin/admin-auth-gate.js",
    "src/admin/admin-navigation.js",
    "src/admin/admin-settings.js",
    "src/admin/admin-sample-data.js",
    "src/admin/admin-layout.js",
    "src/admin/admin-app.js"
];

const BANNED_USER_FACING = [
    "Firebase auth pending",
    "Admin Access Requires Firebase",
    "Configure Firebase",
    "Firebase required",
    "Enable Firebase",
    "Firebase integration"
];

function assert(condition, message) {

    if (!condition) {
        throw new Error(message);
    }

}

function testAdminUiHasNoFirebaseBranding() {

    for (const file of ADMIN_UI_FILES) {
        const source = readFileSync(file, "utf8");

        for (const phrase of BANNED_USER_FACING) {
            assert(
                !source.includes(phrase),
                `${file} still contains banned user-facing phrase: ${phrase}`
            );
        }
    }

    console.log("admin UI firebase branding scan: PASS");

}

function testSidebarStatusNotes() {

    const original = {
        USE_BACKEND_SYNC: FEATURE_FLAGS.USE_BACKEND_SYNC,
        USE_FIREBASE: FEATURE_FLAGS.USE_FIREBASE,
        BACKEND_PROVIDER: FEATURE_FLAGS.BACKEND_PROVIDER
    };

    FEATURE_FLAGS.USE_BACKEND_SYNC = false;
    FEATURE_FLAGS.USE_FIREBASE = false;
    FEATURE_FLAGS.BACKEND_PROVIDER = "none";
    resetBackendAdaptersForTests();

    assert(
        getAdminNavigationStatusNote({ developmentMode: true }) === "Development mode",
        "development sidebar note"
    );

    const nav = renderAdminNavigation("dashboard", { statusNote: "Development mode" });
    assert(!nav.includes("Firebase"), "navigation markup has no Firebase branding");
    assert(nav.includes("Development mode"), "navigation shows development note");

    Object.assign(FEATURE_FLAGS, original);
    resetBackendAdaptersForTests();

    console.log("sidebar status notes: PASS");

}

function testProviderNeutralGateMessages() {

    const authNotConfigured = renderAdminAuthNotConfigured();
    const backendRequired = renderAdminFirebaseRequired();

    for (const markup of [authNotConfigured, backendRequired]) {
        assert(!markup.includes("Firebase"), "gate message has no Firebase branding");
        assert(
            markup.includes("Authentication is not configured for the current backend provider."),
            "gate message uses provider-neutral copy"
        );
    }

    assert(
        backendRequired.includes("USE_BACKEND_SYNC"),
        "developer setup retains compatibility flags"
    );

    console.log("provider-neutral gate messages: PASS");

}

async function testSettingsPageCopy() {

    const data = await loadAdminSampleData();
    const html = renderAdminSettingsPage(data);

    assert(!html.includes("Firebase"), "settings page has no Firebase branding");
    assert(html.includes("Backend"), "settings page uses Backend group label");
    assert(html.includes("Storage"), "settings page uses Storage label");

    console.log("settings page copy: PASS");

}

async function main() {

    testAdminUiHasNoFirebaseBranding();
    testSidebarStatusNotes();
    testProviderNeutralGateMessages();
    await testSettingsPageCopy();
    console.log("Version 2.3.3 backend freeze cleanup tests completed.");

}

main().catch(error => {
    console.error(error);
    process.exit(1);
});
