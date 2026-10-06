// Renders the 3D decor into public/decor/*.webp.
//   npm install --prefix tools/decor-render
//   npm run render --prefix tools/decor-render              — every object
//   npm run render --prefix tools/decor-render -- play lens — only these
// The scene (models, materials, studio light) lives in scene.js and runs in a headless Edge
// (or Chrome: set BROWSER_PATH). Prints the intrinsic sizes for INTRINSIC in decor-3d.tsx and
// saves a contact sheet on a dark background to preview.png.
import { createServer } from "node:http";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(here, "../../public/decor");
const threeDir = join(here, "node_modules", "three");
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8" };

// Static server for the scene and three.js (localhost only, no paths outside the two roots)
const server = createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url ?? "/", "http://localhost").pathname);
  const [root, rel] = path.startsWith("/three/") ? [threeDir, path.slice(7)] : [here, path === "/" ? "scene.html" : path.slice(1)];
  const file = resolve(root, rel);
  if (!file.startsWith(root + sep) || !(extname(file) in types)) {
    res.writeHead(404).end();
    return;
  }
  try {
    res.writeHead(200, { "Content-Type": types[extname(file)] }).end(await readFile(file));
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((ok) => server.listen(0, "127.0.0.1", ok));
const { port } = server.address();

const browser = await chromium.launch({
  ...(process.env.BROWSER_PATH ? { executablePath: process.env.BROWSER_PATH } : { channel: "msedge" }),
  headless: true,
  // GPU if there is one; otherwise WebGL falls back to SwiftShader (slow, same picture)
  args: ["--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});

try {
  const page = await browser.newPage();
  page.on("console", (m) => m.type() === "error" && console.error("[page]", m.text()));
  page.on("pageerror", (e) => console.error("[page]", e.message));
  await page.goto(`http://127.0.0.1:${port}/`);
  await page.waitForFunction(() => "decor" in window, null, { timeout: 30000 });

  const all = await page.evaluate(() => window.decor.names);
  const wanted = process.argv.slice(2);
  const unknown = wanted.filter((n) => !all.includes(n));
  if (unknown.length) throw new Error(`Unknown object(s): ${unknown.join(", ")}. Known: ${all.join(", ")}`);
  const names = wanted.length ? wanted : all;
  console.log(`GPU: ${await page.evaluate(() => window.decor.gpu)}`);

  await mkdir(outDir, { recursive: true });
  const sizes = {};
  for (const name of names) {
    const t = Date.now();
    const r = await page.evaluate((n) => window.decor.render(n), name);
    await writeFile(join(outDir, `${name}.webp`), Buffer.from(r.webp, "base64"));
    sizes[name] = [r.width, r.height];
    console.log(`${name.padEnd(10)} ${r.width}×${r.height}  ${(r.bytes / 1024).toFixed(1)} KB  ${Date.now() - t} ms`);
  }

  const sheet = await page.evaluate(() => window.decor.sheet());
  await writeFile(join(here, "preview.png"), Buffer.from(sheet, "base64"));
  console.log("\nINTRINSIC:");
  for (const [n, [w, h]] of Object.entries(sizes)) console.log(`  ${n}: [${w}, ${h}],`);
} finally {
  await browser.close();
  server.close();
}
