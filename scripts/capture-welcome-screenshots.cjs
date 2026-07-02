const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "screenshots", "welcome-review");
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

async function waitForWelcomeReady(page) {

    await page.waitForSelector("#welcomeScreen:not([hidden])", { timeout: 20000 });
    await page.waitForFunction(() => {
        const loading = document.getElementById("questionnaireLoadingMessage");
        const panel = document.querySelector("#participantSection .welcome-panel");
        return (loading && loading.hidden) || Boolean(panel);
    }, { timeout: 20000 });
    await page.waitForSelector("#participantSection .welcome-panel", { timeout: 20000 });
    await page.evaluate(async () => {
        if (document.fonts && document.fonts.ready) {
            await document.fonts.ready;
        }
    });
    await new Promise(resolve => setTimeout(resolve, 600));

}

async function capture(page, fileName, options = {}) {

    const filePath = path.join(OUT_DIR, fileName);
    await page.screenshot({
        path: filePath,
        fullPage: options.fullPage !== false,
        type: "png"
    });
    console.log(`Saved ${filePath}`);

}

(async () => {

    fs.mkdirSync(OUT_DIR, { recursive: true });

    const browser = await puppeteer.launch({
        headless: true,
        defaultViewport: null,
        args: ["--font-render-hinting=medium"]
    });

    try {
        const desktopPage = await browser.newPage();
        await desktopPage.setViewport({
            width: 1920,
            height: 1080,
            deviceScaleFactor: 1
        });
        await desktopPage.goto(BASE_URL, { waitUntil: "networkidle0", timeout: 30000 });
        await waitForWelcomeReady(desktopPage);
        await capture(desktopPage, "desktop-first-time-1920x1080-fullpage.png");
        await capture(desktopPage, "desktop-first-time-1920x1080-viewport.png", { fullPage: false });

        const returningPage = await browser.newPage();
        await returningPage.setViewport({
            width: 1920,
            height: 1080,
            deviceScaleFactor: 1
        });
        await returningPage.evaluateOnNewDocument(store => {
            localStorage.clear();
            localStorage.setItem("mahasaba-nafs-participants", JSON.stringify(store));
        }, RETURNING_PARTICIPANT_STORE);
        await returningPage.goto(BASE_URL, { waitUntil: "networkidle0", timeout: 30000 });
        await waitForWelcomeReady(returningPage);
        await returningPage.waitForSelector(".welcome-panel__column--returning.is-active", { timeout: 10000 });
        await capture(returningPage, "desktop-returning-1920x1080-fullpage.png");
        await capture(returningPage, "desktop-returning-1920x1080-viewport.png", { fullPage: false });

        const mobilePage = await browser.newPage();
        await mobilePage.setViewport({
            width: 390,
            height: 844,
            deviceScaleFactor: 3,
            isMobile: true,
            hasTouch: true
        });
        await mobilePage.goto(BASE_URL, { waitUntil: "networkidle0", timeout: 30000 });
        await waitForWelcomeReady(mobilePage);
        await capture(mobilePage, "mobile-first-time-390x844-fullpage.png");
        await capture(mobilePage, "mobile-first-time-390x844-viewport.png", { fullPage: false });

        const mobileReturningPage = await browser.newPage();
        await mobileReturningPage.setViewport({
            width: 390,
            height: 844,
            deviceScaleFactor: 3,
            isMobile: true,
            hasTouch: true
        });
        await mobileReturningPage.evaluateOnNewDocument(store => {
            localStorage.clear();
            localStorage.setItem("mahasaba-nafs-participants", JSON.stringify(store));
        }, RETURNING_PARTICIPANT_STORE);
        await mobileReturningPage.goto(BASE_URL, { waitUntil: "networkidle0", timeout: 30000 });
        await waitForWelcomeReady(mobileReturningPage);
        await mobileReturningPage.waitForSelector(".welcome-panel__column--returning.is-active", { timeout: 10000 });
        await capture(mobileReturningPage, "mobile-returning-390x844-fullpage.png");
        await capture(mobileReturningPage, "mobile-returning-390x844-viewport.png", { fullPage: false });
    }
    finally {
        await browser.close();
    }

})().catch(error => {
    console.error(error);
    process.exit(1);
});
