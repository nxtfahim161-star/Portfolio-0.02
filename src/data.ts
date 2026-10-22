export type RegionId =
  | "head" | "neck" | "chest" | "abdomen"
  | "leftShoulder" | "rightShoulder" | "leftArm" | "rightArm";

export interface RegionInfo {
  id: RegionId;
  label: string;
  status: "ok" | "warn" | "alert";
  statusText: string;
  severity: string;
  severityPct: number;
  finding: string;
  complaint: string;
  history: string;
  activity: string;
  activityPct: number;
  target: [number, number, number];
}

export const REGIONS: Record<RegionId, RegionInfo> = {
  leftShoulder: {
    id: "leftShoulder", label: "Left shoulder", status: "warn", statusText: "Sample flag",
    severity: "Moderate", severityPct: 60,
    finding: "Sample note: no fracture or dislocation visible. Soft-tissue strain around the rotator cuff is suggested; clinical evaluation recommended.",
    complaint: "Shoulder pain, limited movement. Started 2 days ago after a fall.",
    history: "Strained right shoulder (2022)", activity: "Regular basketball", activityPct: 70,
    target: [1.05, 1.3, 0],
  },
  rightShoulder: {
    id: "rightShoulder", label: "Right shoulder", status: "ok", statusText: "No flag",
    severity: "Low", severityPct: 15,
    finding: "Sample note: no abnormality in the demo dataset. Prior strain (2022) fully recovered.",
    complaint: "No current complaint.", history: "Strained right shoulder (2022)",
    activity: "Regular basketball", activityPct: 70, target: [-1.05, 1.3, 0],
  },
  chest: {
    id: "chest", label: "Chest", status: "ok", statusText: "No flag",
    severity: "Low", severityPct: 10,
    finding: "Sample note: no chest findings in the demo dataset.",
    complaint: "No current complaint.", history: "No prior chest conditions",
    activity: "Regular basketball", activityPct: 70, target: [0, 0.95, 0.3],
  },
  abdomen: {
    id: "abdomen", label: "Abdomen", status: "ok", statusText: "No flag",
    severity: "Low", severityPct: 8,
    finding: "Sample note: no abdominal findings in the demo dataset.",
    complaint: "No current complaint.", history: "No prior abdominal conditions",
    activity: "Regular basketball", activityPct: 70, target: [0, -0.1, 0.3],
  },
  head: {
    id: "head", label: "Head", status: "ok", statusText: "No flag",
    severity: "Low", severityPct: 5,
    finding: "Sample note: no head findings in the demo dataset.",
    complaint: "No current complaint.", history: "No prior head injuries",
    activity: "Regular basketball", activityPct: 70, target: [0, 2.25, 0],
  },
  neck: {
    id: "neck", label: "Neck", status: "ok", statusText: "No flag",
    severity: "Low", severityPct: 10,
    finding: "Sample note: no neck findings in the demo dataset.",
    complaint: "No current complaint.", history: "No prior neck conditions",
    activity: "Regular basketball", activityPct: 70, target: [0, 1.7, 0],
  },
  leftArm: {
    id: "leftArm", label: "Left arm", status: "warn", statusText: "Sample flag",
    severity: "Mild", severityPct: 30,
    finding: "Sample note: referred discomfort possible from the shoulder region.",
    complaint: "Mild discomfort when lifting.", history: "No prior arm injuries",
    activity: "Regular basketball", activityPct: 70, target: [1.45, 0.1, 0],
  },
  rightArm: {
    id: "rightArm", label: "Right arm", status: "ok", statusText: "No flag",
    severity: "Low", severityPct: 5,
    finding: "Sample note: no abnormality in the demo dataset.",
    complaint: "No current complaint.", history: "No prior arm injuries",
    activity: "Regular basketball", activityPct: 70, target: [-1.45, 0.1, 0],
  },
};

export const PATIENT = {
  name: "Ruben George", sex: "Male", age: 36, weight: 82, height: 182, blood: "O+",
};

export const APPOINTMENTS = [
  { id: 1, date: "Nov 9, 2024", title: "Left shoulder injury" },
  { id: 2, date: "Sep 17, 2024", title: "Routine check" },
  { id: 3, date: "Mar 20, 2024", title: "Routine check" },
];

export const LABS = [
  { key: "CRP", value: 1.8, unit: "mg/L", note: "Slightly elevated", dec: 1 },
  { key: "WBC", value: 8500, unit: "/µL", note: "No infection", dec: 0 },
  { key: "ESR", value: 12, unit: "mm/hr", note: "No issues", dec: 0 },
  { key: "HGB", value: 15.1, unit: "g/dL", note: "Normal", dec: 1 },
];
