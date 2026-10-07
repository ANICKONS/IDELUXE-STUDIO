/*
 * GLSL (WebGL 1) for the planet. Two passes:
 *  - SURFACE_FRAG runs once and bakes the planet into an equirectangular map
 *    (R = land, G = clouds, B = city lights, A = elevation) — the expensive noise lives here;
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

// 8 octaves: the finest ones only show on the 4K map (ragged coasts, cloud wisps)
float fbm(vec3 p) {
  float s = 0.0;
  float a = 0.5;
  for (int i = 0; i < 8; i++) {
    s += a * vnoise(p);
    p = OCT * p * 2.03 + vec3(1.7, 9.2, 3.4);
    a *= 0.5;
  }
  return s / 0.996;
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
  float land = smoothstep(0.528, 0.538, c);
  // Elevation: rolling highlands plus ridged mountain chains (1 − |noise| makes sharp crests)
  float ridge = 1.0 - abs(fbm4(p * 7.0 + 5.0) * 2.0 - 1.0);
  float elev = smoothstep(0.54, 0.7, c + (fbm4(p * 13.0) - 0.5) * 0.22);
  elev = clamp(elev * 0.75 + ridge * ridge * ridge * 0.45 * smoothstep(0.53, 0.6, c), 0.0, 1.0);

  // Clouds: squeezed across latitude, so they stretch along the spin like real weather belts
  vec3 cq = p * vec3(2.6, 5.2, 2.6);
  vec3 cw = vec3(fbm4(cq + vec3(2.3, 0.4, 7.7)), fbm4(cq + vec3(7.1, 3.3, 1.2)), fbm4(cq + vec3(4.9, 8.8, 2.6)));
  float cl = fbm(cq * 1.3 + (cw - 0.5) * 3.2);
  // Fine wisps fray the cloud edges
  cl += (fbm4(cq * 5.0 + 3.0) - 0.5) * 0.08;
  float clouds = smoothstep(0.5, 0.72, cl) * (0.45 + 0.55 * smoothstep(0.38, 0.62, fbm4(p * 1.6 + 11.0)));

  // City lights, baked: settled zones along the coasts and in the lowlands, broken into clusters of
  // towns. Each light spans a few texels, so the linear filtering draws soft warm patches that stay
  // put while the planet turns (per-pixel lights shimmered)
  float coast = 1.0 - smoothstep(0.0, 0.05, abs(c - 0.535));
  float zones = smoothstep(0.48, 0.66, fbm4(p * 5.5 + 21.0));
  float settled = land * clamp(zones * 0.85 + coast * zones * 0.9, 0.0, 1.0) * (1.0 - elev * 0.75);
  float clusters = smoothstep(0.42, 0.78, fbm4(p * 22.0 + 3.0));
  float towns = smoothstep(0.52, 0.92, vnoise(p * 80.0 + 11.0));
  float lights = settled * clusters * (0.22 + 0.9 * towns);

  gl_FragColor = vec4(land, clouds, clamp(lights, 0.0, 1.0), elev);
}
`;

export const PLANET_FRAG = /* glsl */ `
${PRECISION}
uniform sampler2D uMap;
uniform vec2 uTexel;    // one texel of the map (1 / size): elevation gradient for the relief
uniform vec2 uCanvas;   // canvas size, device px (the canvas covers the viewport)
uniform float uScale;   // device px per CSS px
uniform vec3 uPlanet;   // centre x, centre y (viewport CSS px, y down), radius
uniform mat3 uGround;   // view → planet body (camera orbit and spin included)
uniform mat3 uSky;      // view → cloud layer (spins a little faster)
uniform vec3 uSun;      // direction to the sun, view space (behind the planet; moves with the camera)
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

  // Colours of a real sunrise seen from orbit: a thin blue atmosphere, warming to gold where the
  // sun hides behind the limb. Natural light reads as photographed, not as a neon effect.
  vec3 SKY = vec3(0.42, 0.6, 1.0);       // Rayleigh blue
  vec3 HAZE = vec3(0.2, 0.3, 0.55);
  vec3 SUN = vec3(1.0, 0.8, 0.54);       // golden sunlight
  float warm = pow(lit, 4.0);            // how close to the sun: blue → gold along the limb

  // Atmosphere above the limb: a close glow and a wide soft haze, both faint — the backdrop must
  // stay dark under the text
  vec3 halo = vec3(0.0);
  halo += mix(SKY, SUN, warm * 0.6) * exp(-above / 16.0) * (0.03 + 0.15 * lit);
  halo += HAZE * exp(-above / 70.0) * (0.02 + 0.1 * lit);
  halo += SUN * peak * 0.12 * exp(-above / 36.0);
  // Over everything: the limb, and the sun peeking out — a small hot spot plus a faint
  // anamorphic streak (the blue lens flare of cinema glass). The limb is a soft band a few px
  // wide, not a hard bright line: it reads as atmosphere and doesn't sting the eyes behind the text
  vec2 d = (q - sun2) * uPlanet.z;
  float limb = 0.6 * exp(-abs(edge) / 2.2) + 0.4 * exp(-abs(edge) / 7.0);
  vec3 glow = mix(vec3(0.62, 0.74, 1.0), vec3(1.0, 0.88, 0.7), warm) * limb * (0.04 + 0.25 * lit);
  glow += SUN * peak * 0.15 * exp(-abs(edge) / 6.0);
  glow += vec3(0.5, 0.66, 1.0) * 0.045 * exp(-abs(d.y) / 5.0) * exp(-abs(d.x) / 320.0);
  glow += SUN * 0.05 * exp(-dot(d, d) / 9000.0);
  glow += halo * (1.0 - cover);
  vec3 col = vec3(0.0);
  if (cover > 0.0) {
    vec3 n = vec3(q, sqrt(max(0.0, 1.0 - r * r)));
    vec3 b = uGround * n;
    vec2 uv = sphereUV(b);
    vec4 g = texture2D(uMap, uv);
    float clouds = texture2D(uMap, sphereUV(uSky * n)).g;
    float land = g.r;
    float elev = g.a;

    // Relief: the elevation's slope tilts the surface normal (east/north tangents of the sphere),
    // so ridges and valleys catch the low sun along the terminator. Oceans stay flat
    float ex = texture2D(uMap, uv + vec2(uTexel.x * 2.0, 0.0)).a - elev;
    float ey = texture2D(uMap, uv + vec2(0.0, uTexel.y * 2.0)).a - elev;
    vec3 east = normalize(vec3(-b.z, 0.0, b.x) + vec3(0.0, 0.0, 1e-5));
    vec3 north = cross(east, b);
    // (the slope is measured over 2 texels: scaled, so the 1K/2K/4K maps get the same relief)
    vec3 bumped = normalize(b - (east * ex + north * ey) * (9.0 / (uTexel.x * 2048.0)) * land);
    vec3 nl = bumped * uGround;                            // back to view space (transpose)

    // The sun is far behind the planet: only a thin crescent along the limb is in daylight,
    // the rest of the visible side is night
    float ndl = dot(nl, uSun);
    float day = smoothstep(0.0, 0.3, ndl);
    float dusk = smoothstep(-0.16, 0.0, ndl) * (1.0 - smoothstep(0.0, 0.16, ndl));
    float night = 1.0 - smoothstep(-0.08, 0.04, dot(n, uSun));
    // Light scattered by the atmosphere: the night side is not pitch black closer to the limb
    float skyglow = 0.02 + 0.07 * pow(1.0 - n.z, 3.0);

    // Terrain: darker, greener lowlands away from the equator, dry plains near it, bare rock up
    // high, ice caps around the poles
    float lat = abs(b.y);
    vec3 lowland = mix(vec3(0.12, 0.1, 0.075), vec3(0.045, 0.062, 0.05), smoothstep(0.15, 0.55, lat));
    vec3 ground = mix(lowland, vec3(0.17, 0.155, 0.14), elev);
    float ice = smoothstep(0.84, 0.93, lat + (elev - 0.4) * 0.06);
    vec3 ocean = vec3(0.012, 0.02, 0.04);
    vec3 albedo = mix(mix(ocean, ground, land), vec3(0.5, 0.53, 0.58), ice * 0.9);
    col = albedo * (skyglow + 0.75 * day);
    col += dusk * vec3(0.62, 0.32, 0.14) * 0.1;             // amber twilight along the terminator

    vec3 hv = normalize(uSun + vec3(0.0, 0.0, 1.0));        // sun glint on the oceans
    col += pow(max(dot(n, hv), 0.0), 90.0) * (1.0 - land) * (1.0 - ice) * day * SUN * 0.35;

    vec3 cloudCol = vec3(0.66, 0.7, 0.78) * (skyglow * 0.5 + 0.5 * day) + dusk * vec3(0.9, 0.55, 0.32) * 0.14;
    col = mix(col, cloudCol, clouds * 0.7);

    // City lights (baked into the map): warm sodium glow, the brightest centres whiter; dimmed
    // under clouds and fading out towards the limb, where the map gets squeezed
    vec3 cityCol = mix(vec3(1.0, 0.68, 0.36), vec3(1.0, 0.88, 0.7), smoothstep(0.45, 0.9, g.b));
    col += cityCol * night * (1.0 - clouds * 0.85) * (1.0 - ice) * g.b * 0.55 * smoothstep(0.08, 0.35, n.z);

    // Near the limb the surface dissolves into the lit atmosphere
    float rim = pow(1.0 - n.z, 5.0);
    col = mix(col, mix(vec3(0.3, 0.46, 0.9), vec3(0.9, 0.72, 0.5), warm) * (0.06 + 0.38 * lit), rim * (0.14 + 0.4 * lit));

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
