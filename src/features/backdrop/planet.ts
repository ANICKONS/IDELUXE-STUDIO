import { PLANET_FRAG, QUAD_VERT, SURFACE_FRAG } from "@/features/backdrop/planet-shaders";

/*
 * A huge planet in the backdrop, lit from behind (rim light, sunrise glow); its night side is
 * speckled with city lights. Where it sits on screen and from which side we see it is decided by
 * the camera (camera.ts). Rendered with WebGL 1: the surface map is baked once (a few strips per
 * frame, so the load doesn't stutter), then every frame is just two texture lookups per pixel.
 * Without WebGL the sky canvas draws a flat silhouette instead (drawPlanetFallback).
 */

/** How far the atmosphere reaches beyond the limb, CSS px: rows further away are not drawn. */
const GLOW_PAD = 240;
/** Spin axis tilted away from the viewer (the pole hides behind the limb) and leaning sideways. */
const TILT = 0.45;
const ROLL = -0.18;
/** Direction to the sun in world space: above the planet and behind it, as seen on the landing. */
const SUN = normalize([0.2, 0.4, -0.9]);
/** Surface map strips baked per frame. */
const STRIP = 128;

export type PlanetView = {
  /** Disc centre and radius, viewport CSS px. */
  x: number;
  y: number;
  r: number;
  /** Rotation of the surface, rad. */
  spin: number;
  /** Rotation of the cloud layer, rad. */
  clouds: number;
  /** Camera orbit around the planet, rad (camera.ts → Pose). */
  yaw: number;
  pitch: number;
  /**
   * City-light cells per planet radius. Tied to the screen, not to the animated radius: otherwise
   * the lights would reshuffle every frame while the camera moves.
   */
  cityCells: number;
};

