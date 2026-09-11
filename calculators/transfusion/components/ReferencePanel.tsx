import { references } from "../references";
import { BEDSIDE, EVIDENCE } from "../clinicalConstants";
export default function ReferencePanel() {
  return <details id="tx-references"><summary>References</summary>
    <p>Volume = body weight (kg) × species blood-volume estimate × (target PCV − current PCV) ÷ product PCV.</p>
    <p>Blood-volume defaults: dog {EVIDENCE.ebv.dog.value} mL/kg; cat {EVIDENCE.ebv.cat.value} mL/kg. Merck ranges: {EVIDENCE.ebvRange.dog.value.join("–")} and {EVIDENCE.ebvRange.cat.value.join("–")} mL/kg respectively. These are implementation assumptions within those ranges.</p>
    <p>Whole-blood donor ceilings: dog {BEDSIDE.donor.dog.ceiling.value} mL/kg (Italian profile); cat {BEDSIDE.donor.cat.ceiling.value} mL/kg lean BW (ISFM profile). {BEDSIDE.donorNote}</p>
    <p>Minimum donor weight is volume ÷ ceiling, rounded upward to {BEDSIDE.donor.dog.displayIncrementKg} kg for dogs and {BEDSIDE.donor.cat.displayIncrementKg} kg for cats. Screening requirements are separate from this volume-only estimate.</p>
    <p>Large-volume cautions use the upper common-dose references: whole blood {EVIDENCE.commonDose.wholeBlood.value.join("–")} mL/kg; packed cells {EVIDENCE.commonDose.pRbc.value.join("–")} mL/kg (Cornell). Results are never capped.</p>
    <p>{BEDSIDE.targetNote}</p>
    <ol className="tx-references">{(["merck", "isfm", "italy", "cornell", "acvim"] as const).map(id => <li key={id}><a href={references[id].url} target="_blank" rel="noreferrer">{references[id].title}</a><p>{references[id].organization} · {references[id].year}</p></li>)}</ol>
  </details>;
}
