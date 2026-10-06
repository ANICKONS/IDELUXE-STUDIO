import { PLANET_FRAG, QUAD_VERT, SURFACE_FRAG } from "@/features/backdrop/planet-shaders";

/*
 * A huge planet rises from the bottom of the screen: its limb arcs across the backdrop, the sun is
 * hidden right behind it (rim light, sunrise glow), the night side below is speckled with city
 * lights. Rendered with WebGL 1: the surface map is baked once (a few strips per frame, so the
 * load doesn't stutter), then every frame is just two texture lookups per pixel.
 * Without WebGL the sky canvas draws a flat silhouette instead (drawPlanetFallback).
 */

/** Top of the planet (the limb at the centre of the screen), share of the viewport height. */
export const PLANET_LIMB = 0.69;
/** How far the atmosphere reaches above the limb, CSS px: the canvas starts that much higher. */
const GLOW_PAD = 240;
/** Spin axis tilted away from the viewer (the pole hides behind the limb) and leaning sideways. */
const TILT = 0.45;
const ROLL = -0.18;
/** Direction to the sun in view space: above the planet and behind it. */
const SUN = normalize([0.2, 0.4, -0.9]);
/** Surface map strips baked per frame. */
const STRIP = 128;

export type PlanetGeometry = { cx: number; cy: number; r: number; top: number };

/** Big enough to read as a planet, not a hill: the limb drops ~250 px towards the sides at 1440 px. */
export function planetGeometry(w: number, h: number, shiftX = 0): PlanetGeometry {
  const r = Math.max(w * 0.8, 440);
  const top = h * PLANET_LIMB;
  return { cx: w / 2 + shiftX, cy: top + r, r, top };
}

export type PlanetView = {
  /** Rotation of the surface, rad. */
  spin: number;
  /** Rotation of the cloud layer, rad. */
  clouds: number;
  /** Pointer parallax, CSS px. */
  shiftX: number;
};

export type Planet = {
  resize(width: number, height: number): void;
  /** `finish`: bake the whole surface map now (single static frame, e.g. with reduced motion). */
  draw(view: PlanetView, finish?: boolean): void;
  dispose(): void;
};

type Vec3 = [number, number, number];
type Mat3 = number[]; // row-major

function normalize(v: Vec3): Vec3 {
  const l = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / l, v[1] / l, v[2] / l];
}

function mul(a: Mat3, b: Mat3): Mat3 {
  const out: Mat3 = [];
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++) out.push(a[i * 3] * b[j] + a[i * 3 + 1] * b[3 + j] + a[i * 3 + 2] * b[6 + j]);
  return out;
}

const rotX = (t: number): Mat3 => [1, 0, 0, 0, Math.cos(t), -Math.sin(t), 0, Math.sin(t), Math.cos(t)];
const rotY = (t: number): Mat3 => [Math.cos(t), 0, Math.sin(t), 0, 1, 0, -Math.sin(t), 0, Math.cos(t)];
const rotZ = (t: number): Mat3 => [Math.cos(t), -Math.sin(t), 0, Math.sin(t), Math.cos(t), 0, 0, 0, 1];

/** View → body: undo the roll and the tilt, then the spin about the planet's own axis. */
const AXIS = mul(rotX(TILT), rotZ(-ROLL));
const bodyMatrix = (spin: number) => mul(rotY(spin), AXIS);
/** GLSL wants column-major. */
const columnMajor = (m: Mat3) => new Float32Array([m[0], m[3], m[6], m[1], m[4], m[7], m[2], m[5], m[8]]);

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("planet: createShader failed");
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS) && !gl.isContextLost()) {
    throw new Error(`planet: ${gl.getShaderInfoLog(shader)}`);
  }
  return shader;
}

function program(gl: WebGLRenderingContext, fragment: string) {
  const p = gl.createProgram();
  if (!p) throw new Error("planet: createProgram failed");
  const vs = compile(gl, gl.VERTEX_SHADER, QUAD_VERT);
  const fs = compile(gl, gl.FRAGMENT_SHADER, fragment);
  gl.attachShader(p, vs);
  gl.attachShader(p, fs);
  gl.bindAttribLocation(p, 0, "aPos");
  gl.linkProgram(p);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS) && !gl.isContextLost()) throw new Error(`planet: ${gl.getProgramInfoLog(p)}`);
  return p;
}

type Resources = {
  buffer: WebGLBuffer | null;
  draw: WebGLProgram;
  bake: WebGLProgram | null;
  fbo: WebGLFramebuffer | null;
  map: WebGLTexture;
  size: [number, number];
  baked: number;
  u: Record<string, WebGLUniformLocation | null>;
};

function setup(gl: WebGLRenderingContext, small: boolean): Resources {
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  // Power-of-two map, so it can wrap around the planet (REPEAT) in WebGL 1
  const maxSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
  const tw = small || maxSize < 2048 ? 1024 : 2048;
  const size: [number, number] = [tw, tw / 2];
  const map = gl.createTexture();
  if (!map) throw new Error("planet: createTexture failed");
  gl.bindTexture(gl.TEXTURE_2D, map);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size[0], size[1], 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  const fbo = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, map, 0);
  const complete = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  if (!complete) throw new Error("planet: framebuffer incomplete");

  const draw = program(gl, PLANET_FRAG);
  const bake = program(gl, SURFACE_FRAG);
  const u: Resources["u"] = {};
  for (const name of ["uMap", "uCanvas", "uScale", "uTop", "uPlanet", "uGround", "uSky", "uSun", "uCity"]) u[name] = gl.getUniformLocation(draw, name);
  u.uSize = gl.getUniformLocation(bake, "uSize");

  gl.disable(gl.DEPTH_TEST);
  gl.disable(gl.BLEND);
  return { buffer, draw, bake, fbo, map, size, baked: 0, u };
}

