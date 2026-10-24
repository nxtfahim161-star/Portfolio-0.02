import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Billboard, Html } from "@react-three/drei";
import * as THREE from "three";
import { REGIONS, type RegionId } from "./data";
import BodyMesh from "./BodyMesh";

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

const NO_RAY = () => {};

function Floor() {
  return (
    <group position={[0, -1.3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh raycast={NO_RAY}>
        <ringGeometry args={[1.5, 1.56, 96]} />
        <meshBasicMaterial color="#00d9ff" transparent opacity={0.7} side={THREE.DoubleSide} />
      </mesh>
      <mesh raycast={NO_RAY}>
        <ringGeometry args={[1.9, 1.93, 96]} />
        <meshBasicMaterial color="#0866ff" transparent opacity={0.35} side={THREE.DoubleSide} />
      </mesh>
      <mesh raycast={NO_RAY}>
        <circleGeometry args={[1.5, 64]} />
        <meshBasicMaterial color="#0866ff" transparent opacity={0.12} />
      </mesh>
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
        <mesh ref={ring} raycast={NO_RAY}>
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
    <mesh ref={ref} position={[0, 0, 0.1]} visible={false} raycast={NO_RAY}>
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
    <Canvas dpr={[1, 2]} camera={{ position: [0, 0.7, 6.2], fov: 42 }} gl={{ antialias: true }} onPointerMissed={() => {}}>
      <hemisphereLight args={["#9fb8ff", "#2a0e10", 0.7]} />
      <ambientLight intensity={0.25} />
      <directionalLight position={[3, 5, 5]} intensity={1.7} color="#fff1e6" />
      <directionalLight position={[-5, 2, 3]} intensity={0.55} color="#8fb4ff" />
      <pointLight position={[-4, 2, -4]} color="#00d9ff" intensity={30} />
      <pointLight position={[4, 1, -3]} color="#0866ff" intensity={25} />
      <BodyMesh selected={props.selected} onSelect={props.onSelect} layers={props.layers} />
      <Floor />
      <Marker selected={props.selected} showLabels={props.showLabels} />
      <Scan selected={props.selected} active={props.scanning} />
      <Rig selected={props.selected} cmd={props.cmd} autoRotate={props.autoRotate} panMode={props.panMode} />
    </Canvas>
  );
                                 }
