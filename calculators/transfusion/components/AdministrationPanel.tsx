import { useState } from "react";
import { massiveTransfusion, planningRate } from "../calculations";
import { EVIDENCE as E } from "../clinicalConstants";
import { overloadWarning } from "../warnings";
import { Field, Check, Notice, Errors, fmt } from "./Controls";
export default function AdministrationPanel({ weight, ebv, override }: { weight: string; ebv: number | null; override: boolean }) {
  const [volume, setVolume] = useState(""), [hours, setHours] = useState(""), [three, setThree] = useState(""), [day, setDay] = useState("");
  const [cardiac, setCardiac] = useState(false), [renal, setRenal] = useState(false), [overload, setOverload] = useState(false);
  const rate = planningRate(volume, hours, weight), massive = massiveTransfusion(weight, ebv ?? "", three, day);
  return <>
    <h3>Transfusion time planner</h3><p>Enter the clinician-selected total volume independently. Recipient weight: {weight || "not entered"} kg.</p>
    <div className="tx-grid"><Field label="Total planned transfusion volume" value={volume} onChange={setVolume} unit="mL" /><Field label="Planned duration" value={hours} onChange={setHours} unit="hours" /></div>
    {rate ? <div className="tx-result"><span>Average planning rate</span><strong>{fmt(rate.mlHour)} mL/hour</strong><b>{fmt(rate.mlKgHour)} mL/kg/hour</b></div> : <Errors errors={["Enter positive recipient weight, planned volume and duration to calculate a planning rate."]} />}
    <p className="tx-notice tx-caution">Planning rate only — not a universally safe infusion rate. Individualize according to cardiovascular and volume status, renal function, underlying disease and urgency. This average does not model a slower initial phase or interruptions.</p>
    <p>When the patient’s condition permits, begin slowly for approximately the first {E.firstMinutes.value} minutes with close observation for an acute reaction. Increase only if no adverse reaction occurs and clinical condition permits.</p>
    <Check label="Significant cardiac disease" checked={cardiac} onChange={setCardiac} /><Check label="Significant renal disease" checked={renal} onChange={setRenal} /><Check label="High risk of volume overload / TACO (including euvolemia with significant anemia)" checked={overload} onChange={setOverload} /><Notice warning={overloadWarning(cardiac, renal, overload)} />
    <details><summary>Line, filter and monitoring checklist</summary><p>Use a dedicated IV line with an appropriate in-line blood filter. Do not give medications or calcium-containing fluids through the transfusion line. Use gravity or a pump specifically validated for blood products.</p><p>TRACS canine RBC filter reference: {E.filter.value.join("–")} µm. Use a product/species-appropriate system.</p><ul>{["Temperature and fever", "Heart rate, tachycardia and pulse quality", "Respiratory rate, effort and acute dyspnea", "Mucous membranes and mentation", "Blood pressure and hypotension where appropriate", "Vomiting, facial swelling, urticaria/pruritus", "Urine changes, hemoglobinuria and possible hemolysis", "Other signs of acute transfusion reaction"].map(item => <li key={item}>{item}</li>)}</ul><p>Monitor intensively at initiation and continue observation throughout and after transfusion. Vital checks may become less frequent after initiation, but do not leave recipients unmonitored. Reactions can occur after completion.</p></details>
    <details><summary>Cumulative volume / massive transfusion</summary><div className="tx-grid"><Field label="Blood given in previous 3 hours" value={three} onChange={setThree} unit="mL" /><Field label="Blood given in previous 24 hours" value={day} onChange={setDay} unit="mL" /></div>
      <p>Enter cumulative blood volume, including any current transfusion already administered. The 24-hour total includes the 3-hour total.</p>
      {massive ? <><p className="tx-assumptions">EBV: {ebv} mL/kg {override ? "(override)" : "(implementation default)"} · Total estimated blood volume: {fmt(massive.bloodVolumeMl)} mL.<br />TRACS thresholds: &gt;{fmt(massive.threshold3h)} mL / 3 hours or &gt;{fmt(massive.threshold24h)} mL / 24 hours.</p>{massive.triggered && <Notice warning={{ severity: "caution", message: "Massive transfusion threshold exceeded under the selected EBV assumption. Consider regular ionized-calcium monitoring and intensified clinical/laboratory monitoring." }} />}</> : <Errors errors={["Enter valid recipient weight/EBV and non-negative cumulative volumes; the 24-hour total cannot be below the 3-hour total."]} />}
    </details>
  </>;
}
