// =======================================
// محاسبۂ نفس
// Version 2.1.0 — Insights & Trends
// Production Architecture
// =======================================

import { application } from "./src/core/application.js";
import {
    getLastStorageIssue,
    clearLastStorageIssue,
    isLocalStorageAvailable,
    STORAGE_USER_MESSAGES
} from "./src/storage/storage.js";

const APP_VERSION = "2.1.0";

const ANSWER_VALIDATION_MESSAGE = "براہِ کرم آگے بڑھنے سے پہلے ایک جواب منتخب کریں۔";

const UI_LABELS = {
    NAV_PREVIOUS: "← Previous",
    NAV_NEXT: "Next →",
    NAV_FINISH: "Finish →",
    PROGRESS_REVIEW: "Maiyaar-e-Matloob Insights & Trends",
    ASSESSMENT_HISTORY: "Assessment History",
    CONTINUE_ASSESSMENT: "Continue Assessment",
    START_NEW_ASSESSMENT: "Start New Assessment",
    OPEN_PROGRESS_REVIEW: "Open Insights & Trends",
    OPEN_ASSESSMENT_HISTORY: "Open Assessment History",
    BACK: "Back",
    PRINT_REPORT: "Print Report",
    EMPTY_PROGRESS: "No completed assessments yet.",
    EMPTY_HISTORY: "No assessment history available."
};

const UI_ICONS = {
    CONTINUE: "▶",
    RESTART: "↺",
    PROGRESS: "📈",
    HISTORY: "📚",
    PRINT: "🖨"
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

function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

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
        element.style.display = isActive ? "block" : "none";
        element.setAttribute("aria-hidden", isActive ? "false" : "true");
    });

    document.body.classList.toggle("questionnaire-active", screenId === "questionnaireScreen");

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
        actionsHtml = ""
    } = options;

    return `
        <div class="screen-toolbar" role="toolbar" aria-label="${escapeHtml(title)} toolbar">
            <button type="button" id="${backId}" class="secondary-btn screen-toolbar-back">${backLabel}</button>
            <h2 class="screen-toolbar-title">${escapeHtml(title)}</h2>
            <div class="screen-toolbar-actions">${actionsHtml}</div>
        </div>`;

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
        updateHomeDashboardEntryVisibility();
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

    const startButton = document.getElementById("startButton");
    const loadingMessage = document.getElementById("questionnaireLoadingMessage");
    const errorMessage = document.getElementById("questionnaireErrorMessage");

    if (loadingMessage) {
        loadingMessage.style.display = state === "loading" ? "block" : "none";
    }

    if (errorMessage) {
        errorMessage.style.display = state === "error" ? "block" : "none";
    }

    if (startButton) {
        startButton.disabled = state !== "ready";
    }

}

function bindEvents() {

    document.getElementById("startButton")?.addEventListener("click", startQuestionnaire);
    document.getElementById("openHomeDashboardBtn")?.addEventListener("click", openPersonalHomeDashboard);
    document.getElementById("openHistoryBtn")?.addEventListener("click", openAssessmentHistory);
    document.getElementById("openProgressBtn")?.addEventListener("click", openProgressJourney);
    document.getElementById("continueSessionBtn")?.addEventListener("click", continueQuestionnaire);
    document.getElementById("restartSessionBtn")?.addEventListener("click", restartQuestionnaireFromWelcome);
    document.getElementById("previousBtn")?.addEventListener("click", previousQuestion);
    document.getElementById("nextBtn")?.addEventListener("click", nextQuestion);
    document.getElementById("questionContainer")?.addEventListener("change", handleAnswerSelection);
    document.getElementById("questionContainer")?.addEventListener("click", handleExplanationToggle);

}

