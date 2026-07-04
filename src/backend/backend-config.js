import { FEATURE_FLAGS } from "../shared/feature-flags.js";
import {
    getAdminAllowedEmailsFromModule,
    loadRuntimeConfigModule
} from "./config/runtime-config-loader.js";

export const BACKEND_PROVIDERS = Object.freeze([
    "none",
    "supabase",
    "firebase",
    "rest",
    "self-hosted"
]);

export const BACKEND_ENVIRONMENTS = Object.freeze([
    "development",
    "staging",
    "production"
]);

let resolvedLocalConfig = null;
let localConfigPromise = null;

async function loadLocalBackendConfig() {

    if (resolvedLocalConfig) {
        return resolvedLocalConfig;
    }

    if (localConfigPromise) {
        return localConfigPromise;
    }

    localConfigPromise = (async () => {
        const localModule = await loadRuntimeConfigModule();

        if (localModule) {
            resolvedLocalConfig = {
                adminAllowedEmails: getAdminAllowedEmailsFromModule(localModule),
                providerConfig: localModule.BACKEND_PROVIDER_CONFIG
                    || (localModule.FIREBASE_CONFIG ? { firebase: localModule.FIREBASE_CONFIG } : null)
                    || null,
                raw: localModule
            };

            return resolvedLocalConfig;
        }

        resolvedLocalConfig = {
            adminAllowedEmails: [],
            providerConfig: null,
            raw: null
        };

        return resolvedLocalConfig;
    })();

    return localConfigPromise;

}

export async function getBackendConfig() {

    await loadLocalBackendConfig();

    return {
        provider: getBackendProvider(),
        syncEnabled: isBackendSyncEnabled(),
        environment: getBackendEnvironment(),
        adminAllowedEmails: [...(resolvedLocalConfig?.adminAllowedEmails || [])],
        providerConfig: resolvedLocalConfig?.providerConfig || null
    };

}

/**
 * Resolve active backend provider from feature flags.
 * Legacy USE_FIREBASE: true maps to provider "firebase".
 */
export function getBackendProvider() {

    if (FEATURE_FLAGS.USE_BACKEND_SYNC === true) {
        const provider = FEATURE_FLAGS.BACKEND_PROVIDER || "none";

        return BACKEND_PROVIDERS.includes(provider) ? provider : "none";
    }

    if (FEATURE_FLAGS.USE_FIREBASE === true) {
        return "firebase";
    }

    return "none";

}

export function isBackendSyncEnabled() {

    return getBackendProvider() !== "none";

}

export function getBackendEnvironment() {

    const environment = FEATURE_FLAGS.ENVIRONMENT || "development";

    return BACKEND_ENVIRONMENTS.includes(environment) ? environment : "development";

}

export async function getAdminAllowedEmails() {

    const config = await getBackendConfig();

    return config.adminAllowedEmails;

}
