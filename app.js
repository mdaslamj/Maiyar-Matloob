// =======================================
// محاسبۂ نفس
// Version 2.4.1 — Welcome Page Visual Redesign
// Production Architecture
// =======================================

import { application } from "./src/core/application.js";
import {
    getLastStorageIssue,
    clearLastStorageIssue,
    isLocalStorageAvailable,
    STORAGE_USER_MESSAGES
} from "./src/storage/storage.js";

const APP_VERSION = "2.4.1";

/** Reserved for future admin authentication; community analytics stay hidden until enabled. */
const IS_ADMIN_MODE = false;

const ANSWER_VALIDATION_MESSAGE = "براہِ کرم آگے بڑھنے سے پہلے ایک جواب منتخب کریں۔";

const UI_LABELS = {
    NAV_PREVIOUS: "← پچھلا",
    NAV_NEXT: "اگلا →",
    NAV_FINISH: "مکمل کریں →",
    DASHBOARD_TITLE: "معیار",
    PROGRESS_REVIEW: "آپ کی پیش رفت",
    MAIYAAR_INSIGHTS: "معیارِ مطلوب بصیرت",
    ASSESSMENT_HISTORY: "جائزوں کی تاریخ",
    CONTINUE_ASSESSMENT: "جائزہ جاری رکھیں",
    START_NEW_ASSESSMENT: "نیا جائزہ شروع کریں",
    START_ASSESSMENT: "جائزہ شروع کریں",
    OPEN_PROGRESS_REVIEW: "اپنی پیش رفت دیکھیں",
    OPEN_MAIYAAR_INSIGHTS: "معیارِ مطلوب بصیرت",
    OPEN_ASSESSMENT_HISTORY: "جائزوں کی تاریخ",
    OPEN_PERSONAL_HOME: "ذاتی صفحہ",
    BACK: "← واپس",
    PRINT_REPORT: "رپورٹ پرنٹ کریں",
    EMPTY_PROGRESS: "ابھی کوئی مکمل جائزہ محفوظ نہیں ہے۔",
    EMPTY_HISTORY: "ابھی کوئی جائزہ محفوظ نہیں ہے۔",
    EMPTY_INSIGHTS: "بصیرت کے لیے مزید مکمل جائزے درکار ہیں۔"
};

const UI_ICONS = {
    CONTINUE: "▶",
    RESTART: "↺",
    PROGRESS: "📈",
    HISTORY: "📚",
    PRINT: "🖨",
    INSIGHTS: "✨",
    HOME: "🏠",
    START: "✓"
};

const WELCOME_ICON_SVGS = {
    logo: `<svg viewBox="0 0 32 32" class="welcome-svg-icon" aria-hidden="true"><path d="M8 24V11l8-4 8 4v13" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M12 24V14h8v10" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M16 4l1.6 2.8 3.1.4-2.2 2.2.5 3.1L16 11.2 13 12.5l.5-3.1-2.2-2.2 3.1-.4L16 4z" fill="currentColor" opacity="0.9"/></svg>`,
    person: `<svg viewBox="0 0 24 24" class="welcome-svg-icon" aria-hidden="true"><circle cx="12" cy="8" r="3.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M5.5 19.5c1.2-3 3.2-4.5 6.5-4.5s5.3 1.5 6.5 4.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`,
    phone: `<svg viewBox="0 0 24 24" class="welcome-svg-icon" aria-hidden="true"><rect x="7" y="3.5" width="10" height="17" rx="2.2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M10.5 17.5h3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`,
    start: `<svg viewBox="0 0 24 24" class="welcome-svg-icon" aria-hidden="true"><path d="M8 6.5v11l9-5.5-9-5.5z" fill="currentColor"/></svg>`,
    continue: `<svg viewBox="0 0 24 24" class="welcome-svg-icon" aria-hidden="true"><path d="M6 12h10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M13 8l5 4-5 4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    restart: `<svg viewBox="0 0 24 24" class="welcome-svg-icon" aria-hidden="true"><path d="M7 7.5A7.5 7.5 0 0 1 18 9" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M17 5v4h-4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M17 16.5A7.5 7.5 0 0 1 6 15" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M7 19v-4h4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    history: `<svg viewBox="0 0 24 24" class="welcome-svg-icon" aria-hidden="true"><path d="M7 5.5h11a1.5 1.5 0 0 1 1.5 1.5v11a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 18V7A1.5 1.5 0 0 1 7 5.5z" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M8.5 9h7M8.5 12h7M8.5 15h4.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`,
    progress: `<svg viewBox="0 0 24 24" class="welcome-svg-icon" aria-hidden="true"><path d="M5.5 17.5l4.5-5 3.5 3 5.5-7" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M5.5 19.5h13" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`
};

const SCREEN_IDS = [
    "welcomeScreen",
    "questionnaireScreen",
    "homeDashboardScreen",
    "progressScreen",
    "historyScreen",
    "dashboardScreen"
];

let progressInsightsTab = "personal";
let showParticipantForm = false;

function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

}

function formatUrduPercent(value, options = {}) {

    if (value == null || value === "" || Number.isNaN(Number(value))) {
        return "—";
    }

    const numeric = Number(value);
    const formatted = Number.isInteger(numeric)
        ? String(numeric)
        : numeric.toFixed(1).replace(/\.0$/, "");
    const sign = options.showSign && numeric > 0 ? "+" : "";

    return `${sign}${formatted}٪`;

}

function formatAssessmentComparison(firstValue, latestValue) {

    if (firstValue == null || latestValue == null) {
        return "—";
    }

    return `${formatUrduPercent(firstValue)} ← ${formatUrduPercent(latestValue)}`;

}

function announceToScreenReader(message) {

    const announcer = document.getElementById("appAnnouncer");

    if (!announcer || !message) {
        return;
    }

    announcer.textContent = "";
    window.requestAnimationFrame(() => {
        announcer.textContent = message;
    });

}

function showAppStatus(message) {

    const banner = document.getElementById("appStatusBanner");

    if (!banner) {
        return;
    }

    if (!message) {
        banner.hidden = true;
        banner.textContent = "";
        return;
    }

    banner.hidden = false;
    banner.textContent = message;

}

function refreshStorageStatusBanner() {

    const issue = getLastStorageIssue();

    if (issue?.message) {
        showAppStatus(issue.message);
        return;
    }

    showAppStatus("");

}

function activateScreen(screenId, options = {}) {

    SCREEN_IDS.forEach(id => {
        const element = document.getElementById(id);

        if (!element) {
            return;
        }

        const isActive = id === screenId;
        element.hidden = !isActive;
        element.setAttribute("aria-hidden", isActive ? "false" : "true");
    });

    document.body.classList.toggle("questionnaire-active", screenId === "questionnaireScreen");
    document.body.classList.toggle("welcome-active", screenId === "welcomeScreen");

    if (options.announce) {
        announceToScreenReader(options.announce);
    }

    if (options.focusTargetId) {
        const focusTarget = document.getElementById(options.focusTargetId);

        if (focusTarget) {
            focusTarget.focus();
        }
    }

}

function getDomainData(result, fallback = {}) {

    if (result?.code !== "Success") {
        return fallback;
    }

    return result.data || fallback;

}

function renderScreenToolbar(options = {}) {

    const {
        title,
        backId = "screenBackBtn",
        backLabel = UI_LABELS.BACK,
        actionsHtml = "",
        printable = false
    } = options;

    return `
        <div class="screen-toolbar${printable ? "" : " no-print"}" role="toolbar" aria-label="${escapeHtml(title)} toolbar">
            <button type="button" id="${backId}" class="secondary-btn screen-toolbar-back">${backLabel}</button>
            <h2 class="screen-toolbar-title">${escapeHtml(title)}</h2>
            <div class="screen-toolbar-actions">${actionsHtml}</div>
        </div>`;

}

function renderUICard(options = {}) {

    const {
        type = "summary",
        title = "",
        kicker = "",
        bodyHtml = "",
        footerHtml = "",
        className = ""
    } = options;

    return `
        <article class="ui-card ui-card--${type} ${className}">
            ${title || kicker ? `
                <header class="ui-card__header">
                    ${kicker ? `<span class="ui-card__kicker">${escapeHtml(kicker)}</span>` : ""}
                    ${title ? `<h3 class="ui-card__title">${escapeHtml(title)}</h3>` : ""}
                </header>` : ""}
            ${bodyHtml ? `<div class="ui-card__body">${bodyHtml}</div>` : ""}
            ${footerHtml ? `<footer class="ui-card__footer">${footerHtml}</footer>` : ""}
        </article>`;

}

function renderMetricRow(label, value, meta = "") {

    return `
        <div class="ui-metric">
            <span class="ui-metric__label">${escapeHtml(label)}</span>
            <strong class="ui-metric__value">${escapeHtml(value)}</strong>
            ${meta ? `<span class="ui-metric__meta">${escapeHtml(meta)}</span>` : ""}
        </div>`;

}

function renderQuickActionButton(id, icon, label, className = "ui-quick-action-btn") {

    return `<button type="button" id="${id}" class="${className} btn-with-icon"><span class="btn-icon" aria-hidden="true">${icon}</span><span class="ui-btn-label">${escapeHtml(label)}</span></button>`;

}

function renderWelcomeActionButton(id, iconKey, label, className = "welcome-action-btn secondary-btn ui-assessment-btn") {

    const icon = WELCOME_ICON_SVGS[iconKey] || "";

    return `<button type="button" id="${id}" class="${className}"><span class="welcome-action-btn__icon" aria-hidden="true">${icon}</span><span class="welcome-action-btn__label">${escapeHtml(label)}</span></button>`;

}

function renderToolbarAction(id, icon, label) {

    return `<button type="button" id="${id}" class="nav-btn btn-with-icon"><span class="btn-icon" aria-hidden="true">${icon}</span><span>${label}</span></button>`;

}

