"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";
import type { OrbStatus } from "@/stores/chat-store";

/** How the orb behaves in each state: surface wobble, wobble speed, spin, size. */
const TARGET: Record<OrbStatus, { distort: number; speed: number; spin: number; scale: number; glow: number }> = {
  idle: { distort: 0.3, speed: 1.4, spin: 0.12, scale: 1, glow: 0.9 },
  thinking: { distort: 0.62, speed: 4.2, spin: 1.1, scale: 1.07, glow: 1.5 },
  speaking: { distort: 0.42, speed: 2.6, spin: 0.45, scale: 1, glow: 1.2 },
};

/** Theme colours, read from the CSS variables so the orb matches light and dark. */
function useThemeColors() {
  const read = () => {
    const css = getComputedStyle(document.documentElement);
    const main = css.getPropertyValue("--primary").trim() || "#0b6e63";
    const dark = document.documentElement.classList.contains("dark");
    return { main: new THREE.Color(main), dark };
  };
  const [colors, setColors] = useState(read);
  useEffect(() => {
    const mo = new MutationObserver(() => setColors(read()));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => mo.disconnect();
  }, []);
  return colors;
}

/** Cursor position over the whole window, -1..1, so the orb leans toward the pointer. */
function usePointer() {
  const p = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const on = (e: PointerEvent) => {
      p.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      p.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", on, { passive: true });
    return () => window.removeEventListener("pointermove", on);
  }, []);
  return p;
}

/** Small deterministic generator, so the particle layout is the same on every render. */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const haloVertex = /* glsl */ `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const haloFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;
  varying vec3 vNormal;
  void main() {
    float i = pow(max(0.0, 0.78 - dot(vNormal, vec3(0.0, 0.0, 1.0))), 3.0) * uIntensity;
    gl_FragColor = vec4(uColor, clamp(i, 0.0, 0.9));
  }
`;

function Orb({ status }: Readonly<{ status: OrbStatus }>) {
  const { main, dark } = useThemeColors();
  const pointer = usePointer();
  const group = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Points>(null);
  const mat = useRef<{ distort: number; speed: number } | null>(null);
  const halo = useRef<THREE.ShaderMaterial>(null);
  const cur = useRef({ ...TARGET.idle });

  const haloUniforms = useMemo(() => ({ uColor: { value: new THREE.Color() }, uIntensity: { value: 1 } }), []);
  const particles = useMemo(() => {
    const n = 260;
    const rand = mulberry32(42);
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const a = rand() * Math.PI * 2;
      const r = 1.75 + rand() * 0.55;
      pos[i * 3] = Math.cos(a) * r;
      pos[i * 3 + 1] = (rand() - 0.5) * 0.5;
      pos[i * 3 + 2] = Math.sin(a) * r;
    }
    return pos;
  }, []);

  useFrame((state, dt) => {
    const t = TARGET[status];
    const c = cur.current;
    const k = 1 - Math.exp(-dt * 3); // ease toward the target state
    c.distort += (t.distort - c.distort) * k;
    c.speed += (t.speed - c.speed) * k;
    c.spin += (t.spin - c.spin) * k;
    c.scale += (t.scale - c.scale) * k;
    c.glow += (t.glow - c.glow) * k;

    if (mat.current) {
      mat.current.distort = c.distort;
      mat.current.speed = c.speed;
    }
    if (halo.current) halo.current.uniforms.uIntensity.value = c.glow * (dark ? 1.6 : 0.9);

    const g = group.current;
    if (g) {
      g.rotation.y += dt * c.spin;
      g.rotation.x += (pointer.current.y * 0.4 - g.rotation.x) * k;
      g.position.x += (pointer.current.x * 0.18 - g.position.x) * k;
      const pulse = status === "speaking" ? 1 + Math.sin(state.clock.elapsedTime * 7) * 0.03 : 1;
      g.scale.setScalar(c.scale * pulse);
    }
    if (ring.current) {
      ring.current.rotation.y -= dt * (0.08 + c.spin * 0.6);
      ring.current.rotation.z = 0.35 + Math.sin(state.clock.elapsedTime * 0.4) * 0.05;
    }
  });

  const glow = useMemo(() => main.clone().lerp(new THREE.Color("#ffffff"), dark ? 0.25 : 0.05), [main, dark]);
  haloUniforms.uColor.value.copy(glow);

  return (
    <>
      <group ref={group}>
        <mesh>
          <sphereGeometry args={[1, 96, 96]} />
          <MeshDistortMaterial
            ref={mat as never}
            color={main}
            emissive={main}
            emissiveIntensity={dark ? 0.45 : 0.22}
            roughness={0.18}
            metalness={0.15}
            clearcoat={1}
            clearcoatRoughness={0.12}
            distort={0.3}
            speed={1.4}
          />
        </mesh>
        <mesh key={dark ? "halo-dark" : "halo-light"} scale={1.32}>
          <sphereGeometry args={[1, 48, 48]} />
          <shaderMaterial
            ref={halo}
            args={[{ uniforms: haloUniforms, vertexShader: haloVertex, fragmentShader: haloFragment, transparent: true, depthWrite: false, blending: dark ? THREE.AdditiveBlending : THREE.NormalBlending, side: THREE.BackSide }]}
          />
        </mesh>
      </group>
      <points ref={ring}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[particles, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.035} sizeAttenuation color={glow} transparent opacity={dark ? 0.95 : 0.8} depthWrite={false} />
      </points>
    </>
  );
}

export default function AiOrbScene({ status, active }: Readonly<{ status: OrbStatus; active: boolean }>) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 4.6], fov: 38 }}
      gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
      frameloop={active ? "always" : "never"}
      aria-hidden="true"
    >
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 4, 5]} intensity={2.2} />
      <pointLight position={[-4, -2, -3]} intensity={18} color="#7fe3d3" />
      <Orb status={status} />
    </Canvas>
  );
}
