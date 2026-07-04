/**
 * Report PDF export smoke tests.
 *
 * Usage:
 *   node scripts/report-pdf-export-test.mjs
 */

import { buildReportPdfFilename } from "../src/export/report-pdf-export.js";

function assert(condition, message) {

    if (!condition) {
        throw new Error(message);
    }

}

function testFilename() {

    const filename = buildReportPdfFilename(new Date("2026-07-04T12:00:00.000Z"));
    assert(filename === "maiyaar-report-2026-07-04.pdf", "report pdf filename format");

    console.log("filename tests: PASS");

}

async function testVendorImports() {

    const [jspdfModule, html2canvasModule] = await Promise.all([
        import("../vendor/jspdf.es.min.js"),
        import("../vendor/html2canvas.esm.js")
    ]);

    assert(typeof jspdfModule.jsPDF === "function", "jsPDF export");
    assert(typeof html2canvasModule.default === "function", "html2canvas export");

    console.log("vendor import tests: PASS");

}

async function main() {

    testFilename();
    await testVendorImports();
    console.log("Report PDF export tests completed.");

}

main().catch(error => {
    console.error(error);
    process.exit(1);
});
