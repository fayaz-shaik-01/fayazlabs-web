/*
 * Bolt: the 3D assistant. Pure three.js, no React. The layer in bolt-layer.tsx owns the
 * canvas and the DOM overlays and talks to this through the controller returned below.
 *
 * Behaviours: looks at the pointer, tilts toward the scroll direction, reaches and points at
 * whatever the visitor clicks or hovers, talks while the assistant answers, and sits in one
 * of a few camera presets (hero, companion, chat bust).
 */
import * as THREE from "three";

export type BoltMood = "idle" | "talk" | "think" | "wave" | "cheer";

export interface CamPreset {
  yaw: number;
  pitch: number;
  dist: number;
  tx: number;
  ty: number;
  tz: number;
  /** Horizontal shift of the scene, as a fraction of the viewport width (positive moves right). */
  sx: number;
  /** Vertical shift, as a fraction of the viewport height (positive moves up). */
  sy: number;
}

export interface BoltController {
  setPreset(p: CamPreset): void;
  setMood(m: BoltMood, ms?: number): void;
  setSpeaking(v: boolean): void;
  setPointer(x: number, y: number): void;
  pointerLeft(): void;
  addScroll(dy: number): void;
  pointAt(x: number, y: number, ms: number): void;
  stopPoint(): void;
  isPointing(): boolean;
  nod(): void;
  hitTest(x: number, y: number): boolean;
  /** Screen position (px) of the point above Bolt's head, for the speech bubble. */
  headTop(): [number, number];
  /** Screen position (px) just under his feet, for the "Ask Bolt" pill. */
  feet(): [number, number];
  /** Screen position (px) of the pointing fingertip, or null when he is not pointing. */
  fingertip(): [number, number] | null;
  /** Rebuild with the current theme colours. */
  rebuild(): void;
  setOnFrame(cb: (() => void) | null): void;
  dispose(): void;
}

const LA = 0.78;
const LB = 0.74;
const EYE_C = 0.42;
const DOWN = new THREE.Vector3(0, -1, 0);
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

interface Palette {
  shell: string; under: string; metal: string; line: string; glow: string; floor: string; dark: boolean;
}

function readPalette(): Palette {
  const cs = getComputedStyle(document.documentElement);
  const g = (n: string, d: string) => cs.getPropertyValue(n).trim() || d;
  return {
    shell: g("--bolt-shell", "#e9eef5"), under: g("--bolt-under", "#0c1219"), metal: g("--bolt-metal", "#c4ccd8"),
    line: g("--bolt-line", "#6cb8ff"), glow: g("--bolt-glow", "#ffa43a"), floor: g("--bolt-floor", "#6cb8ff"),
    dark: document.documentElement.classList.contains("dark"),
  };
}

/* ---------- geometry helpers ---------- */
function rbox(w: number, h: number, d: number, r: number) {
  r = Math.min(r, w / 2 - 0.002, h / 2 - 0.002, d / 2 - 0.002);
  const sw = w - 2 * r, sh = h - 2 * r, x = sw / 2, y = sh / 2, k = Math.max(0.001, Math.min(r * 0.8, x - 0.001, y - 0.001));
  const s = new THREE.Shape();
  s.moveTo(-x + k, -y); s.lineTo(x - k, -y); s.quadraticCurveTo(x, -y, x, -y + k); s.lineTo(x, y - k); s.quadraticCurveTo(x, y, x - k, y);
  s.lineTo(-x + k, y); s.quadraticCurveTo(-x, y, -x, y - k); s.lineTo(-x, -y + k); s.quadraticCurveTo(-x, -y, -x + k, -y);
  const depth = Math.max(0.002, d - 2 * r);
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: r, bevelSize: r, bevelSegments: 4, curveSegments: 6 });
  g.translate(0, 0, -depth / 2);
  return g;
}
function torsoGeo() {
  const s = new THREE.Shape();
  s.moveTo(-0.32, 0); s.lineTo(0.32, 0);
  s.bezierCurveTo(0.4, 0.22, 0.56, 0.4, 0.57, 0.62);
  s.bezierCurveTo(0.58, 0.78, 0.5, 0.89, 0.36, 0.92);
  s.lineTo(-0.36, 0.92);
  s.bezierCurveTo(-0.5, 0.89, -0.58, 0.78, -0.57, 0.62);
  s.bezierCurveTo(-0.56, 0.4, -0.4, 0.22, -0.32, 0);
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.3, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.09, bevelSegments: 6, curveSegments: 14 });
  g.translate(0, 0, -0.15);
  return g;
}
const taper = (rt: number, rb: number, len: number, seg = 24) => new THREE.CylinderGeometry(rt, rb, len, seg).translate(0, -len / 2, 0);
const sph = (r: number, seg = 22) => new THREE.SphereGeometry(r, seg, Math.round(seg * 0.7));
const torus = (r: number, t: number) => new THREE.TorusGeometry(r, t, 10, 36).rotateX(Math.PI / 2);

