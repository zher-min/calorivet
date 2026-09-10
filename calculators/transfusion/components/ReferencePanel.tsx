import { references } from "../references";
import { EVIDENCE, TECHNICAL } from "../clinicalConstants";
function evidenceRows(node: unknown, path = ""): { path: string; value: number | readonly number[]; unit: string; sourceId: keyof typeof references; note: string }[] {
  if (!node || typeof node !== "object") return [];
  if ("value" in node && "sourceId" in node) return [{ path, ...node } as ReturnType<typeof evidenceRows>[number]];
  return Object.entries(node).flatMap(([key, value]) => evidenceRows(value, path ? `${path}.${key}` : key));
}
export default function ReferencePanel() {
  return <details id="tx-references"><summary>Sources, numerical constants and interpretations</summary>
    <p>Clinical specification version: September 2026. Defaults are implementation assumptions where indicated; source profiles are not universal eligibility criteria.</p>
    <ol className="tx-references">{Object.entries(references).map(([id, source]) => <li key={id} id={`source-${id}`}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a><p>{source.organization} · {source.year ?? "Undated / active policy"} · {source.sourceType}</p><p>{source.supports}</p>{"doi" in source && <small>DOI: {source.doi}</small>}</li>)}</ol>
    <details><summary>Audit numerical constants</summary><dl className="tx-evidence">{evidenceRows(EVIDENCE).map(item => <div key={item.path}><dt>{item.path}</dt><dd>{Array.isArray(item.value) ? item.value.join("–") : item.value} {item.unit} · <a href={references[item.sourceId].url} target="_blank" rel="noreferrer">{references[item.sourceId].organization}</a>{item.note && <p>{item.note}</p>}</dd></div>)}</dl></details>
    <p>Technical validation: EBV overrides {TECHNICAL.ebvMin}–{TECHNICAL.ebvMax} mL/kg; PCV 0–{TECHNICAL.pcvMax}%; weights above {TECHNICAL.weightReviewKg} kg prompt review without a cap. These are input safeguards, not guideline ranges.</p>
    <p>Crossmatch timing uses conservative inclusive boundaries (≥{EVIDENCE.crossmatchDays.dog.value} days in dogs, ≥{EVIDENCE.crossmatchDays.cat.value} in cats). The Merck transfusion text uses “&gt;”. Massive-transfusion alerts use strict “&gt;”. Feline collection values refer to blood alone; final anticoagulated volume is shown separately. Product-specific instructions take precedence.</p>
  </details>;
}
