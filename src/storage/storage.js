import { resolveStorageAdapter } from "./storage-adapter-factory.js";
import {
    getLastStorageIssue,
    clearLastStorageIssue,
    isLocalStorageAvailable,
    STORAGE_USER_MESSAGES
} from "./storage-safety.js";

const adapter = resolveStorageAdapter();

export const STORAGE_KEYS = adapter.STORAGE_KEYS;

export function saveAnswers(answers) {

    adapter.saveAnswers(answers);

}

export function loadAnswers() {

    return adapter.loadAnswers();

}

export function saveSession(session) {

    adapter.saveSession(session);

}

export function loadSession() {

    return adapter.loadSession();

}

export function saveReport(report) {

    adapter.saveReport(report);

}

export function loadReport() {

    return adapter.loadReport();

}

export function clearAll() {

    adapter.clearAll();

}

export function hasIncompleteSession(answers, isSubmitted) {

    return adapter.hasIncompleteSession(answers, isSubmitted);

}

export function loadHistoryStore() {

    return adapter.loadHistoryStore();

}

export function saveHistoryStore(store) {

    adapter.saveHistoryStore(store);

}

export function loadHistoryReport(snapshotId) {

    return adapter.loadHistoryReport(snapshotId);

}

export function saveHistoryReport(snapshotId, report) {

    adapter.saveHistoryReport(snapshotId, report);

}

export function deleteHistoryReport(snapshotId) {

    adapter.deleteHistoryReport(snapshotId);

}

export function clearHistoryReports() {

    adapter.clearHistoryReports();

}

export function loadJournalStore() {

    return adapter.loadJournalStore();

}

export function saveJournalStore(store) {

    adapter.saveJournalStore(store);

}

export function loadParticipantsStore() {

    return adapter.loadParticipantsStore();

}

export function saveParticipantsStore(store) {

    adapter.saveParticipantsStore(store);

}

export {
    getLastStorageIssue,
    clearLastStorageIssue,
    isLocalStorageAvailable,
    STORAGE_USER_MESSAGES
};

export const StorageService = {
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
    saveJournalStore,
    loadParticipantsStore,
    saveParticipantsStore
};
