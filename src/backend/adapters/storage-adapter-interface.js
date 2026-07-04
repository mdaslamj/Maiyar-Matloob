/**
 * Storage Adapter contract — Version 2.2 Phase A.
 */

/**
 * @typedef {Object} StorageAdapter
 * @property {() => string} getProviderName
 * @property {() => Promise<{ ready: boolean, reason: string }>} initialize
 * @property {() => boolean} isReady
 * @property {(participant: object) => Promise<object>} saveParticipant
 * @property {(options: object) => Promise<object>} saveAssessment
 * @property {(appVersion: string, contentVersion: string) => Promise<object>} recordClientVersion
 * @property {() => Promise<object>} countParticipants
 * @property {() => Promise<object>} countAssessments
 * @property {() => Promise<object>} loadLatestAssessment
 * @property {(options?: object) => Promise<object>} loadAssessmentScoreBatch
 * @property {() => Promise<object|null>} loadAdminDashboardMetrics
 * @property {() => Promise<object>} loadParticipantDirectory
 * @property {() => Promise<object[]>} loadCommunityQuestionAggregates
 * @property {() => Promise<object[]>} loadCommunitySectionAggregates
 */

export const StorageAdapterContract = {
    requiredMethods: [
        "getProviderName",
        "initialize",
        "isReady",
        "saveParticipant",
        "saveAssessment",
        "recordClientVersion",
        "countParticipants",
        "countAssessments",
        "loadLatestAssessment",
        "loadAssessmentScoreBatch",
        "loadAdminDashboardMetrics",
        "loadParticipantDirectory",
        "loadCommunityQuestionAggregates",
        "loadCommunitySectionAggregates"
    ]
};

export function assertStorageAdapter(adapter, providerName = "unknown") {

    StorageAdapterContract.requiredMethods.forEach(method => {
        if (typeof adapter?.[method] !== "function") {
            throw new Error(`Storage adapter "${providerName}" missing method: ${method}`);
        }
    });

    return adapter;

}
