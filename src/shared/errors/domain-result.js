/**
 * Standard domain result codes for all engines and adapters.
 * @readonly
 * @enum {string}
 */
export const DOMAIN_RESULT_CODES = {
    SUCCESS: "Success",
    VALIDATION_ERROR: "ValidationError",
    STORAGE_ERROR: "StorageError",
    MIGRATION_REQUIRED: "MigrationRequired",
    UNSUPPORTED_VERSION: "UnsupportedVersion",
    NOT_FOUND: "NotFound",
    NOT_ENABLED: "NotEnabled"
};

/**
 * @template T
 * @typedef {Object} DomainSuccess
 * @property {typeof DOMAIN_RESULT_CODES.SUCCESS} code
 * @property {T} data
 */

/**
 * @typedef {Object} DomainFailure
 * @property {string} code - One of DOMAIN_RESULT_CODES (except SUCCESS).
 * @property {string} message
 * @property {Object} [details]
 */

/**
 * @template T
 * @typedef {DomainSuccess<T>|DomainFailure} DomainResult
 */

export function createSuccess(data) {

    return {
        code: DOMAIN_RESULT_CODES.SUCCESS,
        data
    };

}

export function createFailure(code, message, details) {

    return {
        code,
        message,
        details
    };

}

export function isDomainSuccess(result) {

    return result?.code === DOMAIN_RESULT_CODES.SUCCESS;

}

export function isDomainFailure(result) {

    return Boolean(result?.code && result.code !== DOMAIN_RESULT_CODES.SUCCESS);

}
