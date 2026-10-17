// New Year objects for the seasonal theme (src/features/new-year → hero-decor.ts). Same studio light
// and materials as the rest of the decor (scene.js passes them in); the names carry the folder, so
// they render into public/decor/new-year/:
//   npm run render --prefix tools/decor-render -- new-year/bauble new-year/snowflake new-year/star new-year/gift
// Dropping the theme: delete this file and its two lines in scene.js.

export function newYearObjects({ THREE, M, RoundedBoxGeometry, extrude, roundedPolygon, mesh, pose }) {
  return {
    /** Christmas bauble: a black chrome ball with champagne bands, a gold crown and a loop. */
    "new-year/bauble"() {
      const group = new THREE.Group();
      group.add(mesh(new THREE.SphereGeometry(1, 160, 120), M.ink()));
      // Equator band and two hairlines beside it
      const ring = (y, tube) => {
        const t = mesh(new THREE.TorusGeometry(Math.sqrt(1 - y * y), tube, 16, 240), M.gold(0.12));
        t.rotation.x = Math.PI / 2;
        t.position.y = y;
        group.add(t);
      };
      ring(0, 0.03);
      ring(0.12, 0.011);
      ring(-0.12, 0.011);
      // Crown: a short ribbed cylinder sitting on the ball, a rim at its foot
      const v = (x, y) => new THREE.Vector2(x, y);
      const crown = [v(0.001, 0.9), v(0.25, 0.9), v(0.255, 0.95), v(0.24, 1.13), v(0.21, 1.16), v(0.001, 1.16)];
      group.add(mesh(new THREE.LatheGeometry(crown, 96), M.gold(0.22)));
      for (let k = 0; k < 14; k++) {
        const a = (k / 14) * Math.PI * 2;
        const rib = mesh(new THREE.CapsuleGeometry(0.018, 0.15, 6, 12), M.gold(0.14));
        rib.position.set(Math.cos(a) * 0.248, 1.04, Math.sin(a) * 0.248);
        group.add(rib);
      }
      const rim = mesh(new THREE.TorusGeometry(0.262, 0.022, 12, 96), M.gold(0.1));
      rim.rotation.x = Math.PI / 2;
      rim.position.y = 0.955;
      group.add(rim);
      const loop = mesh(new THREE.TorusGeometry(0.1, 0.022, 16, 64), M.gold(0.1));
      loop.position.y = 1.26;
      group.add(loop);
      return pose(group, 0.16, -0.5, -0.06);
    },

    /** Snowflake: six ivory ceramic arms with two pairs of branches each around a hexagonal centre. */
    "new-year/snowflake"() {
      const group = new THREE.Group();
      // Thin arms facing the camera catch little of the studio's back light: a brighter environment keeps them snow-white
      const pearl = Object.assign(M.gloss("#ffffff", "#ffffff"), { envMapIntensity: 2.4 });
      const capsule = (length, radius, x, y, angle) => {
        const m = mesh(new THREE.CapsuleGeometry(radius, length, 16, 48), pearl);
        m.position.set(x, y, 0);
        m.rotation.z = angle - Math.PI / 2; // capsules run along Y
        group.add(m);
      };
      for (let i = 0; i < 6; i++) {
        const a = Math.PI / 2 + (i * Math.PI) / 3;
        const dx = Math.cos(a);
        const dy = Math.sin(a);
        capsule(1.0, 0.1, dx * 0.56, dy * 0.56, a);
        for (const [d, len] of [
          [0.52, 0.34],
          [0.82, 0.2],
        ]) {
          for (const side of [-1, 1]) {
            const b = a + (side * Math.PI) / 3;
            const half = len / 2 + 0.03;
            capsule(len, 0.066, dx * d + Math.cos(b) * half, dy * d + Math.sin(b) * half, b);
          }
        }
      }
      const hex = Array.from({ length: 6 }, (_, i) => [Math.cos((i * Math.PI) / 3 + Math.PI / 6) * 0.22, Math.sin((i * Math.PI) / 3 + Math.PI / 6) * 0.22]);
      group.add(mesh(extrude(roundedPolygon(hex, 0.06), { depth: 0.08, bevelThickness: 0.07, bevelSize: 0.045 }), pearl));
      return pose(group, 0.32, -0.42, 0.12);
    },

    /** Tree-top star: five points, faceted like cut metal, in champagne gold. */
    "new-year/star"() {
      const points = [];
      for (let i = 0; i < 10; i++) {
        const a = Math.PI / 2 + (i * Math.PI) / 5;
        const r = i % 2 ? 0.5 : 1.15;
        points.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0));
      }
      const front = new THREE.Vector3(0, 0, 0.42);
      const back = new THREE.Vector3(0, 0, -0.42);
      const position = [];
      points.forEach((p, i) => {
        const q = points[(i + 1) % points.length];
        position.push(...front.toArray(), ...p.toArray(), ...q.toArray());
        position.push(...back.toArray(), ...q.toArray(), ...p.toArray());
      });
      // Not indexed: every facet keeps its own flat normal, the edges stay crisp
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(position, 3));
      g.computeVertexNormals();
      // Brushed rather than mirror: flat facets would only mirror the dark studio, these catch its light
      return pose(mesh(g, Object.assign(M.gold(0.4), { envMapIntensity: 1.6 })), 0.42, -0.32, 0.05);
    },

    /** Gift box: black chrome, wrapped in champagne ribbon, a bow on the lid. */
    "new-year/gift"() {
      const group = new THREE.Group();
      const s = 1.5;
      const hgt = s * 0.86;
      group.add(mesh(new RoundedBoxGeometry(s, hgt, s, 8, 0.12), M.ink()));
      const ribbon = M.gold(0.18);
      const w = 0.26;
      const t = 0.035;
      group.add(mesh(new RoundedBoxGeometry(w, hgt + t * 2, s + t * 2, 4, 0.03), ribbon));
      group.add(mesh(new RoundedBoxGeometry(s + t * 2, hgt + t * 2, w, 4, 0.03), ribbon));
      const lid = hgt / 2 + t;
      for (const side of [-1, 1]) {
        const loop = mesh(new THREE.TorusGeometry(0.22, 0.055, 16, 72), ribbon);
        loop.scale.set(1, 0.7, 1);
        loop.position.set(side * 0.2, lid + 0.13, 0);
        loop.rotation.set(0, side * 0.5, side * 0.55);
        group.add(loop);
      }
      const knot = mesh(new THREE.SphereGeometry(0.095, 32, 24), ribbon);
      knot.position.set(0, lid + 0.05, 0);
      group.add(knot);
      return pose(group, 0.5, -0.7, 0.08);
    },
  };
}
