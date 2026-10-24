import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard, Users, FileText, Bot, Settings, Search, Bell, Rotate3d, ZoomIn, ZoomOut,
  Move, RotateCcw, Maximize2, Eye, EyeOff, Layers, X, ArrowRight, Download, Printer,
} from "lucide-react";
import { REGIONS, PATIENT, APPOINTMENTS, LABS, type RegionId } from "./data";
import type { Cmd } from "./Body3D";

const Body3D = lazy(() => import("./ImageViewer"));

function CountUp({ to, dec = 0 }: { to: number; dec?: number }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { setV(to); return; }
    let raf = 0; const t0 = performance.now();
    const tick = (t: number) => {
      const k = Math.min((t - t0) / 900, 1);
      setV(to * (1 - Math.pow(1 - k, 3)));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to]);
  return <>{v.toLocaleString(undefined, { minimumFractionDigits: dec, maximumFractionDigits: dec })}</>;
}

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "patients", label: "Patients", icon: Users },
  { id: "reports", label: "Reports", icon: FileText },
  { id: "ai", label: "AI Assistant", icon: Bot },
  { id: "settings", label: "Settings", icon: Settings },
];
const TOP = ["Overview", "Imaging", "Labs", "Heart", "Brain", "Lungs", "Digestive"];
const TOP_REGION: Record<string, RegionId> = { Heart: "chest", Lungs: "chest", Brain: "head", Digestive: "abdomen" };
const STAGE = {
  Intake: "Intake: patient-reported information",
  Assessment: "Assessment: demo findings",
  Diagnosis: "Diagnosis: requires clinician review",
} as const;

