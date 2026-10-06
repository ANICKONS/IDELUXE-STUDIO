/*
 * GLSL (WebGL 1) for the planet. Two passes:
 *  - SURFACE_FRAG runs once and bakes the planet into an equirectangular map
 *    (R = land, G = clouds, B = city zones, A = elevation) — the expensive noise lives here;
 *  - PLANET_FRAG runs every frame: sphere, lighting, clouds, city lights and the atmosphere.
 */

const PRECISION = /* glsl */ `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
`;

/** Hash without sin(): stable across GPUs. */
const HASH = /* glsl */ `
float hash13(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.zyx + 31.32);
  return fract((p.x + p.y) * p.z);
}
`;

/** Full-screen triangle. */
export const QUAD_VERT = /* glsl */ `
attribute vec2 aPos;
void main() {
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

export const SURFACE_FRAG = /* glsl */ `
${PRECISION}
uniform vec2 uSize;
const float PI = 3.14159265;
${HASH}

// Value noise with quintic fade
float vnoise(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  vec3 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float a = hash13(i);
  float b = hash13(i + vec3(1.0, 0.0, 0.0));
  float c = hash13(i + vec3(0.0, 1.0, 0.0));
  float d = hash13(i + vec3(1.0, 1.0, 0.0));
  float e = hash13(i + vec3(0.0, 0.0, 1.0));
  float f1 = hash13(i + vec3(1.0, 0.0, 1.0));
  float g = hash13(i + vec3(0.0, 1.0, 1.0));
  float h = hash13(i + vec3(1.0, 1.0, 1.0));
  return mix(mix(mix(a, b, u.x), mix(c, d, u.x), u.y), mix(mix(e, f1, u.x), mix(g, h, u.x), u.y), u.z);
}

// Octaves are rotated against each other, so the value-noise grid never shows
const mat3 OCT = mat3(0.7648, 0.0, -0.6442, 0.5046, 0.6216, 0.5991, 0.4004, -0.7833, 0.4754);

float fbm(vec3 p) {
  float s = 0.0;
  float a = 0.5;
  for (int i = 0; i < 6; i++) {
    s += a * vnoise(p);
    p = OCT * p * 2.03 + vec3(1.7, 9.2, 3.4);
    a *= 0.5;
  }
  return s / 0.984;
}

float fbm4(vec3 p) {
  float s = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    s += a * vnoise(p);
    p = OCT * p * 2.03 + vec3(4.1, 2.7, 8.3);
    a *= 0.5;
  }
  return s / 0.9375;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uSize;
  float lon = (uv.x - 0.5) * 2.0 * PI;
  float lat = (uv.y - 0.5) * PI;
  vec3 p = vec3(cos(lat) * cos(lon), sin(lat), cos(lat) * sin(lon));

  // Continents: domain-warped noise, a crisp but slightly ragged coastline
  vec3 q = p * 1.9;
  vec3 warp = vec3(fbm4(q + vec3(1.7, 9.2, 3.1)), fbm4(q + vec3(8.3, 2.8, 5.6)), fbm4(q + vec3(4.1, 6.5, 0.7)));
  float c = fbm(q * 1.15 + (warp - 0.5) * 2.6);
  float land = smoothstep(0.525, 0.545, c);
  float elev = smoothstep(0.54, 0.7, c + (fbm4(p * 13.0) - 0.5) * 0.22);

  // Clouds: squeezed across latitude, so they stretch along the spin like real weather belts
  vec3 cq = p * vec3(2.6, 5.2, 2.6);
  vec3 cw = vec3(fbm4(cq + vec3(2.3, 0.4, 7.7)), fbm4(cq + vec3(7.1, 3.3, 1.2)), fbm4(cq + vec3(4.9, 8.8, 2.6)));
  float cl = fbm(cq * 1.3 + (cw - 0.5) * 3.2);
  float clouds = smoothstep(0.5, 0.72, cl) * (0.45 + 0.55 * smoothstep(0.38, 0.62, fbm4(p * 1.6 + 11.0)));

  // Cities: along the coasts and in the lowlands
  float coast = 1.0 - smoothstep(0.0, 0.05, abs(c - 0.535));
  float zones = smoothstep(0.48, 0.66, fbm4(p * 5.5 + 21.0));
  float city = land * clamp(zones * 0.85 + coast * zones * 0.9, 0.0, 1.0) * (1.0 - elev * 0.75);

  gl_FragColor = vec4(land, clouds, city, elev);
}
`;

export const PLANET_FRAG = /* glsl */ `
${PRECISION}
uniform sampler2D uMap;
uniform vec2 uCanvas;   // canvas size, device px (the canvas covers the viewport)
uniform float uScale;   // device px per CSS px
uniform vec3 uPlanet;   // centre x, centre y (viewport CSS px, y down), radius
uniform mat3 uGround;   // view → planet body (camera orbit and spin included)
uniform mat3 uSky;      // view → cloud layer (spins a little faster)
uniform vec3 uSun;      // direction to the sun, view space (behind the planet; moves with the camera)
uniform float uCity;    // city-light cells per planet radius (≈ one cell per 4–5 CSS px on the landing)
const float PI = 3.14159265;
${HASH}

vec2 sphereUV(vec3 b) {
  return vec2(atan(b.z, b.x) / (2.0 * PI) + 0.5, asin(clamp(b.y, -1.0, 1.0)) / PI + 0.5);
}

