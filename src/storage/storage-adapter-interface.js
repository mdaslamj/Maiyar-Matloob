export const STORAGE_ADAPTER_METHODS = [
    "saveAnswers",
    "loadAnswers",
    "saveSession",
    "loadSession",
    "saveReport",
    "loadReport",
    "clearAll",
    "hasIncompleteSession",
    "loadHistoryStore",
    "saveHistoryStore",
    "loadHistoryReport",
    "saveHistoryReport",
    "deleteHistoryReport",
    "clearHistoryReports",
    "loadJournalStore",
    "saveJournalStore",
    "loadParticipantsStore",
    "saveParticipantsStore"
];

export function assertStorageAdapter(adapter, adapterName = "StorageAdapter") {

    STORAGE_ADAPTER_METHODS.forEach(methodName => {
        if (typeof adapter?.[methodName] !== "function") {
            throw new Error(`${adapterName} is missing required method: ${methodName}`);
        }
    });

    if (!adapter?.STORAGE_KEYS) {
        throw new Error(`${adapterName} is missing STORAGE_KEYS`);
    }

    return adapter;

}

/**
 * @typedef {Object} StorageAdapter
 * @property {import("./local-storage-adapter.js").STORAGE_KEYS} STORAGE_KEYS
 * @property {(answers: Record<string, number>) => void} saveAnswers
 * @property {() => Record<string, number>} loadAnswers
 * @property {(session: { currentQuestion: number, isSubmitted: boolean }) => void} saveSession
 * @property {() => ({ currentQuestion: number, isSubmitted: boolean } | null)} loadSession
 * @property {(report: object) => void} saveReport
 * @property {() => (object | null)} loadReport
 * @property {() => void} clearAll
 * @property {(answers: Record<string, number>, isSubmitted: boolean) => boolean} hasIncompleteSession
 */

export function createStorageAdapterInterface(adapter) {

    return assertStorageAdapter(adapter);

}
