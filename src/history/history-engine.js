import {
    loadHistoryStore,
    saveHistoryStore,
    loadHistoryReport,
    saveHistoryReport,
    deleteHistoryReport,
    clearHistoryReports
} from "../storage/storage.js";
import { buildAssessmentSnapshot } from "./snapshot-builder.js";
import { HISTORY_MAX_SNAPSHOTS } from "./history-config.js";

function readSnapshots() {

    const store = loadHistoryStore();

    return [...store.snapshots].sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

}

function writeSnapshots(snapshots) {

    saveHistoryStore({
        snapshots
    });

}

function trimSnapshots(snapshots) {

    if (snapshots.length <= HISTORY_MAX_SNAPSHOTS) {
        return snapshots;
    }

    const kept = snapshots.slice(0, HISTORY_MAX_SNAPSHOTS);
    const removed = snapshots.slice(HISTORY_MAX_SNAPSHOTS);

    removed.forEach(snapshot => {
        deleteHistoryReport(snapshot.snapshotId);
    });

    return kept;

}

export function saveSnapshot(report, metadata = {}) {

    try {
        const snapshot = buildAssessmentSnapshot(report, metadata);
        const snapshots = readSnapshots();

        snapshots.unshift(snapshot);

        saveHistoryReport(snapshot.snapshotId, report);
        writeSnapshots(trimSnapshots(snapshots));

        return snapshot;
    }

    catch (error) {
        console.error(error);
        return null;
    }

}

export function listSnapshots() {

    try {
        return readSnapshots();
    }

    catch (error) {
        console.error(error);
        return [];
    }

}

export function getSnapshot(snapshotId) {

    if (!snapshotId) {
        return null;
    }

    try {
        return readSnapshots().find(snapshot => snapshot.snapshotId === snapshotId) || null;
    }

    catch (error) {
        console.error(error);
        return null;
    }

}

export function getSnapshotReport(snapshotId) {

    if (!snapshotId) {
        return null;
    }

    try {
        const snapshot = getSnapshot(snapshotId);

        if (!snapshot) {
            return null;
        }

        return loadHistoryReport(snapshotId);
    }

    catch (error) {
        console.error(error);
        return null;
    }

}

export function deleteSnapshot(snapshotId) {

    if (!snapshotId) {
        return false;
    }

    try {
        const snapshots = readSnapshots();
        const nextSnapshots = snapshots.filter(snapshot => snapshot.snapshotId !== snapshotId);

        if (nextSnapshots.length === snapshots.length) {
            return false;
        }

        deleteHistoryReport(snapshotId);
        writeSnapshots(nextSnapshots);

        return true;
    }

    catch (error) {
        console.error(error);
        return false;
    }

}

export function clearHistory() {

    try {
        writeSnapshots([]);
        clearHistoryReports();
        return true;
    }

    catch (error) {
        console.error(error);
        return false;
    }

}

export const HistoryEngine = {
    saveSnapshot,
    listSnapshots,
    getSnapshot,
    getSnapshotReport,
    deleteSnapshot,
    clearHistory
};
