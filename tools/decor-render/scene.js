// three.js scene for the decor renders (run by render.mjs in a headless browser).
// Every object shares one studio light that matches the site's backdrop (palette «Eclipse»): a warm
// rim light from above and behind (the golden sun behind the planet), a champagne fill on the left,
// a cool steel fill on the right and a faint blue bounce from below (the planet's atmosphere).
// Materials are a small "product" set: black chrome, brushed champagne gold, ivory ceramic, pearl.
import * as THREE from "three";
import { ParametricGeometry } from "three/addons/geometries/ParametricGeometry.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";

/** Square render size (supersampled) and the longest side of the saved image, px. */
const RENDER = 1400;
const MAX_SIDE = 720;
const QUALITY = 0.86;

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(RENDER, RENDER);
renderer.setClearColor(0x000000, 0);
// Neutral keeps the warm metals from turning orange (AgX/ACES shift the hues)
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.toneMappingExposure = 1;
renderer.outputColorSpace = THREE.SRGBColorSpace;

/* ───────────── Studio ───────────── */

function studio() {
  const s = new THREE.Scene();
  const dome = new THREE.SphereGeometry(40, 64, 32);
  const top = new THREE.Color(0.012, 0.012, 0.014);
  const mid = new THREE.Color(0.001, 0.001, 0.0015);
  const bottom = new THREE.Color(0.018, 0.026, 0.045);
  const colors = [];
  const p = dome.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i) / 40;
    const c = y > 0 ? mid.clone().lerp(top, y) : mid.clone().lerp(bottom, Math.min(1, -y * 1.4));
    colors.push(c.r, c.g, c.b);
  }
  dome.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  s.add(new THREE.Mesh(dome, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));

  const panel = (w, h, color, power, x, y, z) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(power), side: THREE.DoubleSide }),
    );
    m.position.set(x, y, z);
    m.lookAt(0, 0, 0);
    s.add(m);
  };
  panel(10, 2.5, "#fff0d8", 7, 0, 9, -9); // rim: the golden sun behind the planet
  panel(6, 0.6, "#ffffff", 8, -3, 8, 6); // crisp highlight strip on top faces
  panel(1.6, 1.6, "#ffffff", 4, -5, 3, 9); // small frontal softbox: a glint on glossy faces
  panel(2.5, 7, "#e4d0a8", 3.2, -10, 1, 2); // champagne fill, left
  panel(2.5, 8, "#a8c0de", 3.2, 10, 0, 1); // cool steel fill, right
  panel(12, 5, "#3d5a8a", 1.1, 0, -10, 2); // blue bounce from the planet's atmosphere below
  panel(2.5, 2.5, "#f3d9aa", 2.4, -7, 3, -7); // warm kicker, back left
  return s;
}

const pmrem = new THREE.PMREMGenerator(renderer);
const env = pmrem.fromScene(studio(), 0.02).texture;

/* ───────────── Materials ───────────── */

const M = {
  /** Black chrome in a dark studio: a near-black body, the warm and cool lights in its reflections. */
  ink: () =>
    new THREE.MeshPhysicalMaterial({
      color: "#34363c",
      roughness: 0.2,
      metalness: 1,
      clearcoat: 1,
      clearcoatRoughness: 0.03,
    }),
  /** Champagne gold for rings, trims and accents; rougher = brushed. */
  gold: (roughness = 0.16) => new THREE.MeshPhysicalMaterial({ color: "#dccaa6", roughness, metalness: 1 }),
  /** Glossy ceramic / plastic in any colour. */
  gloss: (color, sheen = "#f2dfb6") =>
    new THREE.MeshPhysicalMaterial({
      color,
      roughness: 0.2,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.03,
      sheen: 0.4,
      sheenColor: sheen,
      sheenRoughness: 0.4,
    }),
  /** Coated lens glass: dark, with the amber-blue interference sheen of real lens coatings. */
  glass: () =>
    new THREE.MeshPhysicalMaterial({
      color: "#050608",
      roughness: 0.03,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.02,
      iridescence: 1,
      iridescenceIOR: 1.9,
      iridescenceThicknessRange: [200, 700],
      envMapIntensity: 2.4,
    }),
  /** Ivory pearl with a faint iridescent sheen. */
  pearl: () =>
    new THREE.MeshPhysicalMaterial({
      color: "#efe7da",
      roughness: 0.16,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.04,
      iridescence: 0.35,
      iridescenceIOR: 1.5,
      iridescenceThicknessRange: [300, 600],
    }),
  /** Self-lit accent: a thin warm light line. */
  glow: (color = "#f2d7a6", power = 1.4) =>
    new THREE.MeshStandardMaterial({ color: "#000000", emissive: color, emissiveIntensity: power, roughness: 0.4 }),
};

