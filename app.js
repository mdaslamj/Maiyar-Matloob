// =======================================
// محاسبۂ نفس
// Version 1.0
// Production Architecture
// =======================================

const STORAGE_KEY = "mahasaba-nafs-answers";

let questionnaire = [];
let responseScale = [];
let currentQuestion = 0;
let answers = {};
let isSubmitted = false;

function initializeApp() {

    bindEvents();
    loadQuestionnaire();

}

async function loadQuestionnaire() {

    try {

        const response = await fetch("questionnaire.json");
        const data = await response.json();

        questionnaire = Array.isArray(data.questions) ? data.questions : [];
        responseScale = Array.isArray(data.responseScale) ? data.responseScale : [];

        document.getElementById("totalQuestions").textContent = questionnaire.length;

        if (questionnaire.length !== 50) {
            console.warn("Expected 50 questions, received", questionnaire.length);
        }

        answers = loadAnswers();
        updateProgress();

    }

    catch (error) {

        console.error(error);

    }

}

function bindEvents() {

    document.getElementById("startButton")?.addEventListener("click", startQuestionnaire);
    document.getElementById("previousBtn")?.addEventListener("click", previousQuestion);
    document.getElementById("nextBtn")?.addEventListener("click", nextQuestion);
    document.getElementById("questionContainer")?.addEventListener("change", handleAnswerSelection);
    document.getElementById("questionContainer")?.addEventListener("click", handleExplanationToggle);

}

function showQuestionnaireScreen() {

    document.getElementById("welcomeScreen").style.display = "none";
    document.getElementById("questionnaireScreen").style.display = "block";
    document.getElementById("dashboardScreen").style.display = "none";
    document.body.classList.add("questionnaire-active");

}

function getQuestionKey(question, index) {

    return question?.id || question?.standardId || `question-${index}`;

}

function getQuestionRequired(question) {

    return question?.required !== false;

}

function getQuestionOptions(question) {

    if (Array.isArray(question?.options) && question.options.length) {
        return question.options.map((option, index) => ({
            value: Number(option?.value ?? option?.score ?? option?.id ?? index + 1),
            label: option?.label ?? option?.text ?? option?.title ?? String(option?.value ?? option?.id ?? index + 1)
        }));
    }

    return responseScale.map(option => ({
        value: Number(option.id),
        label: option.label
    }));

}

function getQuestionSection(question) {

    return question?.section || question?.category || "General";

}

function getQuestionIsReverseScored(question) {

    return question?.isReverseScored === true;

}

function showDashboardScreen() {

    document.getElementById("welcomeScreen").style.display = "none";
    document.getElementById("questionnaireScreen").style.display = "none";
    document.getElementById("dashboardScreen").style.display = "block";
    document.body.classList.remove("questionnaire-active");

}

function startQuestionnaire() {

    showQuestionnaireScreen();

    currentQuestion = 0;
    answers = loadAnswers();
    isSubmitted = false;

    renderQuestion();

}

function renderQuestion() {

    if (!questionnaire.length) {
        return;
    }

    const question = questionnaire[currentQuestion];
    const markup = createQuestionMarkup(question);

    document.getElementById("questionContainer").innerHTML = markup;

    restoreAnswer(question);
    updateProgress();

}