function renderIconButton(className, id, icon, label, extraAttributes = "") {

    return `<button type="button" id="${id}" class="${className} btn-with-icon full-width-btn" ${extraAttributes}><span class="btn-icon" aria-hidden="true">${icon}</span><span>${label}</span></button>`;

}

function initializeApp() {

    if (!isLocalStorageAvailable()) {
        showAppStatus(STORAGE_USER_MESSAGES.unavailable);
    }

    setQuestionnaireLoadState("loading");
    bindEvents();
    initializeScreenAccessibility();
    loadQuestionnaire();

}

function initializeScreenAccessibility() {

    SCREEN_IDS.forEach(id => {
        const element = document.getElementById(id);

        if (!element) {
            return;
        }

        element.setAttribute("aria-hidden", id === "welcomeScreen" ? "false" : "true");
    });

    document.body.classList.toggle("welcome-active", true);

}

async function loadQuestionnaire() {

    setQuestionnaireLoadState("loading");

    try {

        await application.initializeInfrastructure();

        const response = await fetch("questionnaire.json");

        if (!response.ok) {
            throw new Error(`questionnaire.json fetch failed with HTTP ${response.status}`);
        }

        const data = await response.json();
        application.initializeQuestionnaire(data);

        document.getElementById("totalQuestions").textContent = application.questionnaire.length;

        if (application.questionnaire.length !== 50) {
            console.warn("Expected 50 questions, received", application.questionnaire.length);
        }

        updateProgress();
        setQuestionnaireLoadState("ready");
        renderParticipantSection();
        renderWelcomeDashboard();
        refreshStorageStatusBanner();
        restorePersistedState();

    }

    catch (error) {

        application.resetQuestionnaireLoad();
        console.error("Questionnaire load failed:", error);
        setQuestionnaireLoadState("error");

    }

}

function setQuestionnaireLoadState(state) {

    const loadingMessage = document.getElementById("questionnaireLoadingMessage");
    const errorMessage = document.getElementById("questionnaireErrorMessage");

    if (loadingMessage) {
        loadingMessage.hidden = state !== "loading";
    }

    if (errorMessage) {
        errorMessage.hidden = state !== "error";
    }

    if (state === "ready") {
        renderParticipantSection();
        renderWelcomeDashboard();
    }

}

function bindEvents() {

    document.getElementById("welcomeDashboard")?.addEventListener("click", handleWelcomeDashboardClick);
    document.getElementById("participantSection")?.addEventListener("click", handleParticipantSectionClick);
    document.getElementById("participantSection")?.addEventListener("input", handleParticipantSectionInput);
    document.getElementById("questionContainer")?.addEventListener("click", handleQuestionContainerClick);
    document.getElementById("questionContainer")?.addEventListener("change", handleAnswerSelection);

}

function handleQuestionContainerClick(event) {

    if (event.target.closest("#previousBtn")) {
        previousQuestion();
        return;
    }

    if (event.target.closest("#nextBtn")) {
        nextQuestion();
        return;
    }

    handleExplanationToggle(event);

}

function handleWelcomeDashboardClick(event) {

    const button = event.target.closest("button[data-action]");

    if (!button || button.disabled) {
        return;
    }

    switch (button.getAttribute("data-action")) {
        case "open-history":
            openAssessmentHistory();
            break;
        case "open-progress":
            openProgressJourney();
            break;
        default:
            break;
    }

}

function renderParticipantAssessmentActions() {

    const hasIncompleteSession = application.hasIncompleteSession();

    if (hasIncompleteSession) {
        return `
            ${renderWelcomeActionButton("participantContinueBtn", "continue", UI_LABELS.CONTINUE_ASSESSMENT, "primary-btn ui-assessment-btn full-width-btn welcome-action-btn")}
            ${renderWelcomeActionButton("participantRestartBtn", "restart", UI_LABELS.START_NEW_ASSESSMENT, "secondary-btn ui-assessment-btn full-width-btn welcome-action-btn")}`;
    }

    return renderWelcomeActionButton(
        "participantStartBtn",
        "start",
        UI_LABELS.START_ASSESSMENT,
        "primary-btn ui-assessment-btn full-width-btn welcome-action-btn"
    );

}

function renderParticipantNewColumn(participant, isActive) {

    return `
        <div class="welcome-panel__column welcome-panel__column--new ${isActive ? "is-active" : "is-dimmed"}">
            <span class="welcome-panel__kicker">نیا شرکت کنندہ</span>
            <form id="participantForm" class="welcome-panel__form" novalidate>
                <label class="welcome-panel__field" for="participantName">
                    <span class="welcome-panel__label">پورا نام</span>
                    <div class="welcome-panel__input-wrap">
                        <span class="welcome-panel__input-icon" aria-hidden="true">${WELCOME_ICON_SVGS.person}</span>
                        <input
                            type="text"
                            id="participantName"
                            name="participantName"
                            maxlength="100"
                            autocomplete="name"
                            value="${participant ? escapeHtml(participant.name) : ""}"
                            required>
                    </div>
                </label>
                <p id="participantNameError" class="welcome-panel__error" role="alert" hidden></p>

                <label class="welcome-panel__field" for="participantMobile">
                    <span class="welcome-panel__label">موبائل نمبر</span>
                    <div class="welcome-panel__input-wrap">
                        <span class="welcome-panel__input-icon" aria-hidden="true">${WELCOME_ICON_SVGS.phone}</span>
                        <input
                            type="tel"
                            id="participantMobile"
                            name="participantMobile"
                            inputmode="numeric"
                            maxlength="10"
                            autocomplete="tel"
                            dir="ltr"
                            value="${participant ? escapeHtml(participant.mobile) : ""}"
                            required>
                    </div>
                </label>
                <p id="participantMobileError" class="welcome-panel__error" role="alert" hidden></p>

                <button type="submit" class="primary-btn ui-assessment-btn full-width-btn welcome-action-btn">
                    <span class="welcome-action-btn__icon" aria-hidden="true">${WELCOME_ICON_SVGS.start}</span>
                    <span class="welcome-action-btn__label">${UI_LABELS.START_ASSESSMENT}</span>
                </button>
            </form>
        </div>`;

}

function renderParticipantReturningColumn(participant, isActive) {

    if (!isActive || !participant) {
        return `
            <div class="welcome-panel__column welcome-panel__column--returning is-placeholder">
                <span class="welcome-panel__kicker welcome-panel__kicker--gold">واپس آنے والا شرکت کنندہ</span>
            </div>`;
    }

    return `
        <div class="welcome-panel__column welcome-panel__column--returning is-active">
            <span class="welcome-panel__kicker welcome-panel__kicker--gold">واپس آنے والا شرکت کنندہ</span>
            <p class="welcome-panel__greeting">خوش آمدید، <strong>${escapeHtml(participant.name)}</strong></p>
            <div class="welcome-panel__actions">
                ${renderParticipantAssessmentActions()}
            </div>
            <button type="button" id="changeParticipantBtn" class="welcome-panel__link">شناخت تبدیل کریں</button>
        </div>`;

}

function renderParticipantSection() {

    const section = document.getElementById("participantSection");
    const participant = application.getCurrentParticipant();
    const ready = application.questionnaireReady && application.questionnaire.length > 0;

    if (!section) {
        return;
    }

    if (!ready) {
        section.innerHTML = "";
        return;
    }

    const showReturning = Boolean(participant && !showParticipantForm);
    const showNewForm = !showReturning;

    section.innerHTML = `
        <article class="welcome-panel">
            ${renderParticipantNewColumn(participant, showNewForm)}
            <div class="welcome-panel__divider" role="separator" aria-hidden="true"></div>
            ${renderParticipantReturningColumn(participant, showReturning)}
        </article>`;

    document.getElementById("participantForm")?.addEventListener("submit", handleParticipantFormSubmit);

}

function handleParticipantSectionClick(event) {

    if (event.target.closest("#changeParticipantBtn")) {
        showParticipantForm = true;
        renderParticipantSection();
        document.getElementById("participantName")?.focus();
        return;
    }

    if (event.target.closest("#participantStartBtn")) {
        startQuestionnaire({ skipParticipantCheck: true });
        return;
    }

    if (event.target.closest("#participantContinueBtn")) {
        continueQuestionnaire();
        return;
    }

    if (event.target.closest("#participantRestartBtn")) {
        restartQuestionnaireFromWelcome();
    }

}

function clearParticipantFieldErrors() {

    ["participantNameError", "participantMobileError"].forEach(id => {
        const element = document.getElementById(id);

        if (element) {
            element.hidden = true;
            element.textContent = "";
        }
    });

}

function showParticipantFieldErrors(errors = {}) {

    clearParticipantFieldErrors();

    if (errors.name) {
        const nameError = document.getElementById("participantNameError");

        if (nameError) {
            nameError.hidden = false;
            nameError.textContent = errors.name;
        }
    }

    if (errors.mobile) {
        const mobileError = document.getElementById("participantMobileError");

        if (mobileError) {
            mobileError.hidden = false;
            mobileError.textContent = errors.mobile;
        }
    }

}

function submitParticipantIdentity(options = {}) {

    const nameInput = document.getElementById("participantName");
    const mobileInput = document.getElementById("participantMobile");
    const result = application.identifyParticipant(
        nameInput?.value || "",
        mobileInput?.value || ""
    );

    if (!result.valid) {
        showParticipantFieldErrors(result.errors || {});
        nameInput?.focus();
        return false;
    }

    clearParticipantFieldErrors();
    showParticipantForm = false;
    renderParticipantSection();
    renderWelcomeDashboard();
    refreshStorageStatusBanner();

    if (result.isReturning) {
        announceToScreenReader(`${result.participant.name} کی شناخت لوڈ ہو گئی`);
    }

    if (options.startAssessment) {
        startQuestionnaire({ skipParticipantCheck: true });
    }

    return true;

}

