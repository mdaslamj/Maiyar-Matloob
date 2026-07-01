/**
 * Storage safety helpers for local-first persistence.
 * Surfaces corruption and quota issues without changing storage key contracts.
 */

export const STORAGE_ISSUE_CODES = {
    CORRUPT: "CorruptData",
    UNAVAILABLE: "StorageUnavailable",
    QUOTA: "StorageQuotaExceeded"
};

export const STORAGE_USER_MESSAGES = {
    corrupt: "محفوظ ڈیٹا خراب ہو گیا ہے۔ محفوظ شدہ معلومات بحال کر دی گئی ہیں۔",
    unavailable: "براؤزر میں ڈیٹا محفوظ نہیں ہو سکا۔ براہِ کرم نجی براؤزنگ بند کریں یا جگہ خالی کریں۔",
    quota: "محفوظ جگہ ختم ہو گئی ہے۔ پرانے جائزے یا غور و فکر حذف کر کے دوبارہ کوشش کریں۔",
    missingReport: "یہ محفوظ رپورٹ دستیاب نہیں ہے۔",
    missingJournalLink: "منسلک غور و فکر اب موجود نہیں ہے۔",
    generic: "محفوظ کرنے میں مسئلہ پیش آیا۔ براہِ کرم دوبارہ کوشش کریں۔"
};

/** @type {{ code: string, context: string, message: string } | null} */
let lastStorageIssue = null;

export function getLastStorageIssue() {

    return lastStorageIssue;

}

export function clearLastStorageIssue() {

    lastStorageIssue = null;

}

/**
 * @template T
 * @param {string|null|undefined} raw
 * @param {T} fallback
 * @param {string} context
 * @returns {{ value: T, corrupted: boolean }}
 */
export function safeParseJson(raw, fallback, context) {

    if (!raw) {
        return {
            value: fallback,
            corrupted: false
        };
    }

    try {
        return {
            value: JSON.parse(raw),
            corrupted: false
        };
    }

    catch (error) {
        console.error(`Storage parse failed (${context}):`, error);
        lastStorageIssue = {
            code: STORAGE_ISSUE_CODES.CORRUPT,
            context,
            message: STORAGE_USER_MESSAGES.corrupt
        };

        return {
            value: fallback,
            corrupted: true
        };
    }

}

/**
 * @param {() => void} operation
 * @param {string} context
 * @returns {{ ok: boolean, message?: string }}
 */
export function tryStorageWrite(operation, context) {

    try {
        operation();
        return { ok: true };
    }

    catch (error) {
        console.error(`Storage write failed (${context}):`, error);

        const isQuota = error?.name === "QuotaExceededError";
        const message = isQuota
            ? STORAGE_USER_MESSAGES.quota
            : STORAGE_USER_MESSAGES.unavailable;

        lastStorageIssue = {
            code: isQuota ? STORAGE_ISSUE_CODES.QUOTA : STORAGE_ISSUE_CODES.UNAVAILABLE,
            context,
            message
        };

        return {
            ok: false,
            message
        };
    }

}

export function isLocalStorageAvailable() {

    try {
        const testKey = "__maiyaar_storage_probe__";
        localStorage.setItem(testKey, "1");
        localStorage.removeItem(testKey);
        return true;
    }

    catch (error) {
        lastStorageIssue = {
            code: STORAGE_ISSUE_CODES.UNAVAILABLE,
            context: "probe",
            message: STORAGE_USER_MESSAGES.unavailable
        };
        return false;
    }

}
