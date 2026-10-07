// Rasterises the IDX mark (src/app/icon.svg — the same shapes as LogoMark in
// src/components/icons.tsx) for places that need pixels:
//  - src/app/icon.png — favicon fallback for browsers without SVG favicons, transparent;
//  - src/app/apple-icon.png — iOS home screen, the mark on the site's graphite.
// Run after changing the mark: npm run brand --prefix tools/decor-render
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const svg = await readFile(resolve(root, "src/app/icon.svg"), "utf8");

/** `mark`: the mark's square, share of the image (centred). */
const targets = [
  { file: "src/app/icon.png", size: 64, mark: 1 },
  { file: "src/app/apple-icon.png", size: 180, mark: 0.7, backdrop: true },
];

const browser = await chromium.launch({
  ...(process.env.BROWSER_PATH ? { executablePath: process.env.BROWSER_PATH } : { channel: "msedge" }),
  headless: true,
});

try {
  const page = await browser.newPage();
  for (const t of targets) {
    const png = await page.evaluate(
      async ({ svg, t }) => {
        const img = new Image();
        img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
        await img.decode();
        const out = document.createElement("canvas");
        out.width = out.height = t.size;
        const ctx = out.getContext("2d");
        if (t.backdrop) {
          const bg = ctx.createRadialGradient(t.size * 0.5, t.size * 0.3, 0, t.size * 0.5, t.size * 0.5, t.size * 0.75);
          bg.addColorStop(0, "#1a1c22");
          bg.addColorStop(1, "#07080a");
          ctx.fillStyle = bg;
          ctx.fillRect(0, 0, t.size, t.size);
        }
        const side = t.size * t.mark;
        ctx.drawImage(img, (t.size - side) / 2, (t.size - side) / 2, side, side);
        return out.toDataURL("image/png").split(",")[1];
      },
      { svg, t },
    );
    const buf = Buffer.from(png, "base64");
    await writeFile(resolve(root, t.file), buf);
    console.log(`${t.file} ${t.size}×${t.size}, ${(buf.length / 1024).toFixed(1)} KB`);
  }
} finally {
  await browser.close();
}