void main() {
  vec2 css = vec2(gl_FragCoord.x, uCanvas.y - gl_FragCoord.y) / uScale;
  vec2 q = (css - uPlanet.xy) / uPlanet.z;
  q.y = -q.y;
  float r = length(q);
  float edge = (r - 1.0) * uPlanet.z;           // distance to the limb, CSS px (+ outside)
  float above = max(edge, 0.0);

  vec2 sun2 = normalize(uSun.xy + vec2(0.0, 1e-4));
  float facing = dot(q / max(r, 1e-4), sun2);   // 1 right under the sun, -1 opposite
  float lit = smoothstep(-0.4, 1.0, facing);
  float peak = pow(max(facing, 0.0), 40.0);     // where the sun hides behind the limb

  float cover = clamp(0.5 - edge, 0.0, 1.0);    // 1 px anti-aliased disc

  // Atmosphere above the limb: a close glow and a wide soft haze, both faint — the backdrop must
  // stay dark under the text
  vec3 halo = vec3(0.0);
  halo += vec3(0.5, 0.42, 1.0) * exp(-above / 16.0) * (0.03 + 0.17 * lit);
  halo += vec3(0.32, 0.25, 0.9) * exp(-above / 70.0) * (0.02 + 0.11 * lit);
  halo += vec3(0.85, 0.6, 1.0) * peak * 0.12 * exp(-above / 36.0);
  // Over everything: the limb, and the sun peeking out — a small hot spot plus a faint
  // anamorphic streak (a nod to lens flares). The limb is a soft band a few px wide, not a hard
  // bright line: the band reads as atmosphere and doesn't sting the eyes behind the text
  vec2 d = (q - sun2) * uPlanet.z;
  float limb = 0.6 * exp(-abs(edge) / 2.2) + 0.4 * exp(-abs(edge) / 7.0);
  vec3 glow = vec3(0.72, 0.68, 1.0) * limb * (0.04 + 0.26 * lit);
  glow += vec3(0.95, 0.68, 1.0) * peak * 0.14 * exp(-abs(edge) / 6.0);
  glow += vec3(0.6, 0.52, 1.0) * 0.04 * exp(-abs(d.y) / 5.0) * exp(-abs(d.x) / 320.0);
  glow += vec3(0.85, 0.58, 1.0) * 0.05 * exp(-dot(d, d) / 9000.0);
  glow += halo * (1.0 - cover);
  vec3 col = vec3(0.0);
  if (cover > 0.0) {
    vec3 n = vec3(q, sqrt(max(0.0, 1.0 - r * r)));
    vec3 b = uGround * n;
    vec4 g = texture2D(uMap, sphereUV(b));
    float clouds = texture2D(uMap, sphereUV(uSky * n)).g;
    float land = g.r;
    float elev = g.a;

    // The sun is far behind the planet: only a thin crescent along the limb is in daylight,
    // the rest of the visible side is night
    float ndl = dot(n, uSun);
    float day = smoothstep(0.0, 0.3, ndl);
    float dusk = smoothstep(-0.16, 0.0, ndl) * (1.0 - smoothstep(0.0, 0.16, ndl));
    float night = 1.0 - smoothstep(-0.08, 0.04, ndl);
    // Light scattered by the atmosphere: the night side is not pitch black closer to the limb
    float skyglow = 0.02 + 0.07 * pow(1.0 - n.z, 3.0);

    vec3 ocean = vec3(0.022, 0.02, 0.075);
    vec3 ground = mix(vec3(0.075, 0.058, 0.18), vec3(0.17, 0.12, 0.32), elev);
    vec3 albedo = mix(ocean, ground, land);
    col = albedo * (skyglow + 0.75 * day);
    col += dusk * vec3(0.45, 0.16, 0.5) * 0.1;              // pink twilight along the terminator

    vec3 hv = normalize(uSun + vec3(0.0, 0.0, 1.0));        // sun glint on the oceans
    col += pow(max(dot(n, hv), 0.0), 90.0) * (1.0 - land) * day * vec3(0.9, 0.75, 1.0) * 0.35;

    vec3 cloudCol = vec3(0.7, 0.66, 1.0) * (skyglow * 0.5 + 0.5 * day) + dusk * vec3(0.8, 0.38, 0.75) * 0.14;
    col = mix(col, cloudCol, clouds * 0.7);

    // City lights: one possible light per small cell of the sphere, lit only in city zones at night
    vec3 cp = b * uCity;
    vec3 ci = floor(cp);
    vec3 cf = fract(cp) - 0.5;
    float hs = hash13(ci);
    vec3 off = (vec3(hash13(ci + 17.0), hash13(ci + 31.0), hash13(ci + 47.0)) - 0.5) * 0.45;
    float spot = smoothstep(0.3, 0.05, length(cf - off)) * step(0.5, hs);
    vec3 cityCol = mix(vec3(1.0, 0.78, 0.5), vec3(0.92, 0.66, 1.0), hash13(ci + 5.0));
    col += cityCol * night * (1.0 - clouds * 0.9) * g.b * (0.03 + 0.85 * spot * (0.4 + hs));

    // Near the limb the surface dissolves into the lit atmosphere
    float rim = pow(1.0 - n.z, 5.0);
    col = mix(col, vec3(0.42, 0.36, 1.0) * (0.06 + 0.4 * lit), rim * (0.14 + 0.4 * lit));

    // Closer to the viewer (lower on the screen, under the content) the planet sinks into darkness
    col *= 1.0 - 0.6 * smoothstep(0.25, 0.7, n.z);
  }

  vec3 rgb = col * cover + glow;
  float a = clamp(cover + max(glow.r, max(glow.g, glow.b)), 0.0, 1.0);
  rgb = min(rgb, vec3(a));                               // stay valid premultiplied colour
  rgb += (hash13(vec3(gl_FragCoord.xy, 3.0)) - 0.5) / 255.0 * step(0.004, a); // dither the gradients
  gl_FragColor = vec4(max(rgb, 0.0), a);
}
`;
