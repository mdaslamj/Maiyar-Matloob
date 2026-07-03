/**
 * Normalized admin widget result shape — provider-independent.
 */

export function createWidgetResult(status, options = {}) {

    return {
        status,
        value: options.value ?? null,
        lastUpdated: options.lastUpdated ?? null,
        message: options.message ?? ""
    };

}

export function mapStorageError(error, fallbackMessage = "Unable to load data.") {

    const code = error?.code || "";

    if (code === "permission-denied") {
        return createWidgetResult("permission-denied", {
            message: "Permission denied."
        });
    }

    if (code === "unavailable") {
        return createWidgetResult("unavailable", {
            message: "Backend unavailable."
        });
    }

    return createWidgetResult("error", {
        message: fallbackMessage
    });

}
