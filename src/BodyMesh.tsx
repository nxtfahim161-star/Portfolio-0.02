import { Part, M, Core, Tendon, Vein, type V3, type Mat } from "./anatomyKit";
import type { RegionId } from "./data";

const SIDES = [1, -1] as const;
const mir = (a: V3[]): V3[] => a.map(([x, y, z]) => [-x, y, z] as V3);

const VEIN_ARM: V3[] = [
  [1.12, 1.15, 0.32], [1.22, 0.85, 0.3], [1.3, 0.45, 0.3],
  [1.36, 0.05, 0.24], [1.45, -0.4, 0.2], [1.52, -0.9, 0.15],
];
const VEIN_ARM_R = mir(VEIN_ARM);
const VEIN_NECK: V3[] = [[0.17, 2.05, 0.22], [0.2, 1.85, 0.22], [0.32, 1.62, 0.16]];
const VEIN_NECK_R = mir(VEIN_NECK);

const shoulder = (sx: 1 | -1) => (m: Mat) => (
  <>
    <M m={m} p={[sx * 1.15, 1.15, 0.02]} s={[0.3, 0.4, 0.34]} r={[0, 0, sx * 0.45]} />
    <M m={m} p={[sx * 1.12, 1.15, -0.18]} s={[0.24, 0.36, 0.2]} r={[0, 0, sx * 0.45]} />
  </>
);

const arm = (sx: 1 | -1) => (m: Mat) => (
  <>
    <M m={m} p={[sx * 1.28, 0.62, 0.13]} s={[0.18, 0.4, 0.17]} r={[0, 0, sx * 0.27]} />
    <M m={m} p={[sx * 1.32, 0.58, -0.1]} s={[0.19, 0.5, 0.17]} r={[0, 0, sx * 0.27]} />
    <M m={m} p={[sx * 1.5, -0.35, 0.08]} s={[0.15, 0.5, 0.14]} r={[0, 0, sx * 0.11]} />
    <M m={m} p={[sx * 1.52, -0.55, -0.02]} s={[0.16, 0.5, 0.15]} r={[0, 0, sx * 0.11]} />
  </>
);

interface Props {
  selected: RegionId | null;
  onSelect: (id: RegionId) => void;
  layers: boolean;
}

export default function BodyMesh({ selected, onSelect, layers }: Props) {
  const p = { selected, onSelect, layers };
  return (
    <group>
      {/* ভিতরের গাঢ় কাঠামো */}
      <Core p={[0, 0.3, 0]} s={[0.9, 1.35, 0.42]} />
      <Core p={[0, -0.95, 0]} s={[0.78, 0.3, 0.4]} />

      {/* মাথা */}
      <Part id="head" {...p} fiber={false} tint="#d4b3a5">
        {(m) => (
          <>
            <M m={m} p={[0, 2.3, 0]} s={[0.38, 0.46, 0.4]} />
            <M m={m} p={[0, 2.07, 0.08]} s={[0.27, 0.2, 0.28]} />
            <M m={m} p={[0, 2.22, 0.4]} s={[0.06, 0.1, 0.07]} />
            {SIDES.map((sx) => (
              <M key={sx} m={m} p={[sx * 0.38, 2.28, 0]} s={[0.05, 0.11, 0.08]} />
            ))}
          </>
        )}
      </Part>
      {SIDES.map((sx) => (
        <Core key={sx} p={[sx * 0.14, 2.32, 0.34]} s={[0.07, 0.035, 0.05]} color="#2a1a1a" />
      ))}

      {/* গলা ও ট্র্যাপিজিয়াস */}
      <Part id="neck" {...p}>
        {(m) => (
          <>
            <M m={m} p={[0, 1.8, 0]} s={[0.24, 0.4, 0.24]} />
            {SIDES.map((sx) => (
              <group key={sx}>
                <M m={m} p={[sx * 0.13, 1.76, 0.14]} s={[0.06, 0.32, 0.07]} r={[0, 0, -sx * 0.3]} />
                <M m={m} p={[sx * 0.55, 1.45, -0.02]} s={[0.17, 0.55, 0.22]} r={[0, 0, sx * 0.93]} />
              </group>
            ))}
          </>
        )}
      </Part>

      {/* বুক ও উপরের পিঠ */}
      <Part id="chest" {...p}>
        {(m) => (
          <>
            {SIDES.map((sx) => (
              <group key={sx}>
                <M m={m} p={[sx * 0.44, 0.98, 0.36]} s={[0.27, 0.42, 0.2]} r={[0, 0, -sx * 1.27]} />
                {[0.5, 0.33, 0.16].map((y) => (
                  <M key={y} m={m} p={[sx * 0.8, y, 0.17]} s={[0.09, 0.07, 0.1]} r={[0, 0, -sx * 0.2]} />
                ))}
                <M m={m} p={[sx * 0.6, 0.55, -0.27]} s={[0.26, 0.6, 0.14]} r={[0, 0, -sx * 0.35]} />
                <M m={m} p={[sx * 0.74, 1.0, -0.33]} s={[0.18, 0.26, 0.1]} r={[0, 0, -sx * 1.1]} />
              </group>
            ))}
            <M m={m} p={[0, 1.15, -0.22]} s={[0.55, 0.5, 0.14]} />
          </>
        )}
      </Part>

      {/* পেট ও কোমরের পিঠ */}
      <Part id="abdomen" {...p}>
        {(m) => (
          <>
            {[0.45, 0.15, -0.15, -0.45].flatMap((y) =>
              SIDES.map((sx) => (
                <M key={`${sx}${y}`} m={m} p={[sx * 0.17, y, 0.4]} s={[0.15, 0.13, 0.1]} />
              ))
            )}
            {SIDES.map((sx) => (
              <group key={sx}>
                <M m={m} p={[sx * 0.7, 0, 0.14]} s={[0.18, 0.5, 0.2]} r={[0, 0, -sx * 0.12]} />
                <M m={m} p={[sx * 0.15, -0.2, -0.37]} s={[0.12, 0.7, 0.1]} />
              </group>
            ))}
          </>
        )}
      </Part>

      <Part id="leftShoulder" {...p}>{shoulder(1)}</Part>
      <Part id="rightShoulder" {...p}>{shoulder(-1)}</Part>
      <Part id="leftArm" {...p}>{arm(1)}</Part>
      <Part id="rightArm" {...p}>{arm(-1)}</Part>

      {/* সাদা টেন্ডন লাইন */}
      <Tendon p={[0, 0.98, 0.52]} s={[0.04, 0.46, 0.04]} />
      <Tendon p={[0, 0, 0.5]} s={[0.012, 0.62, 0.05]} />
      {[0.3, 0, -0.3].map((y) => (
        <Tendon key={y} p={[0, y, 0.49]} s={[0.34, 0.012, 0.05]} />
      ))}
      <Tendon p={[0, 0.45, -0.42]} s={[0.03, 1.0, 0.05]} />
      {SIDES.map((sx) => (
        <Tendon key={sx} p={[sx * 0.38, 1.4, 0.27]} s={[0.36, 0.028, 0.04]} r={[0, 0, sx * 0.1]} />
      ))}

      {/* শিরা */}
      <Vein pts={VEIN_ARM} />
      <Vein pts={VEIN_ARM_R} />
      <Vein pts={VEIN_NECK} r={0.015} />
      <Vein pts={VEIN_NECK_R} r={0.015} />
    </group>
  );
  }
