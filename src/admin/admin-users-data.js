/**
 * Load live Admin Participants page data.
 * UI components must not access backend providers directly.
 */
import {
    isAdminLiveDataEnabled,
    loadParticipantDirectory
} from "../backend/backend-service.js";

export { isAdminLiveDataEnabled };

export function createLoadingParticipantDirectory() {

    return {
        status: "loading",
        rows: [],
        lastUpdated: null,
        message: "Loading..."
    };

}

export async function loadParticipantDirectoryData() {

    if (!isAdminLiveDataEnabled()) {
        return {
            status: "unavailable",
            rows: [],
            lastUpdated: null,
            message: "Live participant directory requires backend sync."
        };
    }

    return loadParticipantDirectory();

}

export const AdminUsersData = {
    isAdminLiveDataEnabled,
    createLoadingParticipantDirectory,
    loadParticipantDirectoryData
};
