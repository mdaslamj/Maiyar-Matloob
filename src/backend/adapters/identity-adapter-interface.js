/**
 * Identity Adapter contract — Version 2.2 Phase A.
 *
 * @typedef {Object} IdentityResult
 * @property {boolean} success
 * @property {string} [reason]
 * @property {string} [uid]
 * @property {string} [email]
 * @property {string} [error]
 *
 * @typedef {Object} AdminSessionResult
 * @property {boolean} authorized
 * @property {{ uid: string, email: string }|null} user
 */

/**
 * @typedef {Object} IdentityAdapter
 * @property {() => string} getProviderName
 * @property {() => Promise<{ ready: boolean, reason: string, initialized?: boolean, error?: string }>} initialize
 * @property {() => boolean} isReady
 * @property {() => Promise<IdentityResult>} ensureParticipantIdentity
 * @property {() => string|null} getParticipantIdentityId
 * @property {() => Promise<IdentityResult>} signInAdminWithGoogle
 * @property {() => Promise<IdentityResult>} signOut
 * @property {() => Promise<AdminSessionResult>} requireAdminSession
 * @property {(callback: Function) => Function} watchSession
 * @property {(email: string) => boolean} isAuthorizedAdmin
 * @property {() => string[]} getAdminAllowedEmails
 */

export const IdentityAdapterContract = {
    requiredMethods: [
        "getProviderName",
        "initialize",
        "isReady",
        "ensureParticipantIdentity",
        "getParticipantIdentityId",
        "signInAdminWithGoogle",
        "signOut",
        "requireAdminSession",
        "watchSession",
        "isAuthorizedAdmin",
        "getAdminAllowedEmails"
    ]
};

export function assertIdentityAdapter(adapter, providerName = "unknown") {

    IdentityAdapterContract.requiredMethods.forEach(method => {
        if (typeof adapter?.[method] !== "function") {
            throw new Error(`Identity adapter "${providerName}" missing method: ${method}`);
        }
    });

    return adapter;

}
