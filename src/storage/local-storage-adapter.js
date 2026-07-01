import {
    safeParseJson,
    tryStorageWrite
} from "./storage-safety.js";

export const STORAGE_KEYS = {
    ANSWERS: "mahasaba-nafs-answers",
    SESSION: "mahasaba-nafs-session",
    REPORT: "mahasaba-nafs-report",
    HISTORY: "mahasaba-nafs-history",
    HISTORY_REPORTS: "mahasaba-nafs-history-reports",
    JOURNAL: "mahasaba-nafs-journal"
};

const CLEAR_KEYS = [
    STORAGE_KEYS.ANSWERS,
    STORAGE_KEYS.SESSION,
    STORAGE_KEYS.REPORT,
    `${STORAGE_KEYS.ANSWERS}-report`,
    "mahasaba-nafs-report"
];

function saveAnswers(answers) {

    tryStorageWrite(() => {
        localStorage.setItem(STORAGE_KEYS.ANSWERS, JSON.stringify(answers));
    }, "answers");

}

function loadAnswers() {

    const stored = localStorage.getItem(STORAGE_KEYS.ANSWERS);
    const parsed = safeParseJson(stored, {}, "answers");

    return parsed.value && typeof parsed.value === "object" ? parsed.value : {};

}

function saveSession(session) {

    tryStorageWrite(() => {
        localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify({
            currentQuestion: session.currentQuestion,
            isSubmitted: session.isSubmitted
        }));
    }, "session");

}

function loadSession() {

    const stored = localStorage.getItem(STORAGE_KEYS.SESSION);
    const parsed = safeParseJson(stored, null, "session");

    return parsed.value;

}

function saveReport(report) {

    tryStorageWrite(() => {
        localStorage.setItem(STORAGE_KEYS.REPORT, JSON.stringify(report));
    }, "report");

}

function loadReport() {

    const stored = localStorage.getItem(STORAGE_KEYS.REPORT);
    const parsed = safeParseJson(stored, null, "report");

    return parsed.value;

}

function clearAll() {

    tryStorageWrite(() => {
        CLEAR_KEYS.forEach(key => {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
        });
    }, "clear-session");

}

function hasIncompleteSession(answers, isSubmitted) {

    return Object.keys(answers).length > 0 && !isSubmitted;

}

function loadHistoryStore() {

    const stored = localStorage.getItem(STORAGE_KEYS.HISTORY);
    const fallback = {
        schemaVersion: 1,
        snapshots: []
    };
    const parsed = safeParseJson(stored, fallback, "history");

    return {
        schemaVersion: parsed.value?.schemaVersion ?? 1,
        snapshots: Array.isArray(parsed.value?.snapshots) ? parsed.value.snapshots : []
    };

}

function saveHistoryStore(store) {

    tryStorageWrite(() => {
        localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify({
            schemaVersion: 1,
            snapshots: Array.isArray(store?.snapshots) ? store.snapshots : []
        }));
    }, "history");

}

function loadHistoryReportsStore() {

    const stored = localStorage.getItem(STORAGE_KEYS.HISTORY_REPORTS);
    const fallback = {
        reports: {}
    };
    const parsed = safeParseJson(stored, fallback, "history-reports");

    return {
        reports: parsed.value?.reports && typeof parsed.value.reports === "object"
            ? parsed.value.reports
            : {}
    };

}

function saveHistoryReportsStore(store) {

    tryStorageWrite(() => {
        localStorage.setItem(STORAGE_KEYS.HISTORY_REPORTS, JSON.stringify({
            reports: store?.reports && typeof store.reports === "object" ? store.reports : {}
        }));
    }, "history-reports");

}

function loadHistoryReport(snapshotId) {

    const store = loadHistoryReportsStore();

    return store.reports[snapshotId] || null;

}

function saveHistoryReport(snapshotId, report) {

    if (!snapshotId) {
        return;
    }

    tryStorageWrite(() => {
        const store = loadHistoryReportsStore();
        store.reports[snapshotId] = report;
        saveHistoryReportsStore(store);
    }, "history-report");

}

function deleteHistoryReport(snapshotId) {

    if (!snapshotId) {
        return;
    }

    tryStorageWrite(() => {
        const store = loadHistoryReportsStore();

        if (!store.reports[snapshotId]) {
            return;
        }

        delete store.reports[snapshotId];
        saveHistoryReportsStore(store);
    }, "history-report-delete");

}

function clearHistoryReports() {

    tryStorageWrite(() => {
        saveHistoryReportsStore({
            reports: {}
        });
    }, "history-reports-clear");

}

function loadJournalStore() {

    const stored = localStorage.getItem(STORAGE_KEYS.JOURNAL);
    const fallback = {
        schemaVersion: 1,
        entries: []
    };
    const parsed = safeParseJson(stored, fallback, "journal");

    return {
        schemaVersion: parsed.value?.schemaVersion ?? 1,
        entries: Array.isArray(parsed.value?.entries) ? parsed.value.entries : []
    };

}

function saveJournalStore(store) {

    tryStorageWrite(() => {
        localStorage.setItem(STORAGE_KEYS.JOURNAL, JSON.stringify({
            schemaVersion: 1,
            entries: Array.isArray(store?.entries) ? store.entries : []
        }));
    }, "journal");

}

export function createLocalStorageAdapter() {

    return {
        STORAGE_KEYS,
        saveAnswers,
        loadAnswers,
        saveSession,
        loadSession,
        saveReport,
        loadReport,
        clearAll,
        hasIncompleteSession,
        loadHistoryStore,
        saveHistoryStore,
        loadHistoryReport,
        saveHistoryReport,
        deleteHistoryReport,
        clearHistoryReports,
        loadJournalStore,
        saveJournalStore
    };

}