/* ───────────── Geometry helpers ───────────── */

/** Polygon with rounded corners (`r` must stay under half of the shortest edge). */
function roundedPolygon(points, r) {
  const shape = new THREE.Shape();
  const n = points.length;
  points.forEach((pt, i) => {
    const p = new THREE.Vector2(...pt);
    const prev = new THREE.Vector2(...points[(i + n - 1) % n]);
    const next = new THREE.Vector2(...points[(i + 1) % n]);
    const a = p.clone().add(prev.sub(p).setLength(r));
    const b = p.clone().add(next.sub(p).setLength(r));
    if (i === 0) shape.moveTo(a.x, a.y);
    else shape.lineTo(a.x, a.y);
    shape.quadraticCurveTo(p.x, p.y, b.x, b.y);
  });
  shape.closePath();
  return shape;
}

/**
 * Extruded shape with a round bevel and smooth normals (no faceting on glossy surfaces).
 * `center: false` keeps the shape's own origin (parts assembled around a point, e.g. a pivot);
 * the extrusion then runs from z = 0 to z = depth.
 */
function extrude(shape, options, center = true) {
  let g = new THREE.ExtrudeGeometry(shape, { curveSegments: 48, steps: 1, bevelEnabled: true, bevelSegments: 14, ...options });
  g.deleteAttribute("uv");
  g.deleteAttribute("normal");
  g = mergeVertices(g, 1e-5);
  g.computeVertexNormals();
  if (center) g.center();
  return g;
}

const mesh = (geometry, material) => new THREE.Mesh(geometry, material);

function pose(obj, x, y, z) {
  const g = new THREE.Group();
  obj.rotation.set(x, y, z);
  g.add(obj);
  return g;
}

/* ───────────── Objects ───────────── */