function ringPts(r: number, n: number) {
  const p: THREE.Vector3[] = [];
  for (let i = 0; i <= n; i++) { const a = (i / n) * Math.PI * 2; p.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r)); }
  return p;
}

interface Mats {
  shell: THREE.MeshPhysicalMaterial; shellDouble: THREE.MeshPhysicalMaterial; dark: THREE.MeshStandardMaterial;
  metal: THREE.MeshStandardMaterial; glass: THREE.MeshPhysicalMaterial; led: THREE.MeshBasicMaterial; amber: THREE.MeshBasicMaterial;
}
interface Finger { p1: THREE.Group; p2: THREE.Group }
interface Arm {
  up: THREE.Group; fo: THREE.Group; el: THREE.Group; wr: THREE.Group; hand: THREE.Group;
  fingers: Finger[]; thumb: Finger; cO: number; cI: number; tgt: THREE.Vector3; pole: THREE.Vector3; pt: number; tip: THREE.Vector3;
}
interface Human {
  root: THREE.Group; torso: THREE.Group; head: THREE.Group; core: THREE.Mesh; eye: THREE.Group[]; bars: THREE.Mesh[]; led: THREE.Mesh[];
  arm: Record<"-1" | "1", Arm>; hit: THREE.Mesh; R: number; eyeAz: number; eyeEl: number;
}