function handleParticipantFormSubmit(event) {

    event.preventDefault();
    submitParticipantIdentity({ startAssessment: true });

}

function handleParticipantSectionInput(event) {

    if (event.target.id !== "participantMobile") {
        return;
    }

    const mobile = event.target.value;
    const existing = application.findParticipantByMobile(mobile);
    const nameInput = document.getElementById("participantName");

    if (!existing || !nameInput || nameInput.value.trim()) {
        return;
    }

    nameInput.value = existing.name;

}

function ensureParticipantIdentity() {

    if (application.hasCurrentParticipant()) {
        return true;
    }

    const nameInput = document.getElementById("participantName");
    const mobileInput = document.getElementById("participantMobile");

    if (nameInput?.value.trim() && mobileInput?.value.trim()) {
        return submitParticipantIdentity();
    }

    showParticipantForm = true;
    renderParticipantSection();
    document.getElementById("participantName")?.focus();
    announceToScreenReader("براہِ کرم پہلے اپنی شناخت درج کریں");
    return false;

}

function renderWelcomeDashboard() {

    const container = document.getElementById("welcomeDashboard");
    const startButtonReady = application.questionnaireReady && application.questionnaire.length > 0;

    if (!container) {
        return;
    }

    if (!startButtonReady) {
        container.innerHTML = `
            <div class="welcome-summary__grid">
                <div class="welcome-summary-card ui-card ui-card--status">
                    <div class="ui-card__body">
                        <p class="ui-empty">سوالنامہ تیار ہونے کے بعد یہاں آپ کا ذاتی صفحہ ظاہر ہوگا۔</p>
                    </div>
                </div>
            </div>`;
        return;
    }

    const bundle = application.getGrowthBundle();
    const dashboard = getDomainData(bundle.dashboard);
    const growthDashboard = getDomainData(bundle.growthDashboard);
    const overview = growthDashboard.overview || {};

    container.innerHTML = `
        <div class="welcome-summary__grid">
            ${renderUICard({
                type: "status",
                className: "welcome-summary-card dashboard-card dashboard-card--status",
                title: "آج کی کیفیت",
                bodyHtml: `
                    <div class="ui-metric-grid ui-metric-grid--compact">
                        ${renderMetricRow("موجودہ سطح", dashboard.currentOverallLevel ? getPerformanceLevelLabel(dashboard.currentOverallLevel) : "—", dashboard.currentOverallPercentage != null ? formatUrduPercent(dashboard.currentOverallPercentage) : "")}
                        ${renderMetricRow("آخری جائزہ", dashboard.lastAssessmentDate ? formatAssessmentDate(dashboard.lastAssessmentDate) : "—")}
                        ${renderMetricRow("مجموعی پیش رفت", overview.overallTrend?.classification ? getTrendClassificationLabel(overview.overallTrend.classification) : "—", overview.overallTrend?.deltaPercentage != null ? `${formatUrduPercent(overview.overallTrend.deltaPercentage, { showSign: true })} تبدیلی` : "مزید جائزوں کی ضرورت")}
                    </div>`
            })}

            ${renderUICard({
                type: "summary",
                className: "welcome-summary-card dashboard-card dashboard-card--history",
                title: UI_LABELS.ASSESSMENT_HISTORY,
                bodyHtml: `<p class="ui-card__text">اپنے پچھلے جائزوں اور غور و فکر کو دیکھیں۔</p>`,
                footerHtml: renderWelcomeActionButton("welcomeHistoryBtn", "history", UI_LABELS.OPEN_ASSESSMENT_HISTORY, "secondary-btn ui-assessment-btn welcome-action-btn")
            })}

            ${renderUICard({
                type: "summary",
                className: "welcome-summary-card dashboard-card dashboard-card--progress",
                title: UI_LABELS.PROGRESS_REVIEW,
                bodyHtml: `<p class="ui-card__text">پچھلے اور تازہ جائزے کا موازنہ دیکھیں۔</p>`,
                footerHtml: renderWelcomeActionButton("welcomeProgressBtn", "progress", UI_LABELS.OPEN_PROGRESS_REVIEW, "secondary-btn ui-assessment-btn welcome-action-btn")
            })}
        </div>`;

    const actionMap = {
        welcomeHistoryBtn: "open-history",
        welcomeProgressBtn: "open-progress"
    };

    Object.entries(actionMap).forEach(([elementId, action]) => {
        const element = document.getElementById(elementId);

        if (element) {
            element.setAttribute("data-action", action);
        }
    });

}

function computeOverallDistribution(questionInsights = []) {

    if (!questionInsights.length) {
        return { always: 0, often: 0, sometimes: 0, never: 0 };
    }

    const totals = questionInsights.reduce((accumulator, question) => {
        accumulator.always += question.distribution?.always || 0;
        accumulator.often += question.distribution?.often || 0;
        accumulator.sometimes += question.distribution?.sometimes || 0;
        accumulator.never += question.distribution?.never || 0;
        return accumulator;
    }, { always: 0, often: 0, sometimes: 0, never: 0 });

    const count = questionInsights.length;

    return {
        always: Number((totals.always / count).toFixed(1)),
        often: Number((totals.often / count).toFixed(1)),
        sometimes: Number((totals.sometimes / count).toFixed(1)),
        never: Number((totals.never / count).toFixed(1))
    };

}

function showHomeDashboardScreen() {

    activateScreen("homeDashboardScreen", {
        announce: "مرکزی صفحہ کھولا گیا"
    });

}

function showQuestionnaireScreen() {

    activateScreen("questionnaireScreen", {
        announce: "سوالنامہ شروع ہوا"
    });

    document.getElementById("questionContainer").innerHTML = "";

}

function showDashboardScreen() {

    activateScreen("dashboardScreen", {
        announce: "جائزے کی رپورٹ دکھائی جا رہی ہے"
    });

}

function showProgressScreen() {

    activateScreen("progressScreen", {
        announce: `${UI_LABELS.PROGRESS_REVIEW} کھولی گئی`
    });

}

function getTrendClassificationLabel(classification) {

    const labels = {
        "Improving": "بہتری",
        "Stable": "مستحکم",
        "Declining": "تنازل",
        "Insufficient Data": "ناکافی معلومات"
    };

    return labels[classification] || classification;

}

function openPersonalHomeDashboard() {

    showHomeDashboardScreen();
    renderPersonalHomeDashboard();

}

function renderPriorityCards(priorities, emptyMessage) {

    if (!priorities?.length) {
        return `<div class="home-empty">${emptyMessage}</div>`;
    }

    return priorities.map(priority => `
        <article class="home-card home-card-compact">
            <strong>${priority.sectionTitle || priority.title}</strong>
            <span>${priority.latestPercentage != null ? formatUrduPercent(priority.latestPercentage) : ""}</span>
        </article>`).join("");

}

function renderInsightCard(label, insight, emptyMessage) {

    if (!insight) {
        return `<div class="home-empty">${emptyMessage}</div>`;
    }

    return `
        <article class="home-card home-card-compact">
            <strong>${label}</strong>
            <span>${insight.title}</span>
            ${insight.deltaPercentage != null ? `<small>${formatUrduPercent(insight.deltaPercentage, { showSign: true })}</small>` : ""}
            ${insight.latestPercentage != null ? `<small>${formatUrduPercent(insight.latestPercentage)}</small>` : ""}
        </article>`;

}