function updateHomeDashboardEntryVisibility() {

    const snapshots = application.listAssessmentHistory();
    const homeButton = document.getElementById("openHomeDashboardBtn");

    if (homeButton) {
        homeButton.style.display = snapshots.length ? "" : "none";
    }

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
        announce: `${UI_LABELS.PROGRESS_REVIEW} opened`
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
            <span>${priority.latestPercentage != null ? `${priority.latestPercentage}%` : ""}</span>
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
            ${insight.deltaPercentage != null ? `<small>+${insight.deltaPercentage}%</small>` : ""}
            ${insight.latestPercentage != null ? `<small>${insight.latestPercentage}%</small>` : ""}
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
                title: "Home",
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
                    <span class="home-card-meta">${dashboard.currentOverallPercentage != null ? `${dashboard.currentOverallPercentage}%` : ""}</span>
                </article>
                <article class="home-card">
                    <strong>پہلے جائزے سے پیش رفت</strong>
                    <span class="home-card-value">${progress?.deltaPercentage != null ? `${progress.deltaPercentage}%` : "—"}</span>
                    <span class="home-card-meta">${progress ? `${progress.firstPercentage}% → ${progress.latestPercentage}%` : "مزید جائزوں کی ضرورت"}</span>
                </article>
                <article class="home-card">
                    <strong>اگلے جائزے کی تجویز</strong>
                    <span class="home-card-value">${reassessment.recommendedDate ? formatAssessmentDate(reassessment.recommendedDate) : `${reassessment.recommendedDays || dashboard.suggestedReassessmentDays || 30} دن`}</span>
                    <span class="home-card-meta">${reassessment.reasonUrdu || ""}</span>
                </article>
            </div>

            <section class="home-section">
                <h3>موجودہ اولویتیں</h3>
                <div class="home-card-list">${renderPriorityCards(dashboard.currentPriorities, "ابھی کوئی اولویت شناخت نہیں ہوئی۔")}</div>
            </section>

            <section class="home-section">
                <h3>ذاتی بصیرت</h3>
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
                    <p><strong>مستقل مزاجی:</strong> ${reassessment.consistencyScore != null ? `${reassessment.consistencyScore}%` : "—"}</p>
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

function openProgressJourney() {

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
                ? `<div class="progress-section-metrics"><span>تازہ: ${item.latestPercentage}%</span>${item.deltaPercentage != null ? `<strong>${item.deltaPercentage}%</strong>` : ""}</div>`
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

function renderCommunitySummaryList(title, items, getLabel) {

    const markup = items?.length
        ? items.map(item => `
            <article class="progress-section-card">
                <div class="progress-section-title">${escapeHtml(getLabel(item))}</div>
            </article>`).join("")
        : `<div class="progress-empty">No data available yet.</div>`;

    return `
        <div class="progress-subsection">
            <h4>${escapeHtml(title)}</h4>
            <div class="progress-section-list">${markup}</div>
        </div>`;

}

function renderCommunityPracticeCard(practice) {

    return `
        <article class="progress-section-card">
            <div class="progress-section-title">${escapeHtml(practice.practiceName)}</div>
            <div class="progress-section-label">${escapeHtml(practice.implementationStatusLabel || practice.implementationStatus || "")}</div>
            ${renderDistributionBlock(practice.distribution)}
        </article>`;

}

function renderCommunityQuestionCard(question) {

    return `
        <article class="progress-section-card">
            <div class="progress-section-title">${escapeHtml(question.questionText)}</div>
            <div class="progress-section-label">${escapeHtml(question.section || "")}</div>
            ${renderDistributionBlock(question.distribution)}
        </article>`;

}

function renderCommunityTrendCard(trend) {

    const firstAlways = trend.firstPeriod?.distribution?.always ?? "—";
    const latestAlways = trend.latestPeriod?.distribution?.always ?? "—";
    const deltaAlways = trend.delta?.always;

    return `
        <article class="progress-section-card">
            <div class="progress-section-title">${escapeHtml(trend.practiceName)}</div>
            <div class="progress-section-metrics">
                <span>Always: ${firstAlways}% → ${latestAlways}%</span>
                <strong>${deltaAlways != null ? `${deltaAlways >= 0 ? "+" : ""}${deltaAlways}%` : "—"}</strong>
            </div>
            <div class="progress-section-label">${escapeHtml(trend.trend || "stable")}</div>
        </article>`;

}

function renderCommunityInsightsPanel() {

    const insightsResult = application.getMaiyaarInsights();
    const insights = getDomainData(insightsResult);
    const assessmentCount = insights.assessmentCount || 0;

    if (!insights.hasSufficientData || assessmentCount < 1) {
        return `
            <section class="empty-state-card">
                <p>Community insights appear after completed assessments include answer records. Complete a new assessment to populate this view.</p>
            </section>`;
    }

    const summary = insights.summary || {};
    const priorities = insights.educationalPriorities || [];
    const practiceInsights = insights.practiceInsights || [];
    const sectionInsights = insights.sectionInsights || [];
    const implementationTrends = insights.implementationTrends || [];
    const questionInsights = insights.questionInsights || [];

    const priorityMarkup = priorities.length
        ? priorities.map(priority => `
            <article class="progress-section-card">
                <div class="progress-section-label">#${priority.rank}</div>
                <div class="progress-section-title">${escapeHtml(priority.practiceName)}</div>
                <div class="progress-section-meta">Positive: ${priority.positiveRate}% · Never: ${priority.neverRate}%</div>
            </article>`).join("")
        : `<div class="progress-empty">No educational priorities identified with current thresholds.</div>`;

    return `
        <section class="progress-header">
            <p>Community implementation analysis across ${assessmentCount} saved assessment${assessmentCount === 1 ? "" : "s"}.</p>
        </section>

        <section class="progress-sections">
            <h3>Community Summary</h3>
            ${renderCommunitySummaryList("Most Implemented Practices", summary.mostImplementedPractices, item => `${item.practiceName} (${item.positiveRate}%)`)}
            ${renderCommunitySummaryList("Least Implemented Practices", summary.leastImplementedPractices, item => `${item.practiceName} (${item.positiveRate}%)`)}
            ${renderCommunitySummaryList("Improving Practices", summary.improvingPractices, item => item.practiceName)}
            ${renderCommunitySummaryList("Declining Practices", summary.decliningPractices, item => item.practiceName)}
            ${renderCommunitySummaryList("Stable Practices", summary.stablePractices, item => item.practiceName)}
            ${renderCommunitySummaryList("Practices Requiring Immediate Attention", summary.practicesRequiringImmediateAttention, item => `${item.practiceName} (${item.implementationStatusLabel || item.implementationStatus})`)}
        </section>

        <section class="progress-sections">
            <h3>Educational Priorities</h3>
            <div class="progress-section-list">${priorityMarkup}</div>
        </section>

        <section class="progress-sections">
            <h3>Practice Implementation</h3>
            <div class="progress-section-list">
                ${practiceInsights.length
                    ? practiceInsights.map(renderCommunityPracticeCard).join("")
                    : `<div class="progress-empty">No practice data available.</div>`}
            </div>
        </section>

        <section class="progress-sections">
            <h3>Section Implementation</h3>
            <div class="progress-section-list">
                ${sectionInsights.length
                    ? sectionInsights.map(section => `
                        <article class="progress-section-card">
                            <div class="progress-section-title">${escapeHtml(section.sectionTitle)}</div>
                            <div class="progress-section-label">${escapeHtml(section.implementationStatusLabel || section.implementationStatus || "")}</div>
                            ${renderDistributionBlock(section.distribution)}
                        </article>`).join("")
                    : `<div class="progress-empty">No section data available.</div>`}
            </div>
        </section>

        <section class="progress-sections">
            <h3>Implementation Trends</h3>
            <div class="progress-section-list">
                ${implementationTrends.length
                    ? implementationTrends.map(renderCommunityTrendCard).join("")
                    : `<div class="progress-empty">At least two assessments with answer records are required for trends.</div>`}
            </div>
        </section>

        <section class="progress-sections">
            <h3>Question Distributions</h3>
            <div class="progress-section-list">
                ${questionInsights.length
                    ? questionInsights.map(renderCommunityQuestionCard).join("")
                    : `<div class="progress-empty">No question data available.</div>`}
            </div>
        </section>`;

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
    const nextAssessment = dashboard.nextSuggestedAssessment || {};
    const sectionTrends = dashboard.sectionTrends || [];
    const improvingSections = sectionTrends.filter(section => section.classification === "Improving");

    const sectionMarkup = improvingSections.length
        ? improvingSections.map(section => `
            <article class="progress-section-card">
                <div class="progress-section-title">${section.title}</div>
                <div class="progress-section-metrics">
                    <span>${section.firstPercentage}% → ${section.latestPercentage}%</span>
                    <strong>${section.deltaPercentage != null ? `+${section.deltaPercentage}%` : "—"}</strong>
                </div>
                <div class="progress-section-label">${getTrendClassificationLabel(section.classification)}</div>
            </article>`).join("")
        : `<div class="progress-empty">فی الحال کسی شعبے میں واضح بہتری کا رجحان نہیں ملا۔ مزید جائزے مکمل کرنے سے یہاں تبدیلی ظاہر ہوگی۔</div>`;

    const feedbackMarkup = (feedback.items || []).length
        ? feedback.items.map(item => `
            <article class="progress-section-card">
                <div class="progress-section-label">${getFeedbackCategoryLabel(item.category)}</div>
                <div class="progress-section-title">${item.message}</div>
            </article>`).join("")
        : `<div class="progress-empty">فی الحال رائے کے لیے کافی محفوظ جائزے موجود نہیں ہیں۔</div>`;

    const suggestedDateText = nextAssessment.suggestedDate
        ? formatAssessmentDate(nextAssessment.suggestedDate)
        : "—";

    return `
        <section class="progress-header">
            <p>${feedback.summary || overview.trendSummary || "A brief summary of your saved assessments."}</p>
        </section>

        <div class="progress-grid">
            <article class="progress-card">
                <strong>مجموعی پیش رفت</strong>
                <span class="progress-card-value">${getTrendClassificationLabel(overallTrend.classification || "Insufficient Data")}</span>
                <span class="progress-card-meta">${overallTrend.deltaPercentage != null ? `${overallTrend.deltaPercentage}% تبدیلی` : "مزید جائزوں کی ضرورت"}</span>
            </article>

            <article class="progress-card">
                <strong>جائزوں کی تعداد</strong>
                <span class="progress-card-value">${overview.assessmentCount || 0}</span>
                <span class="progress-card-meta">${overview.assessmentFrequency?.averageDaysBetween != null ? `اوسط فاصلہ: ${overview.assessmentFrequency.averageDaysBetween} دن` : "—"}</span>
            </article>

            <article class="progress-card">
                <strong>تازہ ترین جائزہ</strong>
                <span class="progress-card-value">${latestAssessment ? `${latestAssessment.overallPercentage}%` : "—"}</span>
                <span class="progress-card-meta">${latestAssessment ? formatAssessmentDate(latestAssessment.createdAt) : "—"}</span>
            </article>

            <article class="progress-card">
                <strong>پہلا جائزہ</strong>
                <span class="progress-card-value">${firstAssessment ? `${firstAssessment.overallPercentage}%` : "—"}</span>
                <span class="progress-card-meta">${firstAssessment ? formatAssessmentDate(firstAssessment.createdAt) : "—"}</span>
            </article>
        </div>

        <section class="progress-sections">
            <h3>شعبوں میں بہتری</h3>
            <div class="progress-section-list">${sectionMarkup}</div>
        </section>

        <section class="progress-sections">
            <h3>ترقی کا منصوبہ</h3>
            <div class="progress-subsection">
                <h4>تجویز کردہ توجہ</h4>
                <div class="progress-section-list">${renderStructuredList(dashboard.recommendedFocus, "ابھی کوئی توجہ کا شعبہ شناخت نہیں ہوا۔")}</div>
            </div>
            <div class="progress-subsection">
                <h4>اس ہفتے کی اولویت</h4>
                <div class="progress-section-list">${renderStructuredList(dashboard.thisWeeksPriority, "اس ہفتے کے لیے ابھی کوئی اولویت شناخت نہیں ہوئی۔")}</div>
            </div>
            <div class="progress-subsection">
                <h4>ان عادات کو جاری رکھیں</h4>
                <div class="progress-section-list">${renderStructuredList(dashboard.continueTheseHabits, "ابھی کوئی مستحکم شعبہ شناخت نہیں ہوا۔")}</div>
            </div>
            <div class="progress-subsection">
                <h4>بہتری کے مواقع</h4>
                <div class="progress-section-list">${renderStructuredList(dashboard.improvementOpportunities, "ابھی کوئی بہتری کا موقع شناخت نہیں ہوا۔")}</div>
            </div>
            <div class="progress-subsection">
                <h4>اگلے جائزے کی تجویز</h4>
                <div class="progress-empty">${nextAssessment.days ?? "—"} دن${suggestedDateText !== "—" ? ` — تقریباً ${suggestedDateText}` : ""}</div>
            </div>
        </section>

        <section class="progress-sections">
            <h3>راہنمائی کا خلاصہ</h3>
            <div class="progress-section-list">${feedbackMarkup}</div>
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
                aria-controls="insightsPersonalPanel">
                Personal
            </button>
            <button type="button"
                id="insightsCommunityTab"
                class="insights-tab${activeTab === "community" ? " is-active" : ""}"
                role="tab"
                aria-selected="${activeTab === "community"}"
                aria-controls="insightsCommunityPanel">
                Community
            </button>
        </div>`;

}

function bindInsightsTabHandlers() {

    document.getElementById("insightsPersonalTab")?.addEventListener("click", () => {
        progressInsightsTab = "personal";
        renderGrowthJourney();
    });

    document.getElementById("insightsCommunityTab")?.addEventListener("click", () => {
        progressInsightsTab = "community";
        renderGrowthJourney();
    });

}

function renderGrowthJourney() {

    const progressScreen = document.getElementById("progressScreen");
    const bundle = application.getGrowthBundle();
    const activeTab = progressInsightsTab;
    const panelContent = activeTab === "community"
        ? renderCommunityInsightsPanel()
        : renderPersonalProgressPanel(bundle);

    progressScreen.innerHTML = `
        <div class="progress-page">
            ${renderScreenToolbar({
                title: UI_LABELS.PROGRESS_REVIEW,
                backId: "progressBackBtn",
                actionsHtml: renderToolbarAction("progressHistoryBtn", UI_ICONS.HISTORY, UI_LABELS.ASSESSMENT_HISTORY)
            })}

            ${renderInsightsTabBar(activeTab)}

            <div id="insightsPersonalPanel"
                class="insights-tab-panel${activeTab === "personal" ? " is-active" : ""}"
                role="tabpanel"
                ${activeTab === "personal" ? "" : 'hidden'}>
                ${activeTab === "personal" ? panelContent : ""}
            </div>

            <div id="insightsCommunityPanel"
                class="insights-tab-panel${activeTab === "community" ? " is-active" : ""}"
                role="tabpanel"
                ${activeTab === "community" ? "" : 'hidden'}>
                ${activeTab === "community" ? panelContent : ""}
            </div>
        </div>`;

    document.getElementById("progressBackBtn")?.addEventListener("click", showWelcomeScreen);
    document.getElementById("progressHistoryBtn")?.addEventListener("click", openAssessmentHistory);
    bindInsightsTabHandlers();

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
        announce: `${UI_LABELS.ASSESSMENT_HISTORY} opened`
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
                ? `<div><strong>مجموعی فیصد</strong><span>${entry.overallPercentage}%</span></div>`
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
                    ${snapshots.length ? `<button type="button" id="clearHistoryBtn" class="secondary-btn screen-toolbar-action">Clear History</button>` : ""}`
            })}

            <section class="history-header">
                <p>Your assessments and personal reflections in chronological order.</p>
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
        announce: "خوش آمدید صفحہ",
        focusTargetId: "startButton"
    });

    updateHomeDashboardEntryVisibility();

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
    updateHomeDashboardEntryVisibility();
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
    updateHomeDashboardEntryVisibility();
    renderAssessmentHistory();

}

function showSessionResumePrompt() {

    const incompleteSection = document.getElementById("incompleteAssessmentSection");
    const startButton = document.getElementById("startButton");

    if (incompleteSection) {
        incompleteSection.hidden = false;
    }

    if (startButton) {
        startButton.hidden = true;
    }

}

function hideSessionResumePrompt() {

    const incompleteSection = document.getElementById("incompleteAssessmentSection");
    const startButton = document.getElementById("startButton");

    if (incompleteSection) {
        incompleteSection.hidden = true;
    }

    if (startButton) {
        startButton.hidden = false;
    }

}

function restorePersistedState() {

    const result = application.restorePersistedState();

    if (result.type === "restore-report") {
        hideSessionResumePrompt();
        renderDashboard(result.report);
        return;
    }

    if (result.type === "resume-prompt") {
        showSessionResumePrompt();
    }

}

function continueQuestionnaire() {

    if (!application.questionnaireReady || !application.questionnaire.length) {
        return;
    }

    hideSessionResumePrompt();
    showQuestionnaireScreen();
    renderQuestion();
    updateProgress();

}

function restartQuestionnaireFromWelcome() {

    hideSessionResumePrompt();
    startQuestionnaire();

}

function startQuestionnaire() {

    if (!application.questionnaireReady || !application.questionnaire.length) {
        return;
    }

    hideSessionResumePrompt();
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
            <label class="option">
                <input type="radio" name="answer" value="${option.value}" ${checked}>
                <span class="option-text">${option.label}</span>
            </label>`;
    }).join("");

    const explanation = question?.explanation || "";
    const explanationMarkup = `
        <div class="question-explanation">
            <button type="button" class="explanation-toggle" aria-expanded="false" aria-controls="questionExplanationPanel">▼ یہ سوال کس چیز کا جائزہ لیتا ہے؟</button>
            <div id="questionExplanationPanel" class="explanation-panel" hidden>
                <div class="explanation-body">${explanation}</div>
            </div>
        </div>`;

    return `
        <div class="question-card">
            <div class="question-id">${question.id || question.standardId || ""}</div>
            <div class="question-text">${question.question}</div>
            ${explanationMarkup}
            <fieldset class="answers">
                <legend class="visually-hidden">جواب منتخب کریں</legend>
                ${options}
            </fieldset>
            <div class="answer-validation" role="alert" aria-live="assertive" hidden>${ANSWER_VALIDATION_MESSAGE}</div>
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
    document.getElementById("percentage").textContent = percentage + "%";

    const nextButton = document.getElementById("nextBtn");
    const previousButton = document.getElementById("previousBtn");

    nextButton.textContent = application.currentQuestion === totalQuestions - 1
        ? UI_LABELS.NAV_FINISH
        : UI_LABELS.NAV_NEXT;
    nextButton.setAttribute(
        "aria-label",
        application.currentQuestion === totalQuestions - 1 ? "Finish assessment" : "Next question"
    );
    previousButton.textContent = UI_LABELS.NAV_PREVIOUS;

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
    updateHomeDashboardEntryVisibility();
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
    const overallScoreLabel = rawScores.overall.max ? `${rawScores.overall.raw}/${rawScores.overall.max}` : `${overall.percentage}%`;
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

    const sectionMarkup = reportSections.map(section => {
        const sectionClass = section.percentage >= 75 ? "strong-section" : section.percentage < 60 ? "weak-section" : "";
        const sectionLevel = getPerformanceLevelLabel(section.level || "Critical");
        const sectionInterpretation = (insights.sections.find(item => item.title === section.title) || {}).interpretation || "";

        return `
            <div class="report-section-card ${sectionClass}">
                <div class="report-section-row">
                    <div><strong>${section.title}</strong></div>
                    <div>${section.percentage}%</div>
                    <div>${sectionLevel}</div>
                </div>
                <div class="report-section-bar"><span style="width:${Math.max(4, section.percentage)}%"></span></div>
                <p class="report-section-interpretation">${sectionInterpretation}</p>
            </div>`;
    }).join("");

    dashboard.innerHTML = `
        <div class="dashboard-report">
            <section class="report-card report-cover">
                <h1>معیار</h1>
                <h2>محاسبۂ نفس</h2>
                <h3>بر اساس معیارِ مطلوب</h3>
                <div class="report-metrics">
                    <div>
                        <strong>تاریخ جائزہ</strong>
                        <span>${assessmentDate}</span>
                    </div>
                    <div>
                        <strong>مجموعی فیصد</strong>
                        <span>${overall.percentage}%</span>
                    </div>
                    <div>
                        <strong>موجودہ سطح</strong>
                        <span>${overallLevelLabel}</span>
                    </div>
                </div>
            </section>

            <section class="report-card report-card-blue">
                <div class="report-card-head"><span class="report-card-icon">📊</span><h3>مجموعی نتیجہ</h3></div>
                <div class="report-metrics">
                    <div>
                        <strong>مجموعی اسکور</strong>
                        <span>${overallScoreLabel}</span>
                    </div>
                    <div>
                        <strong>درجہ</strong>
                        <span>${overallLevelLabel}</span>
                    </div>
                </div>
                <p class="report-summary-text">${insights.overallSummary}</p>
            </section>

            <section class="report-card report-card-green">
                <div class="report-card-head"><span class="report-card-icon">🎯</span><h3>معیارِ مطلوب</h3></div>
                <p class="report-summary-text benchmark-intro">یہ جائزہ معیارِ مطلوب کی روشنی میں ترتیب دیا گیا ہے۔ اس میں آپ کے جوابات کا تجزیہ مختلف شعبوں کے حوالے سے کیا گیا ہے۔</p>
            </section>

            <section class="report-card report-card-blue">
                <div class="report-card-head"><span class="report-card-icon">📈</span><h3>تفصیلی جائزہ</h3></div>
                <div class="report-section-list">
                    ${sectionMarkup}
                </div>
            </section>

            <section class="report-card report-card-green">
                <div class="report-card-head"><span class="report-card-icon">✅</span><h3>مضبوط شعبے</h3></div>
                <div class="report-highlight-card">
                    <div class="report-highlight-title">${strongestSection.title}</div>
                    <div class="report-highlight-value">${strongestSection.percentage}%</div>
                    <p class="report-summary-text">${insights.strongestSectionExplanation}</p>
                </div>
            </section>

            <section class="report-card report-card-orange">
                <div class="report-card-head"><span class="report-card-icon">🌱</span><h3>بہتری کے لیے شعبے</h3></div>
                <div class="report-section-list">
                    <div class="report-section-row">
                        <div><strong>${growthSection.title}</strong></div>
                        <div>${growthSection.percentage}%</div>
                    </div>
                    <p class="report-summary-text">${insights.growthSectionExplanation}</p>
                </div>
            </section>

            <section class="report-card report-card-red">
                <div class="report-card-head"><span class="report-card-icon">📝</span><h3>کمزور سوالات کے اسباق</h3></div>
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
                <div class="report-card-head"><span class="report-card-icon">🧭</span><h3>30 روزہ عملی منصوبہ</h3></div>
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
                <p class="report-summary-text" style="font-size:17px; line-height:1.9;">
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

            <div class="navigation report-navigation">
                ${isHistorical
                    ? `<button id="historyReportBackBtn" class="secondary-btn">${UI_LABELS.ASSESSMENT_HISTORY}</button>`
                    : `<button id="restartBtn" class="secondary-btn">${UI_ICONS.RESTART} ${UI_LABELS.START_NEW_ASSESSMENT}</button>`}
                <button id="openHistoryFromReportBtn" class="nav-btn btn-with-icon">${UI_ICONS.HISTORY} ${UI_LABELS.ASSESSMENT_HISTORY}</button>
                <button id="openHomeFromReportBtn" class="nav-btn">Home</button>
                <button id="openProgressFromReportBtn" class="nav-btn btn-with-icon">${UI_ICONS.PROGRESS} ${UI_LABELS.PROGRESS_REVIEW}</button>
                <button id="printBtn" class="primary-btn btn-with-icon">${UI_ICONS.PRINT} ${UI_LABELS.PRINT_REPORT}</button>
            </div>
        </div>`;

    dashboard.removeEventListener("click", handleGrowthGroupToggle);
    dashboard.addEventListener("click", handleGrowthGroupToggle);

    if (isHistorical) {
        document.getElementById("historyReportBackBtn")?.addEventListener("click", openAssessmentHistory);
    }
    else {
        document.getElementById("restartBtn")?.addEventListener("click", startQuestionnaire);
    }

    document.getElementById("openHistoryFromReportBtn")?.addEventListener("click", openAssessmentHistory);
    document.getElementById("openHomeFromReportBtn")?.addEventListener("click", openPersonalHomeDashboard);
    document.getElementById("openProgressFromReportBtn")?.addEventListener("click", openProgressJourney);
    document.getElementById("printBtn")?.addEventListener("click", printReport);

}

function printReport() {

    window.print();

}

document.addEventListener("DOMContentLoaded", initializeApp);
