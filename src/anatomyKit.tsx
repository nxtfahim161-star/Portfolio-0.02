import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useCursor } from "@react-three/drei";
import * as THREE from "three";
import type { RegionId } from "./data";

export type V3 = [number, number, number];
export type Mat = THREE.Material;

const NO_RAY = () => {};
export const SPHERE = new THREE.SphereGeometry(1, 40, 30);

let fiberTex: THREE.CanvasTexture | null = null;
function getFiberTexture() {
  if (fiberTex) return fiberTex;
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const g = c.getContext("2d")!;
  const grad = g.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, "#b4524a");
  grad.addColorStop(0.5, "#a34840");
  grad.addColorStop(1, "#8f3a35");
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  let seed = 7;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  for (let i = 0; i < 320; i++) {
    const x = rnd() * 256;
    const w = 0.5 + rnd() * 2.4;
    const light = rnd() > 0.5;
    g.fillStyle = light
      ? `rgba(240,150,130,${0.1 + rnd() * 0.22})`
      : `rgba(50,8,10,${0.12 + rnd() * 0.3})`;
    g.fillRect(x, 0, w, 256);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(2, 1);
  t.anisotropy = 4;
  t.colorSpace = THREE.SRGBColorSpace;
  fiberTex = t;
  return t;
}

function usePartMaterial(sel: boolean, hov: boolean, layers: boolean, tint: string, fiber: boolean) {
  const mat = useMemo(() => {
    if (fiber) {
      const t = getFiberTexture();
      return new THREE.MeshPhysicalMaterial({
        map: t,
        bumpMap: t,
        bumpScale: 0.8,
        roughness: 0.45,
        clearcoat: 0.35,
        clearcoatRoughness: 0.5,
        sheen: 0.5,
        sheenColor: new THREE.Color("#ff9a8a"),
        sheenRoughness: 0.5,
      });
    }
    return new THREE.MeshPhysicalMaterial({
      roughness: 0.6,
      sheen: 0.3,
      sheenColor: new THREE.Color("#ffd5c8"),
    });
  }, [fiber]);

  useEffect(() => () => mat.dispose(), [mat]);

  useEffect(() => {
    mat.color.set(sel ? (fiber ? "#ff8a78" : "#ffb3a5") : tint);
    mat.emissive.set(sel ? "#ff2d1f" : hov ? "#ff6a4a" : "#000000");
    mat.emissiveIntensity = sel ? 0.5 : hov ? 0.22 : 0;
    mat.transparent = layers;
    mat.opacity = layers ? 0.45 : 1;
    mat.depthWrite = !layers;
    mat.needsUpdate = true;
  }, [mat, sel, hov, layers, tint, fiber]);

  return mat;
}

export function Part({
  id, selected, layers, onSelect, tint = "#ffffff", fiber = true, children,
}: {
  id: RegionId;
  selected: RegionId | null;
  layers: boolean;
  onSelect: (id: RegionId) => void;
  tint?: string;
  fiber?: boolean;
  children: (mat: Mat) => ReactNode;
}) {
  const [hov, setHov] = useState(false);
  useCursor(hov);
  const mat = usePartMaterial(selected === id, hov, layers, tint, fiber);
  return (
    <group
      onClick={(e) => {
        e.stopPropagation();
        onSelect(id);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHov(true);
      }}
      onPointerOut={() => setHov(false)}
    >
      {children(mat)}
    </group>
  );
}

export function M({ p, s, r = [0, 0, 0], m }: { p: V3; s: V3; r?: V3; m: Mat }) {
  return <mesh geometry={SPHERE} material={m} position={p} scale={s} rotation={r} />;
}

export function Core({
  p, s, r = [0, 0, 0], color = "#4a1515",
}: { p: V3; s: V3; r?: V3; color?: string }) {
  return (
    <mesh geometry={SPHERE} position={p} scale={s} rotation={r}>
      <meshStandardMaterial color={color} roughness={0.75} />
    </mesh>
  );
}

export function Tendon({ p, s, r = [0, 0, 0] }: { p: V3; s: V3; r?: V3 }) {
  return (
    <mesh geometry={SPHERE} position={p} scale={s} rotation={r} raycast={NO_RAY}>
      <meshStandardMaterial color="#eadfce" roughness={0.5} />
    </mesh>
  );
}

export function Vein({ pts, r = 0.012 }: { pts: V3[]; r?: number }) {
  const curve = useMemo(
    () => new THREE.CatmullRomCurve3(pts.map(([x, y, z]) => new THREE.Vector3(x, y, z))),
    [pts]
  );
  return (
    <mesh raycast={NO_RAY}>
      <tubeGeometry args={[curve, 48, r, 6, false]} />
      <meshStandardMaterial color="#3b5bdb" emissive="#1b3bb0" emissiveIntensity={0.5} roughness={0.4} />
    </mesh>
  );
                         }