function release(gl: WebGLRenderingContext, res: Resources) {
  gl.deleteBuffer(res.buffer);
  gl.deleteProgram(res.draw);
  gl.deleteTexture(res.map);
  if (res.bake) gl.deleteProgram(res.bake);
  if (res.fbo) gl.deleteFramebuffer(res.fbo);
}

/** Bakes the next strip(s) of the surface map; true once the map is complete. */
function bakeStrips(gl: WebGLRenderingContext, res: Resources, all: boolean) {
  if (!res.bake || !res.fbo) return true;
  const [tw, th] = res.size;
  const rows = all ? th - res.baked : Math.min(STRIP, th - res.baked);
  gl.bindFramebuffer(gl.FRAMEBUFFER, res.fbo);
  gl.viewport(0, 0, tw, th);
  gl.enable(gl.SCISSOR_TEST);
  gl.scissor(0, res.baked, tw, rows);
  gl.useProgram(res.bake);
  gl.uniform2f(res.u.uSize, tw, th);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  gl.disable(gl.SCISSOR_TEST);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  res.baked += rows;
  if (res.baked < th) return false;
  gl.deleteFramebuffer(res.fbo);
  gl.deleteProgram(res.bake);
  res.fbo = null;
  res.bake = null;
  return true;
}

export function createPlanet(canvas: HTMLCanvasElement): Planet | null {
  const gl = canvas.getContext("webgl", {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: "low-power",
  });
  if (!gl) return null;

  let res: Resources | null;
  try {
    res = setup(gl, window.innerWidth < 768);
  } catch {
    return null;
  }

  let w = 0;
  let h = 0;
  let top = 0;
  let scale = 1;

  const onLost = (e: Event) => {
    e.preventDefault();
    res = null;
  };
  const onRestored = () => {
    try {
      res = setup(gl, w < 768);
    } catch {
      res = null;
    }
  };
  canvas.addEventListener("webglcontextlost", onLost);
  canvas.addEventListener("webglcontextrestored", onRestored);

  return {
    resize(width, height) {
      w = width;
      h = height;
      scale = Math.min(window.devicePixelRatio || 1, w < 768 ? 1 : 1.5);
      top = Math.max(0, Math.floor(planetGeometry(w, h).top - GLOW_PAD));
      canvas.style.top = `${top}px`;
      canvas.style.height = `${h - top}px`;
      canvas.width = Math.round(w * scale);
      canvas.height = Math.round((h - top) * scale);
    },

    draw(view, finish = false) {
      if (!res || gl.isContextLost()) return;
      if (!bakeStrips(gl, res, finish)) return;
      const g = planetGeometry(w, h, view.shiftX);
      const { u } = res;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(res.draw);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, res.map);
      gl.uniform1i(u.uMap, 0);
      gl.uniform2f(u.uCanvas, canvas.width, canvas.height);
      gl.uniform1f(u.uScale, scale);
      gl.uniform1f(u.uTop, top);
      gl.uniform3f(u.uPlanet, g.cx, g.cy, g.r);
      gl.uniformMatrix3fv(u.uGround, false, columnMajor(bodyMatrix(view.spin)));
      gl.uniformMatrix3fv(u.uSky, false, columnMajor(bodyMatrix(view.clouds)));
      gl.uniform3f(u.uSun, SUN[0], SUN[1], SUN[2]);
      gl.uniform1f(u.uCity, g.r / 4);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      // Fade in once the first real frame is on screen
      if (canvas.style.opacity !== "1") canvas.style.opacity = "1";
    },

    // Frees the GPU objects but keeps the context: a remount (React dev double-mount) gets the
    // same context back from getContext() and must find it alive.
    dispose() {
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      if (res && !gl.isContextLost()) release(gl, res);
      res = null;
    },
  };
}

/** Flat stand-in without WebGL: dark disc, bright limb, soft glow (drawn on the sky canvas). */
export function drawPlanetFallback(ctx: CanvasRenderingContext2D, g: PlanetGeometry) {
  const { cx, cy, r } = g;
  const halo = ctx.createRadialGradient(cx, cy, r, cx, cy, r + 160);
  halo.addColorStop(0, "rgb(143 128 255 / 0.34)");
  halo.addColorStop(0.25, "rgb(107 91 255 / 0.12)");
  halo.addColorStop(1, "rgb(107 91 255 / 0)");
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(cx, cy, r + 160, 0, Math.PI * 2);
  ctx.fill();

  const body = ctx.createRadialGradient(cx, cy - r * 0.2, r * 0.7, cx, cy, r);
  body.addColorStop(0, "#04030d");
  body.addColorStop(0.8, "#0a0822");
  body.addColorStop(1, "#2b2170");
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgb(214 208 255 / 0.85)";
  ctx.lineWidth = 1.2;
  ctx.shadowColor = "rgb(143 128 255 / 0.9)";
  ctx.shadowBlur = 18;
  ctx.stroke();
  ctx.shadowBlur = 0;
}
