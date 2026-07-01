import { isFirestoreEnabled } from "../shared/feature-flags.js";
import { createStorageAdapterInterface } from "./storage-adapter-interface.js";
import { createLocalStorageAdapter } from "./local-storage-adapter.js";
import { createFirestoreStorageAdapter } from "./firestore-storage-adapter.js";

export function resolveStorageAdapter() {

    if (isFirestoreEnabled()) {
        return createStorageAdapterInterface(createFirestoreStorageAdapter(), "FirestoreStorageAdapter");
    }

    return createStorageAdapterInterface(createLocalStorageAdapter(), "LocalStorageAdapter");

}