export type Planet = {
  resize(width: number, height: number): void;
  /**
   * Draws a frame; false while the surface map is still baking.
   * `finish`: bake the whole map now (single static frame, e.g. with reduced motion).
   */
  draw(view: PlanetView, finish?: boolean): boolean;
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

const transpose = (m: Mat3): Mat3 => [m[0], m[3], m[6], m[1], m[4], m[7], m[2], m[5], m[8]];
const apply = (m: Mat3, v: Vec3): Vec3 => [
  m[0] * v[0] + m[1] * v[1] + m[2] * v[2],
  m[3] * v[0] + m[4] * v[1] + m[5] * v[2],
  m[6] * v[0] + m[7] * v[1] + m[8] * v[2],
];

const rotX = (t: number): Mat3 => [1, 0, 0, 0, Math.cos(t), -Math.sin(t), 0, Math.sin(t), Math.cos(t)];
const rotY = (t: number): Mat3 => [Math.cos(t), 0, Math.sin(t), 0, 1, 0, -Math.sin(t), 0, Math.cos(t)];
const rotZ = (t: number): Mat3 => [Math.cos(t), -Math.sin(t), 0, Math.sin(t), Math.cos(t), 0, 0, 0, 1];

/** World → tilted planet frame: undo the roll and the tilt. */
const AXIS = mul(rotX(TILT), rotZ(-ROLL));
/** View → world: the camera orbit. */
const orbit = (yaw: number, pitch: number) => mul(rotY(yaw), rotX(pitch));
/** GLSL wants column-major. */
const columnMajor = (m: Mat3) => new Float32Array(transpose(m));

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
  for (const name of ["uMap", "uCanvas", "uScale", "uPlanet", "uGround", "uSky", "uSun", "uCity"]) u[name] = gl.getUniformLocation(draw, name);
  u.uSize = gl.getUniformLocation(bake, "uSize");

  gl.disable(gl.DEPTH_TEST);
  gl.disable(gl.BLEND);
  gl.clearColor(0, 0, 0, 0);
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
  let scale = 1;
  /** The canvas is already empty: nothing to clear while the planet stays off screen. */
  let blank = false;

  const onLost = (e: Event) => {
    e.preventDefault();
    res = null;
  };
  const onRestored = () => {
    try {
      res = setup(gl, w < 768);
      blank = false;
    } catch {
      res = null;
    }
  };
  canvas.addEventListener("webglcontextlost", onLost);
  canvas.addEventListener("webglcontextrestored", onRestored);

  return {
    // The canvas covers the whole screen (the camera can put the planet anywhere); each frame
    // only renders the rows the planet and its glow actually cover.
    resize(width, height) {
      w = width;
      h = height;
      scale = Math.min(window.devicePixelRatio || 1, w < 768 ? 1 : 1.5);
      canvas.width = Math.round(w * scale);
      canvas.height = Math.round(h * scale);
      blank = false;
    },

    draw(view, finish = false) {
      if (!res || gl.isContextLost()) return false;
      if (!bakeStrips(gl, res, finish)) return false;

      const top = Math.max(0, view.y - view.r - GLOW_PAD);
      const bottom = Math.min(h, view.y + view.r + GLOW_PAD);
      const visible = bottom > top && view.x + view.r + GLOW_PAD > 0 && view.x - view.r - GLOW_PAD < w;
      gl.viewport(0, 0, canvas.width, canvas.height);
      if (!visible) {
        // Off screen (the login shot): clear once, then the canvas just keeps showing nothing
        if (!blank) gl.clear(gl.COLOR_BUFFER_BIT);
        blank = true;
        return true;
      }
      blank = false;
      gl.clear(gl.COLOR_BUFFER_BIT);

      // Device rows, counted from the bottom in GL
      const y0 = Math.max(0, Math.floor((h - bottom) * scale));
      const y1 = Math.min(canvas.height, Math.ceil((h - top) * scale));
      gl.enable(gl.SCISSOR_TEST);
      gl.scissor(0, y0, canvas.width, y1 - y0);

      const cam = orbit(view.yaw, view.pitch);
      const sun = apply(transpose(cam), SUN);
      const { u } = res;
      gl.useProgram(res.draw);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, res.map);
      gl.uniform1i(u.uMap, 0);
      gl.uniform2f(u.uCanvas, canvas.width, canvas.height);
      gl.uniform1f(u.uScale, scale);
      gl.uniform3f(u.uPlanet, view.x, view.y, view.r);
      // View → world (orbit) → tilted planet → spin about its own axis
      gl.uniformMatrix3fv(u.uGround, false, columnMajor(mul(mul(rotY(view.spin), AXIS), cam)));
      gl.uniformMatrix3fv(u.uSky, false, columnMajor(mul(mul(rotY(view.clouds), AXIS), cam)));
      gl.uniform3f(u.uSun, sun[0], sun[1], sun[2]);
      gl.uniform1f(u.uCity, view.cityCells);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.disable(gl.SCISSOR_TEST);
      // Fade in once the first real frame is on screen
      if (canvas.style.opacity !== "1") canvas.style.opacity = "1";
      return true;
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

/** Flat stand-in without WebGL: dark disc, soft limb, glow (drawn on the sky canvas). */
export function drawPlanetFallback(ctx: CanvasRenderingContext2D, g: { x: number; y: number; r: number }) {
  const { x, y, r } = g;
  if (y - r - 160 > ctx.canvas.clientHeight) return;
  const halo = ctx.createRadialGradient(x, y, r, x, y, r + 160);
  halo.addColorStop(0, "rgb(143 128 255 / 0.26)");
  halo.addColorStop(0.25, "rgb(107 91 255 / 0.1)");
  halo.addColorStop(1, "rgb(107 91 255 / 0)");
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(x, y, r + 160, 0, Math.PI * 2);
  ctx.fill();

  const body = ctx.createRadialGradient(x, y - r * 0.2, r * 0.7, x, y, r);
  body.addColorStop(0, "#04030d");
  body.addColorStop(0.8, "#0a0822");
  body.addColorStop(1, "#2b2170");
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgb(214 208 255 / 0.4)";
  ctx.lineWidth = 1.5;
  ctx.shadowColor = "rgb(143 128 255 / 0.7)";
  ctx.shadowBlur = 16;
  ctx.stroke();
  ctx.shadowBlur = 0;
}