function renderPersonalHomeDashboard() {

    const screen = document.getElementById("homeDashboardScreen");
    const bundle = application.getGrowthBundle();
    const dashboard = getDomainData(bundle.dashboard);
    const insights = getDomainData(bundle.insights);
    const reassessment = getDomainData(bundle.reassessmentPlan);
    const progress = dashboard.progressSinceFirstAssessment;
    const latestSnapshotId = bundle.snapshots[0]?.snapshotId || "";
    const continueLabel = dashboard.hasIncompleteSession
        ? UI_LABELS.CONTINUE_ASSESSMENT
        : UI_LABELS.START_NEW_ASSESSMENT;
    const continueIcon = dashboard.hasIncompleteSession ? UI_ICONS.CONTINUE : UI_ICONS.RESTART;

    screen.innerHTML = `
        <div class="home-dashboard-page">
            ${renderScreenToolbar({
                title: UI_LABELS.OPEN_PERSONAL_HOME,
                backId: "homeBackBtn",
                actionsHtml: `
                    ${renderToolbarAction("homeProgressBtn", UI_ICONS.PROGRESS, UI_LABELS.PROGRESS_REVIEW)}
                    ${renderToolbarAction("homeTimelineBtn", UI_ICONS.HISTORY, UI_LABELS.ASSESSMENT_HISTORY)}`
            })}

            <section class="home-header">
                <p>${dashboard.growthSummary || "Your personal muhasabah summary appears here."}</p>
            </section>

            <div class="home-grid">
                <article class="home-card">
                    <strong>آخری جائزہ</strong>
                    <span class="home-card-value">${dashboard.lastAssessmentDate ? formatAssessmentDate(dashboard.lastAssessmentDate) : "—"}</span>
                </article>
                <article class="home-card">
                    <strong>موجودہ سطح</strong>
                    <span class="home-card-value">${dashboard.currentOverallLevel ? getPerformanceLevelLabel(dashboard.currentOverallLevel) : "—"}</span>
                    <span class="home-card-meta">${dashboard.currentOverallPercentage != null ? formatUrduPercent(dashboard.currentOverallPercentage) : ""}</span>
                </article>
                <article class="home-card">
                    <strong>پہلے جائزے سے پیش رفت</strong>
                    <span class="home-card-value">${progress?.deltaPercentage != null ? formatUrduPercent(progress.deltaPercentage, { showSign: true }) : "—"}</span>
                    <span class="home-card-meta">${progress ? `${formatUrduPercent(progress.firstPercentage)} ← ${formatUrduPercent(progress.latestPercentage)}` : "مزید جائزوں کی ضرورت"}</span>
                </article>
                <article class="home-card">
                    <strong>اگلے جائزے کی تجویز</strong>
                    <span class="home-card-value">${reassessment.recommendedDate ? formatAssessmentDate(reassessment.recommendedDate) : `${reassessment.recommendedDays || dashboard.suggestedReassessmentDays || 30} دن`}</span>
                    <span class="home-card-meta">${reassessment.reasonUrdu || ""}</span>
                </article>
            </div>

            <section class="home-section">
                <h3>سب سے پہلے اس پر توجہ دیں</h3>
                <div class="home-card-list">${renderPriorityCards(dashboard.currentPriorities, "ابھی کوئی خاص توجہ تجویز نہیں ہوئی۔")}</div>
            </section>

            <section class="home-section">
                <h3>آپ کے لیے مشورہ</h3>
                <div class="home-grid home-grid-insights">
                    ${renderInsightCard("سب سے زیادہ بہتری", insights.biggestImprovement, "—")}
                    ${renderInsightCard("سب سے مستحکم شعبہ", insights.mostConsistentArea, "—")}
                    ${renderInsightCard("صبر کی ضرورت", insights.areaNeedingPatience, "—")}
                    ${renderInsightCard("اگلی توجہ", insights.suggestedNextFocus, "—")}
                </div>
            </section>

            <section class="home-section">
                <h3>دوبارہ جائزے کا منصوبہ</h3>
                <div class="home-plan-card">
                    <p><strong>تجویز کردہ تاریخ:</strong> ${reassessment.recommendedDate ? formatAssessmentDate(reassessment.recommendedDate) : "—"}</p>
                    <p><strong>وجہ:</strong> ${reassessment.reasonUrdu || "—"}</p>
                    <p><strong>مستقل مزاجی:</strong> ${reassessment.consistencyScore != null ? formatUrduPercent(reassessment.consistencyScore) : "—"}</p>
                    <p><strong>جائزے کا اوسط فاصلہ:</strong> ${reassessment.assessmentFrequency?.averageDaysBetween != null ? `${reassessment.assessmentFrequency.averageDaysBetween} دن` : "—"}</p>
                </div>
            </section>

            <section class="home-section">
                <h3>ذاتی غور و فکر</h3>
                <form id="journalForm" class="journal-form">
                    <label>
                        عنوان
                        <input type="text" id="journalTitle" name="title" maxlength="120">
                    </label>
                    <label>
                        غور و فکر
                        <textarea id="journalNotes" name="notes" rows="3"></textarea>
                    </label>
                    <label>
                        سیکھے ہوئے اسباق
                        <textarea id="journalLessons" name="lessonsLearned" rows="2"></textarea>
                    </label>
                    <label>
                        بہتری کے ارادے
                        <textarea id="journalIntentions" name="intentions" rows="2"></textarea>
                    </label>
                    <input type="hidden" id="journalLinkedSnapshot" value="${latestSnapshotId}">
                    <button type="submit" class="primary-btn">غور و فکر محفوظ کریں</button>
                </form>
            </section>

            <div class="home-actions">
                <button type="button" id="homeContinueAssessmentBtn" class="primary-btn btn-with-icon full-width-btn">
                    <span class="btn-icon" aria-hidden="true">${continueIcon}</span>
                    <span>${continueLabel}</span>
                </button>
            </div>
        </div>`;

    document.getElementById("homeBackBtn")?.addEventListener("click", showWelcomeScreen);
    document.getElementById("homeTimelineBtn")?.addEventListener("click", openAssessmentHistory);
    document.getElementById("homeProgressBtn")?.addEventListener("click", openProgressJourney);
    document.getElementById("homeContinueAssessmentBtn")?.addEventListener("click", () => {
        if (dashboard.hasIncompleteSession) {
            continueQuestionnaire();
            return;
        }

        startQuestionnaire();
    });
    document.getElementById("journalForm")?.addEventListener("submit", handleJournalFormSubmit);

}

function handleJournalFormSubmit(event) {

    event.preventDefault();

    const result = application.saveJournalEntry({
        title: document.getElementById("journalTitle")?.value || "",
        notes: document.getElementById("journalNotes")?.value || "",
        lessonsLearned: document.getElementById("journalLessons")?.value || "",
        intentions: document.getElementById("journalIntentions")?.value || "",
        linkedSnapshotId: document.getElementById("journalLinkedSnapshot")?.value || null
    });

    if (result?.code !== "Success") {
        window.alert(result?.message || STORAGE_USER_MESSAGES.generic);
        refreshStorageStatusBanner();
        return;
    }

    clearLastStorageIssue();
    refreshStorageStatusBanner();
    document.getElementById("journalForm")?.reset();
    announceToScreenReader("آپ کی غور و فکر محفوظ ہو گئی ہے");
    showAppStatus("آپ کی غور و فکر محفوظ ہو گئی ہے۔");
    window.setTimeout(() => showAppStatus(""), 4000);

}

function openMaiyaarInsights() {

    if (!IS_ADMIN_MODE) {
        return;
    }

    progressInsightsTab = "maiyaar";
    openProgressJourney();

}

function openProgressJourney() {

    if (!IS_ADMIN_MODE) {
        progressInsightsTab = "personal";
    }

    showProgressScreen();
    renderGrowthJourney();

}

function getDifficultyLabel(difficulty) {

    const labels = {
        low: "آسان",
        moderate: "درمیانہ",
        high: "زیادہ محنت"
    };

    return labels[difficulty] || difficulty || "";

}

function renderStructuredList(items, emptyMessage) {

    if (!items?.length) {
        return `<div class="progress-empty">${emptyMessage}</div>`;
    }

    return items.map(item => `
        <article class="progress-section-card">
            <div class="progress-section-title">${item.sectionTitle || item.title || item.message || "—"}</div>
            ${item.latestPercentage != null
                ? `<div class="progress-section-metrics"><span>تازہ: ${formatUrduPercent(item.latestPercentage)}</span>${item.deltaPercentage != null ? `<strong>${formatUrduPercent(item.deltaPercentage, { showSign: true })}</strong>` : ""}</div>`
                : ""}
            ${item.classification
                ? `<div class="progress-section-label">${getTrendClassificationLabel(item.classification)}</div>`
                : ""}
            ${item.estimatedImprovementDifficulty
                ? `<div class="progress-section-meta">مشکل: ${getDifficultyLabel(item.estimatedImprovementDifficulty)}</div>`
                : ""}
        </article>`).join("");

}

function getFeedbackCategoryLabel(category) {

    const labels = {
        progress_summary: "مجموعی خلاصہ",
        positive_reinforcement: "مثبت رجحان",
        stable_encouragement: "مستحکم شعبے",
        gentle_reminder: "آہستہ یاد دہانی",
        priority_explanation: "اولویت کی وضاحت",
        reassessment: "اگلا جائزہ"
    };

    return labels[category] || category;

}

function renderDistributionRow(label, value) {

    return `
        <div class="community-distribution-row">
            <span class="community-distribution-label">${escapeHtml(label)}</span>
            <span class="community-distribution-value">${value != null ? `${value}%` : "—"}</span>
        </div>`;

}

function renderDistributionBlock(distribution = {}) {

    return `
        <div class="community-distribution">
            ${renderDistributionRow("Always", distribution.always)}
            ${renderDistributionRow("Often", distribution.often)}
            ${renderDistributionRow("Sometimes", distribution.sometimes)}
            ${renderDistributionRow("Never", distribution.never)}
        </div>`;

}

function renderCommunityInsightsPanel(maiyaarInsightsInput) {

    const insights = maiyaarInsightsInput || getDomainData(application.getGrowthBundle().maiyaarInsights);
    const assessmentCount = insights.assessmentCount || 0;

    if (!insights.hasSufficientData || assessmentCount < 1) {
        return `
            <section class="ui-card ui-card--status">
                <div class="ui-card__body">
                    <p class="ui-empty">${UI_LABELS.EMPTY_INSIGHTS}</p>
                </div>
            </section>`;
    }

    const questionInsights = insights.questionInsights || [];
    const sectionInsights = insights.sectionInsights || [];
    const practiceInsights = insights.practiceInsights || [];
    const implementationTrends = insights.implementationTrends || [];
    const overallDistribution = computeOverallDistribution(questionInsights);
    const topPracticed = [...questionInsights]
        .sort((left, right) => (right.distribution?.always || 0) - (left.distribution?.always || 0))
        .slice(0, 10);
    const leastPracticed = [...questionInsights]
        .sort((left, right) => (right.distribution?.never || 0) - (left.distribution?.never || 0))
        .slice(0, 10);
    const improvingPractices = implementationTrends.filter(item => item.trend === "improving").slice(0, 10);
    const decliningPractices = implementationTrends.filter(item => item.trend === "declining").slice(0, 10);
    const snapshotPractices = practiceInsights.slice(0, 12);

    return `
        <section class="ui-card ui-card--summary">
            <header class="ui-card__header">
                <span class="ui-card__kicker">Anonymous Aggregated Patterns</span>
                <h3 class="ui-card__title">${UI_LABELS.MAIYAAR_INSIGHTS}</h3>
            </header>
            <div class="ui-card__body">
                <p class="ui-card__text">Understanding how well the teachings are actually being practiced across ${assessmentCount} completed assessment${assessmentCount === 1 ? "" : "s"}. No individual answers are shown.</p>
            </div>
        </section>

        ${renderUICard({
            type: "insight",
            title: "Overall Implementation Distribution",
            bodyHtml: renderDistributionBlock(overallDistribution)
        })}

        <div class="dashboard-grid dashboard-grid--split">
            ${renderUICard({
                type: "trend",
                title: "Top 10 Most Practiced Teachings",
                bodyHtml: renderRankedQuestionList(topPracticed, "always")
            })}
            ${renderUICard({
                type: "trend",
                title: "Top 10 Least Practiced Teachings",
                bodyHtml: renderRankedQuestionList(leastPracticed, "never")
            })}
        </div>

        <div class="dashboard-grid dashboard-grid--split">
            ${renderUICard({
                type: "summary",
                title: "Practices Improving Over Time",
                bodyHtml: renderPracticeTrendList(improvingPractices, "No improving practices identified yet.")
            })}
            ${renderUICard({
                type: "summary",
                title: "Practices Declining",
                bodyHtml: renderPracticeTrendList(decliningPractices, "No declining practices identified yet.")
            })}
        </div>

        ${renderUICard({
            type: "insight",
            title: "Section-wise Implementation",
            bodyHtml: `
                <div class="ui-stack">
                    ${sectionInsights.length
                        ? sectionInsights.map(section => `
                            <article class="ui-list-card">
                                <div class="ui-list-card__title">${escapeHtml(section.sectionTitle)}</div>
                                <div class="ui-list-card__meta">${escapeHtml(section.implementationStatusLabel || section.implementationStatus || "")}</div>
                                ${renderDistributionBlock(section.distribution)}
                            </article>`).join("")
                        : `<p class="ui-empty">No section data available.</p>`}
                </div>`
        })}

        ${renderUICard({
            type: "status",
            title: "Community Implementation Snapshot",
            bodyHtml: `
                <div class="ui-stack ui-stack--compact">
                    ${snapshotPractices.length
                        ? snapshotPractices.map(practice => `
                            <article class="ui-list-card">
                                <div class="ui-list-card__title">${escapeHtml(practice.practiceName)}</div>
                                ${renderDistributionBlock(practice.distribution)}
                            </article>`).join("")
                        : `<p class="ui-empty">No practice snapshot available.</p>`}
                </div>`
        })}`;

}

