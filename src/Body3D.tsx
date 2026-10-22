import { useEffect, useMemo, useRef, useState, type MutableRefObject, type ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Billboard, Html, useCursor } from "@react-three/drei";
import * as THREE from "three";
import { REGIONS, type RegionId } from "./data";

export interface Cmd { zoom: number; reset: boolean }
interface Props {
  selected: RegionId | null;
  onSelect: (id: RegionId) => void;
  autoRotate: boolean;
  panMode: boolean;
  layers: boolean;
  showLabels: boolean;
  scanning: boolean;
  cmd: MutableRefObject<Cmd>;
}

const mat = (sel: boolean, hov: boolean, layers: boolean, base = "#a8423a") => ({
  color: sel ? "#d9473a" : base,
  emissive: sel ? "#ff2d1f" : hov ? "#ff6a4a" : "#000000",
  emissiveIntensity: sel ? 0.55 : hov ? 0.25 : 0,
  roughness: 0.55, metalness: 0.05,
  transparent: layers, opacity: layers ? 0.45 : 1,
});
type MatProps = ReturnType<typeof mat>;

function Part(props: {
  id: RegionId; selected: RegionId | null; layers: boolean;
  onSelect: (id: RegionId) => void; base?: string;
  children: (m: MatProps) => ReactNode;
}) {
  const [hov, setHov] = useState(false);
  useCursor(hov);
  const m = mat(props.selected === props.id, hov, props.layers, props.base);
  return (
    <group
      onClick={(e) => { e.stopPropagation(); props.onSelect(props.id); }}
      onPointerOver={(e) => { e.stopPropagation(); setHov(true); }}
      onPointerOut={() => setHov(false)}
    >
      {props.children(m)}
    </group>
  );
}

function Ellipsoid({ pos, scale, m }: { pos: [number, number, number]; scale: [number, number, number]; m: MatProps }) {
  return (
    <mesh position={pos} scale={scale}>
      <sphereGeometry args={[1, 40, 32]} />
      <meshStandardMaterial {...m} />
    </mesh>
  );
}

function Body({ selected, onSelect, layers }: Pick<Props, "selected" | "onSelect" | "layers">) {
  const p = { selected, onSelect, layers };
  const arm = (sx: 1 | -1) => (m: MatProps) => (
    <>
      <mesh position={[sx * 1.4, 0.55, 0]} rotation={[0, 0, sx * 0.08]}>
        <capsuleGeometry args={[0.3, 0.9, 8, 20]} />
        <meshStandardMaterial {...m} />
      </mesh>
      <mesh position={[sx * 1.55, -0.55, 0.05]} rotation={[0, 0, sx * 0.05]}>
        <capsuleGeometry args={[0.24, 0.9, 8, 20]} />
        <meshStandardMaterial {...m} />
      </mesh>
    </>
  );
  return (
    <group position={[0, 0, 0]}>
      <Part id="head" {...p} base="#c9a79a">
        {(m) => <Ellipsoid pos={[0, 2.25, 0]} scale={[0.4, 0.48, 0.42]} m={m} />}
      </Part>
      <Part id="neck" {...p}>
        {(m) => (
          <>
            <mesh position={[0, 1.78, 0]}>
              <cylinderGeometry args={[0.22, 0.3, 0.5, 24]} />
              <meshStandardMaterial {...m} />
            </mesh>
            <Ellipsoid pos={[0.4, 1.5, -0.05]} scale={[0.5, 0.25, 0.3]} m={m} />
            <Ellipsoid pos={[-0.4, 1.5, -0.05]} scale={[0.5, 0.25, 0.3]} m={m} />
          </>
        )}
      </Part>
      <Part id="chest" {...p}>
        {(m) => (
          <>
            <Ellipsoid pos={[0, 0.85, 0]} scale={[1.0, 0.8, 0.55]} m={m} />
            <Ellipsoid pos={[0.42, 0.95, 0.4]} scale={[0.6, 0.4, 0.35]} m={m} />
            <Ellipsoid pos={[-0.42, 0.95, 0.4]} scale={[0.6, 0.4, 0.35]} m={m} />
          </>
        )}
      </Part>
      <Part id="abdomen" {...p}>
        {(m) => (
          <>
            <Ellipsoid pos={[0, -0.2, 0]} scale={[0.8, 0.9, 0.5]} m={m} />
            {[0.3, -0.05, -0.4].flatMap((y) => [-0.2, 0.2].map((x) => (
              <mesh key={`${x}${y}`} position={[x, y, 0.42]}>
                <boxGeometry args={[0.3, 0.26, 0.12]} />
                <meshStandardMaterial {...m} />
              </mesh>
            )))}
          </>
        )}
      </Part>
      <Part id="leftShoulder" {...p}>
        {(m) => <Ellipsoid pos={[1.05, 1.3, 0]} scale={[0.45, 0.42, 0.42]} m={m} />}
      </Part>
      <Part id="rightShoulder" {...p}>
        {(m) => <Ellipsoid pos={[-1.05, 1.3, 0]} scale={[0.45, 0.42, 0.42]} m={m} />}
      </Part>
      <Part id="leftArm" {...p}>{arm(1)}</Part>
      <Part id="rightArm" {...p}>{arm(-1)}</Part>
    </group>
  );
}

