const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "screenshots", "welcome-final-qa");
const BASE_URL = "http://127.0.0.1:8765/index.html";

const RETURNING_STORE = {
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

const VIEWPORTS = [
    { label: "desktop-1920x1080", width: 1920, height: 1080, mobile: false },
    { label: "desktop-1600x900", width: 1600, height: 900, mobile: false },
    { label: "desktop-1536x864", width: 1536, height: 864, mobile: false },
    { label: "desktop-1366x768", width: 1366, height: 768, mobile: false },
    { label: "laptop-1440x900", width: 1440, height: 900, mobile: false },
    { label: "tablet-1024x768", width: 1024, height: 768, mobile: false },
    { label: "tablet-820x1180", width: 820, height: 1180, mobile: true },
    { label: "mobile-390x844", width: 390, height: 844, mobile: true, scale: 3 },
    { label: "mobile-393x852", width: 393, height: 852, mobile: true, scale: 3 },
    { label: "mobile-412x915", width: 412, height: 915, mobile: true, scale: 3 },
    { label: "mobile-430x932", width: 430, height: 932, mobile: true, scale: 3 }
];

async function waitForWelcome(page) {
    await page.waitForSelector("#welcomeScreen:not([hidden])", { timeout: 20000 });
    await page.waitForFunction(() => {
        const loading = document.getElementById("questionnaireLoadingMessage");
        const panel = document.querySelector("#participantSection .welcome-panel");
        return (loading && loading.hidden) || Boolean(panel);
    }, { timeout: 20000 });
    await page.waitForSelector("#participantSection .welcome-panel", { timeout: 20000 });
    await page.evaluate(async () => {
        if (document.fonts?.ready) {
            await document.fonts.ready;
        }
    });
    await new Promise(r => setTimeout(r, 500));
}

function rect(el) {
    if (!el) {
        return null;
    }
    const r = el.getBoundingClientRect();
    return {
        x: Math.round(r.x),
        y: Math.round(r.y),
        width: Math.round(r.width),
        height: Math.round(r.height),
        right: Math.round(r.right),
        bottom: Math.round(r.bottom)
    };
}

async function auditPage(page, context) {
    return page.evaluate(({ contextLabel }) => {
        const issues = [];
        const doc = document.documentElement;
        const body = document.body;
        const pageEl = document.querySelector(".welcome-page");
        const hero = document.querySelector(".welcome-hero");
        const participant = document.querySelector(".welcome-participant");
        const panel = document.querySelector(".welcome-panel");
        const summary = document.querySelector(".welcome-summary");
        const meta = document.querySelector(".welcome-meta");
        const grid = document.querySelector(".welcome-summary__grid");
        const cards = [...document.querySelectorAll(".welcome-summary__grid .ui-card")];

        const add = (severity, code, detail) => issues.push({ severity, code, detail });

        const scrollW = Math.max(doc.scrollWidth, body.scrollWidth);
        const clientW = doc.clientWidth;
        if (scrollW > clientW + 1) {
            add("fail", "horizontal-scroll", `scrollWidth ${scrollW} > clientWidth ${clientW}`);
        }

        const scrollH = Math.max(doc.scrollHeight, body.scrollHeight);
        const clientH = window.innerHeight;
        const overflowY = scrollH - clientH;

        if (contextLabel.includes("desktop") || contextLabel.includes("laptop") || contextLabel.includes("tablet-1024")) {
            if (overflowY > 2) {
                add("fail", "desktop-vertical-overflow", `scrollHeight ${scrollH} > viewport ${clientH} by ${overflowY}px`);
            }
        }

        if (contextLabel.startsWith("mobile") && overflowY > 120) {
            add("warn", "mobile-scroll-excess", `mobile overflow ${overflowY}px (>120px threshold)`);
        }

        const pageRect = pageEl?.getBoundingClientRect();
        const heroRect = hero?.getBoundingClientRect();
        const participantRect = participant?.getBoundingClientRect();
        const metaRect = meta?.getBoundingClientRect();

        if (pageRect) {
            const pageCenter = pageRect.left + pageRect.width / 2;
            const viewportCenter = clientW / 2;
            if (Math.abs(pageCenter - viewportCenter) > 2) {
                add("fail", "page-not-centered", `page center offset ${Math.round(pageCenter - viewportCenter)}px`);
            }
        }

        if (heroRect && pageRect) {
            const heroCenter = heroRect.left + heroRect.width / 2;
            const pageCenter = pageRect.left + pageRect.width / 2;
            if (Math.abs(heroCenter - pageCenter) > 2) {
                add("fail", "hero-not-centered", `hero offset ${Math.round(heroCenter - pageCenter)}px from page center`);
            }
        }

        if (participantRect && pageRect) {
            const partCenter = participantRect.left + participantRect.width / 2;
            const pageCenter = pageRect.left + pageRect.width / 2;
            if (Math.abs(partCenter - pageCenter) > 2) {
                add("fail", "participant-not-centered", `participant offset ${Math.round(partCenter - pageCenter)}px`);
            }
        }

        if (metaRect && pageRect) {
            if (Math.abs(metaRect.width - pageRect.width) > 2) {
                add("warn", "meta-width-mismatch", `meta ${Math.round(metaRect.width)}px vs page ${Math.round(pageRect.width)}px`);
            }
        }

        if (panel?.classList.contains("welcome-panel--single")) {
            const placeholder = document.querySelector(".welcome-panel__column--returning.is-placeholder");
            if (placeholder) {
                add("fail", "empty-placeholder", "returning placeholder visible in single-panel mode");
            }
            const divider = document.querySelector(".welcome-panel__divider");
            if (divider) {
                add("fail", "single-panel-divider", "divider visible in single-panel mode");
            }
        }

        if (panel?.classList.contains("welcome-panel--dual")) {
            const cols = [...document.querySelectorAll(".welcome-panel__column")];
            if (cols.length !== 2) {
                add("fail", "dual-column-count", `expected 2 columns, found ${cols.length}`);
            } else {
                const hDiff = Math.abs(cols[0].getBoundingClientRect().height - cols[1].getBoundingClientRect().height);
                if (hDiff > 4 && window.innerWidth > 767) {
                    add("warn", "dual-column-height", `column height diff ${Math.round(hDiff)}px`);
                }
            }
        }

        if (grid && cards.length === 3) {
            const gridRect = grid.getBoundingClientRect();
            cards.forEach((card, i) => {
                const cardRect = card.getBoundingClientRect();
                if (cardRect.bottom > clientH + 2 && contextLabel.includes("desktop-1366")) {
                    add("warn", "card-clipped", `card ${i + 1} bottom ${Math.round(cardRect.bottom)} > viewport ${clientH}`);
                }
                if (cardRect.right > gridRect.right + 1 || cardRect.left < gridRect.left - 1) {
                    add("fail", "card-grid-overflow", `card ${i + 1} exceeds grid bounds`);
                }
            });
        }

        document.querySelectorAll("button, input, .welcome-panel__link").forEach(el => {
            const r = el.getBoundingClientRect();
            if (r.width > 0 && r.height > 0 && (r.height < 38 || r.width < 38) && el.tagName !== "INPUT") {
                add("warn", "touch-target", `${el.id || el.className} ${Math.round(r.width)}x${Math.round(r.height)}`);
            }
        });

        const clipped = [...document.querySelectorAll(".welcome-page *")].filter(el => {
            const style = getComputedStyle(el);
            if (style.overflow === "hidden" && el.scrollHeight > el.clientHeight + 2) {
                const r = el.getBoundingClientRect();
                return r.height > 0 && r.width > 0 && !el.classList.contains("welcome-summary__grid");
            }
            return false;
        });

        clipped.slice(0, 3).forEach(el => {
            add("warn", "content-clipped", `${el.className || el.tagName} scroll ${el.scrollHeight}/${el.clientHeight}`);
        });

        return {
            context: contextLabel,
            viewport: { width: clientW, height: clientH },
            scroll: { width: scrollW, height: scrollH, overflowY },
            panelMode: panel?.classList.contains("welcome-panel--dual") ? "dual" : "single",
            issueCount: issues.length,
            issues
        };
    }, { contextLabel: context });
}

async function captureScreenshot(page, fileName) {
    const filePath = path.join(OUT_DIR, fileName);
    await page.screenshot({ path: filePath, fullPage: false, type: "png" });
    return filePath;
}

(async () => {
    fs.mkdirSync(OUT_DIR, { recursive: true });

    const browser = await puppeteer.launch({
        headless: true,
        defaultViewport: null,
        args: ["--font-render-hinting=medium"]
    });

    const results = [];
    const screenshots = [];

    try {
        for (const vp of VIEWPORTS) {
            for (const mode of ["first-time", "returning"]) {
                const page = await browser.newPage();
                await page.setViewport({
                    width: vp.width,
                    height: vp.height,
                    deviceScaleFactor: vp.scale || 1,
                    isMobile: Boolean(vp.mobile),
                    hasTouch: Boolean(vp.mobile)
                });

                if (mode === "returning") {
                    await page.evaluateOnNewDocument(store => {
                        localStorage.clear();
                        localStorage.setItem("mahasaba-nafs-participants", JSON.stringify(store));
                    }, RETURNING_STORE);
                } else {
                    await page.evaluateOnNewDocument(() => localStorage.clear());
                }

                await page.goto(BASE_URL, { waitUntil: "networkidle0", timeout: 30000 });
                await waitForWelcome(page);

                if (mode === "returning") {
                    await page.waitForSelector(".welcome-panel--dual", { timeout: 10000 });
                } else {
                    await page.waitForSelector(".welcome-panel--single", { timeout: 10000 });
                }

                const context = `${vp.label}/${mode}`;
                const audit = await auditPage(page, context);
                results.push(audit);

                const shotKey = `${vp.label}-${mode}.png`;
                if (
                    (vp.label === "desktop-1920x1080" || vp.label === "mobile-390x844") &&
                    (mode === "first-time" || mode === "returning")
                ) {
                    const saved = await captureScreenshot(page, shotKey);
                    screenshots.push(saved);
                }

                await page.close();
            }
        }
    } finally {
        await browser.close();
    }

    const reportPath = path.join(OUT_DIR, "qa-report.json");
    fs.writeFileSync(reportPath, JSON.stringify({ results, screenshots }, null, 2));

    const fails = results.flatMap(r => r.issues.filter(i => i.severity === "fail").map(i => ({ ...i, context: r.context })));
    const warns = results.flatMap(r => r.issues.filter(i => i.severity === "warn").map(i => ({ ...i, context: r.context })));

    console.log("\n=== Welcome Final QA ===");
    console.log(`Checks: ${results.length}`);
    console.log(`Failures: ${fails.length}`);
    console.log(`Warnings: ${warns.length}`);
    console.log(`Report: ${reportPath}`);

    if (fails.length) {
        console.log("\nFAILURES:");
        fails.forEach(f => console.log(`  [${f.context}] ${f.code}: ${f.detail}`));
    }

    if (warns.length) {
        console.log("\nWARNINGS:");
        warns.forEach(w => console.log(`  [${w.context}] ${w.code}: ${w.detail}`));
    }

    process.exit(fails.length ? 1 : 0);
})().catch(err => {
    console.error(err);
    process.exit(1);
});
