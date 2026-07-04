import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = path.join(ROOT, "assets", "images", "maiyaar-home-background.jpg");
const OUTPUT = path.join(ROOT, "assets", "images", "maiyaar-home-background-decor.jpg");

const meta = await sharp(SOURCE).metadata();
const width = meta.width;
const height = meta.height;
const archHeight = Math.round(height * 0.28);

const archStrip = await sharp(SOURCE)
    .extract({ left: 0, top: 0, width, height: archHeight })
    .blur(2.5)
    .modulate({ brightness: 1.04, saturation: 0.82 })
    .toBuffer();

const creamBody = Buffer.from(
    `<svg width="${width}" height="${height - archHeight}" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="cream" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#f7f2ea"/>
                <stop offset="100%" stop-color="#fbf7f0"/>
            </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#cream)"/>
    </svg>`
);

const creamSection = await sharp(creamBody).png().toBuffer();

await sharp({
    create: {
        width,
        height,
        channels: 3,
        background: { r: 251, g: 247, b: 240 }
    }
})
    .composite([
        { input: archStrip, top: 0, left: 0 },
        { input: creamSection, top: archHeight, left: 0 },
        {
            input: Buffer.from(
                `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
                    <rect width="100%" height="100%" fill="#fbf7f0" opacity="0.28"/>
                </svg>`
            ),
            top: 0,
            left: 0
        }
    ])
    .jpeg({ quality: 90, mozjpeg: true })
    .toFile(OUTPUT);

console.log(`Decorative background written to ${OUTPUT}`);