export default function App() {
  const [intro, setIntro] = useState(() => !sessionStorage.getItem("medex-intro"));
  const [nav, setNav] = useState("dashboard");
  const [top, setTop] = useState("Overview");
  const [selected, setSelected] = useState<RegionId | null>("leftShoulder");
  const [scanning, setScanning] = useState(true);
  const [autoRotate, setAutoRotate] = useState(false);
  const [panMode, setPanMode] = useState(false);
  const [layers, setLayers] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [stage, setStage] = useState<keyof typeof STAGE>("Assessment");
  const [rtab, setRtab] = useState<"diagnosis" | "ai">("diagnosis");
  const [appt, setAppt] = useState(1);
  const [thumb, setThumb] = useState(0);
  const [modal, setModal] = useState(false);
  const [toast, setToast] = useState("");
  const cmd = useRef<Cmd>({ zoom: 0, reset: false });
  const viewerRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!intro) return;
    const t = setTimeout(() => { setIntro(false); sessionStorage.setItem("medex-intro", "1"); }, 1200);
    return () => clearTimeout(t);
  }, [intro]);

  useEffect(() => {
    if (!scanning) return;
    const t = setTimeout(() => setScanning(false), 1600);
    return () => clearTimeout(t);
  }, [scanning, selected]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!modal) return;
    lastFocus.current = document.activeElement as HTMLElement;
    modalRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModal(false);
      if (e.key === "Tab" && modalRef.current) {
        const f = modalRef.current.querySelectorAll<HTMLElement>("button");
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); lastFocus.current?.focus(); };
  }, [modal]);

  const select = (id: RegionId) => { setSelected(id); setScanning(true); setRtab("diagnosis"); };
  const region = selected ? REGIONS[selected] : null;

  const onTop = (t: string) => {
    setTop(t);
    if (TOP_REGION[t]) select(TOP_REGION[t]);
    if (t === "Imaging") document.getElementById("imaging")?.scrollIntoView({ behavior: "smooth", block: "center" });
    if (t === "Labs") document.getElementById("labs")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const fullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else viewerRef.current?.requestFullscreen?.();
  };
  const reset = () => { cmd.current.reset = true; setSelected(null); setAutoRotate(false); };

  const reportText = () => region
    ? `MedEx — DEMO REPORT (synthetic data, not a medical diagnosis)\n\nPatient: ${PATIENT.name}, ${PATIENT.age}y, ${PATIENT.sex}\nRegion: ${region.label}\nSeverity: ${region.severity}\nNote: ${region.finding}\nComplaint: ${region.complaint}\nHistory: ${region.history}\n`
    : "";
  const download = () => {
    const url = URL.createObjectURL(new Blob([reportText()], { type: "text/plain" }));
    const a = document.createElement("a");
    a.href = url; a.download = "medex-demo-report.txt"; a.click();
    URL.revokeObjectURL(url);
    setToast("Report downloaded");
  };

  return (
    <>
      <AnimatePresence>
        {intro && (
          <motion.div className="intro" exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
            <motion.div className="logo" initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }}>✱</motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="app">
        <motion.header className="topbar glass" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="brand"><i>✱</i><span>MedEx</span></div>
          <nav className="toptabs" aria-label="Sections">
            {TOP.map((t) => (
              <button key={t} className={top === t ? "on" : ""} onClick={() => onTop(t)}>{t}</button>
            ))}
          </nav>
          <label className="search"><Search size={15} /><input placeholder="Search patient, report…" aria-label="Search" /></label>
          <button className="iconbtn" aria-label="Notifications" onClick={() => setToast("No new notifications (demo)")}>
            <Bell size={18} /><span className="badge" />
          </button>
          <div className="avatar" aria-label="Profile">DR</div>
        </motion.header>

        <div className="main">
          <motion.aside className="sidebar glass" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            {NAV.map(({ id, label, icon: I }) => (
              <button key={id} className={nav === id ? "on" : ""} onClick={() => setNav(id)} aria-label={label}>
                <I size={18} /><span>{label}</span>
              </button>
            ))}
            <div className="promo">
              <div className="orb"><Bot size={22} color="#00d9ff" /></div>
              <b>AI-Powered Medical Insights</b>Demo mode
            </div>
          </motion.aside>

          {nav !== "dashboard" ? (
            <div className="glass ph-view" style={{ gridColumn: "2 / -1" }}>
              <h2>{NAV.find((n) => n.id === nav)?.label}</h2>
              <p style={{ marginTop: 8 }}>এই পেজটি পরের ধাপে বানানো হবে।</p>
              <button className="cta" style={{ margin: "18px auto 0", padding: "10px 22px" }} onClick={() => setNav("dashboard")}>
                Back to Dashboard
              </button>
            </div>
          ) : (
            <>
              <motion.div className="col" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                <section className="glass card">
                  <h3>Patient <span className="demo">synthetic</span></h3>
                  <div className="pat">
                    <div className="ph">RG</div>
                    <div><b>{PATIENT.name}</b><br /><small>{PATIENT.sex}</small></div>
                  </div>
                  <div className="grid2">
                    <div className="stat">Age<b>{PATIENT.age} years</b></div>
                    <div className="stat">Weight<b>{PATIENT.weight} kg</b></div>
                    <div className="stat">Height<b>{PATIENT.height} cm</b></div>
                    <div className="stat">Blood<b>{PATIENT.blood}</b></div>
                  </div>
                </section>
                <section className="glass card">
                  <h3>Appointments</h3>
                  {APPOINTMENTS.map((a) => (
                    <button key={a.id} className={`appt ${appt === a.id ? "on" : ""}`} onClick={() => setAppt(a.id)}>
                      {a.date}<small>{a.title}</small>
                    </button>
                  ))}
                </section>
                <section className="glass card" id="labs">
                  <h3>Latest blood test</h3>
                  <div className="grid2">
                    {LABS.map((l) => (
                      <div key={l.key} className="lab">
                        <em>{l.key}</em><b><CountUp to={l.value} dec={l.dec} /></b> {l.unit}
                        <div>{l.note}</div>
                      </div>
                    ))}
                  </div>
                </section>
              </motion.div>

              <motion.section ref={viewerRef} className="glass viewer" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.25 }}>
                <div className="vtabs" role="tablist">
                  {(Object.keys(STAGE) as (keyof typeof STAGE)[]).map((s) => (
                    <button key={s} role="tab" aria-selected={stage === s} className={stage === s ? "on" : ""} onClick={() => setStage(s)}>{s}</button>
                  ))}
                </div>

                <div className="canvaswrap">
                  <Suspense fallback={<div className="skeleton" />}>
                    <Body3D
                      selected={selected} onSelect={select} autoRotate={autoRotate} panMode={panMode}
                      layers={layers} showLabels={showLabels} scanning={scanning} cmd={cmd}
                    />
                  </Suspense>
                </div>

                {region && (
                  <div className="glass injury" aria-live="polite">
                    <div><span className={`dot ${region.status}`} /><b>{region.statusText}</b></div>
                    <div style={{ color: "var(--text2)", marginTop: 4 }}>{region.label} — {region.severity}</div>
                    <div className="demo" style={{ marginTop: 4 }}>{STAGE[stage]}</div>
                    <button onClick={() => setRtab("diagnosis")}>View Details →</button>
                  </div>
                )}

                <div className="sidetools">
                  <button className={showLabels ? "on" : ""} onClick={() => setShowLabels((v) => !v)} aria-label="Toggle labels" title="Labels">
                    {showLabels ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                  <button className={scanning ? "on" : ""} onClick={() => setScanning(true)} aria-label="Run scan animation" title="Scan animation">
                    <Rotate3d size={18} />
                  </button>
                  <button className={layers ? "on" : ""} onClick={() => setLayers((v) => !v)} aria-label="Layer view" title="Layers">
                    <Layers size={18} />
                  </button>
                  <button onClick={fullscreen} aria-label="Fullscreen" title="Fullscreen"><Maximize2 size={18} /></button>
                </div>

                <div className="ctl" role="toolbar" aria-label="Viewer controls">
                  <button className={autoRotate ? "on" : ""} onClick={() => setAutoRotate((v) => !v)}><Rotate3d size={16} /><span>Rotate</span></button>
                  <button onClick={() => (cmd.current.zoom += 1)} aria-label="Zoom in"><ZoomIn size={16} /><span>Zoom</span></button>
                  <button onClick={() => (cmd.current.zoom -= 1)} aria-label="Zoom out"><ZoomOut size={16} /></button>
                  <button className={panMode ? "on" : ""} onClick={() => setPanMode((v) => !v)}><Move size={16} /><span>Pan</span></button>
                  <button onClick={reset}><RotateCcw size={16} /><span>Reset</span></button>
                </div>
              </motion.section>

              <motion.aside className="glass right" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}>
                <div className="rtabs" role="tablist">
                  <button role="tab" aria-selected={rtab === "diagnosis"} className={rtab === "diagnosis" ? "on" : ""} onClick={() => setRtab("diagnosis")}>Diagnosis</button>
                  <button role="tab" aria-selected={rtab === "ai"} className={rtab === "ai" ? "on" : ""} onClick={() => setRtab("ai")}>AI Analysis</button>
                </div>

                {!region ? (
                  <div className="box">শরীরের যেকোনো অংশে ক্লিক করে সেটি সিলেক্ট করো।</div>
                ) : rtab === "ai" ? (
                  <>
                    <h2>{region.label}</h2>
                    <div className="box">
                      <h4>AI backend সংযুক্ত নেই</h4>
                      কোনো AI বিশ্লেষণ চালানো হয়নি, তাই এখানে কোনো ফলাফল দেখানো হচ্ছে না। বাস্তব API যুক্ত করার পর এখানে রেজাল্ট আসবে।
                    </div>
                    <button className="cta" disabled>Run analysis</button>
                  </>
                ) : (
                  <AnimatePresence mode="wait">
                    <motion.div key={region.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      <h2>{region.label}</h2>
                      <div className="box" id="imaging">
                        <h4>Imaging results <span className="demo">(sample)</span></h4>
                        {region.finding}
                        <div className="thumbs">
                          {[0, 1, 2, 3].map((i) => (
                            <button key={i} className={thumb === i ? "on" : ""} onClick={() => setThumb(i)} aria-label={`Image ${i + 1}`} />
                          ))}
                        </div>
                      </div>
                      <div className="box">
                        <h4>Complaint details</h4>
                        <b style={{ color: "var(--text)" }}>Primary complaint:</b> {region.complaint}
                        <br /><b style={{ color: "var(--text)" }}>Prior injuries:</b> {region.history}
                        <div style={{ marginTop: 10 }}>Activity: {region.activity}</div>
                        <div className="bar"><i style={{ width: `${region.activityPct}%` }} /></div>
                        <div>Severity: {region.severity}</div>
                        <div className="bar"><i style={{ width: `${region.severityPct}%` }} /></div>
                      </div>
                      <button className="cta" onClick={() => setModal(true)}>View Full Report <ArrowRight size={16} /></button>
                    </motion.div>
                  </AnimatePresence>
                )}
              </motion.aside>
            </>
          )}
        </div>
      </div>

      <AnimatePresence>
        {modal && region && (
          <motion.div className="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setModal(false)}>
            <motion.div
              ref={modalRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Report"
              className="glass modal" initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <h2>Report — {region.label}</h2>
                <button className="iconbtn" aria-label="Close" onClick={() => setModal(false)}><X size={18} /></button>
              </div>
              <p className="demo">DEMO — synthetic data. This is not a medical diagnosis.</p>
              <pre style={{ whiteSpace: "pre-wrap", marginTop: 14, fontFamily: "inherit", color: "var(--text2)", lineHeight: 1.6 }}>{reportText()}</pre>
              <div className="row">
                <button onClick={download}><Download size={16} />Download</button>
                <button onClick={() => window.print()}><Printer size={16} />Print</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && <motion.div className="toast" role="status" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>{toast}</motion.div>}
      </AnimatePresence>
    </>
  );
            }
