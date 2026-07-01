import {
    loadJournalStore,
    saveJournalStore
} from "../storage/storage.js";
import {
    createSuccess,
    createFailure,
    DOMAIN_RESULT_CODES
} from "../shared/errors/domain-result.js";

export const JOURNAL_SCHEMA_VERSION = 1;

function createEntryId() {

    return `journal-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

}

function normalizeEntry(entry) {

    return {
        schemaVersion: JOURNAL_SCHEMA_VERSION,
        entryId: entry.entryId || createEntryId(),
        createdAt: entry.createdAt || new Date().toISOString(),
        title: String(entry.title || "").trim(),
        notes: String(entry.notes || "").trim(),
        lessonsLearned: String(entry.lessonsLearned || "").trim(),
        intentions: String(entry.intentions || "").trim(),
        linkedSnapshotId: entry.linkedSnapshotId || null
    };

}

function validateEntryInput(entry) {

    if (!entry || typeof entry !== "object") {
        return "Journal entry must be an object.";
    }

    const normalized = normalizeEntry(entry);
    const hasContent = normalized.title
        || normalized.notes
        || normalized.lessonsLearned
        || normalized.intentions;

    if (!hasContent) {
        return "At least one reflection field is required.";
    }

    return null;

}

export function listJournalEntries() {

    const store = loadJournalStore();

    return [...store.entries].sort((left, right) => {
        return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    });

}

export function getJournalEntry(entryId) {

    if (!entryId) {
        return null;
    }

    return listJournalEntries().find(entry => entry.entryId === entryId) || null;

}

export function saveJournalEntry(entry) {

    const validationError = validateEntryInput(entry);

    if (validationError) {
        return createFailure(
            DOMAIN_RESULT_CODES.VALIDATION_ERROR,
            validationError
        );
    }

    const store = loadJournalStore();
    const normalized = normalizeEntry(entry);
    const existingIndex = store.entries.findIndex(item => item.entryId === normalized.entryId);

    if (existingIndex >= 0) {
        store.entries[existingIndex] = normalized;
    } else {
        store.entries.push(normalized);
    }

    saveJournalStore(store);

    return createSuccess(normalized);

}

export function deleteJournalEntry(entryId) {

    if (!entryId) {
        return createFailure(
            DOMAIN_RESULT_CODES.VALIDATION_ERROR,
            "Journal entry id is required."
        );
    }

    const store = loadJournalStore();
    const nextEntries = store.entries.filter(entry => entry.entryId !== entryId);

    if (nextEntries.length === store.entries.length) {
        return createFailure(
            DOMAIN_RESULT_CODES.NOT_FOUND,
            "Journal entry was not found."
        );
    }

    saveJournalStore({
        ...store,
        entries: nextEntries
    });

    return createSuccess({ entryId });

}

export const JournalEngine = {
    listJournalEntries,
    getJournalEntry,
    saveJournalEntry,
    deleteJournalEntry
};
