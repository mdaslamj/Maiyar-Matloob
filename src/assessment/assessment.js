// Assessment domain — pure scoring and assessment generation logic.

function getQuestionKey(question, index) {

    return question?.id || question?.standardId || `question-${index}`;

}

function getQuestionSection(question) {

    return question?.section || question?.category || "General";

}

function getQuestionIsReverseScored(question) {

    return question?.isReverseScored === true;

}

function getQuestionOptions(question, responseScale) {

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

export function getMaxScore(question, responseScale) {

    const options = getQuestionOptions(question, responseScale);

    return Math.max(...options.map(option => Number(option.value)), 1);

}

export function calculateQuestionScore(question, answer, responseScale) {

    if (!question || answer == null) {
        return 0;
    }

    const value = Number(answer);
    const maxScore = getMaxScore(question, responseScale);
    const isReverseScored = getQuestionIsReverseScored(question);

    return isReverseScored ? maxScore + 1 - value : value;

}

export function calculateRawScores(questionnaire, answers, responseScale) {

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
        const score = calculateQuestionScore(question, answer, responseScale);
        const maxScore = getMaxScore(question, responseScale);
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

export function calculateCategoryPercentages(rawScores) {

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

export function calculateOverallPercentage(rawScores) {

    const max = rawScores.overall.max || 1;
    return Number(((rawScores.overall.raw / max) * 100).toFixed(1));

}

export function getPerformanceLevel(percentage) {

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
        return "آپ کی مجموعی سطح قابلِ قبول ہے۔ اپنی اصلاح اور تزکیہ کے لیے منظم کوششوں کی ضرورت ہے۔";
    }

    if (percentage >= 40) {
        return "آپ کی مجموعی سطح میں بہتری کی ضرورت ہے۔ حقیقی خودِ نگرانی اور محاسبہ بہت ضروری ہے۔";
    }

    return "آپ کی مجموعی سطح شدید تشویش کا باعث ہے۔ فوری اور گہرے روحانی و اخلاقی محاسبہ کی ضرورت ہے۔";

}

export function generateCategoryComment(category) {

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
        return "یہ شعبہ بہتری کے لیے تقاضا کرتا ہے۔ اپنی عادتوں اور مشغولیات میں سوچ سمجھ کر تبدیلی کی ضرورت ہے۔";
    }

    if (percentage < 40) {
        return "یہ شعبہ انتہائی نیازمند ہے۔ فوری اصلاح، سمجھداری اور مسلسل محاسبہ ضروری ہے۔";
    }

    return "اس شعبے میں مزید توجہ و کوشش کی ضرورت ہے۔";

}

export function generateAssessment(questionnaire, answers, responseScale) {

    const rawScores = calculateRawScores(questionnaire, answers, responseScale);
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