const objects = {
  /** Play button: rounded triangle, ivory ceramic. */
  play() {
    const pts = [0, 120, 240].map((a) => [Math.cos((a * Math.PI) / 180), Math.sin((a * Math.PI) / 180)]);
    const g = extrude(roundedPolygon(pts, 0.42), { depth: 0.3, bevelThickness: 0.22, bevelSize: 0.16 });
    return pose(mesh(g, M.gloss("#eeeae2", "#ffffff")), -0.22, -0.62, 0.08);
  },

  /** After Effects keyframe: a black chrome diamond in a champagne «selected» outline. */
  keyframe() {
    const s = 1.0;
    const diamond = [
      [0, s],
      [-s, 0],
      [0, -s],
      [s, 0],
    ];
    const group = new THREE.Group();
    group.add(mesh(extrude(roundedPolygon(diamond, 0.2), { depth: 0.34, bevelThickness: 0.24, bevelSize: 0.18 }), M.ink()));
    const k = 1.42;
    const outline = roundedPolygon(
      diamond.map(([x, y]) => [x * k, y * k]),
      0.3,
    );
    const pts = outline.getSpacedPoints(240).map((p) => new THREE.Vector3(p.x, p.y, 0));
    const tube = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 360, 0.03, 16, true);
    group.add(mesh(tube, M.gold(0.12)));
    return pose(group, 0.18, -0.58, 0.05);
  },

  /** Sparkles (the AI assistant's icon): a puffy four-point star and a small one beside it. */
  sparkle() {
    // Outline of the classic ✦: four concave quadratic sides. Every ray from the centre crosses it
    // once, so it becomes a radius function r(angle) that the puffy surface below follows.
    const R = 1.2;
    const c = 0.2;
    const outline = new THREE.Shape();
    outline.moveTo(R, 0);
    outline.quadraticCurveTo(c, c, 0, R);
    outline.quadraticCurveTo(-c, c, -R, 0);
    outline.quadraticCurveTo(-c, -c, 0, -R);
    outline.quadraticCurveTo(c, -c, R, 0);
    const polar = outline
      .getPoints(1200)
      .map((p) => [Math.atan2(p.y, p.x), p.length()])
      .sort((a, b) => a[0] - b[0]);
    const radiusAt = (t) => {
      const a = THREE.MathUtils.euclideanModulo(t + Math.PI, Math.PI * 2) - Math.PI;
      let lo = 0;
      let hi = polar.length - 1;
      while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if (polar[mid][0] < a) lo = mid;
        else hi = mid;
      }
      const [a0, r0] = polar[lo];
      const [a1, r1] = polar[hi];
      return a1 === a0 ? r0 : r0 + ((r1 - r0) * (a - a0)) / (a1 - a0);
    };
    const rMin = radiusAt(Math.PI / 4);
    const star = (depth) =>
      new ParametricGeometry(
        (u, v, target) => {
          const t = u * Math.PI * 2 + Math.PI / 4; // seam in a valley, not on a tip
          const e = (v - 0.5) * Math.PI;
          const r = radiusAt(t);
          const d = depth * (0.22 + 0.78 * (rMin / r)); // thick in the middle, thin towards the tips
          target.set(r * Math.cos(t) * Math.cos(e), r * Math.sin(t) * Math.cos(e), d * Math.sin(e));
        },
        960,
        96,
      );
    const smooth = (g) => {
      g.deleteAttribute("uv");
      g.deleteAttribute("normal");
      const m = mergeVertices(g, 1e-5);
      m.computeVertexNormals();
      return m;
    };
    const group = new THREE.Group();
    group.add(mesh(smooth(star(0.42)), M.pearl()));
    const small = mesh(smooth(star(0.42)), M.pearl());
    small.scale.setScalar(0.4);
    small.position.set(1.0, 0.95, 0.2);
    small.rotation.set(0.15, -0.25, 0.25);
    group.add(small);
    return pose(group, 0.14, -0.3, 0.06);
  },

  /** Camera lens: ribbed black barrel, champagne front ring, coated glass, a thin warm ring. */
  lens() {
    const v = (x, y) => new THREE.Vector2(x, y);
    const back = [v(0.001, -0.95), v(0.5, -0.95), v(0.62, -0.93), v(0.66, -0.86), v(0.8, -0.84), v(0.85, -0.79)];
    for (let k = 0; k < 10; k++) {
      const y = -0.74 + k * 0.058;
      back.push(v(0.9, y), v(0.94, y + 0.012), v(0.94, y + 0.034), v(0.9, y + 0.046));
    }
    back.push(v(0.9, -0.16), v(0.95, -0.12), v(0.97, 0.06));
    const front = [v(0.97, 0.06), v(1.0, 0.1), v(1.0, 0.36), v(0.98, 0.42), v(0.9, 0.445), v(0.86, 0.44), v(0.84, 0.38), v(0.82, 0.31)];
    const lens = new THREE.Group();
    lens.add(mesh(new THREE.LatheGeometry(back, 160), M.ink()));
    lens.add(mesh(new THREE.LatheGeometry(front, 160), M.gold()));
    // Front element: tinted, half see-through, so the inner elements show through it
    const dome = (r, rim, y, material) => {
      const theta = Math.asin(rim / r);
      const m = mesh(new THREE.SphereGeometry(r, 160, 40, 0, Math.PI * 2, 0, theta), material);
      m.position.y = y - r * Math.cos(theta);
      return m;
    };
    const frontGlass = Object.assign(M.glass(), { transparent: true, opacity: 0.55, depthWrite: false });
    lens.add(dome(2.4, 0.82, 0.31, frontGlass));
    // Inside: a recess, a gold ring, a second coated element and a warm light ring around the aperture
    const recess = Object.assign(M.ink(), { side: THREE.DoubleSide });
    lens.add(mesh(new THREE.CylinderGeometry(0.82, 0.62, 0.32, 160, 1, true), recess).translateY(0.15));
    const inner = mesh(new THREE.TorusGeometry(0.62, 0.025, 16, 160), M.gold());
    inner.rotation.x = Math.PI / 2;
    inner.position.y = 0.0;
    lens.add(inner);
    const second = M.glass();
    second.iridescenceThicknessRange = [400, 900];
    lens.add(dome(0.9, 0.6, 0.0, second));
    const aperture = mesh(new THREE.TorusGeometry(0.26, 0.012, 12, 96), M.glow());
    aperture.rotation.x = Math.PI / 2;
    aperture.position.y = 0.2;
    lens.add(aperture);
    const accent = mesh(new THREE.TorusGeometry(0.952, 0.014, 12, 160), M.gold(0.1));
    accent.rotation.x = Math.PI / 2;
    accent.position.y = -0.1;
    lens.add(accent);
    lens.rotation.x = Math.PI / 2; // optical axis towards the camera
    const tilt = new THREE.Group();
    tilt.add(lens);
    return pose(tilt, -0.42, 0.68, 0.12);
  },

  /** Audio waveform (sound effects): a row of capsules, graphite → champagne → ivory. */
  wave() {
    const heights = [0.5, 0.95, 1.55, 2.2, 2.75, 2.1, 1.4, 0.95, 0.55];
    const c0 = new THREE.Color("#3a3d44");
    const c1 = new THREE.Color("#c9a76f");
    const c2 = new THREE.Color("#ece5d8");
    const group = new THREE.Group();
    heights.forEach((h, i) => {
      const t = i / (heights.length - 1);
      const col = t < 0.5 ? c0.clone().lerp(c1, t * 2) : c1.clone().lerp(c2, (t - 0.5) * 2);
      const r = 0.17;
      const m = mesh(new THREE.CapsuleGeometry(r, Math.max(0.01, h - 2 * r), 24, 64), M.gloss(col));
      m.position.x = (i - (heights.length - 1) / 2) * 0.44;
      group.add(m);
    });
    return pose(group, -0.12, 0.6, 0.05);
  },

  /** Trefoil knot in black chrome (an abstract "motion path"). */
  knot() {
    const g = new THREE.TorusKnotGeometry(1, 0.3, 480, 64, 2, 3);
    return pose(mesh(g, M.ink()), 0.35, -0.45, 0.2);
  },

  /** Rounded cube in brushed champagne gold. */
  cube() {
    const g = new RoundedBoxGeometry(1.6, 1.6, 1.6, 10, 0.34);
    return pose(mesh(g, M.gold(0.26)), 0.55, -0.72, 0.08);
  },

  /** Asterisk: three crossed capsules in black chrome. */
  asterisk() {
    const group = new THREE.Group();
    for (let i = 0; i < 3; i++) {
      const arm = mesh(new THREE.CapsuleGeometry(0.22, 2.3, 32, 96), M.ink());
      arm.rotation.z = (i * Math.PI) / 3;
      group.add(arm);
    }
    return pose(group, 0.32, -0.5, 0.18);
  },
};

