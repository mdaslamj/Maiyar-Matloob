import { getBackendProvider } from "./backend-config.js";
import { createProviderPair } from "./registry/provider-registry.js";

let activeProviderName = "none";
let identityAdapter = null;
let storageAdapter = null;
let initializationPromise = null;
let initializationResult = {
    initialized: false,
    reason: "not-initialized"
};

function resolveProviderPair() {

    const providerName = getBackendProvider();

    if (providerName !== activeProviderName || !identityAdapter || !storageAdapter) {
        const pair = createProviderPair(providerName);

        activeProviderName = providerName;
        identityAdapter = pair.identity;
        storageAdapter = pair.storage;
        initializationPromise = null;
        initializationResult = {
            initialized: false,
            reason: "not-initialized"
        };
    }

    return { identityAdapter, storageAdapter, providerName: activeProviderName };

}

export function getActiveProviderName() {

    return resolveProviderPair().providerName;

}

export function getIdentityAdapter() {

    return resolveProviderPair().identityAdapter;

}

export function getStorageAdapter() {

    return resolveProviderPair().storageAdapter;

}

export async function initializeBackendAdapters() {

    if (initializationPromise) {
        return initializationPromise;
    }

    initializationPromise = (async () => {
        const { identityAdapter: identity, storageAdapter: storage, providerName } = resolveProviderPair();

        if (providerName === "none") {
            initializationResult = {
                initialized: false,
                reason: "backend-disabled",
                provider: providerName
            };

            return initializationResult;
        }

        const identityResult = await identity.initialize();
        const storageResult = await storage.initialize();
        const storageOnlyProvider = providerName === "supabase";
        const ready = storageOnlyProvider
            ? storage.isReady()
            : Boolean(identity.isReady() && storage.isReady());

        initializationResult = {
            initialized: ready,
            reason: ready ? "ready" : (identityResult.reason || storageResult.reason || "not-ready"),
            provider: providerName,
            identity: identityResult,
            storage: storageResult
        };

        return initializationResult;
    })();

    return initializationPromise;

}

export function isBackendReady() {

    const { identityAdapter: identity, storageAdapter: storage, providerName } = resolveProviderPair();

    if (providerName === "supabase") {
        return storage.isReady();
    }

    return Boolean(identity.isReady() && storage.isReady());

}

export function resetBackendAdaptersForTests() {

    activeProviderName = "none";
    identityAdapter = null;
    storageAdapter = null;
    initializationPromise = null;
    initializationResult = {
        initialized: false,
        reason: "not-initialized"
    };

}

export const BackendAdapter = {
    initializeBackendAdapters,
    isBackendReady,
    getActiveProviderName,
    getIdentityAdapter,
    getStorageAdapter,
    resetBackendAdaptersForTests
};