function renderRankedQuestionList(questions, metricKey) {

    if (!questions.length) {
        return `<p class="ui-empty">No data available yet.</p>`;
    }

    return `
        <ol class="ui-ranked-list">
            ${questions.map((question, index) => `
                <li class="ui-ranked-list__item">
                    <span class="ui-ranked-list__rank">${index + 1}</span>
                    <div class="ui-ranked-list__content">
                        <strong>${escapeHtml(question.questionText)}</strong>
                        <span>${metricKey === "always" ? "Always" : "Never"}: ${question.distribution?.[metricKey] ?? 0}%</span>
                    </div>
                </li>`).join("")}
        </ol>`;

}

function renderPracticeTrendList(trends, emptyMessage) {

    if (!trends.length) {
        return `<p class="ui-empty">${emptyMessage}</p>`;
    }

    return `
        <ul class="ui-ranked-list ui-ranked-list--plain">
            ${trends.map(trend => `
                <li class="ui-ranked-list__item">
                    <div class="ui-ranked-list__content">
                        <strong>${escapeHtml(trend.practiceName)}</strong>
                        <span>Always: ${trend.firstPeriod?.distribution?.always ?? "—"}% → ${trend.latestPeriod?.distribution?.always ?? "—"}%</span>
                    </div>
                </li>`).join("")}
        </ul>`;

}

function renderPersonalProgressPanel(bundle) {

    const dashboard = getDomainData(bundle.growthDashboard);
    const overview = dashboard.overview || {};
    const assessmentCount = overview.assessmentCount || 0;

    if (assessmentCount < 1) {
        return `
            <section class="empty-state-card">
                <p>${UI_LABELS.EMPTY_PROGRESS}</p>
            </section>`;
    }

    const overallTrend = overview.overallTrend || {};
    const latestAssessment = overview.latestAssessment;
    const firstAssessment = overview.firstAssessment;
    const feedback = dashboard.feedbackSummary || {};
    const sectionTrends = dashboard.sectionTrends || [];
    const nextFocus = (dashboard.recommendedFocus || [])[0]
        || (dashboard.thisWeeksPriority || [])[0]
        || null;
    const consistencyScore = dashboard.consistencyScore ?? overview.assessmentFrequency?.consistencyScore;
    const averageDaysBetween = overview.assessmentFrequency?.averageDaysBetween;

    const sectionMarkup = sectionTrends.length
        ? sectionTrends.map(section => `
            <article class="progress-section-card">
                <div class="progress-section-title">${section.title}</div>
                <div class="progress-section-metrics">
                    <span>${formatAssessmentComparison(section.firstPercentage, section.latestPercentage)}</span>
                    ${section.deltaPercentage != null
                        ? `<strong>${formatUrduPercent(section.deltaPercentage, { showSign: true })}</strong>`
                        : ""}
                </div>
                <div class="progress-section-label">${getTrendClassificationLabel(section.classification)}</div>
            </article>`).join("")
        : `<div class="progress-empty">ابھی شعبہ وار موازنہ کے لیے کافی جائزے موجود نہیں ہیں۔</div>`;

    const nextStepMarkup = nextFocus
        ? `
            <article class="progress-section-card">
                <div class="progress-section-title">${nextFocus.sectionTitle || nextFocus.title || nextFocus.message || "—"}</div>
                ${nextFocus.latestPercentage != null
                    ? `<div class="progress-section-meta">موجودہ: ${formatUrduPercent(nextFocus.latestPercentage)}</div>`
                    : ""}
                ${nextFocus.message && (nextFocus.sectionTitle || nextFocus.title)
                    ? `<div class="progress-section-meta">${nextFocus.message}</div>`
                    : ""}
            </article>`
        : `<div class="progress-empty">اگلے قدم کے لیے مزید جائزے مکمل کریں۔</div>`;

    const consistencyMarkup = consistencyScore != null || averageDaysBetween != null
        ? `
            <div class="progress-grid progress-grid--compact">
                ${consistencyScore != null
                    ? `<article class="progress-card"><strong>استقلال</strong><span class="progress-card-value">${formatUrduPercent(consistencyScore)}</span></article>`
                    : ""}
                ${averageDaysBetween != null
                    ? `<article class="progress-card"><strong>جائزوں کا وقفہ</strong><span class="progress-card-value">${averageDaysBetween} دن</span></article>`
                    : ""}
            </div>`
        : `<div class="progress-empty">استقلال کے لیے مزید جائزے درکار ہیں۔</div>`;

    return `
        <section class="progress-header">
            <p>${feedback.summary || overview.trendSummary || "آپ کے محفوظ جائزوں کا مختصر خلاصہ۔"}</p>
        </section>

        <section class="progress-sections">
            <h3>آپ کی مجموعی پیش رفت</h3>
            <div class="progress-grid progress-grid--compact">
                <article class="progress-card">
                    <strong>پچھلا جائزہ</strong>
                    <span class="progress-card-value">${firstAssessment ? formatUrduPercent(firstAssessment.overallPercentage) : "—"}</span>
                    <span class="progress-card-meta">${firstAssessment ? formatAssessmentDate(firstAssessment.createdAt) : "—"}</span>
                </article>
                <article class="progress-card">
                    <strong>تازہ جائزہ</strong>
                    <span class="progress-card-value">${latestAssessment ? formatUrduPercent(latestAssessment.overallPercentage) : "—"}</span>
                    <span class="progress-card-meta">${latestAssessment ? formatAssessmentDate(latestAssessment.createdAt) : "—"}</span>
                </article>
                <article class="progress-card progress-card--wide">
                    <strong>مجموعی تبدیلی</strong>
                    <span class="progress-card-value">${getTrendClassificationLabel(overallTrend.classification || "Insufficient Data")}</span>
                    <span class="progress-card-meta">${overallTrend.deltaPercentage != null ? `${formatUrduPercent(overallTrend.deltaPercentage, { showSign: true })} تبدیلی` : "مزید جائزوں کی ضرورت"}</span>
                </article>
            </div>
        </section>

        <section class="progress-sections">
            <h3>شعبوں میں پیش رفت</h3>
            <div class="progress-section-list">${sectionMarkup}</div>
        </section>

        <section class="progress-sections">
            <h3>آپ کا استقلال</h3>
            ${consistencyMarkup}
        </section>

        <section class="progress-sections">
            <h3>اگلا قدم</h3>
            <div class="progress-section-list">${nextStepMarkup}</div>
        </section>

        <section class="progress-sections">
            <h3>خلاصہ</h3>
            <div class="progress-section-card">
                <div class="progress-section-title">${feedback.summary || overview.trendSummary || "آپ کے جائزوں کا خلاصہ یہاں ظاہر ہوگا۔"}</div>
            </div>
        </section>`;

}

function renderInsightsTabBar(activeTab) {

    return `
        <div class="insights-tab-bar" role="tablist" aria-label="Insights and trends sections">
            <button type="button"
                id="insightsPersonalTab"
                class="insights-tab${activeTab === "personal" ? " is-active" : ""}"
                role="tab"
                aria-selected="${activeTab === "personal"}"
                aria-controls="insightsPersonalPanel"
                tabindex="${activeTab === "personal" ? "0" : "-1"}">
                Personal
            </button>
            <button type="button"
                id="insightsMaiyaarTab"
                class="insights-tab${activeTab === "maiyaar" ? " is-active" : ""}"
                role="tab"
                aria-selected="${activeTab === "maiyaar"}"
                aria-controls="insightsMaiyaarPanel"
                tabindex="${activeTab === "maiyaar" ? "0" : "-1"}">
                ${UI_LABELS.MAIYAAR_INSIGHTS}
            </button>
        </div>`;

}