function Marker({ selected, showLabels }: { selected: RegionId | null; showLabels: boolean }) {
  const ring = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ring.current) ring.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 3) * 0.08);
  });
  if (!selected) return null;
  const r = REGIONS[selected];
  const pos: [number, number, number] = [r.target[0], r.target[1], r.target[2] + 0.5];
  return (
    <>
      <pointLight position={pos} color="#ff4a3a" intensity={2} distance={2.5} />
      <Billboard position={pos}>
        <mesh ref={ring}>
          <ringGeometry args={[0.28, 0.31, 48]} />
          <meshBasicMaterial color="#ff5268" transparent opacity={0.9} />
        </mesh>
      </Billboard>
      {showLabels && (
        <Html position={[pos[0], pos[1] + 0.5, pos[2]]} center>
          <div className="lbl">{r.label}</div>
        </Html>
      )}
    </>
  );
}

function Scan({ selected, active }: { selected: RegionId | null; active: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.visible = active && !!selected;
    if (active && selected) {
      const y = REGIONS[selected].target[1];
      ref.current.position.y = y - 0.6 + ((clock.elapsedTime * 0.9) % 1) * 1.2;
    }
  });
  return (
    <mesh ref={ref} position={[0, 0, 0.1]} visible={false}>
      <boxGeometry args={[3.8, 0.02, 1.6]} />
      <meshBasicMaterial color="#00d9ff" transparent opacity={0.55} />
    </mesh>
  );
}

function Rig({ selected, cmd, autoRotate, panMode }: Pick<Props, "selected" | "cmd" | "autoRotate" | "panMode">) {
  const controls = useRef<any>(null);
  const { camera } = useThree();
  const goal = useRef(new THREE.Vector3(0, 0.6, 0));
  const home = useMemo(() => new THREE.Vector3(0, 0.7, 6.2), []);
  const movingTarget = useRef(false);
  const returning = useRef(false);

  useEffect(() => {
    goal.current.set(...(selected ? REGIONS[selected].target : ([0, 0.6, 0] as [number, number, number])));
    movingTarget.current = true;
  }, [selected]);

  useFrame(() => {
    const c = controls.current;
    if (!c) return;
    if (movingTarget.current) {
      c.target.lerp(goal.current, 0.08);
      if (c.target.distanceTo(goal.current) < 0.01) movingTarget.current = false;
    }
    const z = cmd.current.zoom;
    if (z !== 0) {
      const off = camera.position.clone().sub(c.target);
      off.multiplyScalar(z > 0 ? Math.pow(0.8, z) : Math.pow(1.25, -z));
      camera.position.copy(c.target).add(off);
      cmd.current.zoom = 0;
    }
    if (cmd.current.reset) {
      cmd.current.reset = false;
      returning.current = true;
      goal.current.set(0, 0.6, 0);
      movingTarget.current = true;
    }
    if (returning.current) {
      camera.position.lerp(home, 0.08);
      if (camera.position.distanceTo(home) < 0.02) returning.current = false;
    }
  });

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      minDistance={2.5}
      maxDistance={9}
      autoRotate={autoRotate}
      autoRotateSpeed={1.4}
      mouseButtons={{
        LEFT: panMode ? THREE.MOUSE.PAN : THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN,
      }}
      touches={{
        ONE: panMode ? THREE.TOUCH.PAN : THREE.TOUCH.ROTATE,
        TWO: THREE.TOUCH.DOLLY_PAN,
      }}
    />
  );
}

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch { return false; }
}

export default function Body3D(props: Props) {
  const ok = useMemo(hasWebGL, []);
  if (!ok) {
    return (
      <div className="fallback">
        <h3>WebGL supported নয়</h3>
        <p>এই ডিভাইস/ব্রাউজারে 3D viewer চালানো যাচ্ছে না। অন্য ব্রাউজারে চেষ্টা করো।</p>
      </div>
    );
  }
  return (
    <Canvas dpr={[1, 2]} camera={{ position: [0, 0.7, 6.2], fov: 42 }} onPointerMissed={() => {}}>
      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 5, 5]} intensity={1.4} />
      <pointLight position={[-4, 2, -4]} color="#00d9ff" intensity={30} />
      <pointLight position={[4, 1, -3]} color="#0866ff" intensity={25} />
      <Body selected={props.selected} onSelect={props.onSelect} layers={props.layers} />
      <Marker selected={props.selected} showLabels={props.showLabels} />
      <Scan selected={props.selected} active={props.scanning} />
      <Rig selected={props.selected} cmd={props.cmd} autoRotate={props.autoRotate} panMode={props.panMode} />
    </Canvas>
  );
                                       }
