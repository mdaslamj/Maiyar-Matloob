import { createLocalStorageAdapter, STORAGE_KEYS } from "./local-storage-adapter.js";

function createNotEnabledError(methodName) {

    return new Error(`Firestore storage adapter is not enabled (${methodName}). Set USE_FIRESTORE after security review.`);

}

export function createFirestoreStorageAdapter() {

    return {
        STORAGE_KEYS,

        saveAnswers() {
            throw createNotEnabledError("saveAnswers");
        },

        loadAnswers() {
            throw createNotEnabledError("loadAnswers");
        },

        saveSession() {
            throw createNotEnabledError("saveSession");
        },

        loadSession() {
            throw createNotEnabledError("loadSession");
        },

        saveReport() {
            throw createNotEnabledError("saveReport");
        },

        loadReport() {
            throw createNotEnabledError("loadReport");
        },

        clearAll() {
            throw createNotEnabledError("clearAll");
        },

        hasIncompleteSession() {
            throw createNotEnabledError("hasIncompleteSession");
        },

        loadHistoryStore() {
            throw createNotEnabledError("loadHistoryStore");
        },

        saveHistoryStore() {
            throw createNotEnabledError("saveHistoryStore");
        },

        loadHistoryReport() {
            throw createNotEnabledError("loadHistoryReport");
        },

        saveHistoryReport() {
            throw createNotEnabledError("saveHistoryReport");
        },

        deleteHistoryReport() {
            throw createNotEnabledError("deleteHistoryReport");
        },

        clearHistoryReports() {
            throw createNotEnabledError("clearHistoryReports");
        },

        loadJournalStore() {
            throw createNotEnabledError("loadJournalStore");
        },

        saveJournalStore() {
            throw createNotEnabledError("saveJournalStore");
        },

        loadParticipantsStore() {
            throw createNotEnabledError("loadParticipantsStore");
        },

        saveParticipantsStore() {
            throw createNotEnabledError("saveParticipantsStore");
        }
    };

}
