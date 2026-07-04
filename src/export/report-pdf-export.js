/**
 * Generate a downloadable PDF from the rendered assessment report DOM.
 * Uses html2canvas for faithful layout capture (including Urdu/RTL text)
 * and jsPDF for multi-page PDF assembly — independent of browser print dialogs.
 */

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const PAGE_MARGIN_MM = 10;
const SECTION_GAP_MM = 3;
const EXPORT_WIDTH_PX = 794;
const CAPTURE_SCALE = 2;
const JPEG_QUALITY = 0.92;

let librariesPromise = null;
const JSPDF_SCRIPT_ID = "maiyaar-jspdf-lib";

function loadJsPdfUmd() {

    const jsPDF = window.jspdf?.jsPDF;

    if (typeof jsPDF === "function") {
        return Promise.resolve(jsPDF);
    }

    const existing = document.getElementById(JSPDF_SCRIPT_ID);

    if (existing?.dataset.loaded === "true") {
        return Promise.resolve(window.jspdf?.jsPDF);
    }

    if (existing) {
        return new Promise((resolve, reject) => {
            existing.addEventListener("load", () => {
                resolve(window.jspdf?.jsPDF);
            }, { once: true });
            existing.addEventListener("error", () => {
                reject(new Error("jsPDF failed to load."));
            }, { once: true });
        });
    }

    return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.id = JSPDF_SCRIPT_ID;
        script.src = new URL("../../vendor/jspdf.umd.min.js", import.meta.url).href;
        script.async = true;
        script.onload = () => {
            script.dataset.loaded = "true";
            const loadedJsPDF = window.jspdf?.jsPDF;

            if (typeof loadedJsPDF !== "function") {
                reject(new Error("jsPDF failed to load."));
                return;
            }

            resolve(loadedJsPDF);
        };
        script.onerror = () => reject(new Error("jsPDF failed to load."));
        document.head.appendChild(script);
    });

}

function loadPdfLibraries() {

    if (!librariesPromise) {
        librariesPromise = Promise.all([
            loadJsPdfUmd(),
            import("../../vendor/html2canvas.esm.js")
        ]).then(([jsPDF, html2canvasModule]) => ({
            jsPDF,
            html2canvas: html2canvasModule.default
        }));
    }

    return librariesPromise;

}

function waitForFonts() {

    if (document.fonts?.ready) {
        return document.fonts.ready;
    }

    return Promise.resolve();

}

function prepareReportClone(sourceRoot) {

    const clone = sourceRoot.cloneNode(true);

    clone.querySelectorAll(".no-print, .screen-toolbar, .report-hub-nav").forEach(element => {
        element.remove();
    });

    clone.querySelectorAll(".growth-group").forEach(group => {
        const toggle = group.querySelector(".growth-group-toggle");
        const panel = group.querySelector(".growth-group-panel");

        if (panel) {
            panel.style.display = "grid";
        }

        if (toggle) {
            toggle.setAttribute("data-expanded", "true");
            toggle.setAttribute("aria-expanded", "true");
        }
    });

    clone.classList.add("report-pdf-export");
    return clone;

}

function mountExportContainer(clone) {

    const container = document.createElement("div");
    container.className = "report-pdf-export-container";
    container.setAttribute("aria-hidden", "true");
    container.appendChild(clone);
    document.body.appendChild(container);
    return container;

}

function canvasHeightToMm(canvas, widthMm) {

    return (canvas.height * widthMm) / canvas.width;

}

function createCanvasSlice(canvas, offsetY, sliceHeight) {

    const slice = document.createElement("canvas");
    slice.width = canvas.width;
    slice.height = sliceHeight;

    const context = slice.getContext("2d");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, slice.width, slice.height);
    context.drawImage(
        canvas,
        0,
        offsetY,
        canvas.width,
        sliceHeight,
        0,
        0,
        canvas.width,
        sliceHeight
    );

    return slice;

}

function addCanvasSliceToPdf(pdf, sliceCanvas, x, y, widthMm) {

    const heightMm = canvasHeightToMm(sliceCanvas, widthMm);
    pdf.addImage(
        sliceCanvas.toDataURL("image/jpeg", JPEG_QUALITY),
        "JPEG",
        x,
        y,
        widthMm,
        heightMm
    );

    return heightMm;

}

