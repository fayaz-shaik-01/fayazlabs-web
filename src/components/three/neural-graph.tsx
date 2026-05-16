"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const LAB_GREEN = "#4ade80";
const LAB_AMBER = "#fbbf24";
const STRUT_COLOR = "#4ade80";

const NODE_DATA = [
  { label: "Agent", pos: [0, 1.5, 0] as [number, number, number], color: LAB_GREEN },
  { label: "LLM", pos: [-2.2, 0.5, 0.5] as [number, number, number], color: LAB_AMBER },
  { label: "Tools", pos: [2.2, 0.5, -0.5] as [number, number, number], color: LAB_GREEN },
  { label: "Memory", pos: [-1.5, -1.2, 1] as [number, number, number], color: LAB_AMBER },
  { label: "API", pos: [1.5, -1.2, -1] as [number, number, number], color: LAB_GREEN },
  { label: "Eval", pos: [0, -2, 0] as [number, number, number], color: LAB_AMBER },
  { label: "Output", pos: [2.8, -0.5, 0.8] as [number, number, number], color: LAB_GREEN },
  { label: "Orchestrator", pos: [-2.8, -0.5, -0.8] as [number, number, number], color: LAB_AMBER },
];

const EDGES = [
  [0, 1], [0, 2], [0, 5], [1, 3], [1, 7], [2, 4], [2, 6], [3, 5], [4, 6],
  [5, 7], [3, 4], [6, 0],
];

function MechanicalNode({ position, color, index }: Readonly<{ position: [number, number, number]; color: string; index: number }>) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    const floatY = Math.sin(t * 0.5 + index * 0.8) * 0.06;
    const floatX = Math.cos(t * 0.3 + index * 1.1) * 0.03;
    meshRef.current.position.y = position[1] + floatY;
    meshRef.current.position.x = position[0] + floatX;
    if (glowRef.current) {
      glowRef.current.position.copy(meshRef.current.position);
      glowRef.current.scale.setScalar(1 + Math.sin(t * 0.8 + index) * 0.1);
    }
  });

  return (
    <group>
      {/* Outer glow */}
      <mesh ref={glowRef} position={position}>
        <boxGeometry args={[0.28, 0.28, 0.28]} />
        <meshBasicMaterial color={color} transparent opacity={0.08} />
      </mesh>
      {/* Core node — box for mechanical feel */}
      <mesh ref={meshRef} position={position}>
        <boxGeometry args={[0.12, 0.12, 0.12]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.6}
          roughness={0.3}
          metalness={0.7}
        />
      </mesh>
    </group>
  );
}

function MechanicalStrut({ start, end, index }: Readonly<{ start: [number, number, number]; end: [number, number, number]; index: number }>) {
  const pulseRef = useRef<THREE.Mesh>(null);

  const { midpoint, length, quaternion } = useMemo(() => {
    const s = new THREE.Vector3(...start);
    const e = new THREE.Vector3(...end);
    const mid = s.clone().add(e).multiplyScalar(0.5);
    const dir = e.clone().sub(s);
    const len = dir.length();
    const quat = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      dir.normalize()
    );
    return { midpoint: mid, length: len, quaternion: quat };
  }, [start, end]);

  const points = useMemo(() => {
    return [new THREE.Vector3(...start), new THREE.Vector3(...end)];
  }, [start, end]);

  useFrame(({ clock }) => {
    if (!pulseRef.current) return;
    const t = (clock.getElapsedTime() * 0.25 + index * 0.12) % 1;
    pulseRef.current.position.lerpVectors(points[0], points[1], t);
  });

  return (
    <group>
      {/* Rigid strut — thin cylinder */}
      <mesh position={[midpoint.x, midpoint.y, midpoint.z]} quaternion={quaternion}>
        <cylinderGeometry args={[0.012, 0.012, length, 4]} />
        <meshStandardMaterial
          color={STRUT_COLOR}
          emissive={STRUT_COLOR}
          emissiveIntensity={0.15}
          transparent
          opacity={0.25}
          roughness={0.4}
          metalness={0.8}
        />
      </mesh>
      {/* Traveling pulse */}
      <mesh ref={pulseRef} position={start}>
        <boxGeometry args={[0.03, 0.03, 0.03]} />
        <meshBasicMaterial color={LAB_GREEN} transparent opacity={0.8} />
      </mesh>
    </group>
  );
}

export function NeuralGraph() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock, pointer }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    groupRef.current.rotation.y = t * 0.05 + pointer.x * 0.3;
    groupRef.current.rotation.x = Math.sin(t * 0.1) * 0.05 + pointer.y * 0.15;
  });

  return (
    <group ref={groupRef} scale={1.3} position={[1.5, 0, 0]}>
      {NODE_DATA.map((node, i) => (
        <MechanicalNode key={node.label} position={node.pos} color={node.color} index={i} />
      ))}
      {EDGES.map(([a, b], i) => (
        <MechanicalStrut key={`${a}-${b}`} start={NODE_DATA[a].pos} end={NODE_DATA[b].pos} index={i} />
      ))}
      <ambientLight intensity={0.4} />
      <pointLight position={[5, 5, 5]} intensity={0.5} color={LAB_GREEN} />
      <pointLight position={[-5, -3, 3]} intensity={0.3} color={LAB_AMBER} />
    </group>
  );
}