function bindInsightsTabHandlers() {

    const tabs = [
        { id: "insightsPersonalTab", tab: "personal" },
        { id: "insightsMaiyaarTab", tab: "maiyaar" }
    ];

    tabs.forEach(({ id, tab }) => {
        const element = document.getElementById(id);

        if (!element) {
            return;
        }

        element.addEventListener("click", () => {
            progressInsightsTab = tab;
            renderGrowthJourney();
        });

        element.addEventListener("keydown", (event) => {
            if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
                return;
            }

            event.preventDefault();
            progressInsightsTab = tab === "personal" ? "maiyaar" : "personal";
            renderGrowthJourney();
            document.getElementById(progressInsightsTab === "personal" ? "insightsPersonalTab" : "insightsMaiyaarTab")?.focus();
        });
    });

}

function renderGrowthJourney() {

    const progressScreen = document.getElementById("progressScreen");
    const bundle = application.getGrowthBundle();
    const activeTab = IS_ADMIN_MODE ? progressInsightsTab : "personal";
    const maiyaarInsights = getDomainData(bundle.maiyaarInsights);
    const panelContent = IS_ADMIN_MODE && activeTab === "maiyaar"
        ? renderCommunityInsightsPanel(maiyaarInsights)
        : renderPersonalProgressPanel(bundle);
    const tabBarMarkup = IS_ADMIN_MODE ? renderInsightsTabBar(activeTab) : "";
    const adminPanelMarkup = IS_ADMIN_MODE
        ? `
            <div id="insightsMaiyaarPanel"
                class="insights-tab-panel${activeTab === "maiyaar" ? " is-active" : ""}"
                role="tabpanel"
                aria-labelledby="insightsMaiyaarTab"
                ${activeTab === "maiyaar" ? "" : 'hidden'}>
                ${activeTab === "maiyaar" ? panelContent : ""}
            </div>`
        : "";

    progressScreen.innerHTML = `
        <div class="progress-page">
            ${renderScreenToolbar({
                title: UI_LABELS.PROGRESS_REVIEW,
                backId: "progressBackBtn",
                actionsHtml: renderToolbarAction("progressHistoryBtn", UI_ICONS.HISTORY, UI_LABELS.ASSESSMENT_HISTORY)
            })}

            ${tabBarMarkup}

            <div id="insightsPersonalPanel"
                class="insights-tab-panel${activeTab === "personal" ? " is-active" : ""}"
                role="tabpanel"
                aria-labelledby="insightsPersonalTab"
                ${activeTab === "personal" ? "" : 'hidden'}>
                ${activeTab === "personal" ? panelContent : ""}
            </div>

            ${adminPanelMarkup}
        </div>`;

    document.getElementById("progressBackBtn")?.addEventListener("click", showWelcomeScreen);
    document.getElementById("progressHistoryBtn")?.addEventListener("click", openAssessmentHistory);

    if (IS_ADMIN_MODE) {
        bindInsightsTabHandlers();
    }

}

function renderProgressJourney() {

    renderGrowthJourney();

}

function formatAssessmentDate(isoDate) {

    return new Date(isoDate).toLocaleDateString("ur-PK", {
        year: "numeric",
        month: "long",
        day: "numeric"
    });

}

function showHistoryScreen() {

    activateScreen("historyScreen", {
        announce: `${UI_LABELS.ASSESSMENT_HISTORY} کھولی گئی`
    });

}

function openAssessmentHistory() {

    showHistoryScreen();
    renderAssessmentHistory();

}

function renderAssessmentHistory() {

    const historyScreen = document.getElementById("historyScreen");
    const bundle = application.getGrowthBundle();
    const timeline = getDomainData(bundle.timeline);
    const entries = timeline.entries || [];
    const snapshots = bundle.snapshots || [];

    const listMarkup = entries.length
        ? entries.map(entry => {
            const typeLabel = entry.type === "reflection" ? "غور و فکر" : "جائزہ";
            const percentageMarkup = entry.overallPercentage != null
                ? `<div><strong>مجموعی فیصد</strong><span>${formatUrduPercent(entry.overallPercentage)}</span></div>`
                : "";
            const levelMarkup = entry.overallLevel
                ? `<div><strong>موجودہ سطح</strong><span>${getPerformanceLevelLabel(entry.overallLevel)}</span></div>`
                : "";
            const summaryMarkup = entry.growthSummary
                ? `<p class="timeline-summary">${escapeHtml(entry.growthSummary)}</p>`
                : "";
            const reflectionMarkup = entry.hasReflection && entry.reflectionTitle
                ? `<p class="timeline-reflection"><strong>منسلک غور و فکر:</strong> ${escapeHtml(entry.reflectionTitle)}</p>`
                : "";
            const reflectionBody = entry.reflection
                ? `<div class="timeline-reflection-body">
                        ${entry.reflection.notes ? `<p>${escapeHtml(entry.reflection.notes)}</p>` : ""}
                        ${entry.reflection.lessonsLearned ? `<p><strong>اسباق:</strong> ${escapeHtml(entry.reflection.lessonsLearned)}</p>` : ""}
                        ${entry.reflection.intentions ? `<p><strong>ارادے:</strong> ${escapeHtml(entry.reflection.intentions)}</p>` : ""}
                   </div>`
                : "";

            return `
                <article class="history-item timeline-item timeline-item--${entry.type}" data-entry-id="${entry.entryId}" data-entry-type="${entry.type}">
                    <div class="history-item-meta">
                        <div><strong>قسم</strong><span>${typeLabel}</span></div>
                        <div><strong>تاریخ</strong><span>${formatAssessmentDate(entry.date)}</span></div>
                        ${percentageMarkup}
                        ${levelMarkup}
                    </div>
                    ${summaryMarkup}
                    ${reflectionMarkup}
                    ${reflectionBody}
                    <div class="history-item-actions">
                        ${entry.type === "assessment" && entry.snapshotId
                            ? `<button type="button" class="primary-btn" data-action="view-report" data-snapshot-id="${entry.snapshotId}">رپورٹ دیکھیں</button>`
                            : ""}
                        ${entry.type === "reflection" && entry.journalEntryId
                            ? `<button type="button" class="secondary-btn" data-action="delete-journal" data-journal-id="${entry.journalEntryId}">غور و فکر حذف کریں</button>`
                            : ""}
                        ${entry.type === "assessment" && entry.snapshotId
                            ? `<button type="button" class="secondary-btn" data-action="delete-snapshot" data-snapshot-id="${entry.snapshotId}">جائزہ حذف کریں</button>`
                            : ""}
                    </div>
                </article>`;
        }).join("")
        : `<div class="history-empty">${UI_LABELS.EMPTY_HISTORY}</div>`;

    historyScreen.innerHTML = `
        <div class="history-page">
            ${renderScreenToolbar({
                title: UI_LABELS.ASSESSMENT_HISTORY,
                backId: "historyBackBtn",
                actionsHtml: `
                    ${renderToolbarAction("historyProgressBtn", UI_ICONS.PROGRESS, UI_LABELS.PROGRESS_REVIEW)}
                    ${snapshots.length ? `<button type="button" id="clearHistoryBtn" class="secondary-btn screen-toolbar-action">تاریخ صاف کریں</button>` : ""}`
            })}

            <section class="history-header">
                <p>آپ کے جائزے اور ذاتی غور و فکر ترتیبِ وقت کے ساتھ۔</p>
            </section>

            <div class="history-list timeline-list">
                ${listMarkup}
            </div>
        </div>`;

    document.getElementById("historyBackBtn")?.addEventListener("click", showWelcomeScreen);
    document.getElementById("historyProgressBtn")?.addEventListener("click", openProgressJourney);
    document.getElementById("clearHistoryBtn")?.addEventListener("click", handleClearHistory);
    historyScreen.removeEventListener("click", handleHistoryListClick);
    historyScreen.addEventListener("click", handleHistoryListClick);

}

function showWelcomeScreen() {

    activateScreen("welcomeScreen", {
        announce: "خوش آمدید صفحہ"
    });

    renderWelcomeDashboard();
    renderParticipantSection();

    const focusTarget = document.querySelector("#welcomeDashboard button[data-action], #participantStartBtn");

    if (focusTarget) {
        focusTarget.focus();
    }

}

function handleHistoryListClick(event) {

    const button = event.target.closest("button[data-action]");

    if (!button) {
        return;
    }

    const snapshotId = button.getAttribute("data-snapshot-id");
    const action = button.getAttribute("data-action");

    if (action === "view-report") {
        viewHistoricalReport(snapshotId);
        return;
    }

    if (action === "delete-snapshot") {
        handleDeleteSnapshot(snapshotId);
        return;
    }

    if (action === "delete-journal") {
        handleDeleteJournalEntry(button.getAttribute("data-journal-id"));
    }

}

function viewHistoricalReport(snapshotId) {

    const snapshot = application.getHistoricalSnapshot(snapshotId);
    const report = application.getHistoricalReport(snapshotId);

    if (!snapshot || !report) {
        window.alert(STORAGE_USER_MESSAGES.missingReport);
        renderAssessmentHistory();
        return;
    }

    renderDashboard(report, {
        historical: true,
        snapshot
    });

}

function handleDeleteSnapshot(snapshotId) {

    const confirmed = window.confirm("کیا آپ واقعی یہ جائزہ حذف کرنا چاہتے ہیں؟");

    if (!confirmed) {
        return;
    }

    application.deleteHistoricalSnapshot(snapshotId);
    renderWelcomeDashboard();
    renderAssessmentHistory();

}

function handleDeleteJournalEntry(entryId) {

    const confirmed = window.confirm("کیا آپ واقعی یہ غور و فکر حذف کرنا چاہتے ہیں؟");

    if (!confirmed) {
        return;
    }

    application.deleteJournalEntry(entryId);
    renderAssessmentHistory();

}

