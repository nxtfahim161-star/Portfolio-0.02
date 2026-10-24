import { useEffect, useRef, useState, type MutableRefObject } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { REGIONS, type RegionId } from "./data";
import type { Cmd } from "./Body3D";

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

type ViewId = "front" | "back" | "top" | "bottom";
type Spots = Partial<Record<RegionId, [number, number]>>;

const VIEWS: { id: ViewId; label: string; src: string }[] = [
  { id: "front", label: "সামনে", src: "./views/front.jpg" },
  { id: "back", label: "পিছনে", src: "./views/back.jpg" },
  { id: "top", label: "উপর", src: "./views/top.jpg" },
  { id: "bottom", label: "নিচ", src: "./views/bottom.jpg" },
];

// প্রতিটা ছবিতে অংশের অবস্থান (% এ: x, y)
const SPOTS: Record<ViewId, Spots> = {
  front: {
    head: [50, 9], neck: [50, 19], chest: [50, 30], abdomen: [50, 50],
    leftShoulder: [73, 25], rightShoulder: [27, 25],
    leftArm: [83, 45], rightArm: [17, 45],
  },
  back: {
    head: [50, 9], neck: [50, 19], chest: [50, 32], abdomen: [50, 52],
    leftShoulder: [26, 25], rightShoulder: [74, 25],
    leftArm: [16, 45], rightArm: [84, 45],
  },
  top: { head: [50, 24], neck: [50, 40] },
  bottom: {},
};

const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n));

export default function ImageViewer(props: Props) {
  const { selected, onSelect, autoRotate, panMode, layers, showLabels, scanning, cmd } = props;
  const [idx, setIdx] = useState(0);
  const [scale, setScale] = useState(1);
  const [off, setOff] = useState({ x: 0, y: 0 });
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const moved = useRef(false);

  const view = VIEWS[idx];
  const spots = SPOTS[view.id];

  // Zoom / Reset বাটনের কমান্ড
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const c = cmd.current;
      if (c.zoom !== 0) {
        const z = c.zoom;
        c.zoom = 0;
        setScale((s) => clamp(s * Math.pow(1.25, z), 1, 3));
      }
      if (c.reset) {
        c.reset = false;
        setScale(1);
        setOff({ x: 0, y: 0 });
        setIdx(0);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [cmd]);

  // Rotate বাটন: নিজে নিজে এক এক করে দিক বদলাবে
  useEffect(() => {
    if (!autoRotate) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % VIEWS.length), 2500);
    return () => clearInterval(t);
  }, [autoRotate]);

  // অংশ সিলেক্ট করলে যে দিকে সেটা দেখা যায় সেদিকে চলে যাবে
  useEffect(() => {
    if (!selected) return;
    if (SPOTS[VIEWS[idx].id][selected]) return;
    const i = VIEWS.findIndex((v) => SPOTS[v.id][selected]);
    if (i >= 0) setIdx(i);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  const go = (d: number) => setIdx((i) => (i + d + VIEWS.length) % VIEWS.length);

  const down = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, ox: off.x, oy: off.y };
    moved.current = false;
  };
  const move = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (Math.abs(dx) + Math.abs(dy) > 4) moved.current = true;
    if (panMode || scale > 1) setOff({ x: d.ox + dx, y: d.oy + dy });
  };
  const up = (e: React.PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!panMode && scale === 1 && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      go(dx < 0 ? 1 : -1);
    }
  };
  const wheel = (e: React.WheelEvent) => {
    setScale((s) => clamp(s * (e.deltaY < 0 ? 1.1 : 0.9), 1, 3));
  };

  const hiddenNote = selected && !spots[selected] && view.id !== "bottom";

  return (
    <div
      style={{ position: "absolute", inset: 0, containerType: "size", touchAction: "none", userSelect: "none" }}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={() => (drag.current = null)}
      onWheel={wheel}
    >
      <div
        style={{
          position: "absolute", left: "50%", top: "50%",
          width: "min(100cqw, 100cqh)", height: "min(100cqw, 100cqh)",
          transform: `translate(-50%, -50%) translate(${off.x}px, ${off.y}px) scale(${scale})`,
          transition: drag.current ? "none" : "transform .25s ease",
          filter: layers ? "saturate(.35) contrast(1.15) brightness(1.1)" : "none",
        }}
      >
        <AnimatePresence>
          <motion.img
            key={view.id}
            src={view.src}
            alt={`শরীরের ${view.label} দিকের ছবি`}
            draggable={false}
            onError={() => setFailed((f) => ({ ...f, [view.id]: true }))}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }}
          />
        </AnimatePresence>

        {scanning && selected && spots[selected] && (
          <motion.div
            key={`scan-${view.id}`}
            initial={{ top: "5%" }}
            animate={{ top: "95%" }}
            transition={{ duration: 1.4, ease: "linear" }}
            style={{
              position: "absolute", left: "10%", right: "10%", height: 2, pointerEvents: "none",
              background: "var(--cyan)", boxShadow: "0 0 14px 3px rgba(0,217,255,.6)",
            }}
          />
        )}

        {(Object.entries(spots) as [RegionId, [number, number]][]).map(([id, [x, y]]) => {
          const on = selected === id;
          return (
            <button
              key={`${view.id}-${id}`}
              aria-label={REGIONS[id].label}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => onSelect(id)}
              style={{
                position: "absolute", left: `${x}%`, top: `${y}%`,
                width: on ? 30 : 20, height: on ? 30 : 20, transform: "translate(-50%, -50%)",
                borderRadius: "50%", transition: ".2s",
                border: `2px solid ${on ? "#ff5268" : "rgba(0,217,255,.8)"}`,
                background: on ? "rgba(255,82,104,.25)" : "rgba(0,217,255,.12)",
                boxShadow: on ? "0 0 16px rgba(255,82,104,.8)" : "none",
              }}
            >
              {on && showLabels && (
                <span className="lbl" style={{ position: "absolute", left: "50%", bottom: "130%", transform: "translateX(-50%)" }}>
                  {REGIONS[id].label}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {failed[view.id] && (
        <div className="fallback" style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
          <div>
            <h3>ছবি পাওয়া যায়নি</h3>
            <p>public/views/{view.id}.jpg নামে ছবিটা আপলোড করো।</p>
          </div>
        </div>
      )}

      {hiddenNote && (
        <div className="demo" style={{ position: "absolute", top: 60, right: 70, fontSize: 12 }}>
          এই দিক থেকে অংশটা দেখা যায় না
        </div>
      )}

      <div
        role="group"
        aria-label="দিক বদলান"
        onPointerDown={(e) => e.stopPropagation()}
        style={{
          position: "absolute", left: "50%", bottom: 64, transform: "translateX(-50%)",
          display: "flex", gap: 4, padding: 4, borderRadius: 999,
          background: "rgba(8,15,29,.85)", border: "1px solid var(--border)",
        }}
      >
        {VIEWS.map((v, i) => (
          <button
            key={v.id}
            onClick={() => setIdx(i)}
            aria-pressed={i === idx}
            style={{
              padding: "5px 12px", borderRadius: 999, fontSize: 12, transition: ".2s",
              background: i === idx ? "var(--blue)" : "transparent",
              color: i === idx ? "#fff" : "var(--text2)",
            }}
          >
            {v.label}
          </button>
        ))}
      </div>
    </div>
  );
                   }