/* ───────────── Capture ───────────── */

const outputs = [];

function blobToBase64(blob) {
  return new Promise((ok) => {
    const r = new FileReader();
    r.onload = () => ok(String(r.result).split(",")[1]);
    r.readAsDataURL(blob);
  });
}

async function capture(name) {
  const src = renderer.domElement;
  const w = src.width;
  const h = src.height;
  const full = document.createElement("canvas");
  full.width = w;
  full.height = h;
  const fx = full.getContext("2d", { willReadFrequently: true });
  fx.drawImage(src, 0, 0);
  const data = fx.getImageData(0, 0, w, h).data;
  let x0 = w;
  let y0 = h;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      if (data[(y * w + x) * 4 + 3] > 3) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
  if (x1 < 0) throw new Error(`${name}: empty render`);
  const pad = 10;
  x0 = Math.max(0, x0 - pad);
  y0 = Math.max(0, y0 - pad);
  x1 = Math.min(w - 1, x1 + pad);
  y1 = Math.min(h - 1, y1 + pad);
  const bw = x1 - x0 + 1;
  const bh = y1 - y0 + 1;
  const k = Math.min(1, MAX_SIDE / Math.max(bw, bh));
  const out = document.createElement("canvas");
  out.width = Math.round(bw * k);
  out.height = Math.round(bh * k);
  const ox = out.getContext("2d");
  ox.imageSmoothingEnabled = true;
  ox.imageSmoothingQuality = "high";
  ox.drawImage(full, x0, y0, bw, bh, 0, 0, out.width, out.height);
  const blob = await new Promise((ok) => out.toBlob(ok, "image/webp", QUALITY));
  outputs.push({ name, canvas: out });
  return { webp: await blobToBase64(blob), width: out.width, height: out.height, bytes: blob.size };
}