function handleClearHistory() {

    const confirmed = window.confirm("کیا آپ واقعی تمام محفوظ جائزے حذف کرنا چاہتے ہیں؟");

    if (!confirmed) {
        return;
    }

    application.clearAssessmentHistory();
    renderWelcomeDashboard();
    renderAssessmentHistory();

}

function restorePersistedState() {

    const result = application.restorePersistedState();

    if (result.type === "restore-report") {
        renderParticipantSection();
        renderWelcomeDashboard();
        renderDashboard(result.report);
        return;
    }

    renderParticipantSection();
    renderWelcomeDashboard();

}

function continueQuestionnaire() {

    if (!application.questionnaireReady || !application.questionnaire.length) {
        return;
    }

    if (!ensureParticipantIdentity()) {
        return;
    }

    showQuestionnaireScreen();
    renderQuestion();
    updateProgress();

}

function restartQuestionnaireFromWelcome() {

    startQuestionnaire();

}

function startQuestionnaire(options = {}) {

    if (!application.questionnaireReady || !application.questionnaire.length) {
        return;
    }

    if (!options.skipParticipantCheck && !ensureParticipantIdentity()) {
        return;
    }

    showQuestionnaireScreen();
    application.restartWorkflow();
    renderQuestion();
    updateProgress();
    application.persistSession();

}

function renderQuestion() {

    if (!application.questionnaire.length) {
        return;
    }

    const question = application.questionnaire[application.currentQuestion];
    const markup = createQuestionMarkup(question);
    const container = document.getElementById("questionContainer");

    container.innerHTML = markup;
    container.scrollTop = 0;

    restoreAnswer(question);
    updateProgress();

}

function createQuestionMarkup(question) {

    const questionKey = application.getQuestionKey(question, application.currentQuestion);
    const hasSavedAnswer = Object.prototype.hasOwnProperty.call(application.answers, questionKey);
    const savedValue = hasSavedAnswer ? Number(application.answers[questionKey]) : null;
    const options = application.getQuestionOptions(question).map(option => {
        const checked = savedValue != null && savedValue === Number(option.value) ? "checked" : "";

        return `
            <label class="option option--card">
                <input type="radio" name="answer" value="${option.value}" ${checked}>
                <span class="option-text">${option.label}</span>
            </label>`;
    }).join("");

    const explanation = question?.explanation || "";
    const explanationMarkup = `
        <div class="question-explanation">
            <button type="button" class="explanation-toggle" aria-expanded="false" aria-controls="questionExplanationPanel">▼ Why is this question asked?</button>
            <div id="questionExplanationPanel" class="explanation-panel" hidden>
                <div class="explanation-body">${explanation}</div>
            </div>
        </div>`;

    return `
        <div class="question-card question-card--zero-scroll">
            <div class="question-id">${question.id || question.standardId || ""}</div>
            <div class="question-text">${question.question}</div>
            ${explanationMarkup}
            <fieldset class="answers answers--grid">
                <legend class="visually-hidden">جواب منتخب کریں</legend>
                ${options}
            </fieldset>
            <div class="answer-validation" role="alert" aria-live="assertive" hidden>${ANSWER_VALIDATION_MESSAGE}</div>
            <div class="question-card__nav navigation" role="toolbar" aria-label="Question navigation">
                <button type="button" id="previousBtn" class="secondary-btn" aria-label="Previous question">${UI_LABELS.NAV_PREVIOUS}</button>
                <button type="button" id="nextBtn" class="primary-btn" aria-label="Next question">${UI_LABELS.NAV_NEXT}</button>
            </div>
        </div>`;

}

function clearAnswerValidation() {

    const container = document.getElementById("questionContainer");

    if (!container) {
        return;
    }

    const questionCard = container.querySelector(".question-card");
    const validationMessage = container.querySelector(".answer-validation");

    if (questionCard) {
        questionCard.classList.remove("question-card--validation");
    }

    if (validationMessage) {
        validationMessage.hidden = true;
    }

}

function showAnswerValidation() {

    const container = document.getElementById("questionContainer");

    if (!container) {
        return;
    }

    const questionCard = container.querySelector(".question-card");
    const validationMessage = container.querySelector(".answer-validation");

    if (questionCard) {
        questionCard.classList.add("question-card--validation");
    }

    if (validationMessage) {
        validationMessage.hidden = false;
    }

}

function handleAnswerSelection(event) {

    const input = event.target;

    if (!input.matches("input[name='answer']")) {
        return;
    }

    application.recordAnswer(application.currentQuestion, input.value);
    application.persistAnswersAndSession();
    clearAnswerValidation();
    updateProgress();

}

function handleExplanationToggle(event) {

    const toggle = event.target.closest(".explanation-toggle");

    if (!toggle) {
        return;
    }

    event.preventDefault();

    const panelId = toggle.getAttribute("aria-controls");
    const panel = panelId ? document.getElementById(panelId) : toggle.nextElementSibling;

    if (!panel) {
        return;
    }

    const isExpanded = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!isExpanded));
    panel.hidden = isExpanded;

}

function restoreAnswer(question) {

    const questionKey = application.getQuestionKey(question, application.currentQuestion);
    const hasSavedAnswer = Object.prototype.hasOwnProperty.call(application.answers, questionKey);
    const savedValue = hasSavedAnswer ? Number(application.answers[questionKey]) : null;
    const radios = document.querySelectorAll("#questionContainer input[name='answer']");

    radios.forEach(radio => {
        radio.checked = savedValue != null && Number(radio.value) === savedValue;
    });

}

function nextQuestion() {

    const question = application.questionnaire[application.currentQuestion];

    if (!question) {
        return;
    }

    if (application.getQuestionRequired(question) && !application.isCurrentQuestionAnswered()) {
        showAnswerValidation();
        return;
    }

    clearAnswerValidation();

    const navigationResult = application.advanceQuestion();

    if (navigationResult === "continue") {
        renderQuestion();
        return;
    }

    submitQuestionnaire();

}

function previousQuestion() {

    if (application.goToPreviousQuestion()) {
        renderQuestion();
    }

}

function updateProgress() {

    const totalQuestions = application.questionnaire.length || 0;
    const currentNumber = totalQuestions ? application.currentQuestion + 1 : 0;

    document.getElementById("currentQuestion").textContent = currentNumber;
    document.getElementById("totalQuestions").textContent = totalQuestions;

    const progressBar = document.getElementById("progressBar");
    progressBar.max = totalQuestions;
    progressBar.value = currentNumber;

    const percentage = totalQuestions ? Math.round((currentNumber / totalQuestions) * 100) : 0;
    document.getElementById("percentage").textContent = formatUrduPercent(percentage);

    const nextButton = document.getElementById("nextBtn");
    const previousButton = document.getElementById("previousBtn");

    if (nextButton) {
        nextButton.textContent = application.currentQuestion === totalQuestions - 1
            ? UI_LABELS.NAV_FINISH
            : UI_LABELS.NAV_NEXT;
        nextButton.setAttribute(
            "aria-label",
            application.currentQuestion === totalQuestions - 1 ? "Finish assessment" : "Next question"
        );
    }

    if (previousButton) {
        previousButton.textContent = UI_LABELS.NAV_PREVIOUS;
    }

}

function getPerformanceLevelLabel(level) {

    const labels = {
        "Excellent": "انتہائی ممتاز",
        "Very Good": "بہت اچھا",
        "Good": "اچھا",
        "Needs Improvement": "بہتری کی ضرورت",
        "Critical": "تشویشناک"
    };

    return labels[level] || level;

}

function submitQuestionnaire() {

    const report = application.completeAssessment();
    renderWelcomeDashboard();
    renderParticipantSection();
    refreshStorageStatusBanner();
    renderDashboard(report);
    return report;

}

function handleGrowthGroupToggle(event) {

    const toggle = event.target.closest(".growth-group-toggle");

    if (!toggle) {
        return;
    }

    event.preventDefault();

    const panel = toggle.nextElementSibling;

    if (!panel || !panel.classList.contains("growth-group-panel")) {
        return;
    }

    const isExpanded = toggle.getAttribute("data-expanded") === "true";
    toggle.setAttribute("data-expanded", String(!isExpanded));
    panel.style.display = isExpanded ? "none" : "block";

}

