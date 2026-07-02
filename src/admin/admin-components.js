import { IMPLEMENTATION_BUCKETS } from "./admin-sample-data.js";

export function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

}

export function formatPercent(value) {

    if (value == null || value === "" || Number.isNaN(Number(value))) {
        return "—";
    }

    const numeric = Number(value);
    const formatted = Number.isInteger(numeric)
        ? String(numeric)
        : numeric.toFixed(1).replace(/\.0$/, "");

    return `${formatted}%`;

}

/** @deprecated Use formatPercent — kept for backward compatibility */
export function formatPercentage(value) {

    return formatPercent(value);

}

export function formatDate(value) {

    if (!value) {
        return "—";
    }

    return new Date(value).toLocaleDateString("en-GB", {
        year: "numeric",
        month: "short",
        day: "numeric"
    });

}

export function renderPageIntro(title, description) {

    return `
        <header class="admin-page-header">
            <h1 class="admin-page-title">${escapeHtml(title)}</h1>
            ${description ? `<p class="admin-page-description">${escapeHtml(description)}</p>` : ""}
        </header>`;

}

export function renderMetricCard(label, value, meta = "") {

    return `
        <article class="ui-card ui-card--status admin-metric-card">
            <div class="ui-card__body">
                <div class="ui-metric">
                    <span class="ui-metric__label">${escapeHtml(label)}</span>
                    <strong class="ui-metric__value">${escapeHtml(value)}</strong>
                    ${meta ? `<span class="ui-metric__meta">${escapeHtml(meta)}</span>` : ""}
                </div>
            </div>
        </article>`;

}

export function renderDistributionBars(distribution = {}, options = {}) {

    const compact = options.compact === true;

    return `
        <div class="admin-distribution${compact ? " admin-distribution--compact" : ""}" role="list" aria-label="Implementation distribution">
            ${IMPLEMENTATION_BUCKETS.map(bucket => {
                const value = distribution[bucket.key] ?? 0;

                return `
                    <div class="admin-distribution-row" role="listitem">
                        <div class="admin-distribution-row__head">
                            <span class="admin-distribution-row__label">${escapeHtml(bucket.label)}</span>
                            <span class="admin-distribution-row__value">${formatPercent(value)}</span>
                        </div>
                        <div class="admin-distribution-row__track" aria-hidden="true">
                            <span class="admin-distribution-row__fill" style="width:${Math.max(2, value)}%"></span>
                        </div>
                    </div>`;
            }).join("")}
        </div>`;

}

export function renderDistributionCards(distribution = {}) {

    return `
        <div class="admin-distribution-cards">
            ${IMPLEMENTATION_BUCKETS.map(bucket => `
                <article class="ui-card ui-card--compact admin-bucket-card">
                    <div class="ui-card__body">
                        <span class="ui-metric__label">${escapeHtml(bucket.label)}</span>
                        <strong class="ui-metric__value">${formatPercent(distribution[bucket.key])}</strong>
                    </div>
                </article>`).join("")}
        </div>`;

}

export function renderRankedTeachingList(items = [], emptyMessage = "No data available.") {

    if (!items.length) {
        return `<p class="ui-empty">${escapeHtml(emptyMessage)}</p>`;
    }

    return `
        <ol class="admin-ranked-list">
            ${items.map((item, index) => `
                <li class="admin-ranked-list__item">
                    <span class="admin-ranked-list__rank">${index + 1}</span>
                    <div class="admin-ranked-list__content">
                        <strong>${escapeHtml(item.name)}</strong>
                        <span>${formatPercent(item.positiveRate)} positive implementation</span>
                    </div>
                </li>`).join("")}
        </ol>`;

}

export function renderSectionCard(title, bodyHtml, options = {}) {

    return `
        <section class="admin-section${options.className ? ` ${options.className}` : ""}">
            <div class="admin-section__head">
                <h2 class="admin-section__title">${escapeHtml(title)}</h2>
                ${options.description ? `<p class="admin-section__description">${escapeHtml(options.description)}</p>` : ""}
            </div>
            <div class="admin-section__body">
                ${bodyHtml}
            </div>
        </section>`;

}

export function renderDataTable(columns, rows) {

    return `
        <div class="admin-table-wrap">
            <table class="admin-table">
                <thead>
                    <tr>
                        ${columns.map(column => `<th scope="col">${escapeHtml(column.label)}</th>`).join("")}
                    </tr>
                </thead>
                <tbody>
                    ${rows.length
                        ? rows.map(row => `
                            <tr>
                                ${columns.map(column => `<td>${column.render(row)}</td>`).join("")}
                            </tr>`).join("")
                        : `<tr><td colspan="${columns.length}" class="admin-table__empty">No records available.</td></tr>`}
                </tbody>
            </table>
        </div>`;

}

export function renderStatusBadge(status) {

    const normalized = String(status || "").toLowerCase();
    const label = normalized.charAt(0).toUpperCase() + normalized.slice(1);

    return `<span class="admin-status-badge admin-status-badge--${escapeHtml(normalized)}">${escapeHtml(label)}</span>`;

}

export function renderTrendCard(trend) {

    const directionSymbol = trend.direction === "up"
        ? "↑"
        : trend.direction === "down"
            ? "↓"
            : "→";
    const directionClass = trend.direction === "up"
        ? "up"
        : trend.direction === "down"
            ? "down"
            : "stable";

    return `
        <article class="ui-card ui-card--trend admin-trend-card admin-trend-card--${directionClass}">
            <div class="ui-card__body">
                <div class="admin-trend-card__head">
                    <strong class="admin-trend-card__title">${escapeHtml(trend.teachingName)}</strong>
                    <span class="admin-trend-card__direction" aria-label="Trend direction">${directionSymbol}</span>
                </div>
                <p class="ui-card__text">${escapeHtml(trend.summary)}</p>
            </div>
        </article>`;

}

export function renderSettingsGroup(title, items = []) {

    return `
        <section class="ui-card ui-card--compact admin-settings-group">
            <header class="ui-card__header">
                <h3 class="ui-card__title">${escapeHtml(title)}</h3>
            </header>
            <div class="ui-card__body admin-settings-list">
                ${items.map(item => `
                    <div class="admin-settings-item">
                        <span class="admin-settings-item__label">${escapeHtml(item.label)}</span>
                        <span class="admin-settings-item__value">${escapeHtml(item.value)}</span>
                    </div>`).join("")}
            </div>
        </section>`;

}
