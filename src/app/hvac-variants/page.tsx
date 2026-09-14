"use client";

import { useSyncExternalStore, useState } from "react";
import s from "./variants.module.css";

const query = "(min-width: 1100px)";
function subscribe(callback: () => void) {
  const media = window.matchMedia(query);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}
const variants = [
  { key: "system", label: "A / System diagnosis", title: "Repair the customer path.",
    hypothesis: "Hypothesis: explaining the connected customer path will help established HVAC owners recognize a foundation problem and request a qualified review. A deeper, education-led page." },
  { key: "snapshot", label: "B / Proof-first Snapshot", title: "Show the deliverable first.",
    hypothesis: "Hypothesis: a tangible sample and a shorter route to the request will reduce uncertainty and increase qualified Snapshot requests. A direct-response page." },
] as const;
export default function ComparisonPage() {
  const wide = useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => false);
  const [selected, setSelected] = useState<"both" | "system" | "snapshot">("both");
  const mode = !wide && selected === "both" ? "system" : selected;
  return <main className={s.lab}><div className={s.labHeader}><span className={s.labEyebrow}>Booked Out / HVAC concept lab</span><h1>One offer. Two ways in.</h1><p>Compare a system-diagnosis argument with a proof-first Snapshot invitation. Both use the same approved offer and request form. These are preview concepts, not measured winners.</p><div className={s.labControls} aria-label="Comparison view">{([['both', 'Side by side'], ['system', 'A only'], ['snapshot', 'B only']] as const).map(([key,label]) => <button key={key} type="button" aria-pressed={mode === key} disabled={key === "both" && !wide} onClick={() => setSelected(key)}>{label}</button>)}</div><p className={s.labNote}>{wide ? "Each pane responds to its own width. Open the full page to judge desktop composition." : "Single-variant view keeps mobile layouts readable. Use A only or B only to switch."} Forms are live request forms. Do not submit test leads.</p><p className={s.labNote}>Evaluate: qualified Snapshot requests per visitor, with fit rate and completed review rate as guardrails. This lab does not randomize traffic or declare a winner.</p></div><div className={s.labPanels} data-mode={mode}>{variants.map(variant => <section key={variant.key} className={s.labPanel} hidden={mode !== "both" && mode !== variant.key} aria-label={variant.label}><div className={s.panelHeader}><span className={s.labPanelLabel}>{variant.label}</span><h2>{variant.title}</h2><p>{variant.hypothesis}</p><a href={`/hvac-variants/${variant.key}`} target="_blank" rel="noopener noreferrer">Open full page <span aria-hidden="true"> ↗</span><span className="sr-only"> (new tab)</span></a></div><iframe title={`Variant ${variant.label}`} src={`/hvac-variants/${variant.key}`} loading="lazy" /></section>)}</div></main>;
}
