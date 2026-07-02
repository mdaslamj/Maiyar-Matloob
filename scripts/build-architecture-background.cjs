const sharp = require("sharp");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const INPUT = path.join(ROOT, "assets", "images", "maiyaar-home-background.jpg");
const OUTPUT = path.join(ROOT, "assets", "images", "maiyaar-architecture-background.jpg");

async function buildArchitectureBackground() {

    const { width, height } = await sharp(INPUT).metadata();
    const canvasWidth = 1920;
    const canvasHeight = 1080;
    const sideWidth = Math.round(width * 0.26);
    const sideRenderWidth = Math.round(canvasWidth * 0.27);

    const creamBase = await sharp({
        create: {
            width: canvasWidth,
            height: canvasHeight,
            channels: 3,
            background: { r: 251, g: 247, b: 240 }
        }
    }).jpeg().toBuffer();

    const leftBand = await sharp(INPUT)
        .extract({ left: 0, top: 0, width: sideWidth, height })
        .resize(sideRenderWidth, canvasHeight, { fit: "cover", position: "left" })
        .modulate({ brightness: 1.05, saturation: 0.7 })
        .jpeg({ quality: 90 })
        .toBuffer();

    const rightBand = await sharp(INPUT)
        .extract({ left: width - sideWidth, top: 0, width: sideWidth, height })
        .resize(sideRenderWidth, canvasHeight, { fit: "cover", position: "right" })
        .modulate({ brightness: 1.05, saturation: 0.7 })
        .jpeg({ quality: 90 })
        .toBuffer();

    const topLeftCorner = await sharp(INPUT)
        .extract({ left: 0, top: 0, width: sideWidth, height: Math.round(height * 0.36) })
        .resize(sideRenderWidth, Math.round(canvasHeight * 0.34), { fit: "cover", position: "left top" })
        .jpeg({ quality: 90 })
        .toBuffer();

    const topRightCorner = await sharp(INPUT)
        .extract({ left: width - sideWidth, top: 0, width: sideWidth, height: Math.round(height * 0.36) })
        .resize(sideRenderWidth, Math.round(canvasHeight * 0.34), { fit: "cover", position: "right top" })
        .jpeg({ quality: 90 })
        .toBuffer();

    const centerVeilSvg = `
        <svg width="${canvasWidth}" height="${canvasHeight}" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="centerFade" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="#fbf7f0" stop-opacity="0.35"/>
                    <stop offset="18%" stop-color="#fbf7f0" stop-opacity="0.96"/>
                    <stop offset="82%" stop-color="#fbf7f0" stop-opacity="0.96"/>
                    <stop offset="100%" stop-color="#fbf7f0" stop-opacity="0.35"/>
                </linearGradient>
                <linearGradient id="topFade" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#fbf7f0" stop-opacity="0.98"/>
                    <stop offset="28%" stop-color="#fbf7f0" stop-opacity="0.88"/>
                    <stop offset="100%" stop-color="#fbf7f0" stop-opacity="0"/>
                </linearGradient>
            </defs>
            <rect width="100%" height="100%" fill="url(#centerFade)"/>
            <rect width="100%" height="100%" fill="url(#topFade)"/>
        </svg>`;

    const centerVeil = await sharp(Buffer.from(centerVeilSvg)).png().toBuffer();

    await sharp(creamBase)
        .composite([
            { input: leftBand, top: 0, left: 0 },
            { input: rightBand, top: 0, left: canvasWidth - sideRenderWidth },
            { input: topLeftCorner, top: 0, left: 0 },
            { input: topRightCorner, top: 0, left: canvasWidth - sideRenderWidth },
            { input: centerVeil, top: 0, left: 0 }
        ])
        .jpeg({ quality: 92, mozjpeg: true })
        .toFile(OUTPUT);

    console.log(`Created ${OUTPUT}`);

}

buildArchitectureBackground().catch(error => {
    console.error(error);
    process.exit(1);
});