export function createBoltScene(canvas: HTMLCanvasElement, reduceMotion: boolean): BoltController | null {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  } catch {
    return null;
  }
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  let scene: THREE.Scene, cam: THREE.PerspectiveCamera, world: THREE.Group, hum: Human, particles: THREE.Points;
  let P: Palette, MT: Mats, envTex: THREE.Texture | null = null, glowTex: THREE.CanvasTexture | null = null;
  let alive = true, raf = 0, onFrame: (() => void) | null = null;

  /* ---------- environment: a tiny studio baked into reflections ---------- */
  function makeEnv() {
    envTex?.dispose();
    const pm = new THREE.PMREMGenerator(renderer), es = new THREE.Scene();
    const c = document.createElement("canvas"); c.width = 4; c.height = 256;
    const x = c.getContext("2d")!, gr = x.createLinearGradient(0, 0, 0, 256);
    if (P.dark) { gr.addColorStop(0, "#14233a"); gr.addColorStop(0.55, "#0a121e"); gr.addColorStop(1, "#05080d"); }
    else { gr.addColorStop(0, "#f2f6fb"); gr.addColorStop(0.55, "#cbd6e3"); gr.addColorStop(1, "#98a6b8"); }
    x.fillStyle = gr; x.fillRect(0, 0, 4, 256);
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    es.add(new THREE.Mesh(new THREE.SphereGeometry(60, 32, 16), new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide })));
    const sb = (px: number, py: number, pz: number, w: number, h: number, col: string, k: number) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(k), side: THREE.DoubleSide }));
      m.position.set(px, py, pz); m.lookAt(0, 0, 0); es.add(m);
    };
    sb(14, 18, 16, 20, 9, "#ffffff", P.dark ? 5 : 3.2);
    sb(-22, 8, 8, 8, 20, "#bcd6ff", P.dark ? 3.2 : 2);
    sb(0, -6, 22, 26, 4, "#7aa7d6", P.dark ? 1.2 : 1);
    sb(-8, 10, -22, 14, 5, P.line, P.dark ? 4 : 2);
    sb(20, 4, -10, 5, 12, P.glow, P.dark ? 2 : 1.2);
    envTex = pm.fromScene(es, 0.03).texture;
    pm.dispose();
    es.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose();
      const mat = m.material as THREE.MeshBasicMaterial | undefined;
      if (mat) { mat.map?.dispose(); mat.dispose(); }
    });
  }
  function makeGlow() {
    if (glowTex) return glowTex;
    const c = document.createElement("canvas"); c.width = c.height = 64;
    const x = c.getContext("2d")!, g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.35, "rgba(255,255,255,.35)"); g.addColorStop(1, "rgba(255,255,255,0)");
    x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    glowTex = new THREE.CanvasTexture(c); glowTex.colorSpace = THREE.SRGBColorSpace;
    return glowTex;
  }
  function materials(): Mats {
    const base = { color: P.shell, roughness: 0.3, metalness: 0.08, clearcoat: 0.9, clearcoatRoughness: 0.18 };
    return {
      shell: new THREE.MeshPhysicalMaterial(base),
      shellDouble: new THREE.MeshPhysicalMaterial({ ...base, side: THREE.DoubleSide }),
      dark: new THREE.MeshStandardMaterial({ color: P.under, roughness: 0.5, metalness: 0.75 }),
      metal: new THREE.MeshStandardMaterial({ color: P.metal, roughness: 0.26, metalness: 1 }),
      glass: new THREE.MeshPhysicalMaterial({ color: 0x020407, roughness: 0.04, metalness: 0.35, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 1.8 }),
      led: new THREE.MeshBasicMaterial({ color: P.line, toneMapped: false }),
      amber: new THREE.MeshBasicMaterial({ color: P.glow, toneMapped: false }),
    };
  }
  function M(geo: THREE.BufferGeometry, mat: THREE.Material, parent: THREE.Object3D | null, x = 0, y = 0, z = 0, noShadow = false) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z); m.castShadow = !noShadow; m.receiveShadow = true;
    parent?.add(m);
    return m;
  }

  /* ---------- the humanoid ---------- */
  function makeHand(s: number) {
    const g = new THREE.Group(), inner = new THREE.Group();
    inner.rotation.y = (s * Math.PI) / 2; g.add(inner);
    M(rbox(0.17, 0.2, 0.075, 0.03), MT.dark, inner, 0, -0.13, 0);
    M(rbox(0.15, 0.14, 0.02, 0.01), MT.shell, inner, 0, -0.12, 0.05);
    const seg = (parent: THREE.Object3D, len: number, r: number) => M(new THREE.CapsuleGeometry(r, len, 4, 10).translate(0, -(len / 2 + r), 0), MT.dark, parent);
    const mkFinger = (x: number, y: number, len: number, r: number, rotZ: number): Finger => {
      const p1 = new THREE.Group(); p1.position.set(x, y, 0); if (rotZ) p1.rotation.z = rotZ; inner.add(p1); seg(p1, len, r);
      const p2 = new THREE.Group(); p2.position.y = -(len + r * 2); p1.add(p2); seg(p2, len * 0.82, r * 0.92);
      M(sph(r * 1.05, 10), MT.metal, p1, 0, -(len + r * 2), 0, true);
      return { p1, p2 };
    };
    const fingers: Finger[] = [], lens = [0.075, 0.085, 0.08, 0.062];
    for (let i = 0; i < 4; i++) fingers.push(mkFinger(-0.0585 + i * 0.039, -0.23, lens[i], 0.0165, 0));
    const thumb = mkFinger(-s * 0.095, -0.1, 0.06, 0.019, -s * 0.5);
    return { g, fingers, thumb };
  }

  function buildHumanoid(): Human {
    const rootG = new THREE.Group();
    const sh = MT.shell, dk = MT.dark, mt = MT.metal;
    M(rbox(0.84, 0.3, 0.5, 0.08), sh, rootG, 0, 1.98, 0);
    M(new THREE.CylinderGeometry(0.28, 0.32, 0.22, 28), dk, rootG, 0, 2.2, 0);
    M(new THREE.CylinderGeometry(0.26, 0.26, 0.3, 28), dk, rootG, 0, 2.38, 0);
    [-0.1, 0, 0.1].forEach((y) => M(torus(0.265, 0.016), mt, rootG, 0, 2.38 + y, 0, true));
    [-1, 1].forEach((s) => {
      const leg = new THREE.Group(); leg.position.set(s * 0.27, 0, 0); leg.rotation.y = s * 0.05; rootG.add(leg);
      M(sph(0.17), dk, leg, 0, 1.86, 0);
      M(taper(0.16, 0.125, 0.8, 28), sh, leg, 0, 1.8, 0);
      M(rbox(0.016, 0.42, 0.02, 0.006), MT.led, leg, 0, 1.42, 0.152, true);
      M(sph(0.135), dk, leg, 0, 0.96, 0);
      M(rbox(0.19, 0.14, 0.1, 0.045), sh, leg, 0, 0.97, 0.12);
      M(taper(0.118, 0.075, 0.74, 28), sh, leg, 0, 0.9, 0);
      const calf = M(sph(0.11), sh, leg, 0, 0.68, -0.06); calf.scale.set(1, 1.55, 1);
      M(sph(0.09), dk, leg, 0, 0.17, 0);
      M(rbox(0.3, 0.12, 0.56, 0.05), sh, leg, 0, 0.1, 0.1);
      M(rbox(0.31, 0.04, 0.57, 0.02), dk, leg, 0, 0.02, 0.1);
    });
    const torso = new THREE.Group(); torso.position.y = 2.52; rootG.add(torso);
    M(torsoGeo(), sh, torso, 0, 0.02, 0);
    M(rbox(0.68, 0.5, 0.06, 0.025), dk, torso, 0, 0.55, 0.285);
    M(new THREE.TorusGeometry(0.13, 0.02, 12, 40), mt, torso, 0, 0.56, 0.325, true);
    const core = M(new THREE.CircleGeometry(0.108, 32), MT.amber, torso, 0, 0.56, 0.322, true);
    [-1, 1].forEach((s) => M(rbox(0.024, 0.32, 0.02, 0.008), MT.led, torso, s * 0.25, 0.55, 0.322, true));
    [-1, 1].forEach((s) => {
      M(sph(0.2, 24), dk, torso, s * 0.7, 0.72, 0);
      const p = M(new THREE.SphereGeometry(0.27, 32, 18, 0, Math.PI * 2, 0, Math.PI * 0.5), MT.shellDouble, torso, s * 0.72, 0.74, 0);
      p.rotation.z = -s * Math.PI * 0.46;
    });
    M(rbox(0.6, 0.64, 0.2, 0.05), dk, torso, 0, 0.46, -0.32);
    for (let i = 0; i < 3; i++) M(rbox(0.4, 0.018, 0.012, 0.005), MT.led, torso, 0, 0.3 + i * 0.12, -0.428, true);
    M(new THREE.CylinderGeometry(0.1, 0.125, 0.2, 22), dk, torso, 0, 1.02, 0);
    M(torus(0.115, 0.014), mt, torso, 0, 1.1, 0, true);
    const head = new THREE.Group(); head.position.y = 1.16; torso.add(head);
    const scl = (g: THREE.BufferGeometry) => g.scale(1, 1.12, 1.06);
    M(scl(new THREE.SphereGeometry(0.36, 48, 32)), sh, head, 0, 0.42, 0);
    M(scl(new THREE.SphereGeometry(0.366, 40, 24, Math.PI / 2 - 0.86, 1.72, 0.86, 1.3)), dk, head, 0, 0.42, 0, true);
    M(scl(new THREE.SphereGeometry(0.372, 40, 24, Math.PI / 2 - 0.78, 1.56, 0.98, 0.98)), MT.glass, head, 0, 0.42, 0, true);
    const lid = M(scl(new THREE.SphereGeometry(0.362, 32, 12, 0, Math.PI * 2, 0, 0.35)), dk, head, 0, 0.42, 0, true); lid.position.y = 0.43;
    [-1, 1].forEach((s) => {
      const ear = M(new THREE.CylinderGeometry(0.1, 0.1, 0.07, 24), dk, head, s * 0.355, 0.42, 0); ear.rotation.z = Math.PI / 2;
      M(torus(0.1, 0.012).rotateZ(Math.PI / 2), mt, head, s * 0.395, 0.42, 0, true);
    });
    const led = [-1, 1].map((s) => M(sph(0.022, 10), MT.amber, head, s * 0.4, 0.42, 0, true));
    const glow = makeGlow();
    const eye = [0, 1].map(() => {
      const e = new THREE.Group(); head.add(e);
      e.add(new THREE.Mesh(new THREE.CircleGeometry(0.05, 28).scale(1, 0.86, 1), MT.led));
      const gp = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.17), new THREE.MeshBasicMaterial({ map: glow, color: P.line, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
      gp.position.z = 0.003; e.add(gp);
      return e;
    });
    const bars: THREE.Mesh[] = [];
    for (let i = 0; i < 5; i++) { const b = new THREE.Mesh(new THREE.PlaneGeometry(0.024, 0.03), MT.amber); head.add(b); bars.push(b); }

    const arm = {} as Record<"-1" | "1", Arm>;
    ([-1, 1] as const).forEach((s) => {
      const up = new THREE.Group(); rootG.add(up);
      M(taper(0.115, 0.095, LA - 0.16, 24), sh, up, 0, -0.06, 0);
      M(new THREE.CylinderGeometry(0.075, 0.075, LA, 16).translate(0, -LA / 2, 0), dk, up);
      const fo = new THREE.Group(); rootG.add(fo);
      M(taper(0.1, 0.07, LB - 0.2, 24), sh, fo, 0, -0.08, 0);
      M(new THREE.CylinderGeometry(0.062, 0.062, LB, 16).translate(0, -LB / 2, 0), dk, fo);
      M(torus(0.07, 0.014), mt, fo, 0, -LB + 0.07, 0, true);
      const el = new THREE.Group(); rootG.add(el); M(sph(0.105, 18), dk, el); M(sph(0.06, 12), mt, el, 0, 0, 0, true);
      const wr = new THREE.Group(); rootG.add(wr); M(sph(0.07, 14), dk, wr);
      const hd = makeHand(s); rootG.add(hd.g);
      arm[String(s) as "-1" | "1"] = { up, fo, el, wr, hand: hd.g, fingers: hd.fingers, thumb: hd.thumb, cO: 0.5, cI: 0.5, tgt: new THREE.Vector3(s * 0.7, 1.9, 0.1), pole: new THREE.Vector3(s * 0.4, -0.1, -1), pt: 0, tip: new THREE.Vector3() };
    });
    const hit = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, 4.9, 12), new THREE.MeshBasicMaterial({ visible: false }));
    hit.position.y = 2.45; rootG.add(hit);
    return { root: rootG, torso, head, core, eye, bars, led, arm, hit, R: 0.388, eyeAz: 0, eyeEl: 0 };
  }

  function placeOnHead(m: THREE.Object3D, az: number, el: number, r: number) {
    const ce = Math.cos(el);
    m.position.set(r * Math.sin(az) * ce, EYE_C + r * 1.12 * Math.sin(el), r * 1.06 * Math.cos(az) * ce);
    m.rotation.set(-el, az, 0, "YXZ");
  }

  function disposeTree(o: THREE.Object3D) {
    o.traverse((n) => {
      const m = n as THREE.Mesh;
      m.geometry?.dispose();
      const mat = m.material as THREE.Material | THREE.Material[] | undefined;
      if (mat) (Array.isArray(mat) ? mat : [mat]).forEach((x) => x.dispose());
    });
  }

  function build() {
    if (world) { scene.remove(world); disposeTree(world); }
    P = readPalette(); MT = materials(); makeEnv();
    scene = new THREE.Scene(); scene.environment = envTex; world = new THREE.Group(); scene.add(world);
    cam = new THREE.PerspectiveCamera(34, 1, 0.1, 400);
    const dark = P.dark;
    scene.add(new THREE.HemisphereLight(0xffffff, 0x303844, dark ? 0.5 : 1.1));
    const key = new THREE.DirectionalLight(0xffffff, dark ? 3.2 : 3); key.position.set(4, 9, 7); key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048); const sc = key.shadow.camera; sc.left = sc.bottom = -7; sc.right = sc.top = 7; sc.near = 1; sc.far = 30;
    key.shadow.bias = -0.0004;
    scene.add(key);
    const rim = new THREE.PointLight(new THREE.Color(P.line), dark ? 6 : 2.6, 0, 0); rim.position.set(-6, 4, -5); scene.add(rim);
    const fill = new THREE.PointLight(new THREE.Color(P.glow), dark ? 2.4 : 1, 0, 0); fill.position.set(5, 2, 4); scene.add(fill);
    const lc = new THREE.Color(P.floor);
    const grid = new THREE.GridHelper(22, 44, lc, lc); (grid.material as THREE.LineBasicMaterial).transparent = true; (grid.material as THREE.LineBasicMaterial).opacity = 0.13; world.add(grid);
    [2.2, 3.3, 4.4].forEach((r) => {
      const l = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(ringPts(r, 128)), new THREE.LineBasicMaterial({ color: P.line, transparent: true, opacity: 0.3 })); l.position.y = 0.01; world.add(l);
    });
    const tk: THREE.Vector3[] = [];
    for (let i = 0; i < 48; i++) { const a = (i / 48) * Math.PI * 2, r1 = i % 4 === 0 ? 4.8 : 4.6; tk.push(new THREE.Vector3(Math.cos(a) * 4.4, 0.01, Math.sin(a) * 4.4), new THREE.Vector3(Math.cos(a) * r1, 0.01, Math.sin(a) * r1)); }
    world.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(tk), new THREE.LineBasicMaterial({ color: P.line, transparent: true, opacity: 0.6 })));
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(4.8, 5, 0.12, 96), new THREE.MeshStandardMaterial({ color: P.floor, metalness: 0.3, roughness: 0.45, transparent: true, opacity: dark ? 0.2 : 0.22, envMapIntensity: 0.6 }));
    disc.position.y = -0.06; disc.receiveShadow = true; world.add(disc);
    hum = buildHumanoid(); world.add(hum.root);
    const N = 240, pa = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) { const r = 2 + Math.random() * 6, a = Math.random() * 6.283; pa[i * 3] = Math.cos(a) * r; pa[i * 3 + 1] = Math.random() * 5.8; pa[i * 3 + 2] = Math.sin(a) * r; }
    const pg = new THREE.BufferGeometry(); pg.setAttribute("position", new THREE.BufferAttribute(pa, 3));
    particles = new THREE.Points(pg, new THREE.PointsMaterial({ color: P.line, size: 0.05, transparent: true, opacity: 0.7, depthWrite: false }));
    world.add(particles);
    world.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.Material | undefined;
      if (m && ((m as THREE.LineBasicMaterial).isLineBasicMaterial || (m as THREE.PointsMaterial).isPointsMaterial)) m.toneMapped = false;
    });
    resize();
  }

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setSize(w, h, false);
  }

  /* ---------- camera ---------- */
  const cs: CamPreset = { yaw: 0.2, pitch: 0.08, dist: 13, tx: 0, ty: 2.55, tz: 0, sx: 0.2, sy: 0 };
  const goal: CamPreset = { ...cs };
  function updateCamera(dt: number, t: number) {
    const k = 1 - Math.exp(-dt * 3.2);
    (Object.keys(cs) as (keyof CamPreset)[]).forEach((key) => { cs[key] += (goal[key] - cs[key]) * k; });
    const drift = reduceMotion ? 0 : Math.sin(t * 0.18) * 0.04;
    const yaw = cs.yaw + drift, pitch = clamp(cs.pitch, 0.02, 1.2);
    cam.position.set(cs.tx + cs.dist * Math.sin(yaw) * Math.cos(pitch), cs.ty + cs.dist * Math.sin(pitch), cs.tz + cs.dist * Math.cos(yaw) * Math.cos(pitch));
    cam.lookAt(cs.tx, cs.ty, cs.tz);
    const w = window.innerWidth, h = window.innerHeight;
    cam.aspect = w / h;
    cam.setViewOffset(w, h, -cs.sx * w, cs.sy * h, w, h);
    cam.updateMatrixWorld();
  }

  /* ---------- input state ---------- */
  let ptrX = window.innerWidth * 0.45, ptrY = window.innerHeight * 0.5, ptrAt = -1e9, pointerIn = false, scrollLook = 0;
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  const planeLook = new THREE.Plane(new THREE.Vector3(0, 0, 1), -3), planePt = new THREE.Plane(new THREE.Vector3(0, 0, 1), -0.8);
  const vHit = new THREE.Vector3();
  function screenToPlane(x: number, y: number, plane: THREE.Plane, out: THREE.Vector3) {
    ndc.set((x / window.innerWidth) * 2 - 1, -(y / window.innerHeight) * 2 + 1);
    ray.setFromCamera(ndc, cam);
    return ray.ray.intersectPlane(plane, out) ? out : null;
  }
  const now = () => performance.now();

  /* ---------- pointing, gestures, speech ---------- */
  const pt = { on: false, x: 0, y: 0, until: 0, t0: 0, side: 1 as 1 | -1, P: new THREE.Vector3(), yaw: 0 };
  const gest = { name: "idle" as BoltMood, until: 0 };
  let speaking = false, nodAmp = 0, blinkAt = now() + 2500, blinkT = 0;

  const vS = new THREE.Vector3(), vT = new THREE.Vector3(), vE = new THREE.Vector3(), vD = new THREE.Vector3(), vPole = new THREE.Vector3();
  const vA = new THREE.Vector3(), vB = new THREE.Vector3(), vHead = new THREE.Vector3();
  const goalT = new THREE.Vector3(), goalP = new THREE.Vector3();
  const look = { yaw: 0, pitch: 0 };

  function armGoal(s: number, t: number, S0: THREE.Vector3): number {
    const name = gest.name;
    if (pt.on && pt.side === s) {
      vD.subVectors(pt.P, S0).normalize(); goalT.copy(S0).addScaledVector(vD, (LA + LB) * 0.97); goalP.set(s * 0.15, -1, -0.4); return 1;
    }
    if (name === "wave" && s === 1) { goalT.set(S0.x + 0.5 + Math.sin(t * 9) * 0.2, S0.y + 0.75, S0.z + 0.3); goalP.set(1, -0.3, -0.2); return 0; }
    if (name === "talk") { const ph = s * 1.3; goalT.set(S0.x - s * 0.2, S0.y - 0.85 + 0.12 * Math.sin(t * 2.8 + ph), S0.z + 0.72 + 0.1 * Math.sin(t * 2.1 + ph)); goalP.set(s * 0.8, -0.6, -0.1); return 0; }
    if (name === "think") {
      if (s === -1) { goalT.set(-0.1, 3.62, 0.52); goalP.set(-1, -0.2, -0.4); } else { goalT.set(-0.05, 2.62, 0.5); goalP.set(0.8, -0.2, -0.5); }
      return 0;
    }
    if (name === "cheer") { goalT.set(S0.x + s * 0.5, S0.y + 1.0 + 0.1 * Math.sin(t * 8 + s), S0.z + 0.1); goalP.set(s, -0.2, -0.5); return 0; }
    goalT.set(S0.x + s * 0.12 + Math.sin(t * 0.8 + s) * 0.02, S0.y - (LA + LB) * 0.92, S0.z + 0.08); goalP.set(s * 0.4, -0.1, -1);
    return 0;
  }

  function solveArm(s: 1 | -1, k: number, t: number) {
    const A = hum.arm[String(s) as "-1" | "1"];
    vS.set(s * 0.72, 0.72, 0); hum.torso.localToWorld(vS); hum.root.worldToLocal(vS);
    const f = armGoal(s, t, vS);
    A.tgt.lerp(goalT, k); A.pole.lerp(goalP, k); A.pt += (f - A.pt) * k;
    vD.subVectors(A.tgt, vS); let d = vD.length(); vD.normalize(); d = clamp(d, 0.12, LA + LB - 0.01);
    const a = (LA * LA - LB * LB + d * d) / (2 * d), h = Math.sqrt(Math.max(0, LA * LA - a * a));
    vT.copy(vS).addScaledVector(vD, d);
    vE.copy(vS).addScaledVector(vD, a);
    vPole.copy(A.pole); vPole.addScaledVector(vD, -vPole.dot(vD)); if (vPole.lengthSq() < 1e-4) vPole.set(0, -1, 0); vPole.normalize();
    vE.addScaledVector(vPole, h);
    A.up.position.copy(vS); vA.subVectors(vE, vS).normalize(); A.up.quaternion.setFromUnitVectors(DOWN, vA);
    A.el.position.copy(vE);
    A.fo.position.copy(vE); vB.subVectors(vT, vE).normalize(); A.fo.quaternion.setFromUnitVectors(DOWN, vB);
    A.wr.position.copy(vT); A.hand.position.copy(vT); A.hand.quaternion.copy(A.fo.quaternion);
    const base = (gest.name === "wave" && s === 1) || gest.name === "cheer" ? 0 : gest.name === "talk" ? 0.3 : gest.name === "think" ? 0.6 : 0.5;
    const pointing = A.pt > 0.5;
    A.cI += ((pointing ? 0 : base) - A.cI) * k; A.cO += ((pointing ? 1.45 : base) - A.cO) * k;
    A.fingers.forEach((fg, i) => { const c = i === 0 ? A.cI : A.cO; fg.p1.rotation.x = c * 0.95; fg.p2.rotation.x = c * 1.15; });
    A.thumb.p1.rotation.x = A.cO * 0.3; A.thumb.p2.rotation.x = A.cO * 0.5;
    A.tip.copy(vT).addScaledVector(vB, 0.4);
  }

  function updateHumanoid(dt: number, t: number) {
    const H = hum, k = 1 - Math.exp(-dt * 9), tn = now();
    if (gest.until && tn > gest.until) { gest.name = speaking ? "talk" : "idle"; gest.until = 0; }
    if (speaking && gest.name === "idle") gest.name = "talk";
    if (pt.on && tn > pt.until) pt.on = false;
    H.root.position.y = (gest.name === "cheer" ? Math.abs(Math.sin(t * 7)) * 0.08 : 0) + Math.sin(t * 1.6) * 0.008;
    H.torso.scale.y = 1 + Math.sin(t * 1.6) * 0.008;
    const active = pointerIn && tn - ptrAt < 5000;
    let tgt: THREE.Vector3 | null = null;
    if (pt.on) tgt = pt.P; else if (active) tgt = screenToPlane(ptrX, ptrY, planeLook, vHit);
    if (!tgt) { vHit.set(Math.sin(t * 0.4) * 2.2, 3 + Math.sin(t * 0.27) * 0.4, 3); tgt = vHit; }
    H.head.getWorldPosition(vHead);
    const dx = tgt.x - vHead.x, dy = tgt.y - vHead.y, dz = Math.max(0.8, tgt.z - vHead.z);
    look.yaw = Math.atan2(dx, dz); look.pitch = Math.atan2(dy, Math.hypot(dx, dz));
    scrollLook *= Math.exp(-dt * 1.5);
    const sPitch = -scrollLook * 0.6;
    if (pt.on && screenToPlane(pt.x, pt.y, planePt, pt.P)) {
      if (Math.abs(pt.P.x) > 0.35) pt.side = pt.P.x < 0 ? -1 : 1;
      pt.yaw = Math.atan2(pt.P.x, 3);
    }
    const ty = pt.on ? clamp(pt.yaw * 0.8, -0.7, 0.7) : clamp(look.yaw * 0.3, -0.45, 0.45);
    H.torso.rotation.y += (ty - H.torso.rotation.y) * k * 0.7;
    const nodV = Math.sin(tn / 85) * nodAmp + (speaking ? Math.sin(t * 5.5) * 0.035 : 0);
    nodAmp *= Math.exp(-dt * 3.2);
    const hy = clamp(look.yaw - H.torso.rotation.y, -0.95, 0.95), hp = clamp(look.pitch + sPitch, -0.55, 0.6);
    H.head.rotation.y += (hy - H.head.rotation.y) * k;
    H.head.rotation.x += (-(hp + nodV) - H.head.rotation.x) * k;
    H.head.rotation.z += ((gest.name === "think" ? 0.14 : 0) - H.head.rotation.z) * k;
    const azO = clamp((look.yaw - H.torso.rotation.y - H.head.rotation.y) * 0.9, -0.3, 0.3);
    const elO = clamp((look.pitch + sPitch) * 0.55, -0.22, 0.25) + (gest.name === "think" ? 0.1 : 0);
    H.eyeAz += (azO - H.eyeAz) * k; H.eyeEl += (elO - H.eyeEl) * k;
    if (tn > blinkAt) { blinkT = tn; blinkAt = tn + 2500 + Math.random() * 3000; }
    const bl = tn - blinkT < 130 ? 0.1 : 1;
    H.eye.forEach((e, i) => { placeOnHead(e, (i ? 0.3 : -0.3) + H.eyeAz * 0.55, 0.1 + H.eyeEl * 0.55, H.R); e.scale.y += (bl - e.scale.y) * 0.6; });
    H.bars.forEach((b, i) => {
      placeOnHead(b, -0.1 + i * 0.05 + H.eyeAz * 0.3, -0.36 + H.eyeEl * 0.2, H.R);
      const v = speaking ? 0.5 + Math.abs(Math.sin(t * 14 + i * 1.7)) * 2.6 : 0.3;
      b.scale.y += (v - b.scale.y) * 0.5;
    });
    H.led.forEach((l) => l.scale.setScalar(1 + Math.sin(t * 4) * 0.3));
    H.core.scale.setScalar(1 + Math.sin(t * 2.2) * 0.1);
    H.torso.updateMatrixWorld(true);
    solveArm(-1, k, t); solveArm(1, k, t);
  }

  /* ---------- screen projections for the overlays ---------- */
  const pv = new THREE.Vector3();
  function proj(x: number, y: number, z: number): [number, number] {
    pv.set(x, y, z).project(cam);
    return [(pv.x * 0.5 + 0.5) * window.innerWidth, (-pv.y * 0.5 + 0.5) * window.innerHeight];
  }

  /* ---------- loop ---------- */
  let last = now(), tAcc = 0;
  function frame(tn: number) {
    raf = requestAnimationFrame(frame);
    if (!alive || document.hidden) return;
    const dt = Math.min(0.05, (tn - last) / 1000); last = tn; tAcc += dt;
    if (!reduceMotion) particles.rotation.y += dt * 0.02;
    updateHumanoid(dt, tAcc);
    updateCamera(dt, tAcc);
    renderer.render(scene, cam);
    onFrame?.();
  }

  build();
  raf = requestAnimationFrame(frame);
  window.addEventListener("resize", resize);

  const api: BoltController = {
    setPreset(p) { Object.assign(goal, p); },
    setMood(m, ms = 0) { gest.name = m; gest.until = ms ? now() + ms : 0; },
    setSpeaking(v) { speaking = v; if (!v && gest.name === "talk" && !gest.until) gest.name = "idle"; },
    setPointer(x, y) { ptrX = x; ptrY = y; ptrAt = now(); pointerIn = true; },
    pointerLeft() { pointerIn = false; },
    addScroll(dy) { scrollLook = clamp(scrollLook + dy * 0.012, -1, 1); },
    pointAt(x, y, ms) { if (!pt.on || now() - pt.t0 > 250) pt.t0 = now(); pt.on = true; pt.x = x; pt.y = y; pt.until = now() + ms; },
    stopPoint() { pt.on = false; },
    isPointing() { return pt.on; },
    nod() { nodAmp = 0.16; },
    hitTest(x, y) {
      ndc.set((x / window.innerWidth) * 2 - 1, -(y / window.innerHeight) * 2 + 1);
      ray.setFromCamera(ndc, cam);
      return ray.intersectObject(hum.hit).length > 0;
    },
    headTop() { hum.head.getWorldPosition(vHead); return proj(vHead.x, vHead.y + 0.95, vHead.z); },
    feet() { return proj(0, 0, 1.1); },
    fingertip() {
      const A = hum.arm[String(pt.side) as "-1" | "1"];
      if (!pt.on || A.pt < 0.55) return null;
      vB.copy(A.tip); hum.root.localToWorld(vB);
      return proj(vB.x, vB.y, vB.z);
    },
    rebuild() { build(); },
    setOnFrame(cb) { onFrame = cb; },
    dispose() {
      alive = false; cancelAnimationFrame(raf); window.removeEventListener("resize", resize);
      disposeTree(world); envTex?.dispose(); glowTex?.dispose(); renderer.dispose();
    },
  };
  return api;
}