function createQuestionMarkup(question) {

    const questionKey = getQuestionKey(question, currentQuestion);
    const hasSavedAnswer = Object.prototype.hasOwnProperty.call(answers, questionKey);
    const savedValue = hasSavedAnswer ? Number(answers[questionKey]) : null;
    const options = getQuestionOptions(question).map(option => {
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
            <a href="#" class="explanation-toggle" data-expanded="false">▼ یہ سوال کس چیز کا جائزہ لیتا ہے؟</a>
            <div class="explanation-panel" style="display:none;">
                <div class="explanation-body">${explanation}</div>
            </div>
        </div>`;

    return `
        <div class="question-card">
            <div class="question-id">${question.id || question.standardId || ""}</div>
            <div class="question-text">${question.question}</div>
            ${explanationMarkup}
            <div class="answers">${options}</div>
        </div>`;

}

function handleAnswerSelection(event) {

    const input = event.target;

    if (!input.matches("input[name='answer']")) {
        return;
    }

    saveAnswer(input.value);
    saveAnswers();
    updateProgress();

}

function handleExplanationToggle(event) {

    const toggle = event.target.closest(".explanation-toggle");

    if (!toggle) {
        return;
    }

    event.preventDefault();

    const panel = toggle.nextElementSibling;

    if (!panel || !panel.classList.contains("explanation-panel")) {
        return;
    }

    const isExpanded = toggle.getAttribute("data-expanded") === "true";
    toggle.setAttribute("data-expanded", String(!isExpanded));
    panel.style.display = isExpanded ? "none" : "block";

}

function saveAnswer(value) {

    const question = questionnaire[currentQuestion];

    if (!question) {
        return;
    }

    answers[getQuestionKey(question, currentQuestion)] = Number(value);

}

function saveAnswers() {

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
    }

    catch (error) {
        console.error(error);
    }

}

function loadAnswers() {

    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : {};
    }

    catch (error) {
        console.error(error);
        return {};
    }

}

function restoreAnswer(question) {

    const questionKey = getQuestionKey(question, currentQuestion);
    const hasSavedAnswer = Object.prototype.hasOwnProperty.call(answers, questionKey);
    const savedValue = hasSavedAnswer ? Number(answers[questionKey]) : null;
    const radios = document.querySelectorAll("#questionContainer input[name='answer']");

    radios.forEach(radio => {
        radio.checked = savedValue != null && Number(radio.value) === savedValue;
    });

}

function nextQuestion() {

    const question = questionnaire[currentQuestion];

    if (!question) {
        return;
    }

    const questionKey = getQuestionKey(question, currentQuestion);

    if (getQuestionRequired(question) && !Object.prototype.hasOwnProperty.call(answers, questionKey)) {
        return;
    }

    if (currentQuestion < questionnaire.length - 1) {
        currentQuestion += 1;
        renderQuestion();
        return;
    }

    submitQuestionnaire();

}

function previousQuestion() {

    if (currentQuestion > 0) {
        currentQuestion -= 1;
        renderQuestion();
    }

}

function updateProgress() {

    const totalQuestions = questionnaire.length || 0;
    const answeredCount = questionnaire.reduce((count, question, index) => {
        const questionKey = getQuestionKey(question, index);
        return count + (Object.prototype.hasOwnProperty.call(answers, questionKey) ? 1 : 0);
    }, 0);
    const currentNumber = totalQuestions ? currentQuestion + 1 : 0;

    document.getElementById("currentQuestion").textContent = currentNumber;
    document.getElementById("totalQuestions").textContent = totalQuestions;

    const progressBar = document.getElementById("progressBar");
    progressBar.max = totalQuestions;
    progressBar.value = answeredCount;

    const percentage = totalQuestions ? Math.round((answeredCount / totalQuestions) * 100) : 0;
    document.getElementById("percentage").textContent = percentage + "%";

    const nextButton = document.getElementById("nextBtn");
    const previousButton = document.getElementById("previousBtn");

    nextButton.textContent = currentQuestion === totalQuestions - 1 ? "Finish →" : "Next →";
    previousButton.textContent = "← Previous";

}

function getMaxScore(question) {

    const options = getQuestionOptions(question);

    return Math.max(...options.map(option => Number(option.value)), 1);

}

function calculateQuestionScore(question, answer) {

    if (!question || answer == null) {
        return 0;
    }

    const value = Number(answer);
    const maxScore = getMaxScore(question);
    const isReverseScored = getQuestionIsReverseScored(question);

    return isReverseScored ? maxScore + 1 - value : value;

}

function calculateRawScores() {

    const rawScores = {
        overall: { raw: 0, max: 0 },
        categories: {}
    };

    questionnaire.forEach((question, index) => {
        const questionKey = getQuestionKey(question, index);
        const answer = answers[questionKey];
        if (answer == null) {
            return;
        }
        const score = calculateQuestionScore(question, answer);
        const maxScore = getMaxScore(question);
        const sectionName = getQuestionSection(question);
        rawScores.overall.raw += score;
        rawScores.overall.max += maxScore;
        if (!rawScores.categories[sectionName]) {
            rawScores.categories[sectionName] = { raw: 0, max: 0 };
        }
        rawScores.categories[sectionName].raw += score;
        rawScores.categories[sectionName].max += maxScore;
    });

    return rawScores;

}

function calculateCategoryPercentages(rawScores = calculateRawScores()) {

    const percentages = {};

    Object.entries(rawScores.categories).forEach(([key, value]) => {
        const percentage = value.max ? (value.raw / value.max) * 100 : 0;
        percentages[key] = {
            raw: value.raw,
            max: value.max,
            percentage: Number(percentage.toFixed(1))
        };
    });

    return percentages;

}

function calculateOverallPercentage(rawScores = calculateRawScores()) {

    const max = rawScores.overall.max || 1;
    return Number(((rawScores.overall.raw / max) * 100).toFixed(1));

}

function getPerformanceLevel(percentage) {

    if (percentage >= 90) {
        return "Excellent";
    }

    if (percentage >= 75) {
        return "Very Good";
    }

    if (percentage >= 60) {
        return "Good";
    }

    if (percentage >= 40) {
        return "Needs Improvement";
    }

    return "Critical";

}

function generateOverallSummary(percentage) {

    if (percentage >= 90) {
        return "آپ کی مجموعی سطح بہت ممتاز ہے۔ آپ کے اندر روحانی اور اخلاقی تربیت کی مضبوط بنیاد موجود ہے۔";
    }

    if (percentage >= 75) {
        return "آپ کی مجموعی سطح بہت خوبصورت ہے۔ آپ میں بہتری کے لیے چند مزید مسلسل کوششوں کی ضرورت ہے۔";
    }

    if (percentage >= 60) {
        return "آپ کی مجموعی سطح acceptable ہے۔ اپنی اصلاح اور تزکیہ کے لیے منظم کوششوں کی ضرورت ہے۔";
    }

    if (percentage >= 40) {
        return "آپ کی مجموعی سطح میں بہتری کی ضرورت ہے۔ حقیقی خودِ نگرانی اور محاسبہ بہت ضروری ہے۔";
    }

    return "آپ کی مجموعی سطح شدید تشویش کا باعث ہے۔ فوری اور گہرے روحانی و اخلاقی محاسبہ کی ضرورت ہے۔";

}

function generateCategoryComment(category) {

    const percentage = category.percentage;
    const level = category.level;

    if (level === "Excellent") {
        return "یہ سطح انتہائی قابلِ تعریف ہے۔ آپ اس شعبے میں اچھی بنیاد پر قائم ہیں۔";
    }

    if (level === "Very Good") {
        return "یہ سطح اچھی ہے۔ تھوڑی سی توجہ اور مسلسل کوشش سے یہ مزید بہتر ہوسکتی ہے۔";
    }

    if (level === "Good") {
        return "یہ سطح قابلِ قبول ہے۔ بعض شعبوں میں زیادہ توجہ اور نظم کی ضرورت ہے۔";
    }

    if (level === "Needs Improvement") {
        return "یہ شعبہ بہتری کے لیے تقاضا کرتا ہے۔ اپنی عادتوں اور مشغولیات میں thoughtful تبدیلی کی ضرورت ہے۔";
    }

    if (percentage < 40) {
        return "یہ شعبہ انتہائی نیازمند ہے۔ فوری اصلاح، سمجھداری اور مسلسل محاسبہ ضروری ہے۔";
    }

    return "اس شعبے میں مزید توجہ و کوشش کی ضرورت ہے۔";

}

function generateAssessment() {

    const rawScores = calculateRawScores();
    const categories = calculateCategoryPercentages(rawScores);
    const overallPercentage = calculateOverallPercentage(rawScores);
    const overallLevel = getPerformanceLevel(overallPercentage);

    return {
        overall: {
            percentage: overallPercentage,
            level: overallLevel,
            summary: generateOverallSummary(overallPercentage)
        },
        categories: Object.entries(categories).map(([id, value]) => {
            const level = getPerformanceLevel(value.percentage);
            return {
                id,
                title: id,
                raw: value.raw,
                max: value.max,
                percentage: value.percentage,
                level,
                comment: generateCategoryComment({ percentage: value.percentage, level })
            };
        })
    };

}

function getOverallInterpretation(percentage) {

    if (percentage >= 90) {
        return "آپ کی مجموعی روحانی و اخلاقی سطح بہت مضبوط ہے۔ آپ کے اندر موجود بنیاد اور مسلسل کوششوں کی تاثیر واضح طور پر نظر آتی ہے۔";
    }

    if (percentage >= 75) {
        return "آپ کی مجموعی سطح اچھی ہے۔ تھوڑی سی مزید نظم اور مسلسل محاسبہ سے آپ اپنی ترقی کو اور زیادہ پختہ کر سکتے ہیں۔";
    }

    if (percentage >= 60) {
        return "آپ کی مجموعی سطح قابلِ قبول ہے۔ مزید توجہ اور باقاعدہ عمل سے آپ اپنی سطح کو اور بہتر بنا سکتے ہیں۔";
    }

    if (percentage >= 40) {
        return "آپ کی مجموعی سطح میں بہتری کی ضرورت ہے۔ ایک منظم اور باقاعدہ عمل سے آپ کی روحانی و اخلاقی تربیت میں واضح پیش رفت ممکن ہے۔";
    }

    return "آپ کی مجموعی سطح میں فوری اصلاح کی ضرورت ہے۔ چھوٹے مگر باقاعدہ اقدامات سے یہ تبدیلی شروع کی جا سکتی ہے۔";

}

function getSectionInterpretation(sectionName, percentage) {

    if (percentage >= 90) {
        return `${sectionName} میں آپ کی سطح بہت مضبوط ہے۔ یہ شعبہ آپ کی موجودہ تربیت اور عادتوں کا ایک روشن ثبوت ہے۔`;
    }

    if (percentage >= 75) {
        return `${sectionName} میں آپ کی سطح اچھی ہے۔ چند مزید مسلسل کوششوں سے اس شعبے کو اور زیادہ پختہ کیا جا سکتا ہے۔`;
    }

    if (percentage >= 60) {
        return `${sectionName} میں آپ کی سطح قابلِ قبول ہے۔ نظم و ترتیب اور باقاعدہ توجہ سے اس میں مزید بہتری ممکن ہے۔`;
    }

    if (percentage >= 40) {
        return `${sectionName} میں مزید بہتری کی ضرورت ہے۔ اس شعبے میں عملی اور باقاعدہ تبدیلی آپ کے نتائج کو بہتر کر سکتی ہے۔`;
    }

    return `${sectionName} میں فوری توجہ کی ضرورت ہے۔ اس پر مسلسل محاسبہ اور واضح عملی قدم بہت مددگار ثابت ہوں گے۔`;

}

function getStrongestAreaExplanation(sectionName, percentage) {

    return `${sectionName} آپ کے جوابوں میں سب سے زیادہ مضبوط شعبہ ظاہر ہوتا ہے۔ ${percentage}% کی سطح اس بات کی نشانی ہے کہ آپ اس میدان میں اچھی بنیاد رکھتے ہیں۔`;

}

function getGrowthAreaExplanation(sectionName, percentage) {

    return `${sectionName} میں مزید ترقی کے لیے ایک منظم اور باقاعدہ کوشش ضروری ہے۔ ${percentage}% کی سطح اس شعبے کو توجہ اور عملی تبدیلی کی ضرورت دکھاتی ہے۔`;

}

function buildActionPlan(assessment) {

    const questions = questionnaire.map((question, index) => {
        const questionKey = getQuestionKey(question, index);
        const answer = answers[questionKey];
        const score = answer == null ? 0 : calculateQuestionScore(question, answer);
        const maxScore = getMaxScore(question);
        const percentage = maxScore ? (score / maxScore) * 100 : 0;

        return {
            section: getQuestionSection(question),
            questionText: question.question,
            percentage: Number(percentage.toFixed(1))
        };
    });

    const sortedQuestions = [...questions].sort((a, b) => a.percentage - b.percentage);
    const sectionPriority = [...assessment.categories]
        .sort((a, b) => a.percentage - b.percentage)
        .filter(category => category.percentage < 100);

    const priorities = [];

    sectionPriority.forEach(category => {
        if (priorities.length >= 3) {
            return;
        }

        const sectionQuestions = questions.filter(item => item.section === category.title);
        const lowestQuestion = sectionQuestions.length
            ? sectionQuestions.reduce((worst, current) => current.percentage < worst.percentage ? current : worst, sectionQuestions[0])
            : null;

        if (!lowestQuestion) {
            return;
        }

        priorities.push(`اس شعبے میں ترقی کے لیے ${category.title} پر عمل کرتے ہوئے ${lowestQuestion.questionText} کے بارے میں ایک واضح اور عملی قدم منتخب کریں۔`);
    });

    if (priorities.length < 3) {
        const remainingQuestions = sortedQuestions.filter(item => !priorities.some(priority => priority.includes(item.section)));

        remainingQuestions.slice(0, 3 - priorities.length).forEach(item => {
            priorities.push(`اپنی عادتوں کو مزید مضبوط بنانے کے لیے ${item.section} کے موضوع پر ${item.questionText} سے شروع کرتے ہوئے ایک روزمرہ کا عملی قدم بنائیں۔`);
        });
    }

    return priorities.slice(0, 3);

}

function getAnswerLabel(answerValue) {

    const numericValue = Number(answerValue);
    const matchingOption = responseScale.find(option => Number(option.id) === numericValue);

    return matchingOption?.label || String(answerValue ?? "");

}

function getQuestionInsightMetadata(question) {

    const explanation = question?.explanation || question?.reason || question?.whyItMatters || question?.insight;
    const improvement = question?.improvement || question?.practicalImprovement || question?.nextStep || question?.action;

    return {
        explanation: explanation || "یہ سوال اس شعبے میں موجود کمزور یا غیر منظم عادت کی نشاندہی کرتا ہے۔",
        improvement: improvement || "اس سوال کے مطابق ایک واضح اور عملی قدم اختیار کریں، جیسے کہ روزمرہ ایک مخصوص عادت کو نافذ کرنا۔"
    };

}

function getDisplaySectionName(sectionName) {

    if (sectionName === "عبادات") {
        return "تعلق باللہ و عبادات";
    }

    if (sectionName === "مقصدِ حیات") {
        return "اسلامی فکر و طرزِ زندگی";
    }

    return sectionName;

}

function buildGrowthQuestionGroups() {

    const groupedQuestions = questionnaire
        .map((question, index) => {
            const questionKey = getQuestionKey(question, index);
            const answerValue = answers[questionKey];

            if (answerValue == null || Number(answerValue) >= 4) {
                return null;
            }

            if (Number(answerValue) > 2) {
                return null;
            }

            const score = calculateQuestionScore(question, answerValue);
            const maxScore = getMaxScore(question);
            const percentage = maxScore ? (score / maxScore) * 100 : 0;
            const insight = getQuestionInsightMetadata(question);

            return {
                section: getDisplaySectionName(getQuestionSection(question)),
                questionNumber: question.id || question.standardId || `Q${index + 1}`,
                questionText: question.question,
                selectedAnswer: getAnswerLabel(answerValue),
                explanation: insight.explanation,
                improvement: insight.improvement,
                score: Number(percentage.toFixed(1)),
                answerValue: Number(answerValue)
            };
        })
        .filter(Boolean)
        .sort((a, b) => a.answerValue - b.answerValue || a.score - b.score);

    const groups = [];

    groupedQuestions.forEach(question => {
        const existingGroup = groups.find(group => group.sectionName === question.section);

        if (existingGroup) {
            existingGroup.questions.push(question);
            return;
        }

        groups.push({
            sectionName: question.section,
            questions: [question]
        });
    });

    return groups;

}

function createReportInsights(assessment) {

    const sectionInsights = assessment.categories.map(category => ({
        ...category,
        interpretation: getSectionInterpretation(category.title, category.percentage)
    }));

    const strongestSection = [...sectionInsights].sort((a, b) => b.percentage - a.percentage)[0] || sectionInsights[0];
    const growthSection = [...sectionInsights].sort((a, b) => a.percentage - b.percentage)[0] || sectionInsights[0];

    return {
        overallSummary: getOverallInterpretation(assessment.overall.percentage),
        sections: sectionInsights,
        strongestSection,
        growthSection,
        strongestSectionExplanation: strongestSection ? getStrongestAreaExplanation(getDisplaySectionName(strongestSection.title), strongestSection.percentage) : "",
        growthSectionExplanation: growthSection ? getGrowthAreaExplanation(getDisplaySectionName(growthSection.title), growthSection.percentage) : "",
        actionPlan: buildActionPlan(assessment),
        growthQuestionGroups: buildGrowthQuestionGroups()
    };

}

function detectStrengths(categories) {

    return categories.filter(category => category.percentage >= 75).map(category => ({
        id: category.id,
        title: category.title,
        percentage: category.percentage,
        level: category.level,
        comment: category.comment
    }));

}

function detectWeaknesses(categories) {

    return categories.filter(category => category.percentage < 60).map(category => ({
        id: category.id,
        title: category.title,
        percentage: category.percentage,
        level: category.level,
        comment: category.comment
    }));

}

function generateRecommendations(assessment, strengths, weaknesses) {

    const recommendations = [];

    if (assessment.overall.percentage < 60) {
        recommendations.push("اپنی روزمرہ کی عادتوں میں منظم اور گہری خودِ نگرانی شامل کریں۔");
    }

    weaknesses.forEach(item => {
        recommendations.push(`"${item.title}" کے شعبے میں مزید توجہ اور مسلسل محاسبہ رکھیں۔`);
    });

    strengths.forEach(item => {
        recommendations.push(`"${item.title}" کی اچھی سطح کو برقرار رکھنے کے لیے مسلسل عمل جاری رکھیں۔`);
    });

    return recommendations;

}

function createFinalReport() {

    const assessment = generateAssessment();
    const strengths = detectStrengths(assessment.categories);
    const weaknesses = detectWeaknesses(assessment.categories);
    const insights = createReportInsights(assessment);

    return {
        assessment,
        strengths,
        weaknesses,
        recommendations: generateRecommendations(assessment, strengths, weaknesses),
        insights
    };

}

function submitQuestionnaire() {

    saveAnswers();
    isSubmitted = true;
    const report = createFinalReport();
    renderDashboard(report);
    return report;

}

function getReportSectionData(sectionName, categories) {

    const fallbackCategory = {
        title: sectionName,
        percentage: 0,
        level: getPerformanceLevel(0),
        raw: 0,
        max: 0
    };

    const normalizedCategory = categories.find(category => category.title === sectionName);

    if (normalizedCategory) {
        return {
            ...normalizedCategory,
            title: sectionName
        };
    }

    if (sectionName === "تعلق باللہ و عبادات") {
        const mappedCategory = categories.find(category => category.title === "عبادات");
        return mappedCategory ? {
            ...mappedCategory,
            title: sectionName
        } : fallbackCategory;
    }

    if (sectionName === "اسلامی فکر و طرزِ زندگی") {
        const mappedCategory = categories.find(category => category.title === "مقصدِ حیات");
        return mappedCategory ? {
            ...mappedCategory,
            title: sectionName
        } : fallbackCategory;
    }

    return fallbackCategory;

}

function buildReportSections(categories) {

    const sectionOrder = [
        "عقیدہ و فکر",
        "تعلق باللہ و عبادات",
        "اسلامی فکر و طرزِ زندگی",
        "تزکیۂ نفس",
        "معاملات و اخلاق",
        "دعوت و اقامتِ دین",
        "تنظیمی زندگی"
    ];

    return sectionOrder.map(sectionName => getReportSectionData(sectionName, categories));

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

function renderDashboard(report) {

    showDashboardScreen();

    const dashboard = document.getElementById("dashboardScreen");
    const overall = report.assessment.overall;
    const categories = report.assessment.categories;
    const reportSections = buildReportSections(categories);
    const insights = report.insights || createReportInsights(report.assessment);
    const rawScores = calculateRawScores();
    const overallScoreLabel = rawScores.overall.max ? `${rawScores.overall.raw}/${rawScores.overall.max}` : `${overall.percentage}%`;
    const assessmentDate = new Date().toLocaleDateString("ur-PK", {
        year: "numeric",
        month: "long",
        day: "numeric"
    });

    const strongestSection = reportSections.reduce((best, current) => {
        return current.percentage > best.percentage ? current : best;
    }, reportSections[0] || { title: "—", percentage: 0 });

    const growthSection = reportSections.reduce((lowest, current) => {
        return current.percentage < lowest.percentage ? current : lowest;
    }, reportSections[0] || { title: "—", percentage: 100 });

    const sectionMarkup = reportSections.map(section => `
        <div class="report-section-card">
            <div class="report-section-row">
                <div><strong>${section.title}</strong></div>
                <div>${section.percentage}%</div>
                <div>${section.level}</div>
            </div>
            <div class="report-section-bar"><span style="width:${Math.max(4, section.percentage)}%"></span></div>
            <p class="report-section-interpretation">${(insights.sections.find(item => item.title === section.title || getDisplaySectionName(item.title) === section.title) || {}).interpretation || ""}</p>
        </div>`).join("");

    dashboard.innerHTML = `
        <div class="dashboard-report">
            <section class="report-card report-cover">
                <h1>محاسبۂ نفس</h1>
                <h2>معیارِ مطلوب کی روشنی میں</h2>
                <h3>Assessment Report</h3>
                <div class="report-metrics">
                    <div>
                        <strong>Assessment Date</strong>
                        <span>${assessmentDate}</span>
                    </div>
                    <div>
                        <strong>Overall Percentage</strong>
                        <span>${overall.percentage}%</span>
                    </div>
                    <div>
                        <strong>Current Level</strong>
                        <span>${overall.level}</span>
                    </div>
                </div>
            </section>

            <section class="report-card">
                <div class="report-card-head"><span class="report-card-icon">◎</span><h3>Overall Result</h3></div>
                <div class="report-metrics">
                    <div>
                        <strong>Overall Score</strong>
                        <span>${overallScoreLabel}</span>
                    </div>
                    <div>
                        <strong>Overall Rating</strong>
                        <span>${overall.level}</span>
                    </div>
                </div>
                <p class="report-summary-text">${insights.overallSummary}</p>
            </section>

            <section class="report-card benchmark-card">
                <div class="report-card-head"><span class="report-card-icon">✦</span><h3>معیارِ مطلوب</h3></div>
                <p class="report-summary-text benchmark-intro">یہ جائزہ دستورِ جماعت اسلامی ہند میں بیان کردہ معیارِ مطلوب کی روشنی میں ترتیب دیا گیا ہے۔ درج ذیل نکات وہ مطلوبہ معیار ہیں جن کے تناظر میں آپ کے جوابات کا تجزیہ کیا گیا ہے۔</p>
            </section>

            <section class="report-card">
                <div class="report-card-head"><span class="report-card-icon">▣</span><h3>Seven Section Analysis</h3></div>
                <div class="report-section-list">
                    ${sectionMarkup}
                </div>
            </section>

            <section class="report-card report-highlight">
                <div class="report-card-head"><span class="report-card-icon">★</span><h3>Strongest Area</h3></div>
                <div class="report-highlight-card">
                    <div class="report-highlight-title">${strongestSection.title}</div>
                    <div class="report-highlight-value">${strongestSection.percentage}%</div>
                    <p class="report-summary-text">${insights.strongestSectionExplanation}</p>
                </div>
            </section>

            <section class="report-card">
                <div class="report-card-head"><span class="report-card-icon">↗</span><h3>Areas for Growth</h3></div>
                <div class="report-section-list">
                    <div class="report-section-row">
                        <div><strong>${growthSection.title}</strong></div>
                        <div>${growthSection.percentage}%</div>
                    </div>
                    <p class="report-summary-text">${insights.growthSectionExplanation}</p>
                </div>
            </section>

            <section class="report-card">
                <div class="report-card-head"><span class="report-card-icon">✎</span><h3>Question Insights</h3></div>
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

            <section class="report-card">
                <div class="report-card-head"><span class="report-card-icon">✓</span><h3>30-Day Action Plan</h3></div>
                <ul class="report-action-list">
                    ${insights.actionPlan.map(item => `<li>${item}</li>`).join("")}
                </ul>
            </section>

            <section class="report-card">
                <div class="report-card-head"><span class="report-card-icon">✦</span><h3>Reflection</h3></div>
                <ul class="report-reflection-list">
                    <li>Which answer surprised you most?</li>
                    <li>Which area needs your immediate attention?</li>
                    <li>What is one habit you will improve this month?</li>
                </ul>
            </section>

            <div class="navigation">
                <button id="restartBtn" class="secondary-btn">Restart Questionnaire</button>
                <button id="printBtn" class="primary-btn">Print Report</button>
            </div>
        </div>`;

    dashboard.removeEventListener("click", handleGrowthGroupToggle);
    dashboard.addEventListener("click", handleGrowthGroupToggle);

    document.getElementById("restartBtn")?.addEventListener("click", startQuestionnaire);
    document.getElementById("printBtn")?.addEventListener("click", printReport);

}

function printReport() {

    window.print();

}

function showDashboard() {

    return null;

}

function showReport(reportData) {

    return reportData;

}

document.addEventListener("DOMContentLoaded", initializeApp);