const puppeteer = require("puppeteer");

const BASE_URL = "http://127.0.0.1:8765/index.html";

const RETURNING_PARTICIPANT_STORE = {
    schemaVersion: 1,
    currentParticipantId: "3001234567",
    participants: {
        "3001234567": {
            participantId: "3001234567",
            name: "احمد علی",
            mobile: "3001234567",
            createdAt: "2026-01-01T00:00:00.000Z",
            lastAssessmentAt: "2026-02-15T00:00:00.000Z",
            assessmentCount: 2
        }
    }
};

(async () => {

    const browser = await puppeteer.launch({ headless: true });

    async function measure(label, setup) {

        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
        if (setup) {
            await setup(page);
        }
        await page.goto(BASE_URL, { waitUntil: "networkidle0" });
        await page.waitForSelector(".welcome-panel");
        const metrics = await page.evaluate(() => ({
            scrollHeight: document.documentElement.scrollHeight,
            clientHeight: document.documentElement.clientHeight,
            bodyOverflow: getComputedStyle(document.body).overflow,
            welcomeOverflow: getComputedStyle(document.querySelector(".welcome-screen")).overflow
        }));
        console.log(label, metrics);
        await page.close();

    }

    await measure("first-time-desktop", null);
    await measure("returning-desktop", page => page.evaluateOnNewDocument(store => {
        localStorage.setItem("mahasaba-nafs-participants", JSON.stringify(store));
    }, RETURNING_PARTICIPANT_STORE));

    const mobilePage = await browser.newPage();
    await mobilePage.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true });
    await mobilePage.goto(BASE_URL, { waitUntil: "networkidle0" });
    await mobilePage.waitForSelector(".welcome-panel");
    const mobileMetrics = await mobilePage.evaluate(() => ({
        scrollHeight: document.documentElement.scrollHeight,
        clientHeight: document.documentElement.clientHeight
    }));
    console.log("first-time-mobile", mobileMetrics);
    await browser.close();

})();