function dispose(root) {
  root.traverse((o) => {
    if (!o.isMesh) return;
    o.geometry.dispose();
    for (const m of [o.material].flat()) {
      m.map?.dispose();
      m.dispose();
    }
  });
}

async function render(name) {
  const root = objects[name]();
  const scene = new THREE.Scene();
  scene.environment = env;
  scene.add(root);
  root.updateMatrixWorld(true);
  const sphere = new THREE.Box3().setFromObject(root, true).getBoundingSphere(new THREE.Sphere());
  root.position.sub(sphere.center);
  const fov = 24;
  const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 200);
  camera.position.set(0, 0, (sphere.radius / Math.sin(THREE.MathUtils.degToRad(fov / 2))) * 1.02);
  camera.lookAt(0, 0, 0);
  renderer.render(scene, camera);
  const result = await capture(name);
  dispose(root);
  return result;
}

/** All renders of this run side by side on the site's background, for a quick look. */
async function sheet() {
  const cols = 4;
  const cell = 340;
  const rows = Math.ceil(outputs.length / cols);
  const c = document.createElement("canvas");
  c.width = cols * cell;
  c.height = rows * cell;
  const x = c.getContext("2d");
  x.fillStyle = "#08090c";
  x.fillRect(0, 0, c.width, c.height);
  x.font = "14px monospace";
  outputs.forEach(({ name, canvas }, i) => {
    const k = Math.min((cell - 40) / canvas.width, (cell - 50) / canvas.height);
    const w = canvas.width * k;
    const h = canvas.height * k;
    const cx = (i % cols) * cell;
    const cy = Math.floor(i / cols) * cell;
    x.drawImage(canvas, cx + (cell - w) / 2, cy + 14 + (cell - 40 - h) / 2, w, h);
    x.fillStyle = "#a8a49c";
    x.fillText(name, cx + 12, cy + cell - 12);
  });
  const blob = await new Promise((ok) => c.toBlob(ok, "image/png"));
  return blobToBase64(blob);
}

const gl = renderer.getContext();
const info = gl.getExtension("WEBGL_debug_renderer_info");
window.decor = {
  names: Object.keys(objects),
  gpu: info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : "unknown",
  render,
  sheet,
};