function renderDashboard(report, options = {}) {

    const isHistorical = options.historical === true;
    const snapshot = options.snapshot || null;

    showDashboardScreen();

    const dashboard = document.getElementById("dashboardScreen");
    const overall = report.assessment.overall;
    const presentation = isHistorical && snapshot
        ? application.getHistoricalDashboardPresentation(report, snapshot)
        : application.getDashboardPresentation(report);
    const { reportSections, insights, rawScores } = presentation;
    const overallScoreLabel = rawScores.overall.max
        ? `${rawScores.overall.raw}/${rawScores.overall.max}`
        : formatUrduPercent(overall.percentage);
    const assessmentDate = isHistorical && snapshot
        ? formatAssessmentDate(snapshot.createdAt)
        : new Date().toLocaleDateString("ur-PK", {
            year: "numeric",
            month: "long",
            day: "numeric"
        });

    const strongestSection = insights.strongestSection || { title: "—", percentage: 0 };
    const growthSection = insights.growthSection || { title: "—", percentage: 0 };
    const overallLevelLabel = getPerformanceLevelLabel(overall.level);
    const reportParticipant = report.participant || application.getCurrentParticipant();
    const participantMarkup = reportParticipant
        ? `
                    <div>
                        <strong>شرکت کنندہ</strong>
                        <span>${escapeHtml(reportParticipant.name)}</span>
                    </div>
                    <div>
                        <strong>موبائل</strong>
                        <span dir="ltr">${escapeHtml(reportParticipant.mobile)}</span>
                    </div>`
        : "";

    const sectionMarkup = reportSections.map(section => {
        const sectionClass = section.percentage >= 75 ? "strong-section" : section.percentage < 60 ? "weak-section" : "";
        const sectionLevel = getPerformanceLevelLabel(section.level || "Critical");
        const sectionInterpretation = (insights.sections.find(item => item.title === section.title) || {}).interpretation || "";

        return `
            <div class="report-section-card ${sectionClass}">
                <div class="report-section-row">
                    <div><strong>${section.title}</strong></div>
                    <div>${formatUrduPercent(section.percentage)}</div>
                    <div>${sectionLevel}</div>
                </div>
                <div class="report-section-bar"><span style="width:${Math.max(4, section.percentage)}%"></span></div>
                <p class="report-section-interpretation">${sectionInterpretation}</p>
            </div>`;
    }).join("");

    const reportHubActions = `
                ${renderQuickActionButton("openProgressFromReportBtn", UI_ICONS.PROGRESS, UI_LABELS.PROGRESS_REVIEW, "ui-quick-action-btn")}
                ${renderQuickActionButton("openHistoryFromReportBtn", UI_ICONS.HISTORY, UI_LABELS.ASSESSMENT_HISTORY, "ui-quick-action-btn")}
                ${renderQuickActionButton("printFromReportBtn", UI_ICONS.PRINT, UI_LABELS.PRINT_REPORT, "ui-quick-action-btn")}
                ${renderQuickActionButton("restartFromReportBtn", UI_ICONS.RESTART, UI_LABELS.START_NEW_ASSESSMENT, "primary-btn ui-assessment-btn")}`;

    const adminReportAction = IS_ADMIN_MODE
        ? renderQuickActionButton("openMaiyaarFromReportBtn", UI_ICONS.INSIGHTS, UI_LABELS.MAIYAAR_INSIGHTS, "ui-quick-action-btn")
        : "";

    dashboard.innerHTML = `
        <div class="dashboard-report">
            ${renderScreenToolbar({
                title: isHistorical ? UI_LABELS.ASSESSMENT_HISTORY : "آپ کی رپورٹ",
                backId: isHistorical ? "historyReportToolbarBackBtn" : "reportBackBtn",
                actionsHtml: `<button type="button" id="printBtn" class="primary-btn btn-with-icon no-print">${UI_ICONS.PRINT} ${UI_LABELS.PRINT_REPORT}</button>`,
                printable: true
            })}

            <section class="report-card report-cover">
                <h1>معیار</h1>
                <h2>محاسبۂ نفس</h2>
                <h3>بر اساس معیارِ مطلوب</h3>
                <div class="report-metrics">
                    ${participantMarkup}
                    <div>
                        <strong>تاریخِ جائزہ</strong>
                        <span>${assessmentDate}</span>
                    </div>
                    <div>
                        <strong>مجموعی فیصد</strong>
                        <span>${formatUrduPercent(overall.percentage)}</span>
                    </div>
                    <div>
                        <strong>موجودہ سطح</strong>
                        <span>${overallLevelLabel}</span>
                    </div>
                </div>
            </section>

            <section class="report-card report-card-blue">
                <div class="report-card-head"><span class="report-card-icon">📊</span><h3>آپ کا مجموعی نتیجہ</h3></div>
                <div class="report-metrics">
                    <div>
                        <strong>مجموعی نمبر</strong>
                        <span>${overallScoreLabel}</span>
                    </div>
                    <div>
                        <strong>سطح</strong>
                        <span>${overallLevelLabel}</span>
                    </div>
                </div>
                <p class="report-summary-text">${insights.overallSummary}</p>
            </section>

            <section class="report-card report-card-green">
                <div class="report-card-head"><span class="report-card-icon">🎯</span><h3>معیارِ مطلوب</h3></div>
                <p class="report-summary-text benchmark-intro">یہ جائزہ معیارِ مطلوب کی روشنی میں ترتیب دیا گیا ہے۔ یہ آپ کے جوابات کو مختلف شعبوں میں سمجھنے میں مدد دیتا ہے۔</p>
            </section>

            <section class="report-card report-card-blue">
                <div class="report-card-head"><span class="report-card-icon">📈</span><h3>ہر شعبے کا جائزہ</h3></div>
                <div class="report-section-list">
                    ${sectionMarkup}
                </div>
            </section>

            <section class="report-card report-card-green">
                <div class="report-card-head"><span class="report-card-icon">✅</span><h3>آپ کے مضبوط شعبے</h3></div>
                <div class="report-highlight-card">
                    <div class="report-highlight-title">${strongestSection.title}</div>
                    <div class="report-highlight-value">${formatUrduPercent(strongestSection.percentage)}</div>
                    <p class="report-summary-text">${insights.strongestSectionExplanation}</p>
                </div>
            </section>

            <section class="report-card report-card-orange">
                <div class="report-card-head"><span class="report-card-icon">🌱</span><h3>جہاں بہتری کی گنجائش ہے</h3></div>
                <div class="report-section-list">
                    <div class="report-section-row">
                        <div><strong>${growthSection.title}</strong></div>
                        <div>${formatUrduPercent(growthSection.percentage)}</div>
                    </div>
                    <p class="report-summary-text">${insights.growthSectionExplanation}</p>
                </div>
            </section>

            <section class="report-card report-card-red">
                <div class="report-card-head"><span class="report-card-icon">📝</span><h3>جن باتوں پر غور کریں</h3></div>
                <div class="report-section-list">
                    ${(insights.growthQuestionGroups || []).length
                        ? insights.growthQuestionGroups.map(group => `
                            <div class="growth-group">
                                <button class="growth-group-toggle" type="button" data-expanded="false">${group.sectionName}</button>
                                <div class="growth-group-panel" style="display:none;">
                                    ${group.questions.map(question => `
                                        <div class="question-insight-card">
                                            <div class="question-insight-meta">
                                                <div><strong>سوال نمبر:</strong> ${question.questionNumber}</div>
                                                <div><strong>آپ کا جواب:</strong> ${question.selectedAnswer}</div>
                                            </div>
                                            <div class="question-insight-label">سوال</div>
                                            <div class="question-insight-text">${question.questionText}</div>
                                            <div class="question-insight-label">یہ سوال کس چیز کا جائزہ لیتا ہے؟</div>
                                            <div class="question-insight-body">${question.explanation}</div>
                                            <div class="question-insight-label">عملی بہتری</div>
                                            <div class="question-insight-body">${question.improvement}</div>
                                        </div>`).join("")}
                                </div>
                            </div>`).join("")
                        : '<p class="report-summary-text">یہ حصے کے لیے فی الحال کوئی سوالات دکھانے کی ضرورت نہیں۔</p>'}
                </div>
            </section>

            <section class="report-card report-card-green">
                <div class="report-card-head"><span class="report-card-icon">🧭</span><h3>اگلے 30 دن کے لیے</h3></div>
                <ul class="report-checklist">
                    ${insights.actionPlan.map(item => `<li>${item}</li>`).join("")}
                </ul>
            </section>

            <section class="report-card report-card-orange">
                <div class="report-card-head"><span class="report-card-icon">🤲</span><h3>غور و فکر</h3></div>
                <ul class="report-reflection-list">
                    <li>اس رپورٹ کا کون سا حصہ آپ کو سب سے زیادہ متاثر کر گیا؟</li>
                    <li>آپ اپنی زندگی میں سب سے پہلے کس شعبے میں بہتری لانا چاہتے ہیں؟</li>
                    <li>آئندہ 30 دن کے لیے آپ کا ایک اہم عزم کیا ہے؟</li>
                </ul>
            </section>

            <section class="report-card report-card-blue">
                <div class="report-card-head"><span class="report-card-icon">🙏</span><h3>دعا</h3></div>
                <p class="report-summary-text report-summary-text--emphasis">
                    رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا وَهَبْ لَنَا مِن لَّدُنكَ رَحْمَةً ۚ إِنَّكَ أَنتَ الْوَهَّابُ
                </p>
                <p class="report-summary-text">
                    اے ہمارے رب! ہمیں ہدایت دینے کے بعد ہمارے دلوں کو ٹیڑھا نہ ہونے دے، اور ہمیں اپنی خاص رحمت عطا فرما، بے شک تو ہی سب سے زیادہ عطا فرمانے والا ہے۔
                </p>
                <p class="report-summary-text">(سورۃ آل عمران: 8)</p>
            </section>

            <section class="report-card report-footer">
                <div class="report-card-head"><span class="report-card-icon">✦</span><h3>معیار</h3></div>
                <p class="report-summary-text">معیار<br>اسلامی محاسبۂ نفس<br>ورژن ${APP_VERSION}</p>
            </section>

            <nav class="report-hub-nav no-print" aria-label="رپورٹ نیویگیشن">
                ${reportHubActions}
                ${adminReportAction}
            </nav>
        </div>`;

    dashboard.removeEventListener("click", handleGrowthGroupToggle);
    dashboard.addEventListener("click", handleGrowthGroupToggle);

    if (isHistorical) {
        document.getElementById("historyReportToolbarBackBtn")?.addEventListener("click", openAssessmentHistory);
    }
    else {
        document.getElementById("reportBackBtn")?.addEventListener("click", showWelcomeScreen);
    }

    document.getElementById("openHistoryFromReportBtn")?.addEventListener("click", openAssessmentHistory);
    document.getElementById("openProgressFromReportBtn")?.addEventListener("click", openProgressJourney);

    if (IS_ADMIN_MODE) {
        document.getElementById("openMaiyaarFromReportBtn")?.addEventListener("click", openMaiyaarInsights);
    }

    document.getElementById("printFromReportBtn")?.addEventListener("click", printReport);
    document.getElementById("printBtn")?.addEventListener("click", printReport);
    document.getElementById("restartFromReportBtn")?.addEventListener("click", startQuestionnaire);

}

function printReport() {

    window.print();

}

document.addEventListener("DOMContentLoaded", initializeApp);