function addCanvasToPdf(pdf, canvas, state) {

    const contentWidth = state.contentWidth;
    const pageBottom = A4_HEIGHT_MM - PAGE_MARGIN_MM;
    let cursorY = state.cursorY;
    const fullHeightMm = canvasHeightToMm(canvas, contentWidth);

    if (cursorY + fullHeightMm <= pageBottom) {
        cursorY += addCanvasSliceToPdf(pdf, canvas, PAGE_MARGIN_MM, cursorY, contentWidth);
        state.cursorY = cursorY + SECTION_GAP_MM;
        return;
    }

    const maxSlicePx = Math.max(
        1,
        Math.floor((state.contentHeight * canvas.width) / contentWidth)
    );
    let offsetY = 0;

    while (offsetY < canvas.height) {
        let availableMm = pageBottom - cursorY;

        if (availableMm <= 1) {
            pdf.addPage();
            cursorY = PAGE_MARGIN_MM;
            availableMm = pageBottom - cursorY;
        }

        const availablePx = Math.max(
            1,
            Math.floor((availableMm * canvas.width) / contentWidth)
        );
        const remainingPx = canvas.height - offsetY;
        const currentSlicePx = Math.min(remainingPx, availablePx, maxSlicePx);
        const sliceCanvas = createCanvasSlice(canvas, offsetY, currentSlicePx);

        cursorY += addCanvasSliceToPdf(pdf, sliceCanvas, PAGE_MARGIN_MM, cursorY, contentWidth);
        offsetY += currentSlicePx;

        if (offsetY < canvas.height) {
            pdf.addPage();
            cursorY = PAGE_MARGIN_MM;
        }
    }

    state.cursorY = cursorY + SECTION_GAP_MM;

}

async function captureSection(html2canvas, section) {

    return html2canvas(section, {
        backgroundColor: "#ffffff",
        scale: CAPTURE_SCALE,
        useCORS: true,
        logging: false,
        windowWidth: EXPORT_WIDTH_PX,
        scrollX: 0,
        scrollY: 0,
        onclone: clonedDocument => {
            const exportRoot = clonedDocument.querySelector(".report-pdf-export-container");

            if (exportRoot) {
                exportRoot.style.position = "static";
                exportRoot.style.left = "0";
                exportRoot.style.width = `${EXPORT_WIDTH_PX}px`;
            }

            clonedDocument.documentElement.setAttribute("dir", "rtl");
            clonedDocument.documentElement.setAttribute("lang", "ur");
            clonedDocument.body.style.fontFamily = "'Noto Naskh Arabic', serif";
            clonedDocument.body.style.direction = "rtl";
        }
    });

}

export function buildReportPdfFilename(date = new Date()) {

    const stamp = date.toISOString().slice(0, 10);
    return `maiyaar-report-${stamp}.pdf`;

}

export async function exportReportToPdf({
    sourceElement,
    filename = buildReportPdfFilename()
} = {}) {

    if (!sourceElement) {
        throw new Error("Report content is unavailable.");
    }

    const { jsPDF, html2canvas } = await loadPdfLibraries();
    await waitForFonts();

    const clone = prepareReportClone(sourceElement);
    const container = mountExportContainer(clone);

    try {
        const sections = Array.from(clone.querySelectorAll(".report-card"));

        if (!sections.length) {
            throw new Error("Report sections are unavailable.");
        }

        const pdf = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4",
            compress: true
        });

        const state = {
            contentWidth: A4_WIDTH_MM - PAGE_MARGIN_MM * 2,
            contentHeight: A4_HEIGHT_MM - PAGE_MARGIN_MM * 2,
            cursorY: PAGE_MARGIN_MM
        };

        for (const section of sections) {
            const canvas = await captureSection(html2canvas, section);
            addCanvasToPdf(pdf, canvas, state);
        }

        pdf.save(filename);
    }
    finally {
        container.remove();
    }

}

export const ReportPdfExport = {
    buildReportPdfFilename,
    exportReportToPdf
};
