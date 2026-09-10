import { useState } from "react";
import { donorCollection, anticoagulant } from "../calculations";
import { EVIDENCE as E } from "../clinicalConstants";
import { weightWarning } from "../warnings";
import type { Species } from "../types";
import { Field, Select, Check, Notice, Errors, fmt } from "./Controls";
export default function DonorCollection() {
  const [species, setSpecies] = useState<Species>("dog"), [weight, setWeight] = useState(""), [planned, setPlanned] = useState("");
  const [system, setSystem] = useState("None"), [within24h, setWithin24h] = useState(false);
  const result = donorCollection(species, weight, planned), ac = anticoagulant(planned, system, within24h), profile = E.donor[species];
  return <>
    <p>Independent donor assessment. Recipient requirements do not determine what can be collected from one donor.</p>
    <div className="tx-grid"><Select label="Donor species" value={species} onChange={value => { setSpecies(value as Species); setWeight(""); setPlanned(""); setSystem("None"); setWithin24h(false); }} options={[["dog", "Dog"], ["cat", "Cat"]]} />
      <Field label={species === "cat" ? "Donor lean body weight" : "Donor body weight"} value={weight} onChange={setWeight} unit="kg" />
      <Field label="Planned blood collection" value={planned} onChange={setPlanned} unit="mL blood" hint="Blood volume excluding anticoagulant." />
    </div>
    <p className="tx-assumptions">Reference screening floor: {profile.floor.value} {profile.floor.unit} · Collection ceiling: {profile.ceiling.value} {profile.ceiling.unit} · {species === "dog" ? "Italian 2025 profile" : "ISFM profile"}.</p>
    <Notice warning={weightWarning(weight)} />
    {result ? <><div className="tx-result"><span>{species === "cat" ? "Conservative maximum blood collection" : "Maximum collection under reference profile"}</span><strong>{fmt(result.maxCollectionMl)} mL</strong><p>Minimum weight for planned collection: <b>{fmt(result.minimumWeightKg, 2)} kg</b></p></div>
      <Notice warning={{ severity: result.criteriaMet ? "info" : "error", message: `Weight/volume criteria ${result.criteriaMet ? "met" : "NOT met"} under selected reference profile. Requested collection has not been reduced.` }} />
      {species === "cat" && <p>Alternative published protocol reference: {fmt(result.alternativeMl!)} mL under the Italian {E.donor.cat.alternativeRange.value.join("–")} mL/kg, up-to-{E.donor.cat.alternativeCap.value} mL profile. This is not the selected collection ceiling.</p>}</> : <Errors errors={["Enter valid positive donor weight and planned blood volume."]} />}
    <p>Final donor suitability requires clinical examination, hematology, blood typing, infectious-disease screening, history review, temperament/handling assessment, donor welfare assessment and local protocol compliance.</p>
    {species === "cat" && <details><summary>Feline anticoagulant helper</summary>
      <Select label="Collection system" value={system} onChange={value => { setSystem(value); setWithin24h(false); }} options={["None", "ACD-A", "CPD", "CPDA-1", "Sodium citrate", "Commercial prefilled collection system"]} />
      {system === "Sodium citrate" && <Check label={`Blood intended for administration within ${E.anticoagulant.citrateHours.value} hours`} checked={within24h} onChange={setWithin24h} />}
      {system === "Commercial prefilled collection system" ? <p>Follow the collection bag manufacturer’s specified blood volume and anticoagulant ratio.</p> : system !== "None" && <><p>ISFM: 1 mL anticoagulant : {system === "Sodium citrate" ? E.anticoagulant.citrate.value : E.anticoagulant.standard.value} mL blood.{system === "Sodium citrate" && ` Sodium citrate is conditional on use within ${E.anticoagulant.citrateHours.value} hours.`}</p>{ac ? <p className="tx-result">Anticoagulant: <b>{fmt(ac.anticoagulantMl)} mL</b> · Total collection: <b>{fmt(ac.totalMl)} mL</b></p> : <Errors errors={["Enter valid planned blood volume and confirm applicable collection conditions."]} />}</>}
      <p>Heparin is not recommended for collection of transfusion blood. Routine feline collections of {E.donor.cat.typical.value.join("–")} mL include anticoagulant; this helper distinguishes blood from final total volume.</p>
    </details>}
    <details><summary>Donor screening and source-specific profile</summary><ul>
      <li>Complete history and physical examination: active disease, medications, recent procedures/surgery, vaccination, prior transfusion and reproductive history (including pregnancy/lactation).</li>
      <li>CBC and PCV/Hct and/or Hb according to local SOP. Italian 2025 Hb reference: dog {E.donor.dog.hb.value} g/dL; cat {E.donor.cat.hb.value} g/dL; not below the laboratory/analyzer species interval. These are protocol-specific values.</li>
      <li>Blood typing: canine DEA 1; feline AB.</li>
      <li>Infectious-disease panel depends on geography, breed, prevalence, travel, environment, vectors, lifestyle and test availability. At least annual retesting, more often with exposure risk (ACVIM). Apply local Malaysia/Southeast Asia guidance where relevant.</li>
      <li>Temperament, handling and welfare: cats may require sedation; use a separate appropriate sedation protocol.</li>
      <li>Maintain donor–unit–recipient traceability for subsequent donor findings.</li>
    </ul><p>Dog: typical collection {E.donor.dog.typical.value.join("–")} mL; interval at least {E.donor.dog.interval.value} months in the Italian profile. Blood-bank minimum weights vary with the intended collection system.</p>
      <p>Cat: generally healthy, calm, approximately {E.donor.cat.age.value.join("–")} years; ISFM describes &gt;{E.donor.cat.floor.value} kg lean BW. V1 uses {E.donor.cat.floor.value} kg as an operational screening floor, not automatic donor eligibility.</p>
    </details>
  </>;
}
